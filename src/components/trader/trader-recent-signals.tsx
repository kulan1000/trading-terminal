"use client";

import { fmtAgo } from "@/lib/format-utils";

const DIR_CLR: Record<string, string> = {
  bullish: "text-[#26A69A]", bearish: "text-[#EF5350]", neutral: "text-[#FF9800]",
};
const TYPE_TAG: Record<string, string> = {
  entry: "bg-[#26A69A]/15 text-[#26A69A]", exited: "bg-white/[0.06] text-white/40",
  position: "bg-[#2962FF]/15 text-[#2962FF]", opinion: "bg-[#FF9800]/10 text-[#FF9800]",
  target: "bg-[#2962FF]/15 text-[#2962FF]",
};

interface Signal {
  id: number;
  asset: string;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string;
  position: string | null;
  created_at: string;
}

export function TraderRecentSignals({ signals }: { signals: Signal[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Recent signals
        </h4>
        <div className="space-y-1.5">
          {signals.slice(0, 20).map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-0.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.direction === "bullish" ? "bg-[#26A69A]" : s.direction === "bearish" ? "bg-[#EF5350]" : "bg-[#FF9800]"}`} />
              <span className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[s.signal_type] ?? TYPE_TAG.opinion}`}>
                {s.signal_type}{s.position ? ` ${s.position}` : ""}
              </span>
              <span className="font-sans text-[11px] text-white/50">{s.asset}</span>
              <span className={`font-sans text-[10px] font-bold ${DIR_CLR[s.direction]}`}>
                {s.direction.toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-white/20">{s.strength}</span>
              <span className="ml-auto font-mono text-[9px] text-white/15">{fmtAgo(s.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
