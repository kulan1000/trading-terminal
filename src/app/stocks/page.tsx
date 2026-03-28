"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { changeColor } from "@/lib/utils";
import { StockSparkline } from "@/components/stocks/stock-sparkline";
import { StockDetail } from "@/components/stocks/stock-detail";
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

function fmtNum(n: number, d = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v > 0 ? v.toString() : "—";
}
function fmtBig(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n > 0 ? n.toString() : "—";
}

function StockRow({
  q,
  expanded,
  onToggle,
}: {
  q: StockQuote;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = changeColor(q.change);
  return (
    <>
      <tr
        className="cursor-pointer border-b border-terminal-border/50 transition-colors hover:bg-terminal-accent/5"
        onClick={onToggle}
      >
        <td className="px-4 py-2">
          <a
            href={`https://ceo.ca/${q.ceoSymbol}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-terminal-text underline decoration-terminal-border hover:decoration-terminal-text"
          >
            {q.symbol}
          </a>
          <span className="ml-2 text-terminal-muted">{q.name}</span>
        </td>
        <td className="px-2 py-2">
          <StockSparkline data={q.sparkline} change={q.change} />
        </td>
        <td className="px-4 py-2 text-right tabular-nums text-terminal-text">
          {fmtNum(q.price)}
        </td>
        <td className={`px-4 py-2 text-right tabular-nums ${color}`}>
          {q.change >= 0 ? "+" : ""}
          {fmtNum(q.change)} ({q.changePercent >= 0 ? "+" : ""}
          {fmtNum(q.changePercent)}%)
        </td>
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          {fmtVol(q.volume)}
        </td>
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"}
        </td>
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
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          {q.marketCap > 0 ? fmtBig(q.marketCap) : "—"}
        </td>
        <td className="w-6 px-2 py-2 text-terminal-muted">
          <span className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-terminal-border/30 bg-terminal-surface/80">
          <td colSpan={9}>
            <StockDetail q={q} />
          </td>
        </tr>
      )}
    </>
  );
}

function SectorTable({ sector, quotes }: { sector: string; quotes: StockQuote[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
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
            <th className="w-[110px] px-2 py-2 text-left font-medium">Intraday</th>
            <th className="px-4 py-2 text-right font-medium">Price</th>
            <th className="px-4 py-2 text-right font-medium">Change</th>
            <th className="px-4 py-2 text-right font-medium">Volume</th>
            <th className="px-4 py-2 text-right font-medium">VWAP</th>
            <th className="px-4 py-2 text-right font-medium">Shorts</th>
            <th className="px-4 py-2 text-right font-medium">MCap</th>
            <th className="w-6 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <StockRow
              key={q.symbol}
              q={q}
              expanded={expanded === q.symbol}
              onToggle={() => setExpanded(expanded === q.symbol ? null : q.symbol)}
            />
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
            <div key={i} className="h-40 animate-pulse rounded-lg border border-terminal-border bg-terminal-surface" />
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
