// Backfill Discord history + classification + scoring for the ingestion gap.
// Usage:
//   npx tsx scripts/backfill-discord.ts --ingest    # fetch history → discord_messages
//   npx tsx scripts/backfill-discord.ts --classify  # classify all unprocessed
//   npx tsx scripts/backfill-discord.ts --score     # score all pending signals
//   npx tsx scripts/backfill-discord.ts --all
//
// Safe to re-run: ingest upserts with ignoreDuplicates, classification marks
// processed, scoring uses signals.scoring_status.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── env (before importing lib modules that read process.env) ────
const ROOT = path.resolve(__dirname, "..");
function loadEnv(file: string) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(line)) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.production.local");
loadEnv(".env.local");

/* eslint-disable @typescript-eslint/no-require-imports */
const { processUnclassified } = require("../src/lib/classify-batch");
const { scoreSignals } = require("../src/lib/score-signals");
const { pairTrades } = require("../src/lib/trade-pairing");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHANNELS: Record<string, string> = {
  "traders-lounge": "1348833494045954098",
  "gold-commodities": "1441803196816167042",
};
const DISCORD_API = "https://discord.com/api/v10";
// Ingestion died ~May 20 (45-day gap before Jul 3). Small overlap is harmless.
const BACKFILL_UNTIL = new Date("2026-05-15T00:00:00Z");

interface DiscordMsg {
  id: string;
  author: { username: string; bot?: boolean };
  content: string;
  timestamp: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ingestHistory() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN missing");

  for (const [channelName, channelId] of Object.entries(CHANNELS)) {
    let before: string | undefined;
    let page = 0;
    let saved = 0;
    let done = false;

    while (!done && page < 400) {
      const url = new URL(`${DISCORD_API}/channels/${channelId}/messages`);
      url.searchParams.set("limit", "100");
      if (before) url.searchParams.set("before", before);

      const res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
      if (res.status === 429) {
        const retry = Number((await res.json())?.retry_after ?? 1);
        console.log(`  429 — waiting ${retry}s`);
        await sleep(retry * 1000 + 250);
        continue;
      }
      if (!res.ok) {
        console.error(`  #${channelName}: HTTP ${res.status} — aborting channel`);
        break;
      }

      const messages = (await res.json()) as DiscordMsg[];
      if (!messages.length) break;

      for (const msg of messages) {
        if (new Date(msg.timestamp) < BACKFILL_UNTIL) { done = true; continue; }
        if (msg.author.bot) continue;
        if (msg.content.trim().length < 3) continue;

        const { error } = await supabase.from("discord_messages").upsert(
          {
            discord_message_id: msg.id,
            author: msg.author.username,
            content: msg.content,
            channel: channelName,
            timestamp: msg.timestamp,
            processed: false,
          },
          { onConflict: "discord_message_id", ignoreDuplicates: true }
        );
        if (!error) saved++;
      }

      before = messages[messages.length - 1].id;
      page++;
      if (page % 10 === 0) {
        console.log(`  #${channelName}: page ${page}, saved ${saved}, oldest ${messages[messages.length - 1].timestamp}`);
      }
      await sleep(400); // stay well under Discord rate limits
    }
    console.log(`#${channelName}: DONE — ${saved} messages saved (${page} pages)`);
  }
}

async function classifyAll() {
  let round = 0;
  for (;;) {
    const { count } = await supabase
      .from("discord_messages")
      .select("id", { count: "exact", head: true })
      .eq("processed", false);
    if (!count) { console.log("CLASSIFY: queue empty"); break; }

    const res = await processUnclassified(120);
    round++;
    console.log(`CLASSIFY round ${round}: remaining=${count} processed=${res.processed} signals=${res.signals} skipped=${res.skipped} gpt_calls=${res.openai_calls}`);
    if (!res.processed) break;
  }
}

async function scoreAll() {
  let idle = 0;
  let round = 0;
  while (idle < 2 && round < 60) {
    const res = await scoreSignals();
    round++;
    console.log(`SCORE round ${round}: scored=${res.scored} unscorable=${res.markedUnscorable ?? 0}`);
    if ((res.scored ?? 0) === 0 && (res.markedUnscorable ?? 0) === 0) idle++;
    else idle = 0;
  }
  const pairs = await pairTrades();
  console.log(`PAIRING: paired=${pairs.paired}`);
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  if (all || args.includes("--ingest")) {
    console.log("═══ PHASE 1: ingest history ═══");
    await ingestHistory();
  }
  if (all || args.includes("--classify")) {
    console.log("═══ PHASE 2: classify backlog ═══");
    await classifyAll();
  }
  if (all || args.includes("--score")) {
    console.log("═══ PHASE 3: score + pair ═══");
    await scoreAll();
  }
  console.log("BACKFILL COMPLETE");
}

main().catch((e) => {
  console.error("BACKFILL FAILED:", e);
  process.exit(1);
});
