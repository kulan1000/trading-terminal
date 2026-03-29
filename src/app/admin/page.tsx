"use client";

import { useEffect, useState, useCallback } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { StatusCard } from "@/components/admin/status-cards";
import { CostCard } from "@/components/admin/cost-card";
import { BiasHistoryChart } from "@/components/admin/bias-history-chart";
import { AssetBreakdown } from "@/components/admin/asset-breakdown";
import { RecentClassifications } from "@/components/admin/recent-classifications";
import { PipelineLog } from "@/components/admin/pipeline-log";
import { PipelineTrigger } from "@/components/admin/pipeline-trigger";
import { SystemHealth } from "@/components/admin/system-health";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PipelineData {
  unprocessed: number;
  recentSignals: number;
  recentMessages: number;
  latestSignal: string | null;
  latestMessage: string | null;
  biasHistory: any[];
  assetBreakdown: Record<string, any>;
  recentClassifications: any[];
  totalMessages: number;
  totalSignals: number;
  pipelineRuns: any[];
  todayOpenAICalls: number;
  todayCostUsd: number;
  checkedAt: string;
}

function fmtAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m sedan`;
}

export default function AdminPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch("/api/pipeline-status")
      .then((r) => r.json())
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  if (error) return <div className="py-10"><FetchError onRetry={fetchStatus} /></div>;

  const signalAge = data?.latestSignal
    ? Date.now() - new Date(data.latestSignal).getTime()
    : Infinity;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Pipeline Admin
        </h1>
        <div className="flex items-center gap-3">
          {data && (
            <span className="font-mono text-[10px] text-white/20">
              {data.totalMessages.toLocaleString()} meddelanden · {data.totalSignals.toLocaleString()} signaler
            </span>
          )}
          <span className="font-mono text-[11px] text-white/25">Auto-refresh 15s</span>
        </div>
      </div>

      {/* Pipeline down warning */}
      {data && signalAge > 30 * 60_000 && (
        <div className="flex items-center gap-3 rounded-xl border border-[#EF5350]/30 bg-[#EF5350]/5 px-5 py-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#EF5350]" />
          <div>
            <p className="font-sans text-[13px] font-medium text-[#EF5350]">
              Pipeline har inte producerat signaler på {fmtAgo(data.latestSignal)}
            </p>
            <p className="mt-0.5 font-sans text-[11px] text-[#EF5350]/60">
              Kontrollera cron-jobb, OpenAI API-nyckel och Discord-token
            </p>
          </div>
        </div>
      )}

      {/* Status cards + cost */}
      {!data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[110px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatusCard
            label="Obehandlade"
            value={data.unprocessed}
            color={data.unprocessed > 20 ? "red" : data.unprocessed > 5 ? "orange" : "green"}
            sub="Discord-meddelanden i kö"
          />
          <StatusCard
            label="Signaler (1h)"
            value={data.recentSignals}
            color={data.recentSignals > 0 ? "green" : "muted"}
            sub="Klassificerade senaste timmen"
          />
          <StatusCard
            label="Meddelanden (1h)"
            value={data.recentMessages}
            color={data.recentMessages > 0 ? "green" : "muted"}
            sub="Nya från Discord"
          />
          <StatusCard
            label="Senaste signal"
            value={fmtAgo(data.latestSignal)}
            color={
              !data.latestSignal ? "muted"
                : signalAge < 15 * 60_000 ? "green"
                  : signalAge < 60 * 60_000 ? "orange"
                    : "red"
            }
            sub={data.latestSignal ? new Date(data.latestSignal).toLocaleString("sv-SE") : "Ingen data"}
          />
          <CostCard todayOpenAICalls={data.todayOpenAICalls} todayCostUsd={data.todayCostUsd} />
        </div>
      )}

      {/* System health + bias chart */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SystemHealth
            runs={data.pipelineRuns}
            latestSignal={data.latestSignal}
            latestMessage={data.latestMessage}
          />
          <div className="lg:col-span-2">
            <BiasHistoryChart data={data.biasHistory} />
          </div>
        </div>
      )}

      {/* Asset breakdown + recent classifications */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AssetBreakdown data={data.assetBreakdown} />
          <RecentClassifications data={data.recentClassifications} />
        </div>
      )}

      {/* Pipeline log */}
      {data && <PipelineLog runs={data.pipelineRuns} />}

      {/* Manual trigger */}
      <PipelineTrigger onComplete={fetchStatus} />
    </div>
  );
}
