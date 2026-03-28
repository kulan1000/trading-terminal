// Commodities futures (Gold, Silver, Oil) trade:
// Sunday 18:00 ET → Friday 17:00 ET (with daily 17:00-18:00 break)
// Fully closed: Friday 17:00 ET → Sunday 18:00 ET

/** Check if commodities markets are currently open */
export function isMarketOpen(now = new Date()): boolean {
  // Convert to Eastern Time
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay(); // 0=Sun, 6=Sat
  const hour = et.getHours();

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
