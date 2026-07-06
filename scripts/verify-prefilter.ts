// Pre-filter regression harness — pure function, no DB/GPT, runs in ms.
// Case classes were adjudicated 2026-07-07 by replaying the filter over the
// full message history (scripts/replay-prefilter.ts); phrasings here are
// synthetic equivalents of the real classes (no member content committed).
//
//   MUST PASS  → signal-bearing content the filter may never eat
//   MUST SKIP  → noise / non-commodity trades that would waste GPT calls
//                (and historically caused Gold/Oil misclassifications)
//
// Run: npx tsx scripts/verify-prefilter.ts   (exits 1 on any FAIL)
/* eslint-disable @typescript-eslint/no-require-imports */
const { prefilterVerdict } = require("../src/lib/pre-filter");

const LOUNGE = "traders-lounge";
const GOLD = "gold-commodities";

const MUST_PASS: Array<[string, string, string]> = [
  // — plain commodity signals —
  ["long gold here", GOLD, "explicit entry"],
  ["Closed my silver longs this morning", LOUNGE, "explicit exit"],
  ["adding to my CL position", LOUNGE, "futures ticker hold"],
  ["Gold rejecting 3400, es puts printing", LOUNGE, "commodity + index co-mention"],
  // — length-floor rescues: explicit commodity core —
  ["long gc", LOUNGE, "short entry shorthand w/ ticker"],
  ["buy oil", LOUNGE, "short entry w/ asset"],
  // — length-floor rescues: bare trade shorthand (exits arrive one-word) —
  ["out", GOLD, "bare exit"],
  ["tp hit ✅", GOLD, "take-profit shorthand"],
  ["BUY!", LOUNGE, "bare entry"],
  ["short", LOUNGE, "bare direction"],
  ["stopped out", GOLD, "stop-loss exit"],
  ["Done", LOUNGE, "bare close"],
  // — keyword recall fixed 2026-07-07 —
  ["Dollar ripping, indices down, PMs cheap right now", LOUNGE, "PMs plural slang"],
  ["Might close the SPX short and rotate into XLE instead", LOUNGE, "XLE oil-sector ETF survives index guard"],
  ["Re-entered BNO and OXY today, plus a little UVIX as a hedge", LOUNGE, "BNO/OXY survive vol-ticker guard"],
  ["still holding uvix and zsl overnight", LOUNGE, "ZSL silver ETF survives guard"],
  ["PMs, bonds and crypto all disagree with equities today", LOUNGE, "PMs survives crypto guard"],
];

const MUST_SKIP: Array<[string, string, string]> = [
  // — pure noise —
  ["gm everyone", GOLD, "greeting"],
  ["Thanks", GOLD, "acknowledgement"],
  ["🚀🚀🚀", GOLD, "emoji only"],
  ["wow", LOUNGE, "reaction"],
  ["Pro tip", LOUNGE, "short non-trade"],
  ["At 3:30", LOUNGE, "short non-trade"],
  // — non-commodity instruments (the pre-guard era misclassification class) —
  ["SQQQ into close", LOUNGE, "inverse index ETF"],
  ["long nq fill 27150", LOUNGE, "lowercase index future"],
  ["got filled long ES 7163, will dca 7160", LOUNGE, "index future fill"],
  ["Closed my short ES. Great day guys.", LOUNGE, "index exit"],
  ["short sndk here, deep red already", LOUNGE, "equity short"],
  ["I think we bounce then dump. Just bought SVIX", LOUNGE, "vol ETF entry"],
  ["opened a SOXS position", LOUNGE, "semis inverse ETF"],
  ["bought weekly spy puts", LOUNGE, "SPY puts"],
  ["shorting mstr is just shorting bitcoin", LOUNGE, "crypto proxy"],
  ["going long NQ at the open tomorrow", LOUNGE, "index future"],
  ["QQQ rejecting off the ema repeatedly", LOUNGE, "index TA"],
  ["Loaded heavy on UVIX at 6.83", LOUNGE, "vol ETF entry"],
];

let pass = 0;
let fail = 0;

for (const [msg, channel, label] of MUST_PASS) {
  const v = prefilterVerdict(msg, channel);
  if (v.pass) {
    pass++;
    console.log(`PASS  ✓ passes   ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ✗ skipped (${v.reason})   ${label}: "${msg}"`);
  }
}
for (const [msg, channel, label] of MUST_SKIP) {
  const v = prefilterVerdict(msg, channel);
  if (!v.pass) {
    pass++;
    console.log(`PASS  ✓ skips (${v.reason})   ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ✗ passed   ${label}: "${msg}"`);
  }
}

console.log(`\n${pass}/${pass + fail} green`);
process.exit(fail ? 1 : 0);
