"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/use-stock-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { SectorTable, type SortKey } from "@/components/stocks/sector-table";
import { AddStockDialog } from "@/components/stocks/add-stock-dialog";
import { TsxvStatus } from "@/components/stocks/tsxv-status";

const SECTORS = ["silver", "gold", "oil"];

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <div className="px-6 py-4">
        <div className="h-4 w-28 animate-skeleton rounded" />
      </div>
      <div className="border-t border-white/[0.04]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-6 border-b border-white/[0.03] px-6 py-3.5">
            <div className="h-3.5 w-16 animate-skeleton rounded" />
            <div className="ml-auto h-3.5 w-14 animate-skeleton rounded" />
            <div className="h-6 w-20 animate-skeleton rounded-md" />
            <div className="h-3.5 w-16 animate-skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Stocks — Watchlist
          </h1>
          <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] tabular-nums text-white/30">
            {quotes.length}
          </span>
          <button onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[#2962FF] px-3 py-1.5 font-sans text-[12px] font-medium text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)]">
            + Add
          </button>
        </div>
        <div className="flex items-center gap-4">
          <TsxvStatus />
          <span className="font-mono text-[11px] tabular-nums text-white/25">
            {loading ? "Loading..." : lastUpdated ? `${secondsAgo}s ago` : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonTable key={i} />)}
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
