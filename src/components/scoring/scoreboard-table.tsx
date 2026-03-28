"use client";

import { useState } from "react";
import type { TraderScore } from "@/hooks/use-scoring-data";

type SortKey = "author" | "trades" | "winRate" | "totalPnl" | "avgPnl";

function sortTraders(list: TraderScore[], key: SortKey, asc: boolean): TraderScore[] {
  return [...list].sort((a, b) => {
    const va = key === "author" ? a.author.toLowerCase() : a[key];
    const vb = key === "author" ? b.author.toLowerCase() : b[key];
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
}

const COLS: { key: SortKey; label: string; align: string }[] = [
  { key: "author", label: "Trader", align: "text-left" },
  { key: "trades", label: "Trades", align: "text-right" },
  { key: "winRate", label: "Win Rate", align: "text-right" },
  { key: "totalPnl", label: "Total P/L", align: "text-right" },
  { key: "avgPnl", label: "Avg P/L", align: "text-right" },
];

export function ScoreboardTable({ traders }: { traders: TraderScore[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = sortTraders(traders, sortKey, sortAsc);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "author"); }
  }

  if (!traders.length) {
    return (
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-6">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Scoreboard
        </h3>
        <p className="text-xs text-tv-text-subtle">
          Inga traders med minst 3 stängda trades ännu. Data fylls på automatiskt.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Scoreboard
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-text-secondary">
            <th className="w-8 pb-2 text-center text-[11px] font-medium uppercase tracking-wider">#</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`cursor-pointer pb-2 text-[11px] font-medium uppercase tracking-wider transition-colors hover:text-tv-text ${c.align}`}
              >
                {c.label}
                {sortKey === c.key && (
                  <span className="ml-1 text-tv-blue">{sortAsc ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const pnlColor = t.totalPnl >= 0 ? "text-tv-green" : "text-tv-red";
            const wrColor = t.winRate >= 0.6 ? "text-tv-green" : t.winRate >= 0.4 ? "text-tv-orange" : "text-tv-red";
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
            return (
              <tr key={t.author} className="border-b border-tv-divider transition-colors hover:bg-tv-hover">
                <td className="py-1.5 text-center">{medal}</td>
                <td className="py-1.5 font-sans text-tv-text">{t.author}</td>
                <td className="py-1.5 text-right text-tv-text-secondary">{t.trades}</td>
                <td className={`py-1.5 text-right font-semibold ${wrColor}`}>
                  {(t.winRate * 100).toFixed(0)}%
                  <span className="ml-1 text-tv-text-subtle">({t.wins}W)</span>
                </td>
                <td className={`py-1.5 text-right ${pnlColor}`}>
                  {t.totalPnl >= 0 ? "+" : ""}{t.totalPnl.toFixed(2)}
                </td>
                <td className={`py-1.5 text-right ${t.avgPnl >= 0 ? "text-tv-green" : "text-tv-red"}`}>
                  {t.avgPnl >= 0 ? "+" : ""}{t.avgPnl.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
