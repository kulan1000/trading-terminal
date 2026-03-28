import type { FeedMessage } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";

const SIGNAL_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-tv-bull/20 text-tv-bull" },
  exited: { label: "EXIT", cls: "bg-tv-bear/20 text-tv-bear" },
  position: { label: "HOLD", cls: "bg-tv-blue/20 text-tv-blue" },
  opinion: { label: "OPINION", cls: "bg-tv-secondary/20 text-tv-secondary" },
  target: { label: "TARGET", cls: "bg-tv-orange/20 text-tv-orange" },
};

function HighlightText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? <mark key={i} className="rounded bg-tv-yellow/30 px-0.5 text-tv-text">{part}</mark>
          : part
      )}
    </>
  );
}

interface Props {
  messages: FeedMessage[];
  highlight?: string;
}

export function MessageList({ messages, highlight }: Props) {
  if (!messages.length) {
    return (
      <p className="py-8 text-center text-sm text-tv-secondary">
        Inga meddelanden hittades.
      </p>
    );
  }

  return (
    <div className="space-y-0 text-sm">
      {messages.map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString("sv-SE", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          timeZone: "Europe/Stockholm",
        });
        return (
          <div key={msg.id}
            className="flex items-start gap-2 border-b border-tv-divider px-1 py-2 transition-colors hover:bg-tv-elevated/50">
            <span className="shrink-0 font-mono text-xs text-tv-muted">{time}</span>
            <span className="shrink-0 text-xs text-tv-orange">#{msg.channel}</span>
            <span className="shrink-0 font-sans text-xs font-semibold text-tv-blue">{msg.author}</span>
            <span className="flex-1 text-xs leading-relaxed text-tv-text">
              <HighlightText text={msg.content} highlight={highlight} />
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {msg.assets.map((a, i) => {
                const typeInfo = a.signal_type ? SIGNAL_TYPE_LABELS[a.signal_type] : null;
                return (
                  <span key={`${a.asset}-${i}`} className="flex items-center gap-0.5">
                    {typeInfo && (
                      <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${typeInfo.cls}`}>
                        {typeInfo.label}
                      </span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[a.asset] ?? "bg-tv-input text-tv-secondary"} ${a.strength === "weak" ? "opacity-60" : ""}`}
                      title={a.interpretation ?? undefined}
                    >
                      {a.asset}
                    </span>
                  </span>
                );
              })}
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
