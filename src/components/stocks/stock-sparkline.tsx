"use client";

import { changeColor } from "@/lib/utils";

interface StockSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  change: number;
}

export function StockSparkline({ data, width = 100, height = 28, change }: StockSparklineProps) {
  if (data.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = pad + (1 - (v - min) / range) * (height - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");

  const color = change >= 0 ? "var(--color-terminal-green)" : "var(--color-terminal-red)";

  // Opening price reference line
  const openY = pad + (1 - (data[0] - min) / range) * (height - 2 * pad);

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Opening price line */}
      <line
        x1={0}
        y1={openY}
        x2={width}
        y2={openY}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeDasharray="2,2"
      />
      {/* Price line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current price dot */}
      <circle
        cx={width}
        cy={parseFloat(points.split(" ").pop()?.split(",")[1] ?? "0")}
        r={2}
        fill={color}
      />
    </svg>
  );
}
