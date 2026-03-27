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
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">
        Recent Signals
      </h3>
      <div className="space-y-2">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-xs">
            <span className="w-12 shrink-0 font-bold text-terminal-text">
              {s.asset}
            </span>
            <span className={`w-16 shrink-0 font-medium ${DIRECTION_COLOR[s.direction as keyof typeof DIRECTION_COLOR] ?? "text-terminal-muted"}`}>
              {s.direction.toUpperCase()}
            </span>
            <span className="w-10 shrink-0 text-terminal-muted">
              {Math.round(s.confidence * 100)}%
            </span>
            <span className="truncate text-terminal-muted">
              {s.discord_messages?.author ?? "—"}
            </span>
          </div>
        ))}
        {!signals.length && (
          <p className="text-xs italic text-terminal-muted">No signals yet</p>
        )}
      </div>
    </div>
  );
}
