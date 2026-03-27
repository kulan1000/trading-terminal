import { getFilteredFeed } from "@/lib/queries";
import { getMessageStats } from "@/lib/queries-stats";
import { TerminalCard } from "@/components/ui/terminal-card";
import { MessageSearch } from "@/components/discord/message-search";
import { MessageList } from "@/components/discord/message-list";
import { ChannelFilter } from "@/components/discord/channel-filter";
import { Suspense } from "react";

export const revalidate = 30;

interface Props {
  searchParams: Promise<{ channel?: string; asset?: string; q?: string }>;
}

export default async function DiscordIntelPage({ searchParams }: Props) {
  const { channel, asset, q } = await searchParams;

  const [messages, stats] = await Promise.all([
    getFilteredFeed({ channel, asset, query: q, limit: 50 }),
    getMessageStats(),
  ]);

  const title = q
    ? `Search: "${q}" (${messages.length})`
    : `Raw Feed (${messages.length})`;

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

      <Suspense>
        <ChannelFilter />
      </Suspense>

      <TerminalCard title={title}>
        <MessageList messages={messages} />
      </TerminalCard>
    </div>
  );
}
