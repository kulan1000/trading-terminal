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
      <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-6">
        <h3 className="mb-2 text-sm font-semibold text-terminal-muted">SCOREBOARD</h3>
        <p className="text-xs text-zinc-500">
          Inga traders med minst 3 stängda trades ännu. Data fylls på automatiskt.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-terminal-muted">SCOREBOARD</h3>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-terminal-muted">
            <th className="w-8 pb-2 text-center">#</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`cursor-pointer pb-2 hover:text-terminal-text ${c.align}`}
              >
                {c.label}
                {sortKey === c.key && (
                  <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const pnlColor = t.totalPnl >= 0 ? "text-green-400" : "text-red-400";
            const wrColor = t.winRate >= 0.6 ? "text-green-400" : t.winRate >= 0.4 ? "text-yellow-400" : "text-red-400";
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
            return (
              <tr key={t.author} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-2 text-center">{medal}</td>
                <td className="py-2 text-terminal-text">{t.author}</td>
                <td className="py-2 text-right text-terminal-muted">{t.trades}</td>
                <td className={`py-2 text-right font-semibold ${wrColor}`}>
                  {(t.winRate * 100).toFixed(0)}%
                  <span className="ml-1 text-zinc-600">({t.wins}W)</span>
                </td>
                <td className={`py-2 text-right ${pnlColor}`}>
                  {t.totalPnl >= 0 ? "+" : ""}{t.totalPnl.toFixed(2)}
                </td>
                <td className={`py-2 text-right ${t.avgPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
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
