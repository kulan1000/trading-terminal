"use client";

import { useSearchParams } from "next/navigation";
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

  const q = searchParams.get("q") ?? undefined;
  const author = searchParams.get("author") ?? undefined;
  const channel = searchParams.get("channel") ?? undefined;
  const asset = searchParams.get("asset") ?? undefined;
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

  return (
    <div className="animate-fade-in space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-[18px] font-bold text-white">Discord Intel</h1>
          <span className="rounded-md bg-[#2962FF]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#2962FF]">LIVE</span>
        </div>
        <div className="flex items-center gap-1">
          <StatBadge label="Messages" value={stats.total} />
          <StatBadge label="Processed" value={stats.processed} color="#26A69A" />
          <StatBadge label="Signals" value={stats.signals} color="#2962FF" />
        </div>
      </div>

      {data?.briefing && <DailyBriefingPanel data={data.briefing} />}
      <AdvancedSearch />

      {data ? (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="px-5 pt-4 pb-2">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                {hasFilters ? `Sökresultat: ${filterParts.join(" + ")}` : "Raw Feed"}
              </h4>
              <span className="font-mono text-[10px] tabular-nums text-white/20">{messages.length} meddelanden</span>
            </div>
            <MessageList messages={messages} highlight={q} />
          </div>
        </div>
      ) : error ? (
        <FetchError onRetry={retry} />
      ) : (
        <div className="h-[300px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5">
      <span className="font-sans text-[9px] uppercase tracking-[0.06em] text-white/30">{label}</span>
      <span className="ml-1.5 font-mono text-[12px] font-bold tabular-nums" style={{ color: color ?? "white" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
