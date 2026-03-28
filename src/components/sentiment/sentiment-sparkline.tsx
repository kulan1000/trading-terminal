"use client";

import type { SentimentHistoryPoint } from "@/hooks/use-sentiment";

interface Props {
  points: SentimentHistoryPoint[];
  width?: number;
  height?: number;
}

export function SentimentSparkline({ points, width = 200, height = 40 }: Props) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-tv-muted" style={{ width, height }}>
        Samlar data...
      </div>
    );
  }

  const scores = points.map((p) => p.net_score);
  const maxAbs = Math.max(Math.abs(Math.min(...scores)), Math.abs(Math.max(...scores)), 1);
  const padX = 2;
  const padY = 4;

  // Map points to SVG coordinates
  const step = (width - padX * 2) / (points.length - 1);
  const coords = scores.map((score, i) => ({
    x: padX + i * step,
    y: padY + ((maxAbs - score) / (2 * maxAbs)) * (height - padY * 2),
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

  // Zero line (neutral)
  const zeroY = padY + (height - padY * 2) / 2;

  // Fill area: split into bull (above zero) and bear (below zero) with gradient
  const lastPoint = coords[coords.length - 1];
  const lastScore = scores[scores.length - 1];
  const lineColor = lastScore > 0.5 ? "var(--color-tv-bull)" : lastScore < -0.5 ? "var(--color-tv-bear)" : "var(--color-tv-secondary)";

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Zero reference line */}
      <line
        x1={padX} y1={zeroY} x2={width - padX} y2={zeroY}
        stroke="var(--color-tv-divider)" strokeWidth={0.5} strokeDasharray="2,2"
      />

      {/* Fill area under/above zero */}
      <polygon
        points={`${padX},${zeroY} ${polyline} ${lastPoint.x},${zeroY}`}
        fill={lineColor}
        opacity={0.08}
      />

      {/* Main line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Current value dot */}
      <circle
        cx={lastPoint.x} cy={lastPoint.y} r={2.5}
        fill={lineColor}
      />
    </svg>
  );
}
