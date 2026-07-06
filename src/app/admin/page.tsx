"use client";

import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { LiveDot, Chip, SectionLabel } from "@/components/admin/primitives";
import { HealthStrip, HealthDrilldown } from "@/components/admin/health-strip";
import { ClassifierTuning } from "@/components/admin/classifier-tuning";
import { HistoryPanel } from "@/components/admin/history-panel";
import { AssetBreakdown } from "@/components/admin/asset-breakdown";
import { RecentClassifications } from "@/components/admin/recent-classifications";
import { PipelineLog } from "@/components/admin/pipeline-log";
import { DatabaseInfo } from "@/components/admin/database-info";
import { PipelineTrigger } from "@/components/admin/pipeline-trigger";
import { fmtAgoShort, fmtTimeFull } from "@/lib/format-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PipelineData {
  unprocessed: number;
  recentSignals: number;
  recentMessages: number;
  latestSignal: string | null;
  latestMessage: string | null;
  filterRatio: number;
  cascade: {
    messagesIn: number;
    preFilterPassed: number;
    classified: number;
    signalsExtracted: number;
  };
  assetBreakdown: Record<string, any>;
  recentClassifications: any[];
  totalMessages: number;
  totalSignals: number;
  pipelineRuns: any[];
  pipelineHistory: any[];
  signalHistory: any[];
  todayOpenAICalls: number;
  todayCostUsd: number;
  todayFilterCostUsd: number;
  todayClassifierCostUsd: number;
  tableCounts: Record<string, number>;
  checkedAt: string;
}

type TileId = "queue" | "signals" | "messages" | "latest" | "filter" | "cost";
type SectionId =
  | "tuning"
  | "history"
  | "assets"
  | "recent"
  | "log"
  | "db"
  | "trigger";

