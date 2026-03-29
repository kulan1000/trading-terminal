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

/** "14:35:22" — time with seconds, for pipeline logs */
export function fmtTimeFull(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Stockholm",
  });
}

/** "14:35" — from epoch seconds (for chart timestamps) */
export function fmtTimeEpoch(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
}

/** "$3,045.20" for Gold/Silver, "$68.42" for Oil — asset-aware price formatting */
export function fmtPrice(asset: string, price: number): string {
  if (!price) return "—";
  if (asset === "Oil") return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "5m sedan" / "2h sedan" / "1d sedan" — relative time in Swedish */
export function fmtAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m sedan`;
  return `${Math.round(hours / 24)}d sedan`;
}

/** "5m ago" / "2h ago" / "1d ago" — relative time in English */
export function fmtAgoEn(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "5m" / "2h" — compact relative time, no suffix */
export function fmtAgoShort(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
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