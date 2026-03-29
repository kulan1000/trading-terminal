"use client";

import { useSearchParams } from "next/navigation";
import { MessageFeed } from "@/components/discord/message-list";
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

  const q = searchParams.get("q") ?? undefined;
  const author = searchParams.get("author") ?? undefined;
  const channel = searchParams.get("channel") ?? undefined;
  const asset = searchParams.get("asset") ?? undefined;
  const signalType = searchParams.get("signalType") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const hasFilters = !!(q || author || (channel && channel !== "all") || (asset && asset !== "all") || (signalType && signalType !== "all") || dateFrom || dateTo);
  const stats = data?.stats ?? { total: 0, processed: 0, signals: 0 };
  const messages = data?.messages ?? [];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Discord Intel
        </h1>
        <span className="font-sans text-[12px] text-white/30">
          {stats.total > 0 ? `${stats.total} messages · ${stats.processed} processed · ${stats.signals} signals` : "Loading..."}
        </span>
      </div>

      {data?.briefing && <DailyBriefingPanel data={data.briefing} />}

      <AdvancedSearch />

      {data ? (
        <MessageFeed
          messages={messages}
          highlight={q}
          title={hasFilters ? "Sökresultat" : "Senaste meddelanden"}
          count={messages.length}
        />
      ) : error ? (
        <FetchError onRetry={retry} />
      ) : (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[60px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
          ))}
        </div>
      )}
    </div>
  );
}
