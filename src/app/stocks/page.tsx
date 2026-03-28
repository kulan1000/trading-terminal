"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { StockRow } from "@/components/stocks/stock-row";
import { AddStockDialog } from "@/components/stocks/add-stock-dialog";
import type { StockQuote } from "@/lib/data-ceo-stocks";

const SECTOR_LABELS: Record<string, string> = { gold: "Gold Miners", silver: "Silver", oil: "Oil & Gas" };
const SECTOR_COLORS: Record<string, string> = { gold: "text-yellow-400", silver: "text-gray-300", oil: "text-orange-400" };

function SectorTable({
  sector,
  quotes,
  onRemove,
}: {
  sector: string;
  quotes: StockQuote[];
  onRemove: (ceoSymbol: string) => void;
}) {
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
            <th className="px-4 py-2 text-right font-medium">Vol / Avg</th>
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
              onRemove={() => onRemove(q.ceoSymbol)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StocksPage() {
  const { quotes, loading, lastUpdated, addStock, removeStock } = useStockData();
  const secondsAgo = useSecondsAgo(lastUpdated);
  const [showAdd, setShowAdd] = useState(false);

  const sectors = ["silver", "gold", "oil"];
  const grouped = sectors.reduce(
    (acc, s) => ({ ...acc, [s]: quotes.filter((q) => q.sector === s) }),
    {} as Record<string, StockQuote[]>
  );

  const handleRemove = async (ceoSymbol: string) => {
    if (!confirm(`Remove ${ceoSymbol} from watchlist?`)) return;
    try { await removeStock(ceoSymbol); } catch { /* toast later */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
            Stocks — Watchlist
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded bg-terminal-green/10 px-2 py-0.5 text-xs font-medium text-terminal-green transition-colors hover:bg-terminal-green/20"
          >
            + Add
          </button>
        </div>
        <span className="font-mono text-xs text-terminal-muted">
          {loading ? "Loading…" : lastUpdated ? `Updated ${secondsAgo}s ago · CEO.ca` : ""}
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
            <SectorTable key={s} sector={s} quotes={grouped[s]} onRemove={handleRemove} />
          ))}
        </div>
      )}

      <AddStockDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={addStock} />
    </div>
  );
}
