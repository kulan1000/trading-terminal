// Verification: isMarketOpen / isWeekendDeadZone against the COMEX/NYMEX
// schedule (Sun 18:00 ET open → Fri 17:00 ET close, daily 17-18 ET break).
// Timestamps are UTC; July 2026 is EDT (UTC-4), January 2026 is EST (UTC-5).
// Run: npx tsx scripts/verify-market-hours.ts   (exits 1 on any FAIL)
import { isMarketOpen, isWeekendDeadZone } from "../src/lib/market-hours";

const CASES: Array<[string, string, boolean, boolean]> = [
  // [UTC instant, human label (ET), expect open, expect deadzone]
  ["2026-07-04T16:00:00Z", "Sat 12:00 ET", false, true],
  ["2026-07-05T15:00:00Z", "Sun 11:00 ET", false, true],
  ["2026-07-05T17:00:00Z", "Sun 13:00 ET (pre-open window)", false, false],
  ["2026-07-05T21:59:00Z", "Sun 17:59 ET (1 min before open)", false, false],
  ["2026-07-05T22:01:00Z", "Sun 18:01 ET (just opened)", true, false],
  ["2026-07-06T07:00:00Z", "Mon 03:00 ET (overnight session)", true, false],
  ["2026-07-01T18:00:00Z", "Wed 14:00 ET (regular hours)", true, false],
  ["2026-07-01T21:30:00Z", "Wed 17:30 ET (daily maintenance)", false, false],
  ["2026-07-01T22:05:00Z", "Wed 18:05 ET (after maintenance)", true, false],
  ["2026-07-03T20:59:00Z", "Fri 16:59 ET (1 min before close)", true, false],
  ["2026-07-03T21:01:00Z", "Fri 17:01 ET (weekend begins)", false, true],
  // Winter (EST = UTC-5) — the ET conversion must respect DST
  ["2026-01-14T22:30:00Z", "Wed 17:30 ET winter (maintenance)", false, false],
  ["2026-01-14T20:00:00Z", "Wed 15:00 ET winter (regular)", true, false],
  ["2026-01-17T17:00:00Z", "Sat 12:00 ET winter", false, true],
];

let failed = 0;
for (const [utc, label, expOpen, expDead] of CASES) {
  const d = new Date(utc);
  const open = isMarketOpen(d);
  const dead = isWeekendDeadZone(d);
  const ok = open === expOpen && dead === expDead;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"} | ${label.padEnd(36)} open=${open} (want ${expOpen})  deadzone=${dead} (want ${expDead})`
  );
}
console.log(failed === 0 ? "\nALL MARKET-HOURS CHECKS PASS" : `\n${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
