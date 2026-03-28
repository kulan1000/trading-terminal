import { DIRECTION_COLOR } from "@/lib/constants";

interface Signal {
  id: number;
  asset: string;
  direction: string;
  confidence: number;
  created_at: string;
  discord_messages: { author: string; content: string } | null;
}

export function RecentSignals({ signals }: { signals: Signal[] }) {
  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        Recent Signals
      </h3>
      <div className="space-y-2">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-3 font-mono text-xs">
            <span className="w-12 shrink-0 font-bold text-tv-text">
              {s.asset}
            </span>
            <span className={`w-16 shrink-0 font-medium ${DIRECTION_COLOR[s.direction as keyof typeof DIRECTION_COLOR] ?? "text-tv-secondary"}`}>
              {s.direction.toUpperCase()}
            </span>
            <span className="w-10 shrink-0 text-tv-secondary">
              {Math.round(s.confidence * 100)}%
            </span>
            <span className="truncate font-sans text-tv-secondary">
              {s.discord_messages?.author ?? "—"}
            </span>
          </div>
        ))}
        {!signals.length && (
          <p className="text-xs italic text-tv-secondary">No signals yet</p>
        )}
      </div>
    </div>
  );
}
