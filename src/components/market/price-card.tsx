"use client";

import type { MarketQuote } from "@/lib/market-data";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
}

export function PriceCard({ quote, pair }: PriceCardProps) {
  const isUp = quote.change >= 0;
  const color = isUp ? "text-terminal-green" : "text-terminal-red";
  const arrow = isUp ? "▲" : "▼";
  const borderColor = isUp
    ? "border-terminal-green/30"
    : "border-terminal-red/30";

  return (
    <div
      className={`rounded-lg border ${borderColor} bg-terminal-surface p-4 font-mono`}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-terminal-muted">
          {quote.asset} — {pair}
        </span>
        <span className="text-xs text-terminal-muted">
          {quote.volume > 0
            ? `Vol: ${(quote.volume / 1000).toFixed(0)}K`
            : ""}
        </span>
      </div>

      <div className="flex items-baseline gap-3">
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

      <div className="mt-3 flex items-end justify-between">
        <div className="flex gap-4 text-xs text-terminal-muted">
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
        {quote.sparkline && quote.sparkline.length > 1 && (
          <Sparkline data={quote.sparkline} width={100} height={28} />
        )}
      </div>
    </div>
  );
}
