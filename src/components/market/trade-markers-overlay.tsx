// Signal strip below sparkline: clean colored ticks for entries/exits
"use client";

import { useMemo, useState } from "react";
import type { TradeMarker } from "./sparkline";

interface Props {
  markers: TradeMarker[];
  timestamps: number[];
  toX: (i: number) => number;
  width: number;
  stripHeight: number; // height of the signal strip area
}

function getMarkerColor(m: TradeMarker) {
  const { signal_type, position } = m;
  if (signal_type === "entry" && position === "long") return "#22c55e";
  if (signal_type === "entry" && position === "short") return "#ef4444";
  if (signal_type === "exited" && position === "long") return "#60a5fa";
  if (signal_type === "exited" && position === "short") return "#f97316";
  return "#a78bfa"; // holding
}

function getMarkerLabel(m: TradeMarker) {
  const { signal_type, position } = m;
  if (signal_type === "entry") return position === "long" ? "ENTRY LONG" : "ENTRY SHORT";
  if (signal_type === "exited") return position === "long" ? "EXIT LONG" : "EXIT SHORT";
  return "HOLDING";
}

export function TradeMarkersOverlay({ markers, timestamps, toX, width, stripHeight }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Position markers using original Discord message timestamp
  const positioned = useMemo(() => {
    if (!timestamps.length) return [];
    const tStart = timestamps[0];
    const tEnd = timestamps[timestamps.length - 1];

    return markers
      .map((m) => {
        const mTs = new Date(m.msg_timestamp).getTime() / 1000;
        if (mTs < tStart || mTs > tEnd) return null;
        let mi = 0;
        for (let j = 1; j < timestamps.length; j++) {
          if (Math.abs(timestamps[j] - mTs) < Math.abs(timestamps[mi] - mTs)) mi = j;
        }
        return { ...m, mx: toX(mi), color: getMarkerColor(m), label: getMarkerLabel(m) };
      })
      .filter(Boolean) as Array<TradeMarker & { mx: number; color: string; label: string }>;
  }, [markers, timestamps, toX]);

  if (!positioned.length) return null;

  const mid = stripHeight / 2;

  return (
    <svg width="100%" height={stripHeight} viewBox={`0 0 ${width} ${stripHeight}`}
      preserveAspectRatio="none" className="mt-0.5">
      {/* Subtle baseline */}
      <line x1={0} y1={mid} x2={width} y2={mid}
        stroke="var(--color-terminal-muted)" strokeWidth="0.3" opacity={0.3} />

      {/* Signal ticks */}
      {positioned.map((p) => {
        const isEntry = p.signal_type === "entry";
        const isExit = p.signal_type === "exited";
        const isHov = hovered === p.id;
        // Entries: tick up from baseline, exits: tick down, holding: small dot
        const tickH = isEntry || isExit ? stripHeight * 0.8 : stripHeight * 0.4;
        const y1 = isEntry ? mid - tickH : isExit ? mid : mid - tickH / 2;
        const y2 = y1 + tickH;

        return (
          <g key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Hit area */}
            <rect x={p.mx - 4} y={0} width={8} height={stripHeight} fill="transparent" />
            {/* Tick line */}
            <line x1={p.mx} y1={y1} x2={p.mx} y2={y2}
              stroke={p.color} strokeWidth={isHov ? 2.5 : 1.5}
              strokeLinecap="round" opacity={isHov ? 1 : 0.85} />
            {/* Small dot at tip */}
            {(isEntry || isExit) && (
              <circle cx={p.mx} cy={isEntry ? y1 : y2} r={isHov ? 2 : 1.2}
                fill={p.color} />
            )}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const tipW = 95;
        const tx = p.mx + 10 + tipW > width ? p.mx - tipW - 6 : p.mx + 6;
        const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
        });
        return (
          <foreignObject x={tx} y={-28} width={tipW} height={30} style={{ overflow: "visible" }}>
            <div style={{
              background: "rgba(0,0,0,0.9)", borderRadius: 4, padding: "2px 5px",
              fontSize: 8, lineHeight: 1.3, color: "#e4e4e7", whiteSpace: "nowrap",
              border: `1px solid ${p.color}50`,
            }}>
              <div style={{ fontWeight: 700, color: p.color }}>{p.label}</div>
              <div>{p.author} · ${p.price_at_signal.toFixed(1)} · {time}</div>
            </div>
          </foreignObject>
        );
      })()}
    </svg>
  );
}
