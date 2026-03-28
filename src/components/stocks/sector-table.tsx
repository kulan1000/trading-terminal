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

const COLUMNS: { key: SortKey; label: string; align: string }[] = [
  { key: "symbol", label: "Symbol", align: "text-left" },
  { key: "price", label: "Price", align: "text-right" },
  { key: "changePercent", label: "Change", align: "text-center" },
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

  const accent = SECTOR_ACCENT[sector] ?? "#2962FF";

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Sector accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Sector header */}
      <div className="px-6 py-4">
        <h2 className={`font-sans text-[15px] font-semibold tracking-wide ${SECTOR_COLORS[sector] ?? "text-white"}`}>
          {SECTOR_LABELS[sector] ?? sector}
        </h2>
      </div>

      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y border-white/[0.04] bg-white/[0.015]">
            {COLUMNS.map((col) => (
              <th key={col.key}
                className={`cursor-pointer select-none px-6 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 transition-colors hover:text-white/70 ${col.align}`}
                onClick={() => onSort(col.key)}>
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-tv-blue">{sortAsc ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
            <th className="w-[100px] px-3 py-2.5 font-sans text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              Intraday
            </th>
            <th className="w-8" />
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
