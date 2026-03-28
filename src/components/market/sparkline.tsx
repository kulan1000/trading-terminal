"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SparklineTooltip } from "./sparkline-tooltip";
import { TradeMarkersOverlay } from "./trade-markers-overlay";
import { fmtTimeEpoch } from "@/lib/format-utils";

export interface TradeMarker {
  id: number;
  author: string;
  signal_type: "entry" | "exited" | "position";
  position: "long" | "short" | null;
  direction: string;
  price_at_signal: number;
  created_at: string;
  msg_timestamp: string;
  content: string;
}

interface SparklineProps {
  data: number[];
  timestamps?: number[];
  width?: number;
  height?: number;
  className?: string;
  markers?: TradeMarker[];
}

/** Intraday SVG sparkline with hover tooltip + signal strip below */
export function Sparkline({
  data,
  timestamps,
  width: defaultWidth = 280,
  height = 56,
  className,
  markers,
}: SparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(defaultWidth);

  // Measure actual container width so the viewBox matches the rendered size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setMeasuredWidth(Math.round(w));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = measuredWidth;

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
  const gradId = `intra-${isUp ? "up" : "dn"}-${width}`;

  // Hover calculations — Stockholm time
  const hx = hover !== null ? toX(hover) : 0;
  const hy = hover !== null ? toY(data[hover]) : 0;
  const hTime = hover !== null && timestamps?.[hover]
    ? fmtTimeEpoch(timestamps[hover])
    : null;

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
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

        {hover !== null && (
          <>
            <line x1={hx} y1={0} x2={hx} y2={height}
              stroke="var(--color-terminal-muted)" strokeWidth="0.5" opacity={0.6} />
            <circle cx={hx} cy={hy} r="3" fill={color} stroke="var(--color-terminal-bg)" strokeWidth="1" />
          </>
        )}
      </svg>

      {/* Signal dots ON the chart */}
      {markers?.length ? (
        <TradeMarkersOverlay
          markers={markers}
          timestamps={timestamps ?? []}
          data={data}
          toX={toX}
          toY={toY}
          width={width}
          height={height}
        />
      ) : null}

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
