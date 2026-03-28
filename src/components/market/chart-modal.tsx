"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { MarketQuote } from "@/lib/market-data";
import type { TradeMarker } from "./sparkline";
import { changeColor } from "@/lib/utils";
import { positionMarkers, MARKER_LEGEND } from "./marker-utils";
import { MarkerTooltip } from "./marker-tooltip";
import { ChartModalChart } from "./chart-modal-chart";

interface Props {
  quote: MarketQuote;
  pair: string;
  markers: TradeMarker[];
  onClose: () => void;
}

const W = 900;
const H = 340;
const PAD = 8;

export function ChartModal({ quote, pair, markers, onClose }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [phase, setPhase] = useState<"entering" | "open" | "leaving" | "gone">("entering");

  // Enter animation
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  // Close with exit animation
  const handleClose = useCallback(() => {
    setPhase("leaving");
    setTimeout(() => {
      setPhase("gone");
      onClose();
    }, 250);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const data = quote.sparkline;
  const timestamps = quote.sparklineTs;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toY = useCallback((v: number) => PAD + ((max - v) / range) * (H - PAD * 2), [max, range]);
  const toX = useCallback((i: number) => (i / (data.length - 1)) * W, [data.length]);

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#34d399" : "#f87171";
  const openY = toY(data[0]);

  const positioned = useMemo(
    () => positionMarkers(markers, timestamps, data, toX, toY, W),
    [markers, timestamps, data, toX, toY]
  );

  const hx = hover !== null ? toX(hover) : 0;
  const hTime = hover !== null && timestamps?.[hover]
    ? new Date(timestamps[hover] * 1000).toLocaleTimeString("sv-SE", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
      })
    : null;

  const changeCol = changeColor(quote.change);
  const arrow = quote.change >= 0 ? "▲" : "▼";
  const isVisible = phase === "open";

  if (phase === "gone") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      style={{ perspective: "1200px" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Modal panel — centered with smooth scale+slide animation */}
      <div
        className="relative z-10 w-[95vw] max-w-[960px] rounded-xl border border-tv-border bg-tv-surface font-mono shadow-2xl backdrop-blur-md"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "scale(1) translateY(0)"
            : "scale(0.92) translateY(24px)",
          transition: isVisible
            ? "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 0.2s ease-in, transform 0.2s ease-in",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tv-border/50 px-6 py-4">
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-tv-muted">{quote.asset} — {pair}</span>
            <span className="text-2xl font-bold text-tv-text">
              {quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-semibold ${changeCol}`}>
              {arrow} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {MARKER_LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-[10px] text-tv-muted">{l.label}</span>
                </div>
              ))}
            </div>
            <button onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-tv-muted transition-colors hover:bg-terminal-border/30 hover:text-tv-text">
              ✕
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="relative px-6 py-4">
          <ChartModalChart
            data={data} timestamps={timestamps} width={W} height={H}
            toX={toX} toY={toY} color={color} openY={openY}
            positionedMarkers={positioned}
            onHoverChange={setHover} onMarkerHover={setHoveredMarker}
            onMarkerClick={(id) => setSelectedMarker(selectedMarker === id ? null : id)}
            hoveredMarker={hoveredMarker} selectedMarker={selectedMarker}
          />

          {/* Hover price tooltip */}
          {hover !== null && (
            <div className="pointer-events-none absolute top-4 rounded-md border border-tv-border bg-tv-surface/95 px-3 py-1.5 font-mono text-xs shadow-lg backdrop-blur-sm"
              style={{ left: hx > W * 0.75 ? `calc(${(hx / W) * 100}% - 130px)` : `calc(${(hx / W) * 100}% + 12px)` }}>
              <div className="font-semibold text-tv-text">
                {data[hover].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={data[hover] >= data[0] ? "text-terminal-green" : "text-terminal-red"}>
                {(data[hover] - data[0] >= 0 ? "+" : "")}{(data[hover] - data[0]).toFixed(2)}
              </div>
              {hTime && <div className="text-tv-muted">{hTime}</div>}
            </div>
          )}

          {/* Marker tooltip (hover or selected/clicked) */}
          {(() => {
            const activeId = selectedMarker ?? hoveredMarker;
            if (activeId === null) return null;
            const p = positioned.find((m) => m.id === activeId);
            if (!p) return null;
            const flipLeft = p.pctX > 70;
            const isSelected = selectedMarker === activeId;
            return (
              <div
                className={isSelected ? "absolute" : "pointer-events-none absolute"}
                style={{
                  left: flipLeft ? "auto" : `${p.pctX}%`,
                  right: flipLeft ? `${100 - p.pctX}%` : "auto",
                  top: `calc(${(p.py / H) * 100}% - 10px)`,
                  transform: flipLeft ? "translate(50%, -100%)" : "translate(-50%, -100%)",
                  zIndex: 40,
                }}
              >
                <MarkerTooltip marker={p} size="large" expanded={isSelected} />
                {isSelected && (
                  <button
                    onClick={() => setSelectedMarker(null)}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      color: "#71717a", fontSize: 10, lineHeight: 1,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="border-t border-tv-border/30 px-6 py-2.5 text-[11px] text-tv-muted">
          {positioned.length} trade signal{positioned.length !== 1 ? "s" : ""} (48h) · Click a dot to see original message · ESC to close
        </div>
      </div>
    </div>
  );
}
