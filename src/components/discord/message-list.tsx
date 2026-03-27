interface Message {
  id: number;
  author: string;
  content: string;
  channel: string;
  timestamp: string;
  processed: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return <p className="text-terminal-muted">No messages found.</p>;
  }

  return (
    <div className="space-y-1 font-mono text-sm">
      {messages.map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return (
          <div
            key={msg.id}
            className="flex gap-2 border-b border-terminal-border/30 py-2"
          >
            <span className="shrink-0 text-terminal-muted">{time}</span>
            <span className="shrink-0 text-terminal-yellow">
              #{msg.channel}
            </span>
            <span className="shrink-0 font-semibold text-terminal-accent">
              {msg.author}
            </span>
            <span className="text-terminal-text">{msg.content}</span>
            <span className="ml-auto shrink-0">
              {msg.processed ? (
                <span className="text-terminal-green">●</span>
              ) : (
                <span className="text-terminal-muted">○</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
