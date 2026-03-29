"use client";

import { useState } from "react";
import { BiasSignalTooltip } from "./bias-signal-tooltip";

export interface BiasMarker {
  id: number;
  direction: string;
  author: string;
  content: string | null;
  interpretation: string | null;
  strength: string;
  created_at: string;
  pctX: number;
  pctY: number;
}

interface Props {
  markers: BiasMarker[];
}

export function BiasChartMarkers({ markers }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!markers.length) return null;

  return (
    <>
      {markers.map((p) => {
        const isHov = hovered === p.id;
        const isBull = p.direction === "bullish";
        const color = isBull ? "#26A69A" : "#EF5350";

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
              width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isHov && (
              <div style={{
                position: "absolute",
                width: 20, height: 20, borderRadius: "50%",
                border: `1.5px solid ${color}`,
                opacity: 0.35,
                boxShadow: `0 0 8px ${color}60`,
              }} />
            )}
            <div style={{
              width: isHov ? 12 : 9,
              height: isHov ? 12 : 9,
              borderRadius: "50%",
              background: "rgba(10,10,14,0.8)",
              border: `${isHov ? 2 : 1.5}px solid ${color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
            }}>
              <div style={{
                width: isHov ? 6 : 4,
                height: isHov ? 6 : 4,
                borderRadius: "50%",
                background: color,
                boxShadow: isHov ? `0 0 6px ${color}` : undefined,
                transition: "all 0.15s ease",
              }} />
            </div>
          </div>
        );
      })}

      {hovered !== null && (() => {
        const p = markers.find((m) => m.id === hovered);
        if (!p) return null;
        const flipLeft = p.pctX > 75;
        return (
          <div style={{
            position: "absolute",
            left: flipLeft ? "auto" : `${p.pctX}%`,
            right: flipLeft ? `${100 - p.pctX}%` : "auto",
            top: 0,
            transform: flipLeft ? "translateX(0%)" : p.pctX < 25 ? "translateX(0%)" : "translateX(-50%)",
            zIndex: 30,
            pointerEvents: "none",
            userSelect: "none",
          }}>
            <BiasSignalTooltip
              author={p.author}
              direction={p.direction}
              content={p.content}
              interpretation={p.interpretation}
              created_at={p.created_at}
              strength={p.strength}
            />
          </div>
        );
      })()}
    </>
  );
}
