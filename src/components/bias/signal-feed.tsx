import type { FeedMessage } from "@/lib/types";
import { ASSET_TAG_COLORS, DIRECTION_ICON } from "@/lib/constants";

const STRENGTH_STYLE: Record<string, string> = {
  strong: "border-l-2 border-terminal-accent",
  medium: "border-l-2 border-terminal-muted",
  weak: "border-l border-terminal-border opacity-80",
};

const DIR_TAG: Record<string, { label: string; cls: string }> = {
  bullish: { label: "BULLISH", cls: "bg-green-500/20 text-green-400" },
  bearish: { label: "BEARISH", cls: "bg-red-500/20 text-red-400" },
  neutral: { label: "NEUTRAL", cls: "bg-yellow-500/20 text-yellow-400" },
};

const POS_TAG: Record<string, { label: string; cls: string }> = {
  long: { label: "LONG", cls: "bg-green-600/30 text-green-300 ring-1 ring-green-500/30" },
  short: { label: "SHORT", cls: "bg-red-600/30 text-red-300 ring-1 ring-red-500/30" },
};

export function SignalFeed({ messages }: { messages: FeedMessage[] }) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">
        Signal Feed
      </h3>
      <div className="space-y-3">
        {messages.map((m) => {
          const topStrength = m.assets[0]?.strength ?? "medium";
          return (
            <div
              key={m.id}
              className={`border-b border-terminal-border pb-2 pl-2 last:border-0 ${STRENGTH_STYLE[topStrength] ?? ""}`}
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-terminal-accent">{m.author}</span>
                <span className="text-terminal-muted">#{m.channel}</span>
                {m.assets.map((a, i) => {
                  const dir = DIR_TAG[a.direction];
                  const pos = a.position ? POS_TAG[a.position] : null;
                  return (
                    <span key={`${a.asset}-${i}`} className="inline-flex items-center gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[a.asset] ?? "bg-terminal-border text-terminal-muted"}`}
                        title={a.interpretation ?? undefined}
                      >
                        {DIRECTION_ICON[a.direction] ?? ""} {a.asset}
                      </span>
                      {dir && (
                        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${dir.cls}`}>
                          {dir.label}
                        </span>
                      )}
                      {pos && (
                        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${pos.cls}`}>
                          {pos.label}
                        </span>
                      )}
                    </span>
                  );
                })}
                <span className="ml-auto text-terminal-muted">
                  {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Stockholm",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-terminal-text">
                {m.content}
              </p>
              {m.assets[0]?.interpretation && (
                <p className="mt-0.5 text-[10px] italic text-terminal-muted">
                  {m.assets[0].interpretation}
                </p>
              )}
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-xs italic text-terminal-muted">No signals yet</p>
        )}
      </div>
    </div>
  );
}
