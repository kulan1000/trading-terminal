// Commodities futures (Gold, Silver, Oil) trade:
// Sunday 18:00 ET → Friday 17:00 ET (with daily 17:00-18:00 break)
// Fully closed: Friday 17:00 ET → Sunday 18:00 ET

/** Convert any Date to Eastern Time components */
function toET(date: Date) {
  const et = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return { day: et.getDay(), hour: et.getHours() };
}

/** Check if commodities markets are currently open */
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
