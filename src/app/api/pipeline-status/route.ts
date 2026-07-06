import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CLASSIFIER_COST_PER_CALL } from "@/lib/constants";

export const revalidate = 15;

async function safeCount(promise: PromiseLike<number>): Promise<number> {
  try { return await promise; } catch { return 0; }
}

async function safeString(promise: PromiseLike<string | null>): Promise<string | null> {
  try { return await promise; } catch { return null; }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function safeRows<T>(promise: PromiseLike<T[]>): Promise<T[]> {
  try { return await promise; } catch { return []; }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();

  const [
    unprocessed, recentSignals, recentMessages,
    latestSignal, latestMessage,
    biasHistory, signalsByAsset, recentClassifications,
    totalMessages, totalSignals,
  ] = await Promise.all([
    // --- existing ---
    safeCount(
      supabase.from("discord_messages")
        .select("id", { count: "exact", head: true })
        .eq("processed", false)
        .then((r) => r.count ?? 0)
    ),
    safeCount(
      supabase.from("signals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(now - 60 * 60_000).toISOString())
        .then((r) => r.count ?? 0)
    ),
    safeCount(
      supabase.from("discord_messages")
        .select("id", { count: "exact", head: true })
        .gte("timestamp", new Date(now - 60 * 60_000).toISOString())
        .then((r) => r.count ?? 0)
    ),
    safeString(
      supabase.from("signals")
        .select("created_at")
        .order("created_at", { ascending: false }).limit(1)
        .then((r) => (r.data?.[0] as any)?.created_at ?? null)
    ),
    safeString(
      supabase.from("discord_messages")
        .select("timestamp")
        .order("timestamp", { ascending: false }).limit(1)
        .then((r) => (r.data?.[0] as any)?.timestamp ?? null)
    ),

    // --- NEW: bias history (24h, one row per snapshot) ---
    // Desc + reverse: ascending with the implicit 1000-row cap would drop the
    // NEWEST snapshots first once cadence/assets grow past ~330 runs/day.
    safeRows(
      supabase.from("bias_snapshots")
        .select("asset, direction, score, created_at")
        .gte("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1000)
        .then((r) => ((r.data ?? []) as any[]).reverse())
    ),

    // --- signals by asset last 7d (used for 24h breakdown + 7d history chart) ---
    safeRows(
      supabase.from("signals")
        .select("asset, direction, signal_type, confidence, created_at")
        .gte("created_at", new Date(now - 7 * 24 * 60 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(2000)
        .then((r) => (r.data ?? []) as any[])
    ),

    // --- NEW: last 15 classifications ---
    safeRows(
      supabase.from("signals")
        .select("asset, direction, signal_type, confidence, author, interpretation, created_at")
        .order("created_at", { ascending: false })
        .limit(15)
        .then((r) => (r.data ?? []) as any[])
    ),

    // --- total counts ---
    safeCount(
      supabase.from("discord_messages")
        .select("id", { count: "exact", head: true })
        .then((r) => r.count ?? 0)
    ),
    safeCount(
      supabase.from("signals")
        .select("id", { count: "exact", head: true })
        .then((r) => r.count ?? 0)
    ),
  ]);

  // Table row counts for database overview
  const [totalBiasSnapshots, totalPipelineRuns, totalSentimentSnapshots, totalPriceSnapshots] = await Promise.all([
    safeCount(supabase.from("bias_snapshots").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0)),
    safeCount(supabase.from("pipeline_runs").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0)),
    safeCount(supabase.from("sentiment_snapshots").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0)),
    safeCount(supabase.from("price_snapshots").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0)),
  ]);
  const tableCounts = {
    discord_messages: totalMessages,
    signals: totalSignals,
    bias_snapshots: totalBiasSnapshots,
    pipeline_runs: totalPipelineRuns,
    sentiment_snapshots: totalSentimentSnapshots,
    price_snapshots: totalPriceSnapshots,
  };

  // Pipeline run log (last 20 runs) + 7-day history for chart
  const [pipelineRuns, pipelineHistory] = await Promise.all([
    safeRows(
      supabase.from("pipeline_runs")
        .select("id, started_at, finished_at, duration_ms, status, market_open, ingested, processed, signals, skipped, scored, openai_calls, error_message")
        .order("started_at", { ascending: false })
        .limit(20)
        .then((r) => (r.data ?? []) as any[])
    ),
    safeRows(
      supabase.from("pipeline_runs")
        .select("started_at, status, duration_ms, signals")
        .gte("started_at", new Date(now - 7 * 24 * 60 * 60_000).toISOString())
        .order("started_at", { ascending: true })
        .limit(700)
        .then((r) => (r.data ?? []) as any[])
    ),
  ]);

  // Aggregate signals by asset (24h only for breakdown panel). Also bucket
  // confidence into 10 slots (0.0-0.1 .. 0.9-1.0) for the per-asset histogram.
  const cutoff24h = new Date(now - 24 * 60 * 60_000).toISOString();
  const assetBreakdown: Record<
    string,
    {
      total: number;
      bullish: number;
      bearish: number;
      entries: number;
      exits: number;
      confBuckets: number[];
    }
  > = {};
  for (const s of signalsByAsset) {
    if (s.created_at < cutoff24h) continue;
    if (!assetBreakdown[s.asset]) {
      assetBreakdown[s.asset] = {
        total: 0,
        bullish: 0,
        bearish: 0,
        entries: 0,
        exits: 0,
        confBuckets: Array(10).fill(0),
      };
    }
    const a = assetBreakdown[s.asset];
    a.total++;
    if (s.direction === "bullish") a.bullish++;
    if (s.direction === "bearish") a.bearish++;
    if (s.signal_type === "entry") a.entries++;
    if (s.signal_type === "exited") a.exits++;
    const conf = typeof s.confidence === "number" ? s.confidence : 0;
    const bucket = Math.min(9, Math.max(0, Math.floor(conf * 10)));
    a.confBuckets[bucket]++;
  }

  // Signal history for 7d chart (minimal: date, asset, direction)
  const signalHistory = signalsByAsset.map((s: any) => ({
    asset: s.asset,
    direction: s.direction,
    created_at: s.created_at,
  }));

  // Estimate OpenAI cost from pipeline runs using the shared constant
  // (so classify.ts and pipeline-status can never drift apart).
  const todayRuns = pipelineRuns.filter((r: any) => {
    const d = new Date(r.started_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayOpenAICalls = todayRuns.reduce((sum: number, r: any) => sum + (r.openai_calls ?? 0), 0);
  const todayCostUsd = Math.round(todayOpenAICalls * CLASSIFIER_COST_PER_CALL * 10000) / 10000;

  // Pre-filter + classification cascade over last 24h, derived from pipeline_runs.
  // `processed` counts messages seen; `openai_calls` counts the ones that
  // survived the local regex pre-filter and reached the classifier model.
  // `signals` counts the ones that produced structured output.
  const cutoff24hMs = now - 24 * 60 * 60_000;
  const runs24h = pipelineRuns.filter((r: any) => {
    const t = r.started_at ? new Date(r.started_at).getTime() : 0;
    return t >= cutoff24hMs;
  });
  const processed24h = runs24h.reduce((s: number, r: any) => s + (r.processed ?? 0), 0);
  const openai24h = runs24h.reduce((s: number, r: any) => s + (r.openai_calls ?? 0), 0);
  const signals24h = runs24h.reduce((s: number, r: any) => s + (r.signals ?? 0), 0);
  const ingested24h = runs24h.reduce((s: number, r: any) => s + (r.ingested ?? 0), 0);
  const cascade = {
    messagesIn: processed24h || ingested24h,
    preFilterPassed: openai24h,
    classified: openai24h,
    signalsExtracted: signals24h,
  };
  const filterRatio = processed24h > 0 ? openai24h / processed24h : 0;

  // Cost split — today the regex pre-filter is free and all spend is classifier.
  // Kept as two fields so the UI can show the split once a paid filter model ships.
  const todayFilterCostUsd = 0;
  const todayClassifierCostUsd = todayCostUsd;

  return NextResponse.json({
    unprocessed, recentSignals, recentMessages,
    latestSignal, latestMessage,
    biasHistory, assetBreakdown, recentClassifications,
    totalMessages, totalSignals,
    pipelineRuns,
    pipelineHistory,
    signalHistory,
    todayOpenAICalls,
    todayCostUsd,
    todayFilterCostUsd,
    todayClassifierCostUsd,
    cascade,
    filterRatio,
    tableCounts,
    checkedAt: new Date().toISOString(),
  });
}
