"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const color = value > 0 ? "text-[#26A69A]" : value < 0 ? "text-[#EF5350]" : "text-white/50";
  return <span className={`font-mono tabular-nums ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

export function TraderDrilldown({ signals }: { signals: ScoredSignal[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-white/[0.015] px-5 py-3">
        <table className="w-full text-[12px]">
          <thead>
            <tr>
              <th className="pb-2 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Type</th>
              <th className="pb-2 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Asset</th>
              <th className="pb-2 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Dir</th>
              <th className="pb-2 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">30m</th>
              <th className="pb-2 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">1h</th>
              <th className="pb-2 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">2h</th>
              <th className="pb-2 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">4h</th>
              <th className="pb-2 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Score</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => (
              <tr key={i} className="border-t border-white/[0.03]">
                <td className="py-2">
                  <span className={
                    s.signalType === "entry"
                      ? "rounded-md bg-[#2962FF]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#2962FF]"
                      : "rounded-md bg-[#FF9800]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#FF9800]"
                  }>
                    {s.signalType === "entry" ? "ENTRY" : "EXIT"}
                  </span>
                </td>
                <td className="py-2 font-sans text-[12px] font-medium uppercase text-[#2962FF]">{s.asset}</td>
                <td className="py-2">
                  <span className={`font-sans text-[12px] font-medium ${s.position === "long" ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                    {s.position ?? <span className="text-white/20">—</span>}
                  </span>
                </td>
                <td className="py-2 text-right text-[12px]"><ScoreCell value={s.score30m} /></td>
                <td className="py-2 text-right text-[12px]"><ScoreCell value={s.score1h} /></td>
                <td className="py-2 text-right text-[12px]"><ScoreCell value={s.score2h} /></td>
                <td className="py-2 text-right text-[12px]"><ScoreCell value={s.score4h} /></td>
                <td className="py-2 text-right text-[12px]">
                  <ScoreCell value={s.weightedScore} />
                  {s.consistent && <span className="ml-1 text-[9px] text-[#26A69A]" title="Consistent">✦</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
