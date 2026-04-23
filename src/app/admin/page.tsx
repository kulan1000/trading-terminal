"use client";

import { useEffect, useState, useCallback } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { StatusCard } from "@/components/admin/status-cards";
import { CostCard } from "@/components/admin/cost-card";

import { AssetBreakdown } from "@/components/admin/asset-breakdown";
import { RecentClassifications } from "@/components/admin/recent-classifications";
import { PipelineLog } from "@/components/admin/pipeline-log";
import { PipelineTrigger } from "@/components/admin/pipeline-trigger";
import { SystemHealth } from "@/components/admin/system-health";
import { DatabaseInfo } from "@/components/admin/database-info";
import { PipelineHistory } from "@/components/admin/pipeline-history";
import { SignalHistory } from "@/components/admin/signal-history";
import { fmtAgo } from "@/lib/format-utils";

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
  pipelineHistory: any[];
  signalHistory: any[];
  todayOpenAICalls: number;
  todayCostUsd: number;
  tableCounts: Record<string, number>;
  checkedAt: string;
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
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Pipeline Admin
          </h1>
          {data && (
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${signalAge < 2 * 60 * 60_000 ? "bg-[#26A69A] animate-pulse" : signalAge < 6 * 60 * 60_000 ? "bg-[#FF9800]" : "bg-[#EF5350] animate-pulse"}`} />
              <span className="font-sans text-[11px] text-white/30">
                {signalAge < 2 * 60 * 60_000 ? "Pipeline active" : signalAge < 6 * 60 * 60_000 ? "Slow" : "Down"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="font-mono text-[10px] tabular-nums text-white/20">
              {data.totalMessages.toLocaleString()} msg · {data.totalSignals.toLocaleString()} signals
            </span>
          )}
          {data?.checkedAt && (
            <span className="font-mono text-[10px] text-white/15">
              {new Date(data.checkedAt).toLocaleTimeString("en-US")}
            </span>
          )}
          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/25">
            Auto 15s
          </span>
        </div>
      </div>

      {/* Pipeline down warning — only show if no signals for 6h+ (people sleep/weekends) */}
      {data && signalAge > 6 * 60 * 60_000 && (
        <div className="animate-fade-in overflow-hidden rounded-xl border border-[#EF5350]/20 bg-[#EF5350]/[0.04]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#EF5350]/30 to-transparent" />
          <div className="flex items-center gap-3 px-5 py-3.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#EF5350]" />
            <div>
              <p className="font-sans text-[13px] font-medium text-[#EF5350]">
                Pipeline has not produced signals in {fmtAgo(data.latestSignal)}
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-[#EF5350]/50">
                Check cron jobs, OpenAI API key and Discord token
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status cards + cost */}
      {!data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatusCard
            label="Unprocessed"
            value={data.unprocessed}
            color={data.unprocessed > 20 ? "red" : data.unprocessed > 5 ? "orange" : "green"}
            sub="Discord messages in queue"
          />
          <StatusCard
            label="Signals (1h)"
            value={data.recentSignals}
            color={data.recentSignals > 0 ? "green" : "muted"}
            sub="Classified in the last hour"
          />
          <StatusCard
            label="Messages (1h)"
            value={data.recentMessages}
            color={data.recentMessages > 0 ? "green" : "muted"}
            sub="New from Discord"
          />
          <StatusCard
            label="Latest signal"
            value={fmtAgo(data.latestSignal)}
            color={
              !data.latestSignal ? "muted"
                : signalAge < 2 * 60 * 60_000 ? "green"
                  : signalAge < 6 * 60 * 60_000 ? "orange"
                    : "red"
            }
            sub={data.latestSignal ? new Date(data.latestSignal).toLocaleString("en-US") : "No data"}
          />
          <CostCard todayOpenAICalls={data.todayOpenAICalls} todayCostUsd={data.todayCostUsd} />
        </div>
      )}

      {/* System health */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <SystemHealth
              runs={data.pipelineRuns}
              latestSignal={data.latestSignal}
              latestMessage={data.latestMessage}
            />
          </div>
        </div>
      )}

      {/* History charts: pipeline + signals */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PipelineHistory runs={data.pipelineHistory} />
          <SignalHistory signals={data.signalHistory} />
        </div>
      )}

      {/* Asset breakdown + recent classifications */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AssetBreakdown data={data.assetBreakdown} />
          <RecentClassifications data={data.recentClassifications} />
        </div>
      )}

      {/* Pipeline log + database info */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PipelineLog runs={data.pipelineRuns} />
          </div>
          <DatabaseInfo tableCounts={data.tableCounts} />
        </div>
      )}

      {/* Manual trigger */}
      <PipelineTrigger onComplete={fetchStatus} />
    </div>
  );
}
