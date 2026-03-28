"use client";

import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { changeColor } from "@/lib/utils";
import type { StockQuote } from "@/app/api/stocks/route";

const SECTOR_LABELS: Record<string, string> = {
  gold: "Gold Miners",
  silver: "Silver",
  oil: "Oil & Gas",
};

const SECTOR_COLORS: Record<string, string> = {
  gold: "text-yellow-400",
  silver: "text-gray-300",
  oil: "text-orange-400",
};

function SectorTable({ sector, quotes }: { sector: string; quotes: StockQuote[] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="rounded-lg border border-terminal-border bg-terminal-surface">
      <div className="border-b border-terminal-border px-4 py-2">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${SECTOR_COLORS[sector] ?? "text-terminal-text"}`}>
          {SECTOR_LABELS[sector] ?? sector}
        </h2>
      </div>
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-terminal-border text-terminal-muted">
            <th className="px-4 py-2 text-left font-medium">Symbol</th>
            <th className="px-4 py-2 text-right font-medium">Price</th>
            <th className="px-4 py-2 text-right font-medium">Change</th>
            <th className="px-4 py-2 text-right font-medium">%</th>
            <th className="px-4 py-2 text-right font-medium">Volume</th>
          </tr>
        </thead>
        <tbody className="px-4">
          {quotes.map((q) => (
            <tr key={q.symbol} className="border-b border-terminal-border/50 transition-colors hover:bg-terminal-accent/5">
              <td className="px-4 py-2">
                <span className="font-semibold text-terminal-text">{q.symbol}</span>
                <span className="ml-2 text-terminal-muted">{q.name}</span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-terminal-text">
                {q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className={`px-4 py-2 text-right tabular-nums ${changeColor(q.change)}`}>
                {q.change >= 0 ? "▲ +" : "▼ "}
                {q.change.toFixed(2)}
              </td>
              <td className={`px-4 py-2 text-right tabular-nums ${changeColor(q.change)}`}>
                {q.changePercent >= 0 ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
                {q.volume > 0
                  ? q.volume >= 1_000_000
                    ? `${(q.volume / 1_000_000).toFixed(1)}M`
                    : `${(q.volume / 1_000).toFixed(0)}K`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StocksPage() {
  const { quotes, loading, lastUpdated } = useStockData();
  const secondsAgo = useSecondsAgo(lastUpdated);

  const sectors = ["gold", "silver", "oil"];
  const grouped = sectors.reduce(
    (acc, s) => ({ ...acc, [s]: quotes.filter((q) => q.sector === s) }),
    {} as Record<string, StockQuote[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Stocks — Watchlist
        </h1>
        <span className="font-mono text-xs text-terminal-muted">
          {loading
            ? "Loading…"
            : lastUpdated
              ? `Updated ${secondsAgo}s ago · ${lastUpdated.toLocaleTimeString()}`
              : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-terminal-border bg-terminal-surface"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sectors.map((s) => (
            <SectorTable key={s} sector={s} quotes={grouped[s]} />
          ))}
        </div>
      )}
    </div>
  );
}
