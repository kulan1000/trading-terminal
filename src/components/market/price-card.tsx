"use client";

import { useState } from "react";
import type { MarketQuote } from "@/lib/market-data";
import type { AssetSentiment } from "@/lib/sentiment-engine";
import { changeColor } from "@/lib/utils";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";
import { useTradeMarkers } from "@/hooks/use-trade-markers";
import { ChartModal } from "./chart-modal";

const PAIRS: Record<string, string> = {
  Gold: "XAUUSD", Silver: "XAGUSD", Oil: "WTI",
};

/** Asset-specific ambient glow + border accent + top accent bar color */
const ASSET_GLOW: Record<string, { glow: string; border: string; accent: string }> = {
  Gold:   { glow: "shadow-[0_0_60px_-6px_rgba(255,193,37,0.35),0_0_20px_-4px_rgba(255,193,37,0.15)]",  border: "border-yellow-500/30", accent: "#FFD700" },
  Silver: { glow: "shadow-[0_0_60px_-6px_rgba(192,197,206,0.40),0_0_24px_-4px_rgba(220,225,235,0.18)]", border: "border-gray-300/25", accent: "#D0D5DE" },
  Oil:    { glow: "shadow-[0_0_60px_-6px_rgba(120,80,30,0.30),0_0_24px_-4px_rgba(90,60,20,0.15)]",     border: "border-amber-800/25", accent: "#5C3D1A" },
};

const BIAS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  bullish: { label: "BULLISH", bg: "bg-tv-bull/10", text: "text-tv-bull" },
  bearish: { label: "BEARISH", bg: "bg-tv-bear/10", text: "text-tv-bear" },
  neutral: { label: "NEUTRAL", bg: "bg-tv-orange/10", text: "text-tv-orange" },
};

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
  sentiment?: AssetSentiment;
  variant?: "default" | "hero";
}

export function PriceCard({ quote, pair, sentiment, variant = "default" }: PriceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isUp = quote.change >= 0;
  const color = changeColor(quote.change);
  const arrow = isUp ? "▲" : "▼";
  const assetStyle = ASSET_GLOW[quote.asset];
  const borderColor = assetStyle?.border ?? (isUp ? "border-tv-bull/30" : "border-tv-bear/30");
  const glowColor = assetStyle?.glow ?? "";

  const markers = useTradeMarkers(quote.asset);

  const isHero = variant === "hero";

  return (
    <>
      {expanded && (
        <ChartModal
          quote={quote}
          pair={PAIRS[quote.asset] ?? pair}
          markers={markers}
          onClose={() => setExpanded(false)}
        />
      )}
      <div
        className={`animate-fade-in cursor-pointer overflow-hidden rounded-lg border ${borderColor} bg-tv-surface font-mono transition-all duration-200 hover:border-tv-border-hover hover:bg-tv-elevated ${isHero ? `${glowColor} hover:scale-[1.005]` : ""}`}
        onClick={() => setExpanded(true)}
      >
        {/* Asset accent bar on top + glossy sheen */}
        {isHero && assetStyle ? (
          <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${assetStyle.accent}, transparent)` }} />
        ) : (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        )}
        {/* Header row */}
        <div className={`flex items-baseline justify-between ${isHero ? "px-5 pt-4" : "px-4 pt-3"}`}>
          <div className="flex items-center gap-3">
            <span className={`font-sans ${isHero ? "text-base font-semibold" : "text-xs"} text-tv-heading`}>
              {quote.asset} — {pair}
            </span>
            {sentiment && sentiment.signalCount > 0 && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${BIAS_STYLE[sentiment.bias]?.bg ?? ""} ${BIAS_STYLE[sentiment.bias]?.text ?? "text-tv-secondary"}`}>
                {BIAS_STYLE[sentiment.bias]?.label ?? "—"} {sentiment.confidence.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-xs text-tv-secondary">
            {quote.volume > 0 ? `Vol: ${(quote.volume / 1000).toFixed(0)}K` : ""}
          </span>
        </div>

        {/* Price + change */}
        <div className={`flex items-baseline gap-3 ${isHero ? "px-5 pt-2" : "px-4 pt-1"}`}>
          <AnimatedPrice
            value={quote.price}
            className={`${isHero ? "text-4xl" : "text-3xl"} font-bold text-tv-heading`}
          />
          <span className={`${isHero ? "text-base" : "text-sm"} font-semibold ${color}`}>
            {arrow}{" "}
            <AnimatedPrice value={Math.abs(quote.change)} className="" />
            {" ("}
            <AnimatedPrice value={Math.abs(quote.changePercent)} className="" />
            {"%)"}
          </span>
        </div>

        {/* High / Low */}
        <div className={`flex gap-4 ${isHero ? "px-5 pt-1" : "px-4 pt-1"} text-xs text-tv-secondary`}>
          <span>H: <AnimatedPrice value={quote.high} className="text-tv-text" /></span>
          <span>L: <AnimatedPrice value={quote.low} className="text-tv-text" /></span>
        </div>

        {/* Intraday chart — bigger for hero variant */}
        {quote.sparkline && quote.sparkline.length > 2 && (
          <div className={`${isHero ? "mt-3 px-2 pb-2" : "mt-2 px-1 pb-1"}`}>
            <Sparkline
              data={quote.sparkline}
              timestamps={quote.sparklineTs}
              height={isHero ? 120 : 56}
              markers={markers}
            />
          </div>
        )}

        {/* Marker count */}
        <div className={`flex items-center justify-between ${isHero ? "px-5 pb-3" : "px-4 pb-2"}`}>
          {markers.length > 0 ? (
            <span className="text-[10px] text-tv-muted">
              {markers.length} trade signal{markers.length !== 1 ? "s" : ""} (48h)
            </span>
          ) : <span />}
        </div>
      </div>
    </>
  );
}
