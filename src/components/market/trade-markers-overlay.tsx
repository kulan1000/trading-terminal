// Trade signal dots rendered ON the sparkline chart
"use client";

import { useMemo, useState } from "react";
import type { TradeMarker } from "./sparkline";

interface Props {
  markers: TradeMarker[];
  timestamps: number[]; // epoch seconds for each data point
  data: number[];       // price data points
  toX: (i: number) => number;
  toY: (v: number) => number;
  width: number;
  height: number;
}

interface MarkerStyle {
  color: string;
  label: string;
}

function getStyle(m: TradeMarker): MarkerStyle {
  if (m.signal_type === "entry" && m.position === "long")
    return { color: "#22c55e", label: "ENTRY LONG" };
  if (m.signal_type === "entry" && m.position === "short")
    return { color: "#ef4444", label: "ENTRY SHORT" };
  if (m.signal_type === "exited" && m.position === "long")
    return { color: "#60a5fa", label: "EXIT LONG" };
  if (m.signal_type === "exited" && m.position === "short")
    return { color: "#f97316", label: "EXIT SHORT" };
  return { color: "#a78bfa", label: "HOLDING" };
}

type Positioned = TradeMarker & {
  px: number; // pixel X
  py: number; // pixel Y (on the chart line)
  pctX: number; // 0-100 for tooltip positioning
  style: MarkerStyle;
};

export function TradeMarkersOverlay({
  markers, timestamps, data, toX, toY, width, height,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const positioned = useMemo(() => {
    if (!timestamps.length || !data.length) return [];
    const tStart = timestamps[0];
    const tEnd = timestamps[timestamps.length - 1];
    const tRange = tEnd - tStart || 1;

    // Only entries and exits, no holdings
    return markers
      .filter((m) => m.signal_type === "entry" || m.signal_type === "exited")
      .map((m): Positioned | null => {
        const mTs = new Date(m.msg_timestamp).getTime() / 1000;
        if (mTs < tStart || mTs > tEnd) return null;

        // Find closest data index and interpolate
        const frac = (mTs - tStart) / tRange;
        const exactIdx = frac * (data.length - 1);
        const lo = Math.floor(exactIdx);
        const hi = Math.min(lo + 1, data.length - 1);
        const t = exactIdx - lo;
        const interpolatedPrice = data[lo] + (data[hi] - data[lo]) * t;

        const px = toX(exactIdx);
        const py = toY(interpolatedPrice);
        const pctX = (px / width) * 100;

        return { ...m, px, py, pctX, style: getStyle(m) };
      })
      .filter(Boolean) as Positioned[];
  }, [markers, timestamps, data, toX, toY, width]);

  if (!positioned.length) return null;

  return (
    <>
      {/* SVG layer with dots, overlaid on top of the chart */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute", top: 0, left: 0,
          pointerEvents: "none", overflow: "visible",
        }}
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
              {/* Hit area */}
              <circle cx={p.px} cy={p.py} r={12} fill="transparent"
                style={{ cursor: "pointer" }} />
              {/* Outer pulse ring on hover */}
              {isHov && (
                <circle cx={p.px} cy={p.py} r={10}
                  fill="none" stroke={p.style.color} strokeWidth={1.5}
                  opacity={0.3} filter="url(#dot-glow)" />
              )}
              {/* Dark outline ring — makes dot visible against any background */}
              <circle cx={p.px} cy={p.py}
                r={isHov ? 6 : 4.5}
                fill="rgba(10,10,14,0.8)"
                stroke={p.style.color}
                strokeWidth={isHov ? 2 : 1.5}
                opacity={1}
              />
              {/* Inner bright dot */}
              <circle cx={p.px} cy={p.py}
                r={isHov ? 3 : 2}
                fill={p.style.color}
                opacity={1}
                filter={isHov ? "url(#dot-glow)" : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML tooltip — positioned absolutely over the chart */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
        });
        const date = new Date(p.msg_timestamp).toLocaleDateString("sv-SE", {
          weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm",
        });
        // Position tooltip above the dot, flip if near edges
        const flipRight = p.pctX < 25;
        const flipLeft = p.pctX > 75;
        return (
          <div style={{
            position: "absolute",
            left: flipLeft ? "auto" : `${p.pctX}%`,
            right: flipLeft ? `${100 - p.pctX}%` : "auto",
            top: 0,
            transform: flipRight
              ? "translateX(0%)"
              : flipLeft
                ? "translateX(0%)"
                : "translateX(-50%)",
            background: "rgba(10,10,14,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 8,
            padding: "8px 10px",
            minWidth: 140,
            border: `1px solid ${p.style.color}50`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${p.style.color}20`,
            zIndex: 30,
            pointerEvents: "none",
            userSelect: "none",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: p.style.color, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, color: p.style.color,
                letterSpacing: "0.5px",
                fontFamily: "var(--font-mono, ui-monospace, monospace)",
              }}>
                {p.style.label}
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
                <span>${p.price_at_signal.toLocaleString(undefined, {
                  minimumFractionDigits: 1, maximumFractionDigits: 2,
                })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#71717a" }}>Time</span>
                <span>{date} {time}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
