"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";
import { fmtAgoEn } from "@/lib/format-utils";

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const color = value > 0 ? "text-[#26A69A]" : value < 0 ? "text-[#EF5350]" : "text-white/50";
  return <span className={`font-sans tabular-nums ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

export function RecentScored({ signals }: { signals: ScoredSignal[] }) {
  if (!signals.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Recent Scored
          </h3>
        </div>
        <div className="px-5 pb-4">
          <p className="font-sans text-[13px] text-white/40">Inga scorade signaler annu.</p>
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
          Recent Scored Signals
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y border-white/[0.04] bg-white/[0.015]">
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Trader</th>
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Type</th>
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Asset</th>
            <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">30m</th>
            <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">1h</th>
            <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">2h</th>
            <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">4h</th>
            <th className="px-5 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Total</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s, i) => (
            <tr key={i} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.025]">
              <td className="px-5 py-3 font-sans text-[14px] font-semibold text-white">{s.author}</td>
              <td className="px-5 py-3">
                <span className={
                  s.signalType === "entry"
                    ? "rounded-md bg-[#26A69A]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold text-[#26A69A]"
                    : "rounded-md bg-[#FF9800]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold text-[#FF9800]"
                }>
                  {s.signalType === "entry" ? "ENTRY" : "EXIT"}
                  {s.position ? ` ${s.position.toUpperCase()}` : ""}
                </span>
              </td>
              <td className="px-5 py-3 font-sans text-[13px] font-medium uppercase text-white/60">{s.asset}</td>
              <td className="px-4 py-3 text-right text-[13px]"><ScoreCell value={s.score30m} /></td>
              <td className="px-4 py-3 text-right text-[13px]"><ScoreCell value={s.score1h} /></td>
              <td className="px-4 py-3 text-right text-[13px]"><ScoreCell value={s.score2h} /></td>
              <td className="px-4 py-3 text-right text-[13px]"><ScoreCell value={s.score4h} /></td>
              <td className="px-5 py-3 text-right text-[13px]">
                <ScoreCell value={s.weightedScore} />
                {s.consistent && <span className="ml-1 text-[9px] text-[#26A69A]">✦</span>}
                <span className="ml-1.5 font-sans text-[10px] text-white/20">{fmtAgoEn(s.scoredAt)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
