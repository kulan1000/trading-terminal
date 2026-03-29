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

/** Build a smooth SVG path from {x,y}[] points using cubic bezier curves */
export function pointsToPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const tension = 0.3;
    const dx = (curr.x - prev.x) * tension;
    d += ` C${(prev.x + dx).toFixed(1)},${prev.y.toFixed(1)} ${(curr.x - dx).toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}
