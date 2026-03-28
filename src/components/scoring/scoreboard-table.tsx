"use client";

import { useState } from "react";
import type { TraderScore, RecentTrade } from "@/hooks/use-scoring-data";

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

function duration(entry: string, exit: string): string {
  const ms = new Date(exit).getTime() - new Date(entry).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function TraderDrilldown({ trades }: { trades: RecentTrade[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-tv-bg/50 px-4 py-2">
        <table className="w-full font-mono text-[12px]">
          <thead>
            <tr className="text-tv-text-subtle">
              <th className="pb-1 text-left">Asset</th>
              <th className="pb-1 text-left">Dir</th>
              <th className="pb-1 text-right">Entry</th>
              <th className="pb-1 text-right">Exit</th>
              <th className="pb-1 text-right">P/L</th>
              <th className="pb-1 text-right">%</th>
              <th className="pb-1 text-right">Dur</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const c = t.pnl > 0 ? "text-tv-green" : t.pnl < 0 ? "text-tv-red" : "text-tv-text-secondary";
              return (
                <tr key={i} className="border-t border-tv-divider/50">
                  <td className="py-1 uppercase text-tv-blue">{t.asset}</td>
                  <td className="py-1">
                    <span className={t.position === "long" ? "text-tv-green" : "text-tv-red"}>
                      {t.position}
                    </span>
                  </td>
                  <td className="py-1 text-right text-tv-text">${t.entryPrice.toFixed(2)}</td>
                  <td className="py-1 text-right text-tv-text">${t.exitPrice.toFixed(2)}</td>
                  <td className={`py-1 text-right ${c}`}>
                    {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                  </td>
                  <td className={`py-1 text-right ${c}`}>
                    {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent.toFixed(1)}%
                  </td>
                  <td className="py-1 text-right text-tv-text-subtle">
                    {duration(t.entryTime, t.exitTime)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

interface Props {
  traders: TraderScore[];
  traderTrades: Record<string, RecentTrade[]>;
}

export function ScoreboardTable({ traders, traderTrades }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
            const isExpanded = expanded === t.author;
            return (
              <>
                <tr
                  key={t.author}
                  onClick={() => setExpanded(isExpanded ? null : t.author)}
                  className={`cursor-pointer border-b border-tv-divider transition-colors hover:bg-tv-hover ${isExpanded ? "bg-tv-hover" : ""}`}
                >
                  <td className="py-1.5 text-center">{medal}</td>
                  <td className="py-1.5 font-sans text-tv-text">
                    {t.author}
                    <span className="ml-1.5 text-[10px] text-tv-text-subtle">{isExpanded ? "▾" : "▸"}</span>
                  </td>
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
                {isExpanded && traderTrades[t.author] && (
                  <TraderDrilldown key={`${t.author}-detail`} trades={traderTrades[t.author]} />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
