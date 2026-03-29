"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";
import { fmtDateTime } from "@/lib/format-utils";

const TYPE_LABEL: Record<string, { text: string; cls: string }> = {
  entry: { text: "ENTRY", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  exited: { text: "EXIT", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
  position: { text: "HOLD", cls: "bg-[#2962FF]/15 text-[#2962FF]" },
};

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const color = value > 0 ? "text-[#26A69A]" : value < 0 ? "text-[#EF5350]" : "text-white/50";
  return <span className={`font-sans tabular-nums ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

export function TraderDrilldown({ signals }: { signals: ScoredSignal[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-white/[0.015] px-5 py-3">
        <div className="space-y-2">
          {signals.map((s, i) => {
            const t = TYPE_LABEL[s.signalType] ?? TYPE_LABEL.position;
            return (
              <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                {/* Header: badge, asset, direction, time */}
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${t.cls}`}>
                    {t.text}{s.position ? ` ${s.position.toUpperCase()}` : ""}
                  </span>
                  <span className="font-sans text-[12px] font-medium uppercase text-white/50">{s.asset}</span>
                  {s.priceAtSignal > 0 && (
                    <span className="font-mono text-[11px] text-white/30">${s.priceAtSignal.toLocaleString()}</span>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-white/20">{fmtDateTime(s.signalCreatedAt)}</span>
                </div>

                {/* Scores row */}
                <div className="mt-2 flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-white/25">30m</span> <ScoreCell value={s.score30m} />
                  <span className="text-white/25">1h</span> <ScoreCell value={s.score1h} />
                  <span className="text-white/25">2h</span> <ScoreCell value={s.score2h} />
                  <span className="text-white/25">4h</span> <ScoreCell value={s.score4h} />
                  <span className="text-white/15">→</span>
                  <span className="font-semibold"><ScoreCell value={s.weightedScore} /></span>
                  {s.consistent && <span className="text-[9px] text-[#26A69A]" title="Consistent">✦</span>}
                </div>

                {/* Quote */}
                {s.messageContent && (
                  <p className="mt-2 line-clamp-3 font-sans text-[11px] italic leading-relaxed text-white/25">
                    &ldquo;{s.messageContent}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
