import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
    safeRows(
      supabase.from("bias_snapshots")
        .select("asset, direction, score, created_at")
        .gte("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
        .order("created_at", { ascending: true })
        .then((r) => (r.data ?? []) as any[])
    ),

    // --- NEW: signals by asset last 24h ---
    safeRows(
      supabase.from("signals")
        .select("asset, direction, signal_type, confidence, created_at")
        .gte("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(500)
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

  // Aggregate signals by asset
  const assetBreakdown: Record<string, { total: number; bullish: number; bearish: number; entries: number; exits: number }> = {};
  for (const s of signalsByAsset) {
    if (!assetBreakdown[s.asset]) {
      assetBreakdown[s.asset] = { total: 0, bullish: 0, bearish: 0, entries: 0, exits: 0 };
    }
    const a = assetBreakdown[s.asset];
    a.total++;
    if (s.direction === "bullish") a.bullish++;
    if (s.direction === "bearish") a.bearish++;
    if (s.signal_type === "entry") a.entries++;
    if (s.signal_type === "exited") a.exits++;
  }

  // Estimate OpenAI cost from pipeline runs (gpt-4o-mini: ~$0.00015 per call)
  const COST_PER_CALL = 0.00015;
  const todayRuns = pipelineRuns.filter((r: any) => {
    const d = new Date(r.started_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayOpenAICalls = todayRuns.reduce((sum: number, r: any) => sum + (r.openai_calls ?? 0), 0);
  const todayCostUsd = Math.round(todayOpenAICalls * COST_PER_CALL * 10000) / 10000;

  return NextResponse.json({
    unprocessed, recentSignals, recentMessages,
    latestSignal, latestMessage,
    biasHistory, assetBreakdown, recentClassifications,
    totalMessages, totalSignals,
    pipelineRuns,
    pipelineHistory,
    todayOpenAICalls,
    todayCostUsd,
    tableCounts,
    checkedAt: new Date().toISOString(),
  });
}
