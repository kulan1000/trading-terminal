import type { FeedMessage } from "@/lib/types";

const TAG_COLORS: Record<string, string> = {
  Gold: "bg-yellow-500/20 text-yellow-400",
  Silver: "bg-gray-400/20 text-gray-300",
  Oil: "bg-orange-500/20 text-orange-400",
};

const DIR_ICON: Record<string, string> = {
  bullish: "▲",
  bearish: "▼",
};

export function SignalFeed({ messages }: { messages: FeedMessage[] }) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">
        Signal Feed
      </h3>
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="border-b border-terminal-border pb-2 last:border-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-terminal-accent">{m.author}</span>
              <span className="text-terminal-muted">#{m.channel}</span>
              {m.assets.map((a, i) => (
                <span
                  key={`${a.asset}-${i}`}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLORS[a.asset] ?? "bg-terminal-border text-terminal-muted"}`}
                >
                  {DIR_ICON[a.direction] ?? ""} {a.asset}
                </span>
              ))}
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
          </div>
        ))}
        {!messages.length && (
          <p className="text-xs italic text-terminal-muted">No messages yet</p>
        )}
      </div>
    </div>
  );
}
