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

export function MessageList({ messages }: { messages: FeedMessage[] }) {
  if (!messages.length) {
    return (
      <p className="py-8 text-center text-sm text-terminal-muted">
        No messages found.
      </p>
    );
  }

  return (
    <div className="space-y-0 font-mono text-sm">
      {messages.map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString("sv-SE", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Stockholm",
        });
        return (
          <div
            key={msg.id}
            className="flex items-start gap-2 border-b border-terminal-border/30 px-1 py-2 hover:bg-terminal-surface/50"
          >
            <span className="shrink-0 text-xs text-terminal-muted">{time}</span>
            <span className="shrink-0 text-xs text-terminal-yellow">
              #{msg.channel}
            </span>
            <span className="shrink-0 text-xs font-semibold text-terminal-accent">
              {msg.author}
            </span>
            <span className="flex-1 text-xs leading-relaxed text-terminal-text">
              {msg.content}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {msg.assets.map((a, i) => (
                <span
                  key={`${a.asset}-${i}`}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLORS[a.asset] ?? "bg-terminal-border text-terminal-muted"}`}
                >
                  {DIR_ICON[a.direction] ?? ""} {a.asset}
                </span>
              ))}
              {msg.processed ? (
                <span className="text-terminal-green" title="Processed">●</span>
              ) : (
                <span className="text-terminal-muted" title="Unprocessed">○</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
