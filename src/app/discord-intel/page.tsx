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
    getFilteredFeed({ channel, asset, query: q, author, signalType, dateFrom, dateTo, limit: hasFilters ? 100 : 50 }).catch(() => []),
    getMessageStats().catch(() => ({ total: 0, processed: 0, signals: 0 })),
    getDailyBriefing().catch(() => null),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Discord Intel
        </h1>
        <div className="flex items-center gap-4 font-sans text-[11px]">
          <span className="text-white/40">Messages: <span className="tabular-nums text-white/70">{stats.total}</span></span>
          <span className="text-white/40">Processed: <span className="tabular-nums text-[#26A69A]">{stats.processed}</span></span>
          <span className="text-white/40">Signals: <span className="tabular-nums text-[#2962FF]">{stats.signals}</span></span>
        </div>
      </div>

      {briefing && <DailyBriefingPanel data={briefing} />}

      <Suspense>
        <AdvancedSearch />
      </Suspense>

      <TerminalCard title={title}>
        <MessageList messages={messages} highlight={q} />
      </TerminalCard>
    </div>
  );
}
