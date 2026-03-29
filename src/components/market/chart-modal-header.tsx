"use client";

import type { MarketQuote } from "@/lib/market-data";
import { changeColor } from "@/lib/utils";
import { MARKER_LEGEND } from "./marker-utils";

interface Props {
  quote: MarketQuote;
  pair: string;
  onClose: () => void;
}

export function ChartModalHeader({ quote, pair, onClose }: Props) {
  const changeCol = changeColor(quote.change);
  const arrow = quote.change >= 0 ? "▲" : "▼";

  return (
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
        <button onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-tv-muted transition-colors hover:bg-terminal-border/30 hover:text-tv-text">
          ✕
        </button>
      </div>
    </div>
  );
}
