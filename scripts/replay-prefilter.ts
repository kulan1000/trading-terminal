// Replays the EXACT production pre-filter (prefilterVerdict) over every
// discord_message in the database and cross-references signal existence.
// Produces the confusion matrix that proves the filter is correct:
//
//   PASS + signal      → filter let a real signal through (good)
//   PASS + no signal   → GPT declined it (filter's job is only "maybe")
//   SKIP + signal      → REGRESSION: current filter would kill a message
//                        that produced a real signal — must be empty/justified
//   SKIP + no signal   → intended skip (sampled for manual inspection)
//
// Run: npx tsx scripts/replay-prefilter.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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
const { prefilterVerdict } = require("../src/lib/pre-filter");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Msg {
  id: number;
  content: string;
  channel: string;
  author: string;
}

async function pageAll<T>(
  table: string,
  select: string,
  maxPages: number
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order("id", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`${table} page ${page}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return rows;
}

async function main() {
  console.log("Loading all messages + signal message_ids…");
  const [messages, signalRows] = await Promise.all([
    pageAll<Msg>("discord_messages", "id, content, channel, author", 100),
    pageAll<{ id: number; message_id: number; asset: string; signal_type: string; direction: string }>(
      "signals",
      "id, message_id, asset, signal_type, direction",
      30
    ),
  ]);
  const signaled = new Set(signalRows.map((s) => s.message_id));
  const signalsByMsg = new Map<number, typeof signalRows>();
  for (const s of signalRows) {
    (signalsByMsg.get(s.message_id) ?? signalsByMsg.set(s.message_id, []).get(s.message_id)!).push(s);
  }
  console.log(`${messages.length} messages, ${signaled.size} with ≥1 signal\n`);

  let passSignal = 0;
  let passNoSignal = 0;
  let skipNoSignal = 0;
  const regressions: Array<Msg & { reason: string }> = [];
  const skipReasons: Record<string, number> = {};
  const skipSamples: Record<string, string[]> = {};

  for (const m of messages) {
    const v = prefilterVerdict(m.content, m.channel);
    const hasSignal = signaled.has(m.id);
    if (v.pass) {
      if (hasSignal) passSignal++;
      else passNoSignal++;
    } else {
      const reason = v.reason ?? "?";
      if (hasSignal) {
        regressions.push({ ...m, reason });
      } else {
        skipNoSignal++;
        skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
        // Keep a few samples per reason — longest ones are the riskiest skips
        (skipSamples[reason] ??= []);
        if (skipSamples[reason].length < 8 && m.content.trim().length > 4) {
          skipSamples[reason].push(m.content.slice(0, 90).replace(/\n/g, " "));
        }
      }
    }
  }

  console.log("── Confusion matrix ──────────────────────────");
  console.log(`PASS + signal     ${passSignal}`);
  console.log(`PASS + no signal  ${passNoSignal}  (GPT declined — expected)`);
  console.log(`SKIP + no signal  ${skipNoSignal}`);
  console.log(`SKIP + SIGNAL     ${regressions.length}  ← must be 0 or justified\n`);

  console.log("── Skip reasons (no signal) ──────────────────");
  for (const [reason, n] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`${reason.padEnd(26)} ${n}`);
    for (const s of skipSamples[reason] ?? []) console.log(`    · ${s}`);
  }

  if (regressions.length) {
    console.log("\n── REGRESSIONS (skipped but has signal) ──────");
    for (const r of regressions) {
      const sigs = (signalsByMsg.get(r.id) ?? [])
        .map((s) => `sig#${s.id} ${s.asset}/${s.signal_type}/${s.direction}`)
        .join(", ");
      console.log(`[${r.reason}] #${r.id} ${r.author} in #${r.channel} → ${sigs}`);
      console.log(`    "${r.content.slice(0, 140).replace(/\n/g, " ")}"`);
    }
  }

  // Exit-shorthand loss check: skipped messages containing trade verbs
  console.log("\n── Skipped messages containing trade verbs ───");
  const tradeVerb =
    /\b(tp|sl|closed?|out|flat|stopp?ed|book(ed)?|exit(ed)?|trim(med)?|sold|sell|buy|long|short|add(ed)?|filled?|done)\b/i;
  let tradeVerbSkips = 0;
  for (const m of messages) {
    const v = prefilterVerdict(m.content, m.channel);
    if (!v.pass && !signaled.has(m.id) && tradeVerb.test(m.content)) {
      tradeVerbSkips++;
      if (tradeVerbSkips <= 25)
        console.log(
          `[${v.reason}] ${m.author}: "${m.content.slice(0, 90).replace(/\n/g, " ")}"`
        );
    }
  }
  console.log(`Total: ${tradeVerbSkips}`);

  process.exit(regressions.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
