"use client";

import { useState, useCallback, useRef } from "react";

interface SparklineProps {
  data: number[];
  timestamps?: number[]; // epoch seconds
  width?: number;
  height?: number;
  className?: string;
}

/** Intraday SVG sparkline with hover tooltip */
export function Sparkline({
  data,
  timestamps,
  width = 280,
  height = 64,
  className,
}: SparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const idx = Math.round(ratio * (data.length - 1));
      setHover(Math.max(0, Math.min(idx, data.length - 1)));
    },
    [data.length]
  );

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const toY = (v: number) => pad + ((max - v) / range) * (height - pad * 2);
  const toX = (i: number) => (i / (data.length - 1)) * width;

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp
    ? "var(--color-terminal-green)"
    : "var(--color-terminal-red)";

  const openY = toY(data[0]);
  const fillPath = `M${points[0]} ${points.join(" L")} L${width},${height} L0,${height} Z`;
  const gradId = `intra-${isUp ? "up" : "dn"}`;

  // Format tooltip time
  const fmtTime = (epoch: number) => {
    const d = new Date(epoch * 1000);
    return d.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  };

  // Hover data
  const hx = hover !== null ? toX(hover) : 0;
  const hy = hover !== null ? toY(data[hover]) : 0;
  const hPrice = hover !== null ? data[hover] : 0;
  const hTime =
    hover !== null && timestamps?.[hover]
      ? fmtTime(timestamps[hover])
      : null;
  const hChange =
    hover !== null ? data[hover] - data[0] : 0;
  const hPct =
    hover !== null && data[0] > 0
      ? ((data[hover] - data[0]) / data[0]) * 100
      : 0;

  // Tooltip positioning — flip if too close to right edge
  const tipWidth = 105;
  const flipTip = hover !== null && hx > width - tipWidth - 10;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={`cursor-crosshair ${className ?? ""}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Opening price reference line */}
        <line
          x1={0} y1={openY} x2={width} y2={openY}
          stroke="var(--color-terminal-muted)"
          strokeWidth="0.5" strokeDasharray="4 3" opacity={0.4}
        />

        {/* Gradient fill */}
        <path d={fillPath} fill={`url(#${gradId})`} />

        {/* Price line */}
        <polyline
          points={points.join(" ")}
          fill="none" stroke={color}
          strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
        />

        {/* Current price dot */}
        <circle cx={width} cy={toY(data[data.length - 1])} r="2.5" fill={color} />

        {/* Hover crosshair */}
        {hover !== null && (
          <>
            <line
              x1={hx} y1={0} x2={hx} y2={height}
              stroke="var(--color-terminal-muted)" strokeWidth="0.5" opacity={0.6}
            />
            <circle cx={hx} cy={hy} r="3" fill={color} stroke="var(--color-terminal-bg)" strokeWidth="1" />
          </>
        )}
      </svg>

      {/* Tooltip overlay */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded border border-terminal-border bg-terminal-surface/95 px-2 py-1 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-sm"
          style={{
            left: flipTip ? `calc(${(hx / width) * 100}% - ${tipWidth + 4}px)` : `calc(${(hx / width) * 100}% + 6px)`,
          }}
        >
          <div className="text-terminal-text font-semibold">
            {hPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={hChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>
            {hChange >= 0 ? "+" : ""}
            {hChange.toFixed(2)} ({hPct >= 0 ? "+" : ""}{hPct.toFixed(2)}%)
          </div>
          {hTime && (
            <div className="text-terminal-muted">{hTime} ET</div>
          )}
        </div>
      )}
    </div>
  );
}
