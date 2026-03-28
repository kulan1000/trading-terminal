// Trade signal dots rendered ON the sparkline chart
"use client";

import { useMemo, useState } from "react";
import type { TradeMarker } from "./sparkline";
import { positionMarkers } from "./marker-utils";
import { MarkerTooltip } from "./marker-tooltip";

interface Props {
  markers: TradeMarker[];
  timestamps: number[];
  data: number[];
  toX: (i: number) => number;
  toY: (v: number) => number;
  width: number;
  height: number;
}

export function TradeMarkersOverlay({
  markers, timestamps, data, toX, toY, width, height,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const positioned = useMemo(
    () => positionMarkers(markers, timestamps, data, toX, toY, width),
    [markers, timestamps, data, toX, toY, width]
  );

  if (!positioned.length) return null;

  return (
    <>
      {/* SVG layer with dots */}
      <svg
        width="100%" height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
      >
        <defs>
          <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {positioned.map((p) => {
          const isHov = hovered === p.id;
          return (
            <g key={p.id} style={{ pointerEvents: "all" }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={p.px} cy={p.py} r={12} fill="transparent" style={{ cursor: "pointer" }} />
              {isHov && (
                <circle cx={p.px} cy={p.py} r={10}
                  fill="none" stroke={p.style.color} strokeWidth={1.5}
                  opacity={0.3} filter="url(#dot-glow)" />
              )}
              <circle cx={p.px} cy={p.py}
                r={isHov ? 6 : 4.5} fill="rgba(10,10,14,0.8)"
                stroke={p.style.color} strokeWidth={isHov ? 2 : 1.5} />
              <circle cx={p.px} cy={p.py}
                r={isHov ? 3 : 2} fill={p.style.color}
                filter={isHov ? "url(#dot-glow)" : undefined} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const flipLeft = p.pctX > 75;
        const flipRight = p.pctX < 25;
        return (
          <div style={{
            position: "absolute",
            left: flipLeft ? "auto" : `${p.pctX}%`,
            right: flipLeft ? `${100 - p.pctX}%` : "auto",
            top: 0,
            transform: flipRight ? "translateX(0%)" : flipLeft ? "translateX(0%)" : "translateX(-50%)",
            zIndex: 30,
            pointerEvents: "none",
            userSelect: "none",
          }}>
            <MarkerTooltip marker={p} size="small" />
          </div>
        );
      })()}
    </>
  );
}
