"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { MarketQuote } from "@/lib/market-data";
import type { TradeMarker } from "./sparkline";
import { fmtTimeEpoch } from "@/lib/format-utils";
import { positionMarkers } from "./marker-utils";
import { ChartModalChart } from "./chart-modal-chart";
import { ChartModalHeader } from "./chart-modal-header";
import { ChartHoverTooltip } from "./chart-hover-tooltip";
import { ChartMarkerOverlay } from "./chart-marker-overlay";

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

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  const handleClose = useCallback(() => {
    setPhase("leaving");
    setTimeout(() => { setPhase("gone"); onClose(); }, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

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
  const hTime = hover !== null && timestamps?.[hover] ? fmtTimeEpoch(timestamps[hover]) : null;
  const isVisible = phase === "open";

  if (phase === "gone") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleClose} style={{ perspective: "1200px" }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md"
        style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />

      <div className="relative z-10 w-[95vw] max-w-[960px] rounded-xl border border-white/[0.06] bg-[#111111] shadow-2xl backdrop-blur-md"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.92) translateY(24px)",
          transition: isVisible
            ? "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 0.2s ease-in, transform 0.2s ease-in",
        }}
        onClick={(e) => e.stopPropagation()}>

        <ChartModalHeader quote={quote} pair={pair} onClose={handleClose} />

        <div className="relative px-6 py-4">
          <ChartModalChart
            data={data} timestamps={timestamps} width={W} height={H}
            toX={toX} toY={toY} color={color} openY={openY}
            positionedMarkers={positioned}
            onHoverChange={setHover} onMarkerHover={setHoveredMarker}
            onMarkerClick={(id) => setSelectedMarker(selectedMarker === id ? null : id)}
            hoveredMarker={hoveredMarker} selectedMarker={selectedMarker}
          />
          {hover !== null && (
            <ChartHoverTooltip hoverIdx={hover} data={data} hx={hx} width={W} hTime={hTime} />
          )}
          <ChartMarkerOverlay
            positionedMarkers={positioned} hoveredMarker={hoveredMarker}
            selectedMarker={selectedMarker} chartHeight={H}
            onDeselect={() => setSelectedMarker(null)}
          />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-2.5 text-[11px] text-white/30">
          {positioned.length} trade signal{positioned.length !== 1 ? "s" : ""} (48h) · Click a dot to see original message · ESC to close
        </div>
      </div>
    </div>,
    document.body
  );
}
