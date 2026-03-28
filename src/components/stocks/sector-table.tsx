"use client";

import { useState, useMemo } from "react";
import { StockRow } from "./stock-row";
import type { StockQuote } from "@/lib/data-ceo-stocks";

export type SortKey = "symbol" | "price" | "changePercent" | "volume" | "vwap" | "shortVolume" | "marketCap";

const SECTOR_LABELS: Record<string, string> = {
  gold: "Gold Miners", silver: "Silver", oil: "Oil & Gas",
};
const SECTOR_COLORS: Record<string, string> = {
  gold: "text-tv-yellow", silver: "text-tv-text", oil: "text-tv-orange",
};

const COLUMNS: { key: SortKey; label: string; align: string }[] = [
  { key: "symbol", label: "Symbol", align: "text-left" },
  { key: "price", label: "Price", align: "text-right" },
  { key: "changePercent", label: "Change", align: "text-right" },
  { key: "volume", label: "Vol / Avg", align: "text-right" },
  { key: "vwap", label: "VWAP", align: "text-right" },
  { key: "shortVolume", label: "Shorts", align: "text-right" },
  { key: "marketCap", label: "MCap", align: "text-right" },
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

  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-tv-border bg-tv-surface">
      {/* Glossy top sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Sector header */}
      <div className="px-5 py-3">
        <h2 className={`font-sans text-sm font-semibold uppercase tracking-wider ${SECTOR_COLORS[sector] ?? "text-tv-text"}`}>
          {SECTOR_LABELS[sector] ?? sector}
        </h2>
      </div>

      {/* Table */}
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-y border-white/[0.04] bg-white/[0.02] text-tv-secondary">
            {COLUMNS.map((col) => (
              <th key={col.key}
                className={`cursor-pointer select-none px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-tv-text ${col.align}`}
                onClick={() => onSort(col.key)}>
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-tv-blue">{sortAsc ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
            <th className="w-[110px] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em]">Intraday</th>
            <th className="w-6 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((q) => (
            <StockRow key={q.symbol} q={q}
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
