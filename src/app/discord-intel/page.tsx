import { getSignalFeed, getMessageStats } from "@/lib/queries";
import { TerminalCard } from "@/components/ui/terminal-card";
import { MessageSearch } from "@/components/discord/message-search";
import { MessageList } from "@/components/discord/message-list";

export const revalidate = 30;

export default async function DiscordIntelPage() {
  const [messages, stats] = await Promise.all([
    getSignalFeed(50),
    getMessageStats(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Discord Intel
        </h1>
        <div className="flex gap-4 font-mono text-xs text-terminal-muted">
          <span>
            Messages: <span className="text-terminal-text">{stats.total}</span>
          </span>
          <span>
            Processed:{" "}
            <span className="text-terminal-green">{stats.processed}</span>
          </span>
          <span>
            Signals:{" "}
            <span className="text-terminal-accent">{stats.signals}</span>
          </span>
        </div>
      </div>

      <MessageSearch />

      <TerminalCard title="Raw Message Feed">
        <MessageList messages={messages} />
      </TerminalCard>
    </div>
  );
}
