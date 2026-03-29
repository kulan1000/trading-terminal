"use client";

import { useSearchParams } from "next/navigation";
import { TerminalCard } from "@/components/ui/terminal-card";
import { MessageList } from "@/components/discord/message-list";
import { AdvancedSearch } from "@/components/discord/advanced-search";
import { DailyBriefingPanel } from "@/components/discord/daily-briefing";
import { FetchError } from "@/components/ui/fetch-error";
import { usePollingFetch } from "@/hooks/use-polling-fetch";
import { Suspense } from "react";

export default function DiscordIntelPage() {
  return (
    <Suspense>
      <DiscordIntelContent />
    </Suspense>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function DiscordIntelContent() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const url = `/api/discord-intel-data${qs ? `?${qs}` : ""}`;

  const { data, error, retry } = usePollingFetch<{
    messages: any[];
    stats: { total: number; processed: number; signals: number };
    briefing: any;
  }>({ url });

  const channel = searchParams.get("channel") ?? undefined;
  const asset = searchParams.get("asset") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const author = searchParams.get("author") ?? undefined;
  const signalType = searchParams.get("signalType") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const hasFilters = !!(q || author || (channel && channel !== "all") || (asset && asset !== "all") || (signalType && signalType !== "all") || dateFrom || dateTo);

  const filterParts: string[] = [];
  if (q) filterParts.push(`"${q}"`);
  if (author) filterParts.push(`@${author}`);
  if (asset && asset !== "all") filterParts.push(asset);
  if (signalType && signalType !== "all") filterParts.push(signalType.toUpperCase());

  const stats = data?.stats ?? { total: 0, processed: 0, signals: 0 };
  const messages = data?.messages ?? [];
  const title = hasFilters
    ? `Sökresultat: ${filterParts.join(" + ")} (${messages.length})`
    : `Raw Feed (${messages.length})`;

  return (
    <div className="animate-fade-in space-y-4">
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

      {data?.briefing && <DailyBriefingPanel data={data.briefing} />}

      <AdvancedSearch />

      {data ? (
        <TerminalCard title={title}>
          <MessageList messages={messages} highlight={q} />
        </TerminalCard>
      ) : error ? (
        <FetchError onRetry={retry} />
      ) : (
        <div className="h-[300px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
      )}
    </div>
  );
}
