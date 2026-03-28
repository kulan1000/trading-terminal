// Centralized number/volume/price/date formatting — used across all components

export function fmtNum(n: number, d = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** "28 mar 14:35" — short datetime for message lists, signal feeds, etc. */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

/** "14:35" — time only, Stockholm timezone */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
}

/** "14:35" — from epoch seconds (for chart timestamps) */
export function fmtTimeEpoch(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
}

export function fmtBig(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return n > 0 ? `$${n}` : "—";
}

export function fmtVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v > 0 ? v.toString() : "—";
}