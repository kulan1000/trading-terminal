"use client";

import { useState, useMemo } from "react";
import { StockRow } from "./stock-row";
import type { StockQuote } from "@/lib/data-ceo-stocks";

export type SortKey = "symbol" | "price" | "changePercent" | "volume" | "vwap" | "shortVolume" | "marketCap";

const SECTOR_LABELS: Record<string, string> = {
  gold: "Gold Miners", silver: "Silver", oil: "Oil & Gas",
};
const SECTOR_ACCENT: Record<string, string> = {
  gold: "#FFD700", silver: "#C0C5CE", oil: "#5C3D1A",
};
const SECTOR_COLORS: Record<string, string> = {
  gold: "text-yellow-400", silver: "text-gray-300", oil: "text-orange-400",
};

const COLUMNS: { key: SortKey; label: string; align: string; width: string }[] = [
  { key: "symbol",        label: "Symbol",  align: "text-left",   width: "w-[22%]" },
  { key: "price",         label: "Price",   align: "text-right",  width: "w-[10%]" },
  { key: "changePercent", label: "Change",  align: "text-right",  width: "w-[14%]" },
  { key: "volume",        label: "Volume",  align: "text-right",  width: "w-[14%]" },
  { key: "vwap",          label: "VWAP",    align: "text-right",  width: "w-[10%]" },
  { key: "shortVolume",   label: "Shorts",  align: "text-right",  width: "w-[10%]" },
  { key: "marketCap",     label: "MCap",    align: "text-right",  width: "w-[10%]" },
];

function sortQuotes(quotes: StockQuote[], key: SortKey, asc: boolean): StockQuote[] {
  return [...quotes].sort((a, b) => {
    const va = key === "symbol" ? a.symbol : (a[key] as number);
    const vb = key === "symbol" ? b.symbol : (b[key] as number);
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
}

export function SectorTable({
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

  const accent = SECTOR_ACCENT[sector] ?? "#2962FF";
  const gainers = quotes.filter(q => q.change > 0).length;
  const losers = quotes.filter(q => q.change < 0).length;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Sector header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <h2 className={`font-sans text-[14px] font-semibold ${SECTOR_COLORS[sector] ?? "text-white"}`}>
            {SECTOR_LABELS[sector] ?? sector}
          </h2>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] tabular-nums text-white/25">
            {quotes.length}
          </span>
        </div>
        {(gainers > 0 || losers > 0) && (
          <div className="flex items-center gap-2.5 font-sans text-[10px] tabular-nums">
            {gainers > 0 && <span className="text-[#26A69A]">{gainers}↑</span>}
            {losers > 0 && <span className="text-[#EF5350]">{losers}↓</span>}
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center border-y border-white/[0.04] bg-white/[0.02] px-5 py-2">
        {COLUMNS.map((col) => (
          <div key={col.key}
            className={`cursor-pointer select-none font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-white/30 transition-colors hover:text-white/60 ${col.align} ${col.width}`}
            onClick={() => onSort(col.key)}>
            {col.label}
            {sortKey === col.key && (
              <span className="ml-1 text-[#2962FF]">{sortAsc ? "↑" : "↓"}</span>
            )}
          </div>
        ))}
        <div className="w-[8%] text-right font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
          Chart
        </div>
        <div className="w-[2%]" />
      </div>

      {/* Rows */}
      <div>
        {sorted.map((q) => (
          <StockRow key={q.symbol} q={q}
            expanded={expanded === q.symbol}
            onToggle={() => setExpanded(expanded === q.symbol ? null : q.symbol)}
            onRemove={() => onRemove(q.ceoSymbol)}
          />
        ))}
      </div>
    </div>
  );
}
