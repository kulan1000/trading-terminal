"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";
import { fmtDateTime } from "@/lib/format-utils";

const TYPE_LABEL: Record<string, { text: string; cls: string }> = {
  entry: { text: "ENTRY", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  exited: { text: "EXIT", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
  position: { text: "HOLD", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
};

function SignalBadge({ type, position }: { type: string; position: string | null }) {
  const t = TYPE_LABEL[type] ?? TYPE_LABEL.position;
  return (
    <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${t.cls}`}>
      {t.text}{position ? ` ${position.toUpperCase()}` : ""}
    </span>
  );
}

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const color = value > 0 ? "text-[#26A69A]" : value < 0 ? "text-[#EF5350]" : "text-white/50";
  return <span className={`tabular-nums ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

export function RecentScored({ signals }: { signals: ScoredSignal[] }) {
  if (!signals.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-4 pt-4 pb-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">Recent Scored Signals</h3>
          <p className="mt-2 font-sans text-[13px] text-white/40">Inga scorade signaler ännu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">Recent Scored Signals</h3>
      </div>

      <div className="max-h-[420px] space-y-px overflow-y-auto">
        {signals.map((s, i) => (
          <div key={i} className="group border-b border-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.025]">
            {/* Row 1: trader, badge, asset, score */}
            <div className="flex items-center gap-2">
              <span className="font-sans text-[13px] font-semibold text-white">{s.author}</span>
              <SignalBadge type={s.signalType} position={s.position} />
              <span className="font-sans text-[11px] font-medium uppercase text-white/40">{s.asset}</span>
              <span className="ml-auto font-sans text-[12px]"><ScoreCell value={s.weightedScore} /></span>
              {s.consistent && <span className="text-[9px] text-[#26A69A]">✦</span>}
            </div>
            {/* Row 2: time + scores */}
            <div className="mt-1 flex items-center gap-2 font-sans text-[11px] tabular-nums">
              <span className="text-white/20">{fmtDateTime(s.signalCreatedAt)}</span>
              <span className="text-white/10">|</span>
              <span className="text-white/25">30m</span> <ScoreCell value={s.score30m} />
              <span className="text-white/25">1h</span> <ScoreCell value={s.score1h} />
              <span className="text-white/25">2h</span> <ScoreCell value={s.score2h} />
              <span className="text-white/25">4h</span> <ScoreCell value={s.score4h} />
            </div>
            {/* Row 3: quote */}
            {s.messageContent && (
              <p className="mt-1.5 line-clamp-2 font-sans text-[11px] italic leading-relaxed text-white/25">
                &ldquo;{s.messageContent}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
