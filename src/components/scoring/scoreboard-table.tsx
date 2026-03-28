"use client";

import { useState } from "react";
import Link from "next/link";
import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import { TraderDrilldown } from "./trader-drilldown";

type SortKey = "author" | "signals" | "winRate" | "avgScore" | "consistency";

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
  { key: "signals", label: "Signals", align: "text-right" },
  { key: "winRate", label: "Win Rate", align: "text-right" },
  { key: "avgScore", label: "Avg Score", align: "text-right" },
  { key: "consistency", label: "Consistent", align: "text-right" },
];

interface Props {
  traders: TraderScore[];
  traderSignals: Record<string, ScoredSignal[]>;
}

export function ScoreboardTable({ traders, traderSignals }: Props) {
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
      <div className="rounded-lg border border-tv-border bg-tv-surface p-5">
        <h3 className="mb-2 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
          Scoreboard
        </h3>
        <p className="text-xs text-tv-muted">
          Inga traders med minst 3 scorade signaler ännu. Scoring börjar automatiskt
          efter att prisdata samlats in (30m/1h/2h/4h efter signal).
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        Scoreboard
        <span className="ml-2 text-[10px] font-normal text-tv-muted">
          Tidshorisonter: 30m · 1h · 2h · 4h
        </span>
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-secondary">
            <th className="w-8 pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em]">#</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`cursor-pointer pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-tv-text ${c.align}`}
              >
                {c.label}
                {sortKey === c.key && <span className="ml-1 text-tv-blue">{sortAsc ? "▲" : "▼"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const wrColor = t.winRate >= 0.6 ? "text-tv-bull" : t.winRate >= 0.4 ? "text-tv-orange" : "text-tv-bear";
            const scoreColor = t.avgScore > 0 ? "text-tv-bull" : t.avgScore < 0 ? "text-tv-bear" : "text-tv-secondary";
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
            const isExpanded = expanded === t.author;
            return (
              <>
                <tr
                  key={t.author}
                  onClick={() => setExpanded(isExpanded ? null : t.author)}
                  className={`cursor-pointer border-b border-tv-divider transition-colors hover:bg-tv-elevated ${isExpanded ? "bg-tv-elevated" : ""}`}
                >
                  <td className="py-1.5 text-center">{medal}</td>
                  <td className="py-1.5 font-sans text-tv-text">
                    <Link href={`/trader/${encodeURIComponent(t.author)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-tv-blue transition-colors hover:text-tv-blue-hover hover:underline">
                      {t.author}
                    </Link>
                    <span className="ml-1.5 text-[10px] text-tv-muted">{isExpanded ? "▾" : "▸"}</span>
                  </td>
                  <td className="py-1.5 text-right text-tv-secondary">
                    {t.signals}
                    <span className="ml-1 text-[10px] text-tv-muted">
                      ({t.entries}E {t.exits}X)
                    </span>
                  </td>
                  <td className={`py-1.5 text-right font-semibold ${wrColor}`}>
                    {(t.winRate * 100).toFixed(0)}%
                  </td>
                  <td className={`py-1.5 text-right ${scoreColor}`}>
                    {t.avgScore > 0 ? "+" : ""}{t.avgScore.toFixed(2)}%
                  </td>
                  <td className="py-1.5 text-right text-tv-secondary">
                    {t.consistency}/{t.signals}
                    <span className="ml-1 text-[9px] text-tv-bull">✦</span>
                  </td>
                </tr>
                {isExpanded && traderSignals[t.author] && (
                  <TraderDrilldown key={`${t.author}-detail`} signals={traderSignals[t.author]} />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
