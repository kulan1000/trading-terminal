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

const BIAS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  bullish: { label: "BULLISH", bg: "bg-tv-bull/10", text: "text-tv-bull" },
  bearish: { label: "BEARISH", bg: "bg-tv-bear/10", text: "text-tv-bear" },
  neutral: { label: "NEUTRAL", bg: "bg-tv-orange/10", text: "text-tv-orange" },
};

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
  sentiment?: AssetSentiment;
}

export function PriceCard({ quote, pair, sentiment }: PriceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isUp = quote.change >= 0;
  const color = changeColor(quote.change);
  const arrow = isUp ? "▲" : "▼";
  const borderColor = isUp
    ? "border-tv-bull/30"
    : "border-tv-bear/30";

  const markers = useTradeMarkers(quote.asset);

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
      className={`animate-fade-in cursor-pointer rounded-lg border ${borderColor} bg-tv-surface font-mono transition-all duration-150 hover:border-tv-border-hover hover:bg-tv-elevated`}
      onClick={() => setExpanded(true)}
    >
      {/* Header: asset name + volume */}
      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="font-sans text-xs text-tv-secondary">
          {quote.asset} — {pair}
        </span>
        <span className="text-xs text-tv-secondary">
          {quote.volume > 0
            ? `Vol: ${(quote.volume / 1000).toFixed(0)}K`
            : ""}
        </span>
      </div>

      {/* Price + change */}
      <div className="flex items-baseline gap-3 px-4 pt-1">
        <AnimatedPrice
          value={quote.price}
          className="text-3xl font-bold text-tv-heading"
        />
        <span className={`text-sm font-semibold ${color}`}>
          {arrow}{" "}
          <AnimatedPrice value={Math.abs(quote.change)} className="" />
          {" ("}
          <AnimatedPrice
            value={Math.abs(quote.changePercent)}
            className=""
          />
          {"%)"}
        </span>
      </div>

      {/* High / Low */}
      <div className="flex gap-4 px-4 pt-1 text-xs text-tv-secondary">
        <span>
          H:{" "}
          <AnimatedPrice
            value={quote.high}
            className="text-tv-text"
          />
        </span>
        <span>
          L:{" "}
          <AnimatedPrice
            value={quote.low}
            className="text-tv-text"
          />
        </span>
      </div>

      {/* Intraday chart */}
      {quote.sparkline && quote.sparkline.length > 2 && (
        <div className="mt-2 px-1 pb-1">
          <Sparkline
            data={quote.sparkline}
            timestamps={quote.sparklineTs}
            height={56}
            markers={markers}
          />
        </div>
      )}

      {/* Marker count + sentiment badge */}
      <div className="flex items-center justify-between px-4 pb-2">
        {markers.length > 0 ? (
          <span className="text-[10px] text-tv-muted">
            {markers.length} trade signal{markers.length !== 1 ? "s" : ""} (48h)
          </span>
        ) : <span />}
        {sentiment && sentiment.signalCount > 0 && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${BIAS_STYLE[sentiment.bias]?.bg ?? ""} ${BIAS_STYLE[sentiment.bias]?.text ?? "text-tv-secondary"}`}>
            {BIAS_STYLE[sentiment.bias]?.label ?? "—"} {sentiment.confidence.toFixed(1)}
          </span>
        )}
      </div>
    </div>
    </>
  );
}
