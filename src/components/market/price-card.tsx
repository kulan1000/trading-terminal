"use client";

import type { MarketQuote } from "@/lib/market-data";
import { changeColor } from "@/lib/utils";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";
import { useTradeMarkers } from "@/hooks/use-trade-markers";

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
}

export function PriceCard({ quote, pair }: PriceCardProps) {
  const isUp = quote.change >= 0;
  const color = changeColor(quote.change);
  const arrow = isUp ? "▲" : "▼";
  const borderColor = isUp
    ? "border-terminal-green/30"
    : "border-terminal-red/30";

  const markers = useTradeMarkers(quote.asset);

  return (
    <div
      className={`rounded-lg border ${borderColor} bg-terminal-surface font-mono`}
    >
      {/* Header: asset name + volume */}
      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="text-xs text-terminal-muted">
          {quote.asset} — {pair}
        </span>
        <span className="text-xs text-terminal-muted">
          {quote.volume > 0
            ? `Vol: ${(quote.volume / 1000).toFixed(0)}K`
            : ""}
        </span>
      </div>

      {/* Price + change */}
      <div className="flex items-baseline gap-3 px-4 pt-1">
        <AnimatedPrice
          value={quote.price}
          className="text-3xl font-bold text-terminal-text"
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
      <div className="flex gap-4 px-4 pt-1 text-xs text-terminal-muted">
        <span>
          H:{" "}
          <AnimatedPrice
            value={quote.high}
            className="text-terminal-text"
          />
        </span>
        <span>
          L:{" "}
          <AnimatedPrice
            value={quote.low}
            className="text-terminal-text"
          />
        </span>
      </div>

      {/* Intraday chart — full width at bottom, with trade markers */}
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
        <div className="px-4 pb-2 text-[10px] text-terminal-muted">
          {markers.length} trade signal{markers.length !== 1 ? "s" : ""} (48h)
        </div>
      )}
    </div>
  );
}
