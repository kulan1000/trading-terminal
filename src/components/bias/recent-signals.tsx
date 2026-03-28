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
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-medium uppercase tracking-wider text-tv-text-secondary">
        Recent Signals
      </h3>
      <div className="space-y-2">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-3 font-mono text-xs">
            <span className="w-12 shrink-0 font-bold text-tv-text">
              {s.asset}
            </span>
            <span className={`w-16 shrink-0 font-medium ${DIRECTION_COLOR[s.direction as keyof typeof DIRECTION_COLOR] ?? "text-tv-text-secondary"}`}>
              {s.direction.toUpperCase()}
            </span>
            <span className="w-10 shrink-0 text-tv-text-secondary">
              {Math.round(s.confidence * 100)}%
            </span>
            <span className="truncate font-sans text-tv-text-secondary">
              {s.discord_messages?.author ?? "—"}
            </span>
          </div>
        ))}
        {!signals.length && (
          <p className="text-xs italic text-tv-text-secondary">No signals yet</p>
        )}
      </div>
    </div>
  );
}
