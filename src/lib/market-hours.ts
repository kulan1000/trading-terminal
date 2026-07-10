// Per-class trading calendars. Three calendars cover the whole registry:
//   comex          — Gold/Silver/Oil futures: Sun 18:00 → Fri 17:00 ET,
//                    daily 17:00–18:00 maintenance break
//   index_futures  — CME equity futures (ES/NQ/YM/RTY): same Globex schedule
//   equity_rth     — US stocks/ETFs/indices: RTH 9:30–16:00 ET Mon–Fri,
//                    extended session 4:00–20:00 ET (pre/post market)
// US holidays are NOT modeled (v1): a holiday misread degrades to one
// mislabeled OPEN flag, and the classifier treats the flag as guidance only.

import type { Asset } from "@/lib/instruments";
import { hoursKindOf } from "@/lib/instruments";

/** Convert any Date to Eastern Time components */
function toET(date: Date) {
  const et = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return { day: et.getDay(), hour: et.getHours(), minute: et.getMinutes() };
}

/** Check if commodities futures markets (COMEX) are currently open */
export function isMarketOpen(now = new Date()): boolean {
  const { day, hour } = toET(now);

  // Saturday: always closed
  if (day === 6) return false;

  // Sunday: closed until 18:00 ET
  if (day === 0) return hour >= 18;

  // Friday: closed after 17:00 ET
  if (day === 5) return hour < 17;

  // Mon-Thu: closed during daily maintenance 17:00-18:00 ET
  if (hour === 17) return false;

  return true;
}

/** CME equity index futures (ES/NQ/YM/RTY): Globex schedule like COMEX,
 *  plus the daily equity-futures trading halt 16:15–16:30 ET */
export function isIndexFuturesOpen(now = new Date()): boolean {
  const { hour, minute } = toET(now);
  if (hour === 16 && minute >= 15 && minute < 30) return false;
  return isMarketOpen(now);
}

/** US equities/ETFs/indices. RTH 9:30–16:00 ET; `extended` widens to the
 *  pre/post-market session 4:00–20:00 ET (stocks DO trade there — an
 *  after-hours NVDA entry is a real trade, so classification uses extended
 *  while price snapshots stick to RTH where Yahoo has data). */
export function isEquityMarketOpen(
  now = new Date(),
  opts: { extended?: boolean } = {}
): boolean {
  const { day, hour, minute } = toET(now);
  if (day === 0 || day === 6) return false;
  if (opts.extended) return hour >= 4 && hour < 20;
  const afterOpen = hour > 9 || (hour === 9 && minute >= 30);
  return afterOpen && hour < 16;
}

/** Can this asset be traded right now? (classification semantics —
 *  equities use the extended session) */
export function isMarketOpenFor(asset: Asset, now = new Date()): boolean {
  switch (hoursKindOf(asset)) {
    case "comex": return isMarketOpen(now);
    case "index_futures": return isIndexFuturesOpen(now);
    case "equity_rth": return isEquityMarketOpen(now, { extended: true });
  }
}

/** Should we snapshot a price for this asset right now? (strict sessions —
 *  outside them Yahoo serves the stale last close, which would pollute the
 *  scoring grid with flat phantom bars) */
export function isSnapshotWindowFor(asset: Asset, now = new Date()): boolean {
  switch (hoursKindOf(asset)) {
    case "comex": return isMarketOpen(now);
    case "index_futures": return isIndexFuturesOpen(now);
    case "equity_rth": return isEquityMarketOpen(now);
  }
}

/** Composite status line injected into the classifier prompt — one flag per
 *  calendar so the model can judge entry/exit validity per instrument. */
export function marketStatusLine(now = new Date()): string {
  const flag = (open: boolean) => (open ? "OPEN" : "CLOSED");
  return [
    `COMEX (Gold/Silver/Oil): ${flag(isMarketOpen(now))}`,
    `INDEX FUTURES (ES/NQ/YM/RTY): ${flag(isIndexFuturesOpen(now))}`,
    `US EQUITIES (stocks/ETFs/indices): ${flag(isEquityMarketOpen(now, { extended: true }))}`,
  ].join(" | ");
}

/**
 * Weekend dead zone: signals created here should NOT count toward
 * short-term bias. Covers Friday 17:00 ET → Sunday 12:00 ET.
 *
 * Sunday 12:00-18:00 ET is the 6h pre-open window where opinions
 * START counting again so bias is ready when the market opens.
 *
 * Weekday maintenance breaks (17:00-18:00 ET Mon-Thu) are NOT dead
 * zones — opinions keep counting through those short pauses.
 */
export function isWeekendDeadZone(date: Date): boolean {
  const { day, hour } = toET(date);

  // Saturday: always dead zone
  if (day === 6) return true;

  // Sunday before 12:00 ET: dead zone (>6h before open)
  if (day === 0 && hour < 12) return true;

  // Friday 17:00+ ET: dead zone (market closed for weekend)
  if (day === 5 && hour >= 17) return true;

  return false;
}
