"use client";

import { useState, useCallback, useRef } from "react";
import { SparklineTooltip } from "./sparkline-tooltip";
import { TradeMarkersOverlay } from "./trade-markers-overlay";

export interface TradeMarker {
  id: number;
  author: string;
  signal_type: "entry" | "exited" | "position";
  position: "long" | "short" | null;
  direction: string;
  price_at_signal: number;
  created_at: string; // ISO timestamp
}

interface SparklineProps {
  data: number[];
  timestamps?: number[]; // epoch seconds
  width?: number;
  height?: number;
  className?: string;
  markers?: TradeMarker[];
}

/** Intraday SVG sparkline with hover tooltip + trade markers */
export function Sparkline({
  data,
  timestamps,
  width = 280,
  height = 64,
  className,
  markers,
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
  const color = isUp ? "var(--color-terminal-green)" : "var(--color-terminal-red)";

  const openY = toY(data[0]);
  const fillPath = `M${points[0]} ${points.join(" L")} L${width},${height} L0,${height} Z`;
  const gradId = `intra-${isUp ? "up" : "dn"}`;

  // Hover calculations
  const hx = hover !== null ? toX(hover) : 0;
  const hy = hover !== null ? toY(data[hover]) : 0;
  const hTime = hover !== null && timestamps?.[hover]
    ? new Date(timestamps[hover] * 1000).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" })
    : null;

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

        <line x1={0} y1={openY} x2={width} y2={openY}
          stroke="var(--color-terminal-muted)" strokeWidth="0.5" strokeDasharray="4 3" opacity={0.4} />

        <path d={fillPath} fill={`url(#${gradId})`} />

        <polyline points={points.join(" ")}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={width} cy={toY(data[data.length - 1])} r="2.5" fill={color} />

        {/* Trade heatmap + markers overlay */}
        {markers?.length ? (
          <TradeMarkersOverlay
            markers={markers}
            timestamps={timestamps ?? []}
            toX={toX} toY={toY}
            min={min} max={max} width={width} height={height}
          />
        ) : null}

        {hover !== null && (
          <>
            <line x1={hx} y1={0} x2={hx} y2={height}
              stroke="var(--color-terminal-muted)" strokeWidth="0.5" opacity={0.6} />
            <circle cx={hx} cy={hy} r="3" fill={color} stroke="var(--color-terminal-bg)" strokeWidth="1" />
          </>
        )}
      </svg>

      {hover !== null && (
        <SparklineTooltip
          price={data[hover]}
          change={data[hover] - data[0]}
          changePct={data[0] > 0 ? ((data[hover] - data[0]) / data[0]) * 100 : 0}
          time={hTime}
          x={hx}
          width={width}
        />
      )}
    </div>
  );
}
