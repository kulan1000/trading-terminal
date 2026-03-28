"use client";

import { fmtAgo } from "@/lib/format-utils";

const TYPE_TAG: Record<string, string> = {
  entry: "bg-[#26A69A]/15 text-[#26A69A]", exited: "bg-white/[0.06] text-white/40",
  position: "bg-[#2962FF]/15 text-[#2962FF]", opinion: "bg-[#FF9800]/10 text-[#FF9800]",
  target: "bg-[#2962FF]/15 text-[#2962FF]",
};

interface Score {
  signal_id: number;
  asset: string;
  signal_type: string;
  position: string | null;
  score_30m: number | null;
  score_1h: number | null;
  score_2h: number | null;
  score_4h: number | null;
  weighted_score: number;
  consistency_bonus: boolean;
  scored_at: string;
}

export function TraderScoredSignals({ scores }: { scores: Score[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Senaste scorade signaler
        </h4>
        <div className="space-y-1.5">
          {scores.slice(0, 15).map((sc) => {
            const isWin = sc.weighted_score > 0;
            return (
              <div key={sc.signal_id} className="flex items-center gap-2 py-1">
                <span className={`font-mono text-[11px] font-bold tabular-nums ${isWin ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                  {isWin ? "+" : ""}{sc.weighted_score.toFixed(2)}%
                </span>
                <span className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[sc.signal_type] ?? TYPE_TAG.opinion}`}>
                  {sc.signal_type}{sc.position ? ` ${sc.position}` : ""}
                </span>
                <span className="font-sans text-[11px] text-white/50">{sc.asset}</span>
                {sc.consistency_bonus && (
                  <span className="rounded bg-[#FF9800]/15 px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase text-[#FF9800]">
                    1.2x
                  </span>
                )}
                <div className="ml-auto flex gap-2 font-mono text-[9px] text-white/20">
                  {sc.score_30m !== null && <span>30m: {sc.score_30m.toFixed(2)}%</span>}
                  {sc.score_1h !== null && <span>1h: {sc.score_1h.toFixed(2)}%</span>}
                  {sc.score_2h !== null && <span>2h: {sc.score_2h.toFixed(2)}%</span>}
                  {sc.score_4h !== null && <span>4h: {sc.score_4h.toFixed(2)}%</span>}
                </div>
                <span className="font-mono text-[9px] text-white/15">{fmtAgo(sc.scored_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
