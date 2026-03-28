// Trade signal dots rendered ON the sparkline chart
// Uses HTML divs instead of SVG circles to avoid stretching from preserveAspectRatio="none"
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
    () => positionMarkers(markers, timestamps, data, toX, toY, width).map((p) => ({
      ...p,
      pctY: (p.py / height) * 100,
    })),
    [markers, timestamps, data, toX, toY, width, height]
  );

  if (!positioned.length) return null;

  return (
    <>
      {/* HTML dots — won't stretch like SVG circles */}
      {positioned.map((p) => {
        const isHov = hovered === p.id;
        return (
          <div
            key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              left: `${p.pctX}%`,
              top: `${p.pctY}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              cursor: "pointer",
              // Generous hit area
              width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {/* Glow ring on hover */}
            {isHov && (
              <div style={{
                position: "absolute",
                width: 20, height: 20, borderRadius: "50%",
                border: `1.5px solid ${p.style.color}`,
                opacity: 0.35,
                boxShadow: `0 0 8px ${p.style.color}60`,
              }} />
            )}
            {/* Outer ring */}
            <div style={{
              width: isHov ? 12 : 9,
              height: isHov ? 12 : 9,
              borderRadius: "50%",
              background: "rgba(10,10,14,0.8)",
              border: `${isHov ? 2 : 1.5}px solid ${p.style.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
            }}>
              {/* Inner dot */}
              <div style={{
                width: isHov ? 6 : 4,
                height: isHov ? 6 : 4,
                borderRadius: "50%",
                background: p.style.color,
                boxShadow: isHov ? `0 0 6px ${p.style.color}` : undefined,
                transition: "all 0.15s ease",
              }} />
            </div>
          </div>
        );
      })}

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
