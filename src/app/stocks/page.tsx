"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { SectorTable, type SortKey } from "@/components/stocks/sector-table";
import { AddStockDialog } from "@/components/stocks/add-stock-dialog";
import { TsxvStatus } from "@/components/stocks/tsxv-status";

const SECTORS = ["silver", "gold", "oil"];

export default function StocksPage() {
  const { quotes, loading, lastUpdated, addStock, removeStock } = useStockData();
  const secondsAgo = useSecondsAgo(lastUpdated);
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortAsc, setSortAsc] = useState(true);

  const grouped = SECTORS.reduce(
    (acc, s) => ({ ...acc, [s]: quotes.filter((q) => q.sector === s) }),
    {} as Record<string, typeof quotes>
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "symbol"); }
  };

  const handleRemove = async (ceoSymbol: string) => {
    if (!confirm(`Remove ${ceoSymbol} from watchlist?`)) return;
    try { await removeStock(ceoSymbol); } catch { /* toast later */ }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
            Stocks — Watchlist
          </h1>
          <button onClick={() => setShowAdd(true)}
            className="rounded-[4px] bg-tv-blue/15 px-2 py-0.5 font-sans text-xs font-medium text-tv-blue transition-colors hover:bg-tv-blue/25">
            + Add
          </button>
        </div>
        <div className="flex items-center gap-4">
          <TsxvStatus />
          <span className="font-mono text-xs text-tv-text-secondary">
            {loading ? "Loading..." : lastUpdated ? `${secondsAgo}s ago` : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-skeleton rounded-[6px] border border-tv-border bg-tv-surface" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {SECTORS.map((s) => (
            <SectorTable key={s} sector={s} quotes={grouped[s]} onRemove={handleRemove}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          ))}
        </div>
      )}

      <AddStockDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={addStock} />
    </div>
  );
}
