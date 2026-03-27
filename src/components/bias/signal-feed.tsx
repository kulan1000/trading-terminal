interface Message {
  id: number;
  author: string;
  content: string;
  channel: string;
  timestamp: string;
  processed: boolean;
}

export function SignalFeed({ messages }: { messages: Message[] }) {
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
              <span className="ml-auto text-terminal-muted">
                {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {m.processed && (
                <span className="h-1.5 w-1.5 rounded-full bg-terminal-green" />
              )}
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
