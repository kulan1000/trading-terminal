"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-tv-muted">—</span>;
  const color = value > 0 ? "text-tv-bull" : value < 0 ? "text-tv-bear" : "text-tv-secondary";
  return <span className={color}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

export function TraderDrilldown({ signals }: { signals: ScoredSignal[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-tv-bg/50 px-4 py-2">
        <table className="w-full font-mono text-[12px]">
          <thead>
            <tr className="text-tv-muted">
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
                  <span className={s.position === "long" ? "text-tv-bull" : "text-tv-bear"}>
                    {s.position ?? "—"}
                  </span>
                </td>
                <td className="py-1 text-right"><ScoreCell value={s.score30m} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score1h} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score2h} /></td>
                <td className="py-1 text-right"><ScoreCell value={s.score4h} /></td>
                <td className="py-1 text-right">
                  <ScoreCell value={s.weightedScore} />
                  {s.consistent && <span className="ml-1 text-[9px] text-tv-bull" title="Consistent">✦</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
