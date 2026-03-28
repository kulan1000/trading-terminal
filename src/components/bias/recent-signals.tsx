interface Signal {
  id: number;
  asset: string;
  direction: string;
  confidence: number;
  created_at: string;
  discord_messages: { author: string; content: string } | null;
}

const DIR_BADGE: Record<string, string> = {
  bullish: "bg-[#26A69A]/15 text-[#26A69A]",
  bearish: "bg-[#EF5350]/15 text-[#EF5350]",
  neutral: "bg-[#FF9800]/15 text-[#FF9800]",
};

export function RecentSignals({ signals }: { signals: Signal[] }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Recent Signals
        </h3>
      </div>

      <div className="px-5 pb-4">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.025]">
            <span className="w-12 shrink-0 font-sans text-[13px] font-semibold text-white">
              {s.asset}
            </span>
            <span className={`w-16 shrink-0 rounded-md px-2.5 py-0.5 text-center font-sans text-[10px] font-bold ${DIR_BADGE[s.direction] ?? DIR_BADGE.neutral}`}>
              {s.direction.toUpperCase()}
            </span>
            <span className="w-10 shrink-0 font-mono text-[12px] tabular-nums text-white/50">
              {Math.round(s.confidence * 100)}%
            </span>
            <span className="truncate font-sans text-[12px] text-white/30">
              {s.discord_messages?.author ?? <span className="text-white/20">&mdash;</span>}
            </span>
          </div>
        ))}
        {!signals.length && (
          <p className="font-sans text-[12px] italic text-white/30">No signals yet</p>
        )}
      </div>
    </div>
  );
}
