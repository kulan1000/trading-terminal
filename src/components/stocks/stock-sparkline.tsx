"use client";

import { useMemo } from "react";

interface StockSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  change: number;
}

export function StockSparkline({ data, width = 100, height = 28, change }: StockSparklineProps) {
  if (data.length < 2) return <div style={{ width, height }} />;

  const { points, areaPoints, openY, lastY } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;

    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = pad + (1 - (v - min) / range) * (height - 2 * pad);
      return { x, y };
    });

    const linePoints = pts.map(p => `${p.x},${p.y}`).join(" ");
    const area = linePoints + ` ${width},${height} 0,${height}`;
    const oY = pad + (1 - (data[0] - min) / range) * (height - 2 * pad);
    const lY = pts[pts.length - 1].y;

    return { points: linePoints, areaPoints: area, openY: oY, lastY: lY };
  }, [data, width, height]);

  const isUp = change >= 0;
  const gradientId = `sparkGrad-${isUp ? "up" : "dn"}-${Math.random().toString(36).slice(2, 6)}`;
  const strokeColor = isUp ? "#26A69A" : "#EF5350";
  const fillStart = isUp ? "rgba(38, 166, 154, 0.15)" : "rgba(239, 83, 80, 0.15)";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>

      {/* Gradient area fill */}
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      {/* Opening price reference line */}
      <line x1={0} y1={openY} x2={width} y2={openY}
        stroke="white" strokeOpacity={0.08} strokeDasharray="2,3" />

      {/* Price line */}
      <polyline points={points} fill="none"
        stroke={strokeColor} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Current price dot with glow */}
      <circle cx={width} cy={lastY} r={2.5}
        fill={strokeColor} opacity={0.3} />
      <circle cx={width} cy={lastY} r={1.5}
        fill={strokeColor} />
    </svg>
  );
}
