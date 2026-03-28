import type { TradeMarker } from "./sparkline";

export interface MarkerStyle {
  color: string;
  label: string;
}

export type PositionedMarker = TradeMarker & {
  px: number;
  py: number;
  pctX: number;
  style: MarkerStyle;
};

export function getMarkerStyle(m: TradeMarker): MarkerStyle {
  if (m.signal_type === "entry" && m.position === "long")
    return { color: "#22c55e", label: "ENTRY LONG" };
  if (m.signal_type === "entry" && m.position === "short")
    return { color: "#ef4444", label: "ENTRY SHORT" };
  if (m.signal_type === "exited" && m.position === "long")
    return { color: "#60a5fa", label: "EXIT LONG" };
  if (m.signal_type === "exited" && m.position === "short")
    return { color: "#f97316", label: "EXIT SHORT" };
  return { color: "#a78bfa", label: "HOLDING" };
}

export const MARKER_LEGEND = [
  { color: "#22c55e", label: "Entry Long" },
  { color: "#ef4444", label: "Entry Short" },
  { color: "#60a5fa", label: "Exit Long" },
  { color: "#f97316", label: "Exit Short" },
];

/** Position trade markers on a price chart, returns only entries/exits within time range */
export function positionMarkers(
  markers: TradeMarker[],
  timestamps: number[],
  data: number[],
  toX: (i: number) => number,
  toY: (v: number) => number,
  chartWidth: number,
): PositionedMarker[] {
  if (!timestamps.length || !data.length) return [];
  const tStart = timestamps[0];
  const tEnd = timestamps[timestamps.length - 1];
  const tRange = tEnd - tStart || 1;

  return markers
    .filter((m) => m.signal_type === "entry" || m.signal_type === "exited")
    .map((m): PositionedMarker | null => {
      const mTs = new Date(m.msg_timestamp).getTime() / 1000;
      if (mTs < tStart || mTs > tEnd) return null;

      const frac = (mTs - tStart) / tRange;
      const exactIdx = frac * (data.length - 1);
      const lo = Math.floor(exactIdx);
      const hi = Math.min(lo + 1, data.length - 1);
      const t = exactIdx - lo;
      const interpolatedPrice = data[lo] + (data[hi] - data[lo]) * t;

      const px = toX(exactIdx);
      const py = toY(interpolatedPrice);
      return { ...m, px, py, pctX: (px / chartWidth) * 100, style: getMarkerStyle(m) };
    })
    .filter(Boolean) as PositionedMarker[];
}
