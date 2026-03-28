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

function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtBig(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function fmtVol(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  if (v > 0) return v.toString();
  return "—";
}

function StockRow({ q }: { q: StockQuote }) {
  const color = changeColor(q.change);
  return (
    <tr className="border-b border-terminal-border/50 transition-colors hover:bg-terminal-accent/5">
      {/* Symbol + Name */}
      <td className="px-4 py-2">
        <span className="font-semibold text-terminal-text">{q.symbol}</span>
        <span className="ml-2 text-terminal-muted">{q.name}</span>
      </td>
      {/* Price */}
      <td className="px-4 py-2 text-right tabular-nums text-terminal-text">
        {fmtNum(q.price)}
      </td>
      {/* Change */}
      <td className={`px-4 py-2 text-right tabular-nums ${color}`}>
        {q.change >= 0 ? "▲ +" : "▼ "}
        {fmtNum(q.change)}
      </td>
      {/* Change % */}
      <td className={`px-4 py-2 text-right tabular-nums ${color}`}>
        {q.changePercent >= 0 ? "+" : ""}
        {fmtNum(q.changePercent)}%
      </td>
      {/* Volume */}
      <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
        {fmtVol(q.volume)}
      </td>
      {/* VWAP */}
      <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
        {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"}
      </td>
      {/* Shorts */}
      <td className="px-4 py-2 text-right tabular-nums">
        {q.hasCeoData && q.shortVolume > 0 ? (
          <span className="text-terminal-muted">
            {fmtBig(q.shortVolume)}
            {q.shortChange !== 0 && (
              <span className={q.shortChange > 0 ? "ml-1 text-terminal-red" : "ml-1 text-terminal-green"}>
                {q.shortChange > 0 ? "↑" : "↓"}
              </span>
            )}
          </span>
        ) : "—"}
      </td>
      {/* Market Cap */}
      <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
        {q.marketCap > 0 ? fmtBig(q.marketCap) : "—"}
      </td>
    </tr>
  );
}

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
            <th className="px-4 py-2 text-right font-medium">VWAP</th>
            <th className="px-4 py-2 text-right font-medium">Shorts</th>
            <th className="px-4 py-2 text-right font-medium">MCap</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <StockRow key={q.symbol} q={q} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StocksPage() {
  const { quotes, loading, lastUpdated } = useStockData();
  const secondsAgo = useSecondsAgo(lastUpdated);

  const sectors = ["silver", "gold", "oil"];
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
              ? `Updated ${secondsAgo}s ago · CEO.ca`
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
