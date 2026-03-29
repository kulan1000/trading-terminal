// SVG chart body for the expanded chart modal
"use client";

import { useCallback, useRef, useState } from "react";
import type { PositionedMarker } from "./marker-utils";
import { TimeAxis, PriceAxis } from "./chart-axes";

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
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H + 20}`}
      preserveAspectRatio="none" className="cursor-crosshair"
      onMouseMove={onMove} onMouseLeave={() => { setHover(null); onHoverChange(null); }}>
      <defs>
        <linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
        <filter id="modal-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <TimeAxis timestamps={timestamps} dataLength={data.length} toX={toX} height={H} />
      <PriceAxis data={data} toY={toY} width={W} height={H} />

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
          <line x1={hx} y1={0} x2={hx} y2={H} stroke="#71717a" strokeWidth="0.5" opacity={0.4} />
          <line x1={0} y1={hy} x2={W} y2={hy} stroke="#71717a" strokeWidth="0.5" opacity={0.2} />
          <circle cx={hx} cy={hy} r="4" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
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
            onClick={(e) => { e.stopPropagation(); onMarkerClick(p.id); }}>
            <circle cx={p.px} cy={p.py} r={18} fill="transparent" />
            {isSel && (
              <circle cx={p.px} cy={p.py} r={16}
                fill="none" stroke={p.style.color} strokeWidth={1} opacity={0.2} strokeDasharray="3 2" />
            )}
            {active && (
              <circle cx={p.px} cy={p.py} r={14}
                fill="none" stroke={p.style.color} strokeWidth={1.5} opacity={0.3} filter="url(#modal-glow)" />
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
