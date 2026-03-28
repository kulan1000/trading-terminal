"use client";

import { useState } from "react";
import type { MarketQuote } from "@/lib/market-data";
import { changeColor } from "@/lib/utils";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";
import { useTradeMarkers } from "@/hooks/use-trade-markers";
import { ChartModal } from "./chart-modal";

const PAIRS: Record<string, string> = {
  Gold: "XAUUSD", Silver: "XAGUSD", Oil: "WTI",
};

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
}

export function PriceCard({ quote, pair }: PriceCardProps) {
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

      {/* Marker count badge */}
      {markers.length > 0 && (
        <div className="px-4 pb-2 text-[10px] text-tv-muted">
          {markers.length} trade signal{markers.length !== 1 ? "s" : ""} (48h)
        </div>
      )}
    </div>
    </>
  );
}
