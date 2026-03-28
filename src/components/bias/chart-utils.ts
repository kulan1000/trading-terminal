// SVG chart dimension constants and coordinate helpers for bias detail chart

export const CHART_W = 820;
export const CHART_H = 220;
export const CHART_PAD = { top: 10, right: 55, bottom: 30, left: 40 };

/** Map a timestamp (ms) to an SVG x-coordinate */
export function timeToX(ms: number, start: number, span: number, chartW: number, padLeft: number): number {
  const pct = Math.max(0, Math.min(1, (ms - start) / span));
  return padLeft + pct * chartW;
}

/** Map an ISO date string to an SVG x-coordinate */
export function isoToX(iso: string, start: number, span: number, chartW: number, padLeft: number): number {
  return timeToX(new Date(iso).getTime(), start, span, chartW, padLeft);
}

/** Generate Y-axis label positions from a value range */
export function yAxisLabels(min: number, range: number, count: number, top: number, chartH: number) {
  return Array.from({ length: count }, (_, i) => {
    const val = min + (range * i) / (count - 1);
    const y = top + chartH - (i / (count - 1)) * chartH;
    return { val, y };
  });
}

/** Build an SVG path from {x,y}[] points */
export function pointsToPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}
