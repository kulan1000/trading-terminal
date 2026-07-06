// Verification: every signal_type × position through the EXACT production
// path (classifyMessage → gpt-5.5 subscription transport → strict schema →
// sanitize), with expected-value assertions. Complements the DB evidence —
// the short-side cases are rare in the wild (community is long-biased), so
// this proves them deterministically.
// Run: npx tsx scripts/verify-classification.ts   (exits 1 on any FAIL)
import fs from "node:fs";
import path from "node:path";

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
const { classifyMessage } = require("../src/lib/classify");

interface Expect {
  asset: string;
  signal_type: string;
  position: string | null;
  direction?: string;
}
interface Case {
  msg: string;
  channel: string;
  open: boolean;
  expect: Expect;
  label: string;
}

const CASES: Case[] = [
  { label: "ENTRY LONG",  msg: "just went long silver here at 62.10", channel: "gold-commodities", open: true,
    expect: { asset: "Silver", signal_type: "entry", position: "long", direction: "bullish" } },
  { label: "ENTRY SHORT", msg: "shorting gold here at 4150, this rally is done", channel: "gold-commodities", open: true,
    expect: { asset: "Gold", signal_type: "entry", position: "short", direction: "bearish" } },
  { label: "EXIT LONG",   msg: "sold all my gold longs, taking profit here", channel: "gold-commodities", open: true,
    expect: { asset: "Gold", signal_type: "exited", position: "long" } },
  { label: "EXIT SHORT",  msg: "covered my oil short for a nice win", channel: "traders-lounge", open: true,
    expect: { asset: "Oil", signal_type: "exited", position: "short" } },
  { label: "HOLD LONG",   msg: "still holding my silver long from last week, letting it ride", channel: "gold-commodities", open: true,
    expect: { asset: "Silver", signal_type: "position", position: "long", direction: "bullish" } },
  { label: "HOLD SHORT",  msg: "sitting on my gold short, not covering yet", channel: "gold-commodities", open: true,
    expect: { asset: "Gold", signal_type: "position", position: "short", direction: "bearish" } },
  { label: "OPINION BEAR", msg: "oil looks weak here, OPEC pumping way too much supply", channel: "traders-lounge", open: true,
    expect: { asset: "Oil", signal_type: "opinion", position: null, direction: "bearish" } },
  { label: "OPINION BULL", msg: "gold setup looks great, expecting a breakout above resistance", channel: "gold-commodities", open: true,
    expect: { asset: "Gold", signal_type: "opinion", position: null, direction: "bullish" } },
];

interface Result {
  asset: string; direction: string; signal_type: string;
  position: string | null; confidence: number; target_price: number | null;
}

async function main() {
  let failed = 0;
  await Promise.all(
    CASES.map(async (c) => {
      const t0 = Date.now();
      const res: Result[] = await classifyMessage(c.msg, c.channel, [], c.open);
      const hit = res.find(
        (r) => r.asset === c.expect.asset && r.signal_type === c.expect.signal_type
      );
      const ok =
        !!hit &&
        hit.position === c.expect.position &&
        (!c.expect.direction || hit.direction === c.expect.direction);
      if (!ok) failed++;
      const got = res.length
        ? res.map((r) => `${r.asset} ${r.direction} ${r.signal_type}${r.position ? "/" + r.position : ""} c=${r.confidence}`).join(" | ")
        : "(no signal)";
      console.log(`${ok ? "PASS" : "FAIL"} | ${c.label.padEnd(12)} ${Date.now() - t0}ms | "${c.msg.slice(0, 48)}" → ${got}`);
    })
  );
  console.log(failed === 0 ? "\nALL CLASSIFICATION CHECKS PASS (production path, gpt-5.5)" : `\n${failed} FAILURES`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("VERIFY FAIL:", e.status ?? "", e.message);
  process.exit(1);
});
