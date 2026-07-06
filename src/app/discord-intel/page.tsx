"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, Suspense } from "react";
import { MessageFeed } from "@/components/discord/message-list";
import { AdvancedSearch } from "@/components/discord/advanced-search";
import { StatsRow } from "@/components/discord/stats-row";
import { BriefingSection } from "@/components/discord/briefing-section";
import { SummaryCards } from "@/components/discord/summary-cards";
import { LiveFeedTeaser } from "@/components/discord/live-feed-teaser";
import { FetchError } from "@/components/ui/fetch-error";
import { SectionDivider } from "@/components/ui/section-divider";
import { usePollingFetch } from "@/hooks/use-polling-fetch";
import type { DailyBriefing } from "@/lib/queries-briefing";

export default function DiscordIntelPage() {
  return (
    <Suspense>
      <DiscordIntelContent />
    </Suspense>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function DiscordIntelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const url = `/api/discord-intel-data${qs ? `?${qs}` : ""}`;
  const feedRef = useRef<HTMLDivElement>(null);

  const { data, error, retry } = usePollingFetch<{
    messages: any[];
    stats: { total: number; processed: number; signals: number };
    briefing: DailyBriefing | null;
  }>({ url });

  const q = searchParams.get("q") ?? undefined;
  const author = searchParams.get("author") ?? undefined;
  const channel = searchParams.get("channel") ?? undefined;
  const asset = searchParams.get("asset") ?? undefined;
  const signalType = searchParams.get("signalType") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const hasFilters = !!(
    q ||
    author ||
    (channel && channel !== "all") ||
    (asset && asset !== "all") ||
    (signalType && signalType !== "all") ||
    dateFrom ||
    dateTo
  );

  const stats = data?.stats ?? { total: 0, processed: 0, signals: 0 };
  const messages = data?.messages ?? [];

  function applyAssetFilter(a: string) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("asset", a.toLowerCase());
    router.replace(`/discord-intel?${sp.toString()}`);
    // Scroll down to the filtered feed
    setTimeout(() => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function scrollToFeed() {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Discord Intel
          </h1>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
          </span>
          <span className="font-sans text-[11px] text-white/55">
            {data ? "ingesting from Discord · live" : "Loading..."}
          </span>
        </div>
      </div>

      {/* 4 stat cards */}
      {data && (
        <StatsRow
          total={stats.total}
          processed={stats.processed}
          signals={stats.signals}
          bias={data.briefing?.overallDirection}
          dominantAsset={data.briefing?.dominantAsset ?? undefined}
          todaySignals={data.briefing?.signalCount}
        />
      )}

      {/* 3 briefing cards */}
      {data?.briefing && (
        <BriefingSection data={data.briefing} onAssetFilter={applyAssetFilter} />
      )}

      {/* Most Active + Strongest Signals */}
      {data?.briefing && (
        <>
          <SectionDivider label="Community" meta="contributors · confidence leaders" />
          <SummaryCards data={data.briefing} />
        </>
      )}

      {/* Live Feed teaser */}
      {data && (
        <>
          <SectionDivider label="Live Feed" meta="updates every 30s" />
          <LiveFeedTeaser
            messages={messages}
            totalCount={stats.total}
            onBrowse={scrollToFeed}
          />
        </>
      )}

      {/* Full browsable feed with search — anchor for teaser scroll */}
      <div ref={feedRef} className="space-y-4 pt-2">
        <SectionDivider label="Browse & Search" meta="full message archive" />
        <AdvancedSearch />
        {data ? (
          <MessageFeed
            messages={messages}
            highlight={q}
            title={hasFilters ? "Search results" : "Latest messages"}
            count={messages.length}
          />
        ) : error ? (
          <FetchError onRetry={retry} />
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[60px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]"
              />
            ))}
          </div>
        )}
      </div>

      {/* Status strip at bottom */}
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
          </span>
          <span className="font-sans text-[13px] font-medium text-white/80">
            Discord ingestion online
          </span>
          <span className="font-sans text-[12px] text-white/30">
            {data ? "updating every 30s" : "connecting..."}
          </span>
        </div>
      </div>
    </div>
  );
}
