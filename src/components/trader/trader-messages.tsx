import { fmtDateTime } from "@/lib/format-utils";

interface Message {
  id: number;
  content: string;
  channel: string;
  timestamp: string;
}

export function TraderMessages({ messages }: { messages: Message[] }) {
  if (!messages.length) {
    return <p className="py-4 text-center text-xs text-tv-secondary">Inga meddelanden.</p>;
  }

  return (
    <div className="space-y-0">
      {messages.map((msg) => {
        const time = fmtDateTime(msg.timestamp);
        return (
          <div key={msg.id} className="flex gap-2 border-b border-tv-divider px-1 py-2 transition-colors hover:bg-tv-elevated/50">
            <span className="shrink-0 font-mono text-[10px] text-tv-muted">{time}</span>
            <span className="shrink-0 text-[10px] text-tv-orange">#{msg.channel}</span>
            <span className="flex-1 text-xs leading-relaxed text-tv-text">{msg.content}</span>
          </div>
        );
      })}
    </div>
  );
}
