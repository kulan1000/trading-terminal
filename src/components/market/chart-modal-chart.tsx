// SVG chart body for the expanded chart modal
"use client";

import { useCallback, useRef, useState } from "react";
import type { PositionedMarker } from "./marker-utils";

interface Props {
  data: number[];
  timestamps: number[];
  width: number;
  height: number;
  toX: (i: number) => number;
  toY: (v: number) => number;
  color: string;
  openY: number;
  positionedMarkers: PositionedMarker[];
  onHoverChange: (idx: number | null) => void;
  onMarkerHover: (id: number | null) => void;
  onMarkerClick: (id: number) => void;
  hoveredMarker: number | null;
  selectedMarker: number | null;
}

/** Generate ~5 evenly-spaced "nice" price ticks between min and max */
function priceTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];
  // Pick a nice step size (1, 2, 5, 10, 20, 50, …)
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  const nice = residual <= 1.5 ? 1 : residual <= 3 ? 2 : residual <= 7 ? 5 : 10;
  const step = nice * mag;
  const lo = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= max; v += step) ticks.push(v);
  return ticks;
}

export function ChartModalChart({
  data, timestamps, width: W, height: H, toX, toY,
  color, openY, positionedMarkers,
  onHoverChange, onMarkerHover, onMarkerClick, hoveredMarker, selectedMarker,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const idx = Math.round(ratio * (data.length - 1));
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      setHover(clamped);
      onHoverChange(clamped);
    },
    [data.length, onHoverChange]
  );

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
  const fillPath = `M${points[0]} ${points.join(" L")} L${W},${H} L0,${H} Z`;

  const hx = hover !== null ? toX(hover) : 0;
  const hy = hover !== null ? toY(data[hover]) : 0;

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${W} ${H + 20}`}
      preserveAspectRatio="none"
      className="cursor-crosshair"
      onMouseMove={onMove}
      onMouseLeave={() => { setHover(null); onHoverChange(null); }}
    >
      <defs>
        <linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
        <filter id="modal-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Time axis */}
      {timestamps.length > 10 && (() => {
        const ticks = [];
        for (let i = 0; i <= 6; i++) {
          const idx = Math.round((i / 6) * (data.length - 1));
          const ts = timestamps[idx];
          if (!ts) continue;
          const x = toX(idx);
          const label = new Date(ts * 1000).toLocaleTimeString("sv-SE", {
            hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
          });
          ticks.push(
            <g key={i}>
              <line x1={x} y1={H - 2} x2={x} y2={H + 4} stroke="#52525b" strokeWidth="0.5" />
              <text x={x} y={H + 14} textAnchor="middle"
                fill="#71717a" fontSize="9" fontFamily="ui-monospace, monospace">
                {label}
              </text>
            </g>
          );
        }
        return ticks;
      })()}

      {/* Price axis grid lines + labels */}
      {(() => {
        const dMin = Math.min(...data);
        const dMax = Math.max(...data);
        const ticks = priceTicks(dMin, dMax);
        const decimals = dMax < 10 ? 2 : dMax < 100 ? 2 : dMax < 1000 ? 1 : 0;
        return ticks.map((v) => {
          const y = toY(v);
          if (y < 4 || y > H - 4) return null;
          return (
            <g key={v}>
              <line x1={0} y1={y} x2={W} y2={y}
                stroke="#3f3f46" strokeWidth="0.4" strokeDasharray="4 6" opacity={0.5} />
              <rect x={W - 62} y={y - 8} width={58} height={16} rx={3}
                fill="rgba(10,10,14,0.75)" />
              <text x={W - 6} y={y + 3.5} textAnchor="end"
                fill="#a1a1aa" fontSize="9.5" fontFamily="ui-monospace, monospace">
                {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
              </text>
            </g>
          );
        });
      })()}

      {/* Open price line */}
      <line x1={0} y1={openY} x2={W} y2={openY}
        stroke="#71717a" strokeWidth="0.5" strokeDasharray="6 4" opacity={0.3} />

      <path d={fillPath} fill="url(#modal-grad)" />

      <polyline points={points.join(" ")}
        fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Live dot */}
      <circle cx={W} cy={toY(data[data.length - 1])} r="3.5" fill={color} />

      {/* Hover crosshair */}
      {hover !== null && (
        <>
          <line x1={hx} y1={0} x2={hx} y2={H}
            stroke="#71717a" strokeWidth="0.5" opacity={0.4} />
          <line x1={0} y1={hy} x2={W} y2={hy}
            stroke="#71717a" strokeWidth="0.5" opacity={0.2} />
          <circle cx={hx} cy={hy} r="4" fill={color}
            stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
        </>
      )}

      {/* Signal dots */}
      {positionedMarkers.map((p) => {
        const isHov = hoveredMarker === p.id;
        const isSel = selectedMarker === p.id;
        const active = isHov || isSel;
        return (
          <g key={p.id} style={{ pointerEvents: "all", cursor: "pointer" }}
            onMouseEnter={() => { onMarkerHover(p.id); setHover(null); onHoverChange(null); }}
            onMouseLeave={() => onMarkerHover(null)}
            onClick={(e) => { e.stopPropagation(); onMarkerClick(p.id); }}
          >
            <circle cx={p.px} cy={p.py} r={18} fill="transparent" />
            {/* Selected ring */}
            {isSel && (
              <circle cx={p.px} cy={p.py} r={16}
                fill="none" stroke={p.style.color} strokeWidth={1}
                opacity={0.2} strokeDasharray="3 2" />
            )}
            {active && (
              <circle cx={p.px} cy={p.py} r={14}
                fill="none" stroke={p.style.color} strokeWidth={1.5}
                opacity={0.3} filter="url(#modal-glow)" />
            )}
            <circle cx={p.px} cy={p.py}
              r={active ? 8 : 6} fill="rgba(10,10,14,0.85)"
              stroke={p.style.color} strokeWidth={active ? 2.5 : 2} />
            <circle cx={p.px} cy={p.py}
              r={active ? 4 : 3} fill={p.style.color}
              filter={active ? "url(#modal-glow)" : undefined} />
          </g>
        );
      })}
    </svg>
  );
}
