import { getFilteredFeed } from "@/lib/queries";
import { getMessageStats } from "@/lib/queries-stats";
import { getDailyBriefing } from "@/lib/queries-briefing";
import { TerminalCard } from "@/components/ui/terminal-card";
import { MessageList } from "@/components/discord/message-list";
import { AdvancedSearch } from "@/components/discord/advanced-search";
import { DailyBriefingPanel } from "@/components/discord/daily-briefing";
import { Suspense } from "react";

export const revalidate = 30;

interface Props {
  searchParams: Promise<{
    channel?: string;
    asset?: string;
    q?: string;
    author?: string;
    signalType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function DiscordIntelPage({ searchParams }: Props) {
  const { channel, asset, q, author, signalType, dateFrom, dateTo } = await searchParams;

  const hasFilters = !!(q || author || (channel && channel !== "all") || (asset && asset !== "all") || (signalType && signalType !== "all") || dateFrom || dateTo);

  const [messages, stats, briefing] = await Promise.all([
    getFilteredFeed({ channel, asset, query: q, author, signalType, dateFrom, dateTo, limit: hasFilters ? 100 : 50 }),
    getMessageStats(),
    getDailyBriefing(),
  ]);

  const filterParts: string[] = [];
  if (q) filterParts.push(`"${q}"`);
  if (author) filterParts.push(`@${author}`);
  if (asset && asset !== "all") filterParts.push(asset);
  if (signalType && signalType !== "all") filterParts.push(signalType.toUpperCase());

  const title = hasFilters
    ? `Sökresultat: ${filterParts.join(" + ")} (${messages.length})`
    : `Raw Feed (${messages.length})`;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
          Discord Intel
        </h1>
        <div className="flex gap-4 font-mono text-xs text-tv-secondary">
          <span>Messages: <span className="text-tv-text">{stats.total}</span></span>
          <span>Processed: <span className="text-tv-bull">{stats.processed}</span></span>
          <span>Signals: <span className="text-tv-blue">{stats.signals}</span></span>
        </div>
      </div>

      <DailyBriefingPanel data={briefing} />

      <Suspense>
        <AdvancedSearch />
      </Suspense>

      <TerminalCard title={title}>
        <MessageList messages={messages} highlight={q} />
      </TerminalCard>
    </div>
  );
}
