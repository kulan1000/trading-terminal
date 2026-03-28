// Expanded chart modal — fullscreen overlay with large interactive chart
"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import type { MarketQuote } from "@/lib/market-data";
import type { TradeMarker } from "./sparkline";
import { changeColor } from "@/lib/utils";

interface Props {
  quote: MarketQuote;
  pair: string;
  markers: TradeMarker[];
  onClose: () => void;
}

// Marker styling
function getMarkerStyle(m: TradeMarker) {
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

const LEGEND = [
  { color: "#22c55e", label: "Entry Long" },
  { color: "#ef4444", label: "Entry Short" },
  { color: "#60a5fa", label: "Exit Long" },
  { color: "#f97316", label: "Exit Short" },
];

export function ChartModal({ quote, pair, markers, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const data = quote.sparkline;
  const timestamps = quote.sparklineTs;

  // Chart dimensions
  const W = 900;
  const H = 340;
  const pad = 8;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toY = useCallback(
    (v: number) => pad + ((max - v) / range) * (H - pad * 2),
    [max, range]
  );
  const toX = useCallback(
    (i: number) => (i / (data.length - 1)) * W,
    [data.length]
  );

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#34d399" : "#f87171";
  const openY = toY(data[0]);
  const fillPath = `M${points[0]} ${points.join(" L")} L${W},${H} L0,${H} Z`;

  // Position markers on chart
  const positionedMarkers = useMemo(() => {
    if (!timestamps?.length || !data.length) return [];
    const tStart = timestamps[0];
    const tEnd = timestamps[timestamps.length - 1];
    const tRange = tEnd - tStart || 1;

    return markers
      .filter((m) => m.signal_type === "entry" || m.signal_type === "exited")
      .map((m) => {
        const mTs = new Date(m.msg_timestamp).getTime() / 1000;
        if (mTs < tStart || mTs > tEnd) return null;
        const frac = (mTs - tStart) / tRange;
        const exactIdx = frac * (data.length - 1);
        const lo = Math.floor(exactIdx);
        const hi = Math.min(lo + 1, data.length - 1);
        const t = exactIdx - lo;
        const price = data[lo] + (data[hi] - data[lo]) * t;
        return {
          ...m,
          px: toX(exactIdx),
          py: toY(price),
          pctX: (toX(exactIdx) / W) * 100,
          style: getMarkerStyle(m),
        };
      })
      .filter(Boolean) as Array<TradeMarker & { px: number; py: number; pctX: number; style: { color: string; label: string } }>;
  }, [markers, timestamps, data, toX, toY]);

  // Mouse hover on chart line
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

  const hx = hover !== null ? toX(hover) : 0;
  const hy = hover !== null ? toY(data[hover]) : 0;
  const hTime = hover !== null && timestamps?.[hover]
    ? new Date(timestamps[hover] * 1000).toLocaleTimeString("sv-SE", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
      })
    : null;

  const changeCol = changeColor(quote.change);
  const arrow = quote.change >= 0 ? "▲" : "▼";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-[95vw] max-w-[960px] rounded-xl border border-terminal-border bg-terminal-surface/98 font-mono shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-border/50 px-6 py-4">
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-terminal-muted">
              {quote.asset} — {pair}
            </span>
            <span className="text-2xl font-bold text-terminal-text">
              {quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-semibold ${changeCol}`}>
              {arrow} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex gap-3">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-[10px] text-terminal-muted">{l.label}</span>
                </div>
              ))}
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-terminal-muted transition-colors hover:bg-terminal-border/30 hover:text-terminal-text"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="relative px-6 py-4">
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H + 20}`}
            preserveAspectRatio="none"
            className="cursor-crosshair"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
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

            {/* Time axis labels */}
            {timestamps && timestamps.length > 10 && (() => {
              const tickCount = 6;
              const ticks = [];
              for (let i = 0; i <= tickCount; i++) {
                const idx = Math.round((i / tickCount) * (data.length - 1));
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

            {/* Open price dashed line */}
            <line x1={0} y1={openY} x2={W} y2={openY}
              stroke="#71717a" strokeWidth="0.5" strokeDasharray="6 4" opacity={0.3} />

            {/* Price area fill */}
            <path d={fillPath} fill="url(#modal-grad)" />

            {/* Price line */}
            <polyline points={points.join(" ")}
              fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Live dot at end */}
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
              return (
                <g key={p.id} style={{ pointerEvents: "all", cursor: "pointer" }}
                  onMouseEnter={() => { setHoveredMarker(p.id); setHover(null); }}
                  onMouseLeave={() => setHoveredMarker(null)}
                >
                  <circle cx={p.px} cy={p.py} r={18} fill="transparent" />
                  {/* Pulse ring on hover */}
                  {isHov && (
                    <circle cx={p.px} cy={p.py} r={14}
                      fill="none" stroke={p.style.color} strokeWidth={1.5}
                      opacity={0.3} filter="url(#modal-glow)" />
                  )}
                  {/* Dark outline ring */}
                  <circle cx={p.px} cy={p.py}
                    r={isHov ? 8 : 6}
                    fill="rgba(10,10,14,0.85)"
                    stroke={p.style.color}
                    strokeWidth={isHov ? 2.5 : 2}
                    opacity={1}
                  />
                  {/* Inner bright dot */}
                  <circle cx={p.px} cy={p.py}
                    r={isHov ? 4 : 3}
                    fill={p.style.color}
                    opacity={1}
                    filter={isHov ? "url(#modal-glow)" : undefined}
                  />
                </g>
              );
            })}
          </svg>

          {/* Hover price tooltip */}
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-4 rounded-md border border-terminal-border bg-terminal-surface/95 px-3 py-1.5 font-mono text-xs shadow-lg backdrop-blur-sm"
              style={{
                left: hx > W * 0.75
                  ? `calc(${(hx / W) * 100}% - 130px)`
                  : `calc(${(hx / W) * 100}% + 12px)`,
              }}
            >
              <div className="font-semibold text-terminal-text">
                {data[hover].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={data[hover] >= data[0] ? "text-terminal-green" : "text-terminal-red"}>
                {(data[hover] - data[0] >= 0 ? "+" : "")}{(data[hover] - data[0]).toFixed(2)}
              </div>
              {hTime && <div className="text-terminal-muted">{hTime}</div>}
            </div>
          )}

          {/* Marker hover tooltip */}
          {hoveredMarker !== null && (() => {
            const p = positionedMarkers.find((m) => m.id === hoveredMarker);
            if (!p) return null;
            const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
              hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
            });
            const date = new Date(p.msg_timestamp).toLocaleDateString("sv-SE", {
              weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm",
            });
            const flipLeft = p.pctX > 70;
            return (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: flipLeft ? "auto" : `${p.pctX}%`,
                  right: flipLeft ? `${100 - p.pctX}%` : "auto",
                  top: `calc(${(p.py / H) * 100}% - 10px)`,
                  transform: flipLeft ? "translate(50%, -100%)" : "translate(-50%, -100%)",
                  zIndex: 40,
                }}
              >
                <div style={{
                  background: "rgba(10,10,14,0.96)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  minWidth: 160,
                  border: `1px solid ${p.style.color}50`,
                  boxShadow: `0 12px 32px rgba(0,0,0,0.7), 0 0 16px ${p.style.color}25`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: p.style.color,
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: p.style.color,
                      letterSpacing: "0.5px",
                    }}>
                      {p.style.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11, color: "#d4d4d8", lineHeight: 1.8,
                    fontFamily: "var(--font-mono, monospace)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                      <span style={{ color: "#71717a" }}>Trader</span>
                      <span>{p.author}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                      <span style={{ color: "#71717a" }}>Price</span>
                      <span>${p.price_at_signal.toLocaleString(undefined, {
                        minimumFractionDigits: 2, maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                      <span style={{ color: "#71717a" }}>Time</span>
                      <span>{date} {time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer: signal count */}
        <div className="border-t border-terminal-border/30 px-6 py-2.5 text-[11px] text-terminal-muted">
          {positionedMarkers.length} trade signal{positionedMarkers.length !== 1 ? "s" : ""} (48h) · Click outside or press ESC to close
        </div>
      </div>
    </div>
  );
}
