// Signal strip below sparkline — pill-tag markers on a timeline
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

interface MarkerStyle {
  bg: string;
  border: string;
  text: string;
  icon: string;
  label: string;
}

function getStyle(m: TradeMarker): MarkerStyle {
  if (m.signal_type === "entry" && m.position === "long")
    return { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.5)", text: "#4ade80", icon: "▲", label: "LONG" };
  if (m.signal_type === "entry" && m.position === "short")
    return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)", text: "#f87171", icon: "▼", label: "SHORT" };
  if (m.signal_type === "exited" && m.position === "long")
    return { bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.5)", text: "#93bbfc", icon: "✕", label: "EXIT L" };
  if (m.signal_type === "exited" && m.position === "short")
    return { bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.5)", text: "#fdba74", icon: "✕", label: "EXIT S" };
  return { bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)", text: "#c4b5fd", icon: "◈", label: "HOLD" };
}

type Positioned = TradeMarker & { pct: number; style: MarkerStyle };

export function TradeMarkersOverlay({ markers, timestamps }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const positioned = useMemo(() => {
    if (!timestamps.length) return [];
    const tStart = timestamps[0];
    const tEnd = timestamps[timestamps.length - 1];
    const tRange = tEnd - tStart || 1;

    return markers
      .map((m): Positioned | null => {
        const mTs = new Date(m.msg_timestamp).getTime() / 1000;
        if (mTs < tStart || mTs > tEnd) return null;
        const pct = ((mTs - tStart) / tRange) * 100;
        return { ...m, pct, style: getStyle(m) };
      })
      .filter(Boolean) as Positioned[];
  }, [markers, timestamps]);

  if (!positioned.length) return null;

  return (
    <div style={{ position: "relative", width: "100%", height: 28, marginTop: 2, userSelect: "none" }}>
      {/* Timeline baseline */}
      <div style={{
        position: "absolute", top: 13, left: 4, right: 4, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(161,161,170,0.12) 10%, rgba(161,161,170,0.12) 90%, transparent)",
      }} />

      {/* Marker pills */}
      {positioned.map((p) => {
        const isHov = hovered === p.id;
        return (
          <div
            key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              left: `${p.pct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "1px 5px 1px 3px",
              borderRadius: 4,
              background: isHov ? p.style.bg.replace(/[\d.]+\)$/, "0.3)") : p.style.bg,
              border: `1px solid ${isHov ? p.style.border.replace(/[\d.]+\)$/, "0.8)") : p.style.border}`,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              boxShadow: isHov ? `0 0 8px ${p.style.border}` : "none",
              zIndex: isHov ? 10 : 1,
            }}
          >
            <span style={{ fontSize: 8, lineHeight: 1, color: p.style.text }}>
              {p.style.icon}
            </span>
            <span style={{
              fontSize: 8.5, fontWeight: 600, letterSpacing: "0.4px",
              color: p.style.text,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
            }}>
              {p.style.label}
            </span>
          </div>
        );
      })}

      {/* Hover tooltip card */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
        });
        const date = new Date(p.msg_timestamp).toLocaleDateString("sv-SE", {
          weekday: "short", month: "short", day: "numeric", timeZone: "Europe/Stockholm",
        });
        const flipLeft = p.pct > 70;
        return (
          <div style={{
            position: "absolute",
            left: flipLeft ? "auto" : `${p.pct}%`,
            right: flipLeft ? `${100 - p.pct}%` : "auto",
            bottom: "calc(100% + 6px)",
            transform: flipLeft ? "translateX(50%)" : "translateX(-50%)",
            background: "rgba(10,10,14,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 8,
            padding: "8px 10px",
            minWidth: 140,
            border: `1px solid ${p.style.border}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${p.style.bg}`,
            zIndex: 20,
            pointerEvents: "none",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 16, height: 16, borderRadius: 4,
                background: p.style.bg, fontSize: 9, color: p.style.text,
              }}>
                {p.style.icon}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: p.style.text,
                letterSpacing: "0.6px",
                fontFamily: "var(--font-mono, ui-monospace, monospace)",
              }}>
                {p.signal_type === "entry"
                  ? `ENTRY ${(p.position ?? "").toUpperCase()}`
                  : p.signal_type === "exited"
                    ? `EXIT ${(p.position ?? "").toUpperCase()}`
                    : "HOLDING"}
              </span>
            </div>
            {/* Details */}
            <div style={{
              fontSize: 9.5, color: "#d4d4d8", lineHeight: 1.7,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#71717a" }}>Trader</span>
                <span>{p.author}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#71717a" }}>Price</span>
                <span>${p.price_at_signal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#71717a" }}>Time</span>
                <span>{date} {time}</span>
              </div>
            </div>
            {/* Arrow pointer */}
            <div style={{
              position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
              borderTop: `5px solid ${p.style.border}`,
            }} />
          </div>
        );
      })()}
    </div>
  );
}
