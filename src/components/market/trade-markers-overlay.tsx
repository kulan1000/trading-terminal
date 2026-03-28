// Signal strip below sparkline — TradingView-inspired markers
"use client";

import { useMemo, useState } from "react";
import type { TradeMarker } from "./sparkline";

interface Props {
  markers: TradeMarker[];
  timestamps: number[];
  toX: (i: number) => number;
  width: number;
  stripHeight: number;
}

const COLORS = {
  entryLong: "#22c55e",
  entryShort: "#ef4444",
  exitLong: "#60a5fa",
  exitShort: "#f97316",
  holding: "#a78bfa",
} as const;

function getMarkerColor(m: TradeMarker) {
  if (m.signal_type === "entry") return m.position === "long" ? COLORS.entryLong : COLORS.entryShort;
  if (m.signal_type === "exited") return m.position === "long" ? COLORS.exitLong : COLORS.exitShort;
  return COLORS.holding;
}

function getMarkerLabel(m: TradeMarker) {
  if (m.signal_type === "entry") return m.position === "long" ? "LONG ENTRY" : "SHORT ENTRY";
  if (m.signal_type === "exited") return m.position === "long" ? "LONG EXIT" : "SHORT EXIT";
  return "HOLDING";
}

function getMarkerIcon(m: TradeMarker) {
  if (m.signal_type === "entry") return m.position === "long" ? "▲" : "▼";
  if (m.signal_type === "exited") return "◆";
  return "●";
}

export function TradeMarkersOverlay({ markers, timestamps, toX, width, stripHeight }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

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
        return { ...m, mx: toX(mi), color: getMarkerColor(m), label: getMarkerLabel(m), icon: getMarkerIcon(m) };
      })
      .filter(Boolean) as Array<TradeMarker & { mx: number; color: string; label: string; icon: string }>;
  }, [markers, timestamps, toX]);

  if (!positioned.length) return null;

  const mid = stripHeight / 2;

  return (
    <svg width="100%" height={stripHeight} viewBox={`0 0 ${width} ${stripHeight}`}
      preserveAspectRatio="none" className="mt-1">
      <defs>
        {/* Glow filters per color */}
        {Object.entries(COLORS).map(([key, c]) => (
          <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feFlood floodColor={c} floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {/* Subtle baseline with gradient fade at edges */}
      <line x1={8} y1={mid} x2={width - 8} y2={mid}
        stroke="var(--color-terminal-muted)" strokeWidth="0.4" opacity={0.2}
        strokeDasharray="2 4" />

      {/* Signal markers */}
      {positioned.map((p) => {
        const isEntry = p.signal_type === "entry";
        const isExit = p.signal_type === "exited";
        const isHov = hovered === p.id;
        const filterKey = isEntry
          ? (p.position === "long" ? "entryLong" : "entryShort")
          : isExit
            ? (p.position === "long" ? "exitLong" : "exitShort")
            : "holding";

        if (isEntry) {
          // Triangles: ▲ for long (points up), ▼ for short (points down)
          const isLong = p.position === "long";
          const size = isHov ? 5 : 3.5;
          const cy = isLong ? mid - 1 : mid + 1;
          const tip = isLong ? cy - size : cy + size;
          const base = isLong ? cy + size * 0.6 : cy - size * 0.6;
          const pts = `${p.mx},${tip} ${p.mx - size * 0.7},${base} ${p.mx + size * 0.7},${base}`;
          return (
            <g key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={p.mx - 6} y={0} width={12} height={stripHeight} fill="transparent" />
              <polygon points={pts} fill={p.color}
                opacity={isHov ? 1 : 0.7}
                filter={isHov ? `url(#glow-${filterKey})` : undefined} />
            </g>
          );
        }

        if (isExit) {
          // Diamond shape for exits
          const size = isHov ? 4 : 2.8;
          const pts = `${p.mx},${mid - size} ${p.mx + size * 0.7},${mid} ${p.mx},${mid + size} ${p.mx - size * 0.7},${mid}`;
          return (
            <g key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={p.mx - 6} y={0} width={12} height={stripHeight} fill="transparent" />
              <polygon points={pts} fill={p.color}
                opacity={isHov ? 1 : 0.65}
                filter={isHov ? `url(#glow-${filterKey})` : undefined} />
            </g>
          );
        }

        // Holding: small circle
        return (
          <g key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            <rect x={p.mx - 6} y={0} width={12} height={stripHeight} fill="transparent" />
            <circle cx={p.mx} cy={mid} r={isHov ? 3 : 2}
              fill={p.color} opacity={isHov ? 1 : 0.55}
              filter={isHov ? `url(#glow-${filterKey})` : undefined} />
          </g>
        );
      })}

      {/* Hover tooltip — card style */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const tipW = 120;
        const tipH = 44;
        const tx = p.mx + 10 + tipW > width ? p.mx - tipW - 8 : p.mx + 8;
        const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
        });
        const date = new Date(p.msg_timestamp).toLocaleDateString("sv-SE", {
          month: "short", day: "numeric", timeZone: "Europe/Stockholm",
        });
        return (
          <foreignObject x={tx} y={-tipH - 4} width={tipW} height={tipH + 8}
            style={{ overflow: "visible", pointerEvents: "none" }}>
            <div style={{
              background: "rgba(10,10,14,0.95)",
              backdropFilter: "blur(8px)",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 9,
              lineHeight: 1.4,
              color: "#d4d4d8",
              whiteSpace: "nowrap",
              border: `1px solid ${p.color}40`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 8px ${p.color}20`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 10 }}>{p.icon}</span>
                <span style={{ fontWeight: 700, color: p.color, letterSpacing: "0.5px" }}>{p.label}</span>
              </div>
              <div style={{ color: "#a1a1aa", fontSize: 8.5 }}>
                {p.author} · ${p.price_at_signal.toFixed(1)}
              </div>
              <div style={{ color: "#71717a", fontSize: 8 }}>
                {date} {time}
              </div>
            </div>
          </foreignObject>
        );
      })()}
    </svg>
  );
}
