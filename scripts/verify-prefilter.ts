// Pre-filter regression harness — pure function, no DB/GPT, runs in ms.
// Case classes were adjudicated 2026-07-07 by replaying the filter over the
// full message history (scripts/replay-prefilter.ts); phrasings here are
// synthetic equivalents of the real classes (no member content committed).
// 2026-07-10: equities expansion — index futures/ETF/stock trades are now
// tracked instruments and MUST reach the classifier; only noise and
// crypto-only talk get skipped.
//
//   MUST PASS  → signal-bearing content the filter may never eat
//   MUST SKIP  → noise / crypto-only talk that would waste GPT calls
//
// Run: npx tsx scripts/verify-prefilter.ts   (exits 1 on any FAIL)
/* eslint-disable @typescript-eslint/no-require-imports */
const { prefilterVerdict } = require("../src/lib/pre-filter");

const LOUNGE = "traders-lounge";
const GOLD = "gold-commodities";
const EQUITIES = "equities-stocks";
const SANG = "sang-daily-updates";

const MUST_PASS: Array<[string, string, string]> = [
  // — plain commodity signals —
  ["long gold here", GOLD, "explicit entry"],
  ["Closed my silver longs this morning", LOUNGE, "explicit exit"],
  ["adding to my CL position", LOUNGE, "futures ticker hold"],
  ["Gold rejecting 3400, es puts printing", LOUNGE, "commodity + index co-mention"],
  // — length-floor rescues: explicit instrument core —
  ["long gc", LOUNGE, "short entry shorthand w/ ticker"],
  ["buy oil", LOUNGE, "short entry w/ asset"],
  ["es 7150", EQUITIES, "short index-future level"],
  // — length-floor rescues: bare trade shorthand (exits arrive one-word) —
  ["out", GOLD, "bare exit"],
  ["tp hit ✅", GOLD, "take-profit shorthand"],
  ["BUY!", LOUNGE, "bare entry"],
  ["short", LOUNGE, "bare direction"],
  ["stopped out", GOLD, "stop-loss exit"],
  ["Done", LOUNGE, "bare close"],
  // — keyword recall fixed 2026-07-07 —
  ["Dollar ripping, indices down, PMs cheap right now", LOUNGE, "PMs plural slang"],
  ["Might close the SPX short and rotate into XLE instead", LOUNGE, "SPX + XLE co-mention"],
  ["Re-entered BNO and OXY today, plus a little UVIX as a hedge", LOUNGE, "BNO/OXY + vol ticker"],
  ["still holding uvix and zsl overnight", LOUNGE, "ZSL + UVIX hold"],
  ["PMs, bonds and crypto all disagree with equities today", LOUNGE, "PMs survives crypto guard"],
  // — equities expansion 2026-07-10: tracked instruments MUST reach GPT —
  ["SQQQ into close", LOUNGE, "inverse index ETF"],
  ["long nq fill 27150", LOUNGE, "lowercase index future"],
  ["got filled long ES 7163, will dca 7160", EQUITIES, "index future fill"],
  ["Closed my short ES. Great day guys.", LOUNGE, "index exit"],
  ["I think we bounce then dump. Just bought SVIX", LOUNGE, "vol ETF entry"],
  ["opened a SOXS position", EQUITIES, "semis inverse ETF"],
  ["bought weekly spy puts", EQUITIES, "SPY puts"],
  ["shorting mstr is just shorting bitcoin", LOUNGE, "MSTR tracked (crypto proxy talk)"],
  ["going long NQ at the open tomorrow", LOUNGE, "index future intent"],
  ["QQQ rejecting off the ema repeatedly", EQUITIES, "index TA"],
  ["Loaded heavy on UVIX at 6.83", LOUNGE, "vol ETF entry"],
  ["NVDA 190C for next week looking juicy", EQUITIES, "stock options"],
  ["Morning update: ES over 7100, gold coiling, NVDA earnings Thursday", SANG, "daily multi-asset rundown"],
  // — unknown tickers still pass in trade channels; GPT rejects them —
  ["short sndk here, deep red already", LOUNGE, "unlisted ticker → GPT decides"],
];

const MUST_SKIP: Array<[string, string, string]> = [
  // — pure noise —
  ["gm everyone", GOLD, "greeting"],
  ["Thanks", GOLD, "acknowledgement"],
  ["🚀🚀🚀", GOLD, "emoji only"],
  ["wow", LOUNGE, "reaction"],
  ["Pro tip", LOUNGE, "short non-trade"],
  ["At 3:30", LOUNGE, "short non-trade"],
  // — crypto-only (deliberately untracked — GPT would just say no) —
  ["BTC through 200k by christmas", LOUNGE, "crypto price talk"],
  ["long btc at 98k, alts next", LOUNGE, "crypto entry w/ trade words"],
  ["eth looking strong, solana too", EQUITIES, "crypto-only in equities channel"],
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
