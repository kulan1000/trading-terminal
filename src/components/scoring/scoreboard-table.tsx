"use client";

import { Fragment, useState } from "react";
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

/** Win rate colored pill matching TradingView badge pattern */
function WinRatePill({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(0);
  if (rate >= 0.6) {
    return (
      <span className="inline-block rounded-md bg-[#26A69A]/20 px-2 py-0.5 font-sans text-[12px] tabular-nums text-[#26A69A]">
        {pct}%
      </span>
    );
  }
  if (rate >= 0.4) {
    return (
      <span className="inline-block rounded-md bg-[#FF9800]/15 px-2 py-0.5 font-sans text-[12px] tabular-nums text-[#FF9800]">
        {pct}%
      </span>
    );
  }
  return (
    <span className="inline-block rounded-md bg-[#EF5350]/20 px-2 py-0.5 font-sans text-[12px] tabular-nums text-[#EF5350]">
      {pct}%
    </span>
  );
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
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Scoreboard
          </h3>
        </div>
        <div className="px-5 pb-4">
          <p className="font-sans text-[13px] text-white/40">
            No scored signals yet. Scoring starts automatically once price data
            has been collected (30m/1h/2h/4h after signal). Click a trader to see details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Scoreboard
          <span className="ml-2 font-sans text-[11px] font-normal text-white/30">
            Time horizons: 30m · 1h · 2h · 4h
          </span>
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y border-white/[0.04] bg-white/[0.015]">
            <th className="w-8 px-3 py-2.5 text-center font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              #
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`cursor-pointer px-5 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 transition-colors hover:text-white/70 ${c.align}`}
              >
                {c.label}
                {sortKey === c.key && <span className="ml-1 text-[#FF9800]">{sortAsc ? "▲" : "▼"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const scoreColor = t.avgScore > 0 ? "text-[#26A69A]" : t.avgScore < 0 ? "text-[#EF5350]" : "text-white/50";
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
            const isExpanded = expanded === t.author;
            return (
              <Fragment key={t.author}>
                <tr
                  onClick={() => setExpanded(isExpanded ? null : t.author)}
                  className={`cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.025] ${isExpanded ? "bg-white/[0.025]" : ""}`}
                >
                  <td className="px-3 py-3 text-center font-sans text-[13px]">{medal}</td>
                  <td className="px-5 py-3">
                    <Link href={`/trader/${encodeURIComponent(t.author)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-sans text-[14px] font-semibold text-white transition-colors hover:text-[#FF9800]">
                      {t.author}
                    </Link>
                    <span className="ml-1.5 text-[10px] text-white/20">{isExpanded ? "▾" : "▸"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-sans text-[13px] tabular-nums text-white/70">
                      {t.signals}
                    </span>
                    <span className="ml-1 font-sans text-[10px] text-white/30">
                      ({t.entries}E {t.exits}X)
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <WinRatePill rate={t.winRate} />
                  </td>
                  <td className={`px-5 py-3 text-right font-sans text-[13px] tabular-nums ${scoreColor}`}>
                    {t.avgScore > 0 ? "+" : ""}{t.avgScore.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-sans text-[13px] tabular-nums text-white/70">
                      {t.consistency}/{t.signals}
                    </span>
                    <span className="ml-1 text-[9px] text-[#26A69A]">✦</span>
                  </td>
                </tr>
                {isExpanded && traderSignals[t.author] && (
                  <TraderDrilldown signals={traderSignals[t.author]} />
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
