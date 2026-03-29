"use client";

import { useState } from "react";
import Link from "next/link";

export interface TraderActivityRow {
  author: string;
  total: number;
  opinions: number;
  positions: number;
  entries: number;
  exits: number;
  bullish: number;
  bearish: number;
  avgConf: number;
  lastActive: string;
  assets: string[];
  scoreable: number;
}

type SortKey = "author" | "total" | "scoreable" | "avgConf";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function AssetDots({ assets }: { assets: string[] }) {
  const colors: Record<string, string> = {
    Gold: "bg-[#FFD700]",
    Silver: "bg-[#C0C0C0]",
    Oil: "bg-[#FF6B35]",
  };
  return (
    <div className="flex gap-1">
      {assets.map((a) => (
        <span
          key={a}
          title={a}
          className={`inline-block h-2 w-2 rounded-full ${colors[a] ?? "bg-white/30"}`}
        />
      ))}
    </div>
  );
}

export function TraderActivity({ traders }: { traders: TraderActivityRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...traders].sort((a, b) => {
    const va = sortKey === "author" ? a.author.toLowerCase() : a[sortKey];
    const vb = sortKey === "author" ? b.author.toLowerCase() : b[sortKey];
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "author"); }
  }

  const cols: { key: SortKey; label: string; align: string }[] = [
    { key: "author", label: "Trader", align: "text-left" },
    { key: "total", label: "Signals", align: "text-right" },
    { key: "scoreable", label: "Scoreable", align: "text-right" },
    { key: "avgConf", label: "Avg Conf", align: "text-right" },
  ];

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Trader Activity
          <span className="ml-2 font-sans text-[11px] font-normal text-white/30">
            {traders.length} traders
          </span>
        </h3>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#111111]">
            <tr className="border-y border-white/[0.04] bg-white/[0.015]">
              <th className="w-8 px-3 py-2.5 text-center font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                #
              </th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className={`cursor-pointer px-4 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 hover:text-white/70 ${c.align}`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-[#FF9800]">{sortAsc ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                Bias
              </th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                Assets
              </th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                Last
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 30).map((t, i) => {
              const bullPct = t.total > 0 ? Math.round((t.bullish / t.total) * 100) : 50;
              const biasColor = bullPct > 60 ? "text-[#26A69A]" : bullPct < 40 ? "text-[#EF5350]" : "text-white/50";
              return (
                <tr
                  key={t.author}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.025]"
                >
                  <td className="px-3 py-2.5 text-center font-sans text-[12px] text-white/30">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/trader/${encodeURIComponent(t.author)}`}
                      className="font-sans text-[13px] font-semibold text-white hover:text-[#FF9800] transition-colors"
                    >
                      {t.author}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-sans text-[13px] tabular-nums text-white/70">{t.total}</span>
                    <span className="ml-1 text-[10px] text-white/25">
                      {t.opinions}O {t.positions}P {t.entries}E {t.exits}X
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-sans text-[13px] tabular-nums ${t.scoreable > 0 ? "text-[#FF9800]" : "text-white/25"}`}>
                      {t.scoreable}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-sans text-[12px] tabular-nums text-white/50">{t.avgConf}%</span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-sans text-[12px] tabular-nums ${biasColor}`}>
                    {bullPct}% bull
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <AssetDots assets={t.assets} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-sans text-[11px] tabular-nums text-white/30">
                    {timeAgo(t.lastActive)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