/* ────────────────────────── Section accordion primitive ────────────────────────── */
function Section({
  id,
  openId,
  setOpenId,
  title,
  summary,
  badge,
  children,
}: {
  id: SectionId;
  openId: SectionId | null;
  setOpenId: (id: SectionId | null) => void;
  title: string;
  summary: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="card-btn" data-open={open || undefined}>
      <button
        type="button"
        className="block w-full px-4 py-3 text-left"
        onClick={() => setOpenId(open ? null : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-white">{title}</span>
            {badge}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/50">{summary}</span>
            <span className="chev text-[11px] text-white/40">›</span>
          </div>
        </div>
      </button>
      {open && (
        <div
          className="animate-expand border-t"
          style={{ borderColor: "var(--color-tv-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Header strip ────────────────────────── */
function HeaderStrip({ data }: { data: PipelineData }) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[15px] font-semibold tracking-wide text-white">Pipeline</h1>
        <LiveDot />
        <span className="font-sans text-[11px] text-white/55">
          ingest every 5m · classification on local worker
        </span>
      </div>
      <span className="hidden font-sans text-[12px] text-white/40 md:block">
        updated{" "}
        <span className="tick text-white/70">
          {data.latestMessage ? fmtAgoShort(data.latestMessage) : "—"}
        </span>{" "}
        ago
      </span>
    </div>
  );
}

/* ────────────────────────── Page ────────────────────────── */
export default function AdminPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState(false);
  const [healthOpen, setHealthOpen] = useState<TileId | null>(null);
  // All sections start collapsed — the health strip is the at-a-glance view,
  // detail opens on demand (same compact-first philosophy as /market).
  const [sectionOpen, setSectionOpen] = useState<SectionId | null>(null);

  const fetchStatus = useCallback(() => {
    // `?demo=1` renders the page with a stubbed dataset so the redesign can be
    // previewed end-to-end without a Supabase connection. Harmless in prod.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1") {
      setData(buildDemoData());
      setError(false);
      return;
    }
    fetch("/api/pipeline-status")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  if (error)
    return (
      <div className="py-10">
        <FetchError onRetry={fetchStatus} />
      </div>
    );

  if (!data) {
    return (
      <div className="animate-fade-in space-y-5">
        <div className="flex items-baseline justify-between">
          <div className="h-5 w-24 animate-skeleton" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[80px] animate-skeleton rounded-xl"
            />
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[48px] animate-skeleton rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  const errorRuns = data.pipelineRuns.filter((r: any) => r.status !== "success").length;
  const flaggedCount = data.recentClassifications.filter(
    (c: any) => (c.confidence ?? 0) < 0.5 || (c.signal_type === "opinion" && (c.confidence ?? 0) > 0.7),
  ).length;
  const assetTotal = Object.values(data.assetBreakdown).reduce(
    (s: number, a: any) => s + (a?.total ?? 0),
    0,
  );

  return (
    <div className="animate-fade-in mx-auto max-w-[1400px] space-y-5">
      <HeaderStrip data={data} />

      <HealthStrip data={data} openId={healthOpen} onSelect={setHealthOpen} />
      <HealthDrilldown data={data} openId={healthOpen} onClose={() => setHealthOpen(null)} />

      <SectionLabel>Detail</SectionLabel>

      <Section
        id="tuning"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Models"
        summary="3 stages · gpt-5.5 classifier · eval n=16"
      >
        <ClassifierTuning />
      </Section>

      <Section
        id="history"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="History"
        summary="7d · signals, success, accuracy"
      >
        <HistoryPanel
          pipelineHistory={data.pipelineHistory}
          signalHistory={data.signalHistory}
        />
      </Section>

      <Section
        id="assets"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Asset breakdown"
        summary={`24h · ${assetTotal} signals`}
      >
        <AssetBreakdown data={data.assetBreakdown} />
      </Section>

      <Section
        id="recent"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Recent classifications"
        summary={`${data.recentClassifications.length} shown · ${flaggedCount} flagged`}
      >
        <RecentClassifications data={data.recentClassifications} />
      </Section>

      <Section
        id="log"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Pipeline log"
        badge={errorRuns > 0 ? <Chip tone="bear">{errorRuns} ERRORS</Chip> : null}
        summary={`${data.pipelineRuns.length} runs · last ${
          data.pipelineRuns[0]
            ? fmtAgoShort(data.pipelineRuns[0].finished_at ?? data.pipelineRuns[0].started_at)
            : "—"
        } ago`}
      >
        <PipelineLog runs={data.pipelineRuns} />
      </Section>

      <Section
        id="db"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Database"
        summary={`${Object.keys(data.tableCounts).length} tables · ${(
          data.totalMessages + data.totalSignals
        ).toLocaleString()} rows`}
      >
        <DatabaseInfo tableCounts={data.tableCounts} />
      </Section>

      <Section
        id="trigger"
        openId={sectionOpen}
        setOpenId={setSectionOpen}
        title="Manual trigger"
        summary="bypass schedule"
      >
        <PipelineTrigger onComplete={fetchStatus} lastRun={data.pipelineRuns[0] ?? null} />
      </Section>

      <div className="tick pb-8 pt-4 text-center text-[10px] text-white/30">
        pipeline-status · updated {fmtTimeFull(data.checkedAt)}
      </div>
    </div>
  );
}

/* ────────────────────────── Demo data for ?demo=1 preview ────────────────────────── */
function buildDemoData(): PipelineData {
  const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 3600_000).toISOString();
  const runs = Array.from({ length: 12 }, (_, i) => ({
    id: 1000 - i,
    started_at: minsAgo(i * 20 + 4),
    finished_at: minsAgo(i * 20 + 3),
    duration_ms: 12_000 + Math.round(Math.random() * 40_000),
    status: i === 3 || i === 9 ? "error" : "success",
    market_open: i % 6 !== 0,
    ingested: 8 + (i % 5),
    processed: 6 + (i % 4),
    signals: i === 3 || i === 9 ? 0 : (i % 6) + 1,
    skipped: i % 3,
    scored: 4 + (i % 3),
    openai_calls: i === 3 || i === 9 ? 0 : 20 + (i % 10),
    error_message:
      i === 3 || i === 9 ? "OpenAI 429 — rate limit exceeded on classify stage" : null,
  }));
  const signalHistory: Array<{ asset: string; direction: string; created_at: string }> = [];
  for (let d = 0; d < 7; d++) {
    const count = [42, 51, 18, 22, 68, 34, 58][d];
    for (let k = 0; k < count; k++) {
      const asset = k % 3 === 0 ? "Silver" : k % 2 === 0 ? "Oil" : "Gold";
      const direction = k % 3 === 0 ? "bearish" : k % 5 === 0 ? "neutral" : "bullish";
      signalHistory.push({ asset, direction, created_at: daysAgo(d) });
    }
  }
  return {
    unprocessed: 7,
    recentSignals: 14,
    recentMessages: 312,
    latestSignal: minsAgo(4),
    latestMessage: minsAgo(0.5),
    filterRatio: 0.209,
    cascade: { messagesIn: 14820, preFilterPassed: 3104, classified: 3104, signalsExtracted: 312 },
    assetBreakdown: {
      Gold: {
        total: 148,
        bullish: 92,
        bearish: 56,
        entries: 44,
        exits: 31,
        confBuckets: [2, 5, 9, 18, 24, 31, 28, 19, 9, 3],
      },
      Silver: {
        total: 73,
        bullish: 31,
        bearish: 42,
        entries: 19,
        exits: 14,
        confBuckets: [3, 6, 11, 12, 13, 10, 8, 6, 3, 1],
      },
      Oil: {
        total: 91,
        bullish: 58,
        bearish: 33,
        entries: 28,
        exits: 19,
        confBuckets: [1, 2, 6, 10, 16, 22, 18, 10, 4, 2],
      },
    },
    recentClassifications: [
      { asset: "Gold", direction: "bullish", signal_type: "entry", confidence: 0.87, author: "maverick_77", interpretation: "Loading up on XAU here, 2645 target.", created_at: minsAgo(4) },
      { asset: "Oil", direction: "bearish", signal_type: "entry", confidence: 0.71, author: "crude_trader", interpretation: "Short CL at 68.20, stop at 68.95.", created_at: minsAgo(12) },
      { asset: "Gold", direction: "bullish", signal_type: "exited", confidence: 0.42, author: "liquidus", interpretation: "booked mine", created_at: minsAgo(18) },
      { asset: "Silver", direction: "neutral", signal_type: "opinion", confidence: 0.78, author: "ag_bull", interpretation: "Silver coiling, could go either way next week.", created_at: minsAgo(24) },
      { asset: "Gold", direction: "bearish", signal_type: "entry", confidence: 0.91, author: "maverick_77", interpretation: "Reversing. Short XAU 2680.", created_at: minsAgo(31) },
      { asset: "Oil", direction: "bullish", signal_type: "position", confidence: 0.55, author: "nightowl", interpretation: "Still holding my crude longs from last week.", created_at: minsAgo(44) },
      { asset: "Silver", direction: "bearish", signal_type: "exited", confidence: 0.83, author: "ag_bull", interpretation: "out of SLV", created_at: minsAgo(58) },
      { asset: "Gold", direction: "bullish", signal_type: "target", confidence: 0.70, author: "chartist", interpretation: "XAU target raised to 2720 on daily close above 2665.", created_at: minsAgo(72) },
    ],
    totalMessages: 482_193,
    totalSignals: 18_427,
    pipelineRuns: runs,
    pipelineHistory: runs,
    signalHistory,
    todayOpenAICalls: 1247,
    todayCostUsd: 0.1913,
    todayFilterCostUsd: 0.0042,
    todayClassifierCostUsd: 0.1871,
    tableCounts: {
      discord_messages: 482_193,
      signals: 18_427,
      bias_snapshots: 4_210,
      sentiment_snapshots: 2_185,
      price_snapshots: 104_820,
      pipeline_runs: 3_284,
    },
    checkedAt: new Date().toISOString(),
  };
}
