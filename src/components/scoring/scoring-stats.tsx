"use client";

import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import type { TradePairRow } from "@/components/scoring/trade-pairs";

interface Props {
  scoreboard: TraderScore[];
  recentScored: ScoredSignal[];
  tradePairs: TradePairRow[];
}

function winColor(avg: number): string {
  if (avg >= 60) return "text-[#26A69A]";
  if (avg >= 50) return "text-[#FF9800]";
  return "text-[#EF5350]";
}

function pnlColor(n: number): string {
  if (n > 0) return "text-[#26A69A]";
  if (n < 0) return "text-[#EF5350]";
  return "text-white";
}

function benchmarkLabel(avg: number): string {
  if (avg >= 60) return "above benchmark";
  if (avg >= 50) return "near benchmark";
  return "below benchmark";
}

/**
 * Scoring v2 — 4 stat-card strip at the top.
 * Active Traders · Signals Scored · Avg Win Rate · Total P&L
 */
export function ScoringStats({ scoreboard, recentScored, tradePairs }: Props) {
  const totalTraders = scoreboard.length;
  const activeTraders = scoreboard.filter((t) => t.signals > 0).length;
  const totalScored = recentScored.length;

  const traderAvg =
    scoreboard.length > 0
      ? scoreboard.reduce((s, t) => s + t.winRate, 0) / scoreboard.length
      : 0;
  const avgWinPct = Math.round(traderAvg * 100);

  const totalPnl = tradePairs.reduce((s, p) => s + (p.pnl ?? 0), 0);
  const wins = tradePairs.filter((p) => (p.pnl ?? 0) > 0).length;
  const losses = tradePairs.filter((p) => (p.pnl ?? 0) < 0).length;

  const items = [
    {
      label: "Active Traders",
      value: activeTraders.toString(),
      sub: `of ${totalTraders} total`,
      valueCls: "text-white",
    },
    {
      label: "Signals Scored",
      value: totalScored.toString(),
      sub: "last 7 days",
      valueCls: "text-white",
    },
    {
      label: "Avg Win Rate",
      value: `${avgWinPct}%`,
      sub: benchmarkLabel(avgWinPct),
      valueCls: winColor(avgWinPct),
    },
    {
      label: "Total P&L",
      value: `${totalPnl > 0 ? "+" : ""}${totalPnl.toFixed(1)}`,
      sub: `${wins}W / ${losses}L`,
      valueCls: pnlColor(totalPnl),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="animate-fade-in rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-4 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#151515]"
        >
          <div className="font-sans text-[11px] font-medium text-white/55">
            {item.label}
          </div>
          <div
            className={`mt-1 font-mono text-[26px] font-bold tabular-nums tracking-tight ${item.valueCls}`}
          >
            {item.value}
          </div>
          <div className="mt-0.5 font-sans text-[11px] text-white/40">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
