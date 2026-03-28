import type { FeedMessage } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";

export function MessageList({ messages }: { messages: FeedMessage[] }) {
  if (!messages.length) {
    return (
      <p className="py-8 text-center text-sm text-tv-secondary">
        No messages found.
      </p>
    );
  }

  return (
    <div className="space-y-0 text-sm">
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
            className="flex items-start gap-2 border-b border-tv-divider px-1 py-2 transition-colors hover:bg-tv-elevated/50"
          >
            <span className="shrink-0 font-mono text-xs text-tv-muted">{time}</span>
            <span className="shrink-0 text-xs text-tv-orange">
              #{msg.channel}
            </span>
            <span className="shrink-0 font-sans text-xs font-semibold text-tv-blue">
              {msg.author}
            </span>
            <span className="flex-1 text-xs leading-relaxed text-tv-text">
              {msg.content}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {msg.assets.map((a, i) => (
                <span
                  key={`${a.asset}-${i}`}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[a.asset] ?? "bg-tv-input text-tv-secondary"} ${a.strength === "weak" ? "opacity-60" : ""}`}
                  title={a.interpretation ?? undefined}
                >
                  {a.asset}
                </span>
              ))}
              {msg.processed ? (
                <span className="text-tv-bull" title="Processed">●</span>
              ) : (
                <span className="text-tv-secondary" title="Unprocessed">○</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
