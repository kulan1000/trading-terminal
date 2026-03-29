"use client";

import { useState } from "react";
import { fmtTime } from "@/lib/format-utils";

export interface ScoreHistoryPoint {
  hour: string;       // ISO hour bucket
  avgScore: number;   // avg weighted_score for that hour
  count: number;      // number of signals scored
  wins: number;       // positive scores
  winRate: number;    // wins / count
}

interface Props {
  history: ScoreHistoryPoint[];
}

export function ScoreTimeline({ history }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 py-4">
          <h3 className="font-sans text-[13px] font-semibold text-white">
            Scoring Accuracy Timeline
          </h3>
          <p className="mt-2 font-sans text-[12px] text-white/40">
            Ingen scoring-data ännu. Tidslinjen fylls automatiskt när signaler börjar scornas efter marknadsöppning.
          </p>
        </div>
      </div>
    );
  }

  // Summary stats
  const totalSignals = history.reduce((s, h) => s + h.count, 0);
  const totalWins = history.reduce((s, h) => s + h.wins, 0);
  const overallRate = totalSignals > 0 ? Math.round((totalWins / totalSignals) * 100) : 0;
  const avgScore = history.reduce((s, h) => s + h.avgScore * h.count, 0) / Math.max(totalSignals, 1);
  const maxCount = Math.max(...history.map((h) => h.count), 1);

  // Hovered point
  const hp = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[13px] font-semibold text-white">
            Scoring Timeline
          </h3>
          <div className="flex items-center gap-4 font-sans text-[11px] tabular-nums">
            <span className="text-white/40">{totalSignals} scored</span>
            <span className={overallRate >= 50 ? "text-[#26A69A]" : "text-[#EF5350]"}>
              {overallRate}% win rate
            </span>
            <span className={avgScore >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}>
              {avgScore >= 0 ? "+" : ""}{avgScore.toFixed(2)}% avg
            </span>
          </div>
        </div>

        {/* Bar chart — each hour bucket is a column */}
        <div
          className="relative mt-4"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Hover tooltip */}
          {hp && hoverIdx !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full"
              style={{ left: `${((hoverIdx + 0.5) / history.length) * 100}%` }}
            >
              <div className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 shadow-xl">
                <p className="font-sans text-[11px] font-medium text-white">
                  {fmtTime(hp.hour)}
                </p>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans text-[10px] text-white/40">Signals</span>
                    <span className="font-sans text-[11px] tabular-nums text-white">{hp.count}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans text-[10px] text-white/40">Wins</span>
                    <span className="font-sans text-[11px] tabular-nums text-[#26A69A]">{hp.wins}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans text-[10px] text-white/40">Losses</span>
                    <span className="font-sans text-[11px] tabular-nums text-[#EF5350]">{hp.count - hp.wins}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-1">
                    <span className="font-sans text-[10px] text-white/40">Win Rate</span>
                    <span className={`font-sans text-[11px] tabular-nums font-medium ${hp.winRate >= 0.5 ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                      {Math.round(hp.winRate * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans text-[10px] text-white/40">Avg Score</span>
                    <span className={`font-sans text-[11px] tabular-nums font-medium ${hp.avgScore >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                      {hp.avgScore >= 0 ? "+" : ""}{hp.avgScore.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
            {history.map((h, i) => {
              const barPct = Math.max((h.count / maxCount) * 100, 4); // min 4% so it's visible
              const isHover = hoverIdx === i;
              const color = h.winRate >= 0.5 ? "#26A69A" : h.winRate > 0 ? "#FF9800" : "#EF5350";

              return (
                <div
                  key={i}
                  className="group relative flex flex-1 cursor-pointer flex-col items-center justify-end"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHoverIdx(i)}
                >
                  {/* Win rate label on hover */}
                  {isHover && (
                    <span
                      className="mb-1 font-sans text-[9px] tabular-nums font-medium"
                      style={{ color }}
                    >
                      {Math.round(h.winRate * 100)}%
                    </span>
                  )}

                  {/* Stacked bar: wins (green) + losses (red) */}
                  <div
                    className="relative w-full overflow-hidden rounded-t-sm transition-all duration-150"
                    style={{
                      height: `${barPct}%`,
                      opacity: isHover ? 1 : 0.7,
                    }}
                  >
                    {/* Win portion */}
                    <div
                      className="absolute bottom-0 w-full transition-all"
                      style={{
                        height: `${h.count > 0 ? (h.wins / h.count) * 100 : 0}%`,
                        backgroundColor: "#26A69A",
                        opacity: isHover ? 0.6 : 0.35,
                      }}
                    />
                    {/* Loss portion */}
                    <div
                      className="absolute top-0 w-full transition-all"
                      style={{
                        height: `${h.count > 0 ? ((h.count - h.wins) / h.count) * 100 : 100}%`,
                        backgroundColor: "#EF5350",
                        opacity: isHover ? 0.5 : 0.2,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis time labels */}
          <div className="mt-2 flex">
            {history.map((h, i) => {
              // Show label for first, last, and roughly evenly spaced
              const step = Math.max(1, Math.floor(history.length / 6));
              const show = i === 0 || i === history.length - 1 || i % step === 0;
              return (
                <div key={i} className="flex-1 text-center">
                  {show && (
                    <span className="font-sans text-[9px] tabular-nums text-white/25">
                      {fmtTime(h.hour)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 border-t border-white/[0.04] pt-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#26A69A]/40" />
            <span className="font-sans text-[10px] text-white/30">Wins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#EF5350]/30" />
            <span className="font-sans text-[10px] text-white/30">Losses</span>
          </div>
          <span className="font-sans text-[10px] text-white/20">Hover för detaljer per timme</span>
        </div>
      </div>
    </div>
  );
}
