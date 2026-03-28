"use client";

import { useState, useMemo } from "react";
import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { StockRow } from "@/components/stocks/stock-row";
import { AddStockDialog } from "@/components/stocks/add-stock-dialog";
import { TsxvStatus } from "@/components/stocks/tsxv-status";
import type { StockQuote } from "@/lib/data-ceo-stocks";

const SECTOR_LABELS: Record<string, string> = { gold: "Gold Miners", silver: "Silver", oil: "Oil & Gas" };
const SECTOR_COLORS: Record<string, string> = { gold: "text-yellow-400", silver: "text-gray-300", oil: "text-orange-400" };

type SortKey = "symbol" | "price" | "changePercent" | "volume" | "vwap" | "shortVolume" | "marketCap";

function sortQuotes(quotes: StockQuote[], key: SortKey, asc: boolean): StockQuote[] {
  return [...quotes].sort((a, b) => {
    const va = key === "symbol" ? a.symbol : (a[key] as number);
    const vb = key === "symbol" ? b.symbol : (b[key] as number);
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
}

const COLUMNS: { key: SortKey; label: string; align: string }[] = [
  { key: "symbol", label: "Symbol", align: "text-left" },
  { key: "price", label: "Price", align: "text-right" },
  { key: "changePercent", label: "Change", align: "text-right" },
  { key: "volume", label: "Vol / Avg", align: "text-right" },
  { key: "vwap", label: "VWAP", align: "text-right" },
  { key: "shortVolume", label: "Shorts", align: "text-right" },
  { key: "marketCap", label: "MCap", align: "text-right" },
];

function SectorTable({
  sector, quotes, onRemove, sortKey, sortAsc, onSort,
}: {
  sector: string;
  quotes: StockQuote[];
  onRemove: (ceoSymbol: string) => void;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = useMemo(() => sortQuotes(quotes, sortKey, sortAsc), [quotes, sortKey, sortAsc]);
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
            {COLUMNS.map((col, i) => (
              <th
                key={col.key}
                className={`cursor-pointer select-none px-4 py-2 font-medium transition-colors hover:text-terminal-text ${col.align} ${i === 0 ? "" : ""}`}
                onClick={() => onSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-terminal-green">{sortAsc ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
            {/* Intraday + expand cols — not sortable */}
            <th className="w-[110px] px-2 py-2 text-left font-medium">Intraday</th>
            <th className="w-6 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((q) => (
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
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortAsc, setSortAsc] = useState(true);

  const sectors = ["silver", "gold", "oil"];
  const grouped = sectors.reduce(
    (acc, s) => ({ ...acc, [s]: quotes.filter((q) => q.sector === s) }),
    {} as Record<string, StockQuote[]>
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) { setSortAsc(!sortAsc); }
    else { setSortKey(key); setSortAsc(key === "symbol"); }
  };

  const handleRemove = async (ceoSymbol: string) => {
    if (!confirm(`Remove ${ceoSymbol} from watchlist?`)) return;
    try { await removeStock(ceoSymbol); } catch { /* toast later */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-4">
          <TsxvStatus />
          <span className="font-mono text-xs text-terminal-muted">
            {loading ? "Loading…" : lastUpdated ? `${secondsAgo}s ago` : ""}
          </span>
        </div>
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
            <SectorTable
              key={s} sector={s} quotes={grouped[s]} onRemove={handleRemove}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
          ))}
        </div>
      )}

      <AddStockDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={addStock} />
    </div>
  );
}
