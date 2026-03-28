"use client";

import { useState } from "react";
import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";

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

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-tv-text-subtle">—</span>;
  const color = value > 0 ? "text-tv-green" : value < 0 ? "text-tv-red" : "text-tv-text-secondary";
  return <span className={color}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

function TraderDrilldown({ signals }: { signals: ScoredSignal[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-tv-bg/50 px-4 py-2">
        <table className="w-full font-mono text-[12px]">
          <thead>
            <tr className="text-tv-text-subtle">
              <th className="pb-1 text-left">Type</th>
              <th className="pb-1 text-left">Asset</th>
              <th className="pb-1 text-left">Dir</th>
              <th className="pb-1 text-right">30m</th>
              <th className="pb-1 text-right">1h</th>
              <th className="pb-1 text-right">2h</th>
              <th className="pb-1 text-right">4h</th>
              <th className="pb-1 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => (
              <tr key={i} className="border-t border-tv-divider/50">
                <td className="py-1">
                  <span className={
                    s.signalType === "entry"
                      ? "rounded bg-tv-blue/15 px-1.5 py-0.5 text-tv-blue"
                      : "rounded bg-tv-orange/15 px-1.5 py-0.5 text-tv-orange"
                  }>
                    {s.signalType === "entry" ? "ENTRY" : "EXIT"}
                  </span>
                </td>
                <td className="py-1 uppercase text-tv-blue">{s.asset}</td>
                <td className="py-1">
                  <span className={s.position === "long" ? "text-tv-green" : "text-tv-red"}>
                    {s.position ?? "—"}
                  </span>
                </td>
                <td className="py-1 text-right"><ScoreCell value={s.score30m} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score1h} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score2h} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score4h} /></td>
                <td className="py-1 text-right">
                  <ScoreCell value={s.weightedScore} />
                  {s.consistent && <span className="ml-1 text-[9px] text-tv-green" title="Consistent">✦</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

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
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-6">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Scoreboard
        </h3>
        <p className="text-xs text-tv-text-subtle">
          Inga traders med minst 3 scorade signaler ännu. Scoring börjar automatiskt
          efter att prisdata samlats in (30m/1h/2h/4h efter signal).
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Scoreboard
        <span className="ml-2 text-[10px] font-normal text-tv-text-subtle">
          Tidshorisonter: 30m · 1h · 2h · 4h
        </span>
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
                {sortKey === c.key && <span className="ml-1 text-tv-blue">{sortAsc ? "▲" : "▼"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const wrColor = t.winRate >= 0.6 ? "text-tv-green" : t.winRate >= 0.4 ? "text-tv-orange" : "text-tv-red";
            const scoreColor = t.avgScore > 0 ? "text-tv-green" : t.avgScore < 0 ? "text-tv-red" : "text-tv-text-secondary";
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
                  <td className="py-1.5 text-right text-tv-text-secondary">
                    {t.signals}
                    <span className="ml-1 text-[10px] text-tv-text-subtle">
                      ({t.entries}E {t.exits}X)
                    </span>
                  </td>
                  <td className={`py-1.5 text-right font-semibold ${wrColor}`}>
                    {(t.winRate * 100).toFixed(0)}%
                  </td>
                  <td className={`py-1.5 text-right ${scoreColor}`}>
                    {t.avgScore > 0 ? "+" : ""}{t.avgScore.toFixed(2)}%
                  </td>
                  <td className="py-1.5 text-right text-tv-text-secondary">
                    {t.consistency}/{t.signals}
                    <span className="ml-1 text-[9px] text-tv-green">✦</span>
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
