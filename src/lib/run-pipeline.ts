// Single source of truth for the classification pipeline.
// Both /api/ingest (manual trigger) and /api/cron/classify (scheduled) call this,
// so every run — manual or cron — ends up in pipeline_runs and shows in admin UI.

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ingestDiscord } from "@/lib/ingest-discord";
import { processUnclassified } from "@/lib/classify-batch";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { pairTrades } from "@/lib/trade-pairing";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";
import { generateDailySummary } from "@/lib/daily-summary";
import { isMarketOpen } from "@/lib/market-hours";

export interface PipelineResult {
  runId: number | null;
  marketOpen: boolean;
  /** Set when the run was skipped because another run is in progress */
  skipped?: string;
  ingest: { ingested: number };
  classify: {
    processed: number;
    signals: number;
    skipped?: number;

    openai_calls?: number;
  };
  prices: { saved?: number; skipped?: string };
  scoring: { scored?: number; skipped?: string };
  pairing: { paired?: number; skipped?: string };
  sentiment: unknown;
  bias: unknown;
  dailySummary: number;
}

/**
 * Run the full pipeline and log to `pipeline_runs`.
 * `trigger` is accepted for future use; not persisted until the schema has a column for it.
 */
export async function runPipeline(_trigger: "manual" | "cron"): Promise<PipelineResult> {
  const supabase = getSupabaseAdmin();
  const marketOpen = isMarketOpen();
  const startedAt = new Date();

  // Self-heal zombie rows: a run hard-killed at the serverless deadline
  // never reaches its catch/update, leaving status='running' forever.
  await supabase
    .from("pipeline_runs")
    .update({ status: "error", error_message: "timed out (marked by next run)", finished_at: startedAt.toISOString() })
    .eq("status", "running")
    .lt("started_at", new Date(startedAt.getTime() - 15 * 60_000).toISOString());

  // Best-effort run lock: overlapping runs (cron + manual trigger) would
  // write duplicate sentiment/bias snapshot rows for the same minute.
  const { data: liveRun } = await supabase
    .from("pipeline_runs")
    .select("id")
    .eq("status", "running")
    .gte("started_at", new Date(startedAt.getTime() - 15 * 60_000).toISOString())
    .limit(1);
  if (liveRun?.length) {
    return {
      runId: null,
      marketOpen,
      skipped: `run ${(liveRun[0] as { id: number }).id} already in progress`,
      ingest: { ingested: 0 },
      classify: { processed: 0, signals: 0, skipped: 0, openai_calls: 0 },
      prices: { skipped: "run in progress" },
      scoring: { skipped: "run in progress" },
      pairing: { skipped: "run in progress" },
      sentiment: null,
      bias: null,
      dailySummary: 0,
    };
  }

  const { data: runRow } = await supabase
    .from("pipeline_runs")
    .insert({
      started_at: startedAt.toISOString(),
      status: "running",
      market_open: marketOpen,
    })
    .select("id")
    .single();
  const runId = (runRow as { id: number } | null)?.id ?? null;

  try {
    const ingest = await ingestDiscord();
    // Classification is owned by the local classify-worker (ChatGPT
    // subscription transport, LaunchAgent com.trading-terminal.classifier) —
    // the serverless pipeline must NOT double-process the queue on
    // pay-per-token API billing. Emergency serverless fallback: set
    // CLASSIFY_IN_PIPELINE=1 on Vercel.
    const classify =
      process.env.CLASSIFY_IN_PIPELINE === "1"
        ? await processUnclassified()
        : { processed: 0, signals: 0, skipped: 0, openai_calls: 0 };

    const prices = marketOpen
      ? await savePriceSnapshots()
      : { saved: 0, skipped: "market closed" };

    const scoring = await scoreSignals();
    const pairing = await pairTrades();
    const sentiment = await saveSentimentSnapshots();
    const bias = await saveBiasSnapshots();
    const dailySummary = await generateDailySummary();

    if (runId) {
      await supabase
        .from("pipeline_runs")
        .update({
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - startedAt.getTime(),
          status: "success",
          ingested: ingest.ingested,
          processed: classify.processed ?? 0,
          signals: classify.signals ?? 0,
          skipped: classify.skipped ?? 0,
          scored: typeof scoring === "object" ? scoring.scored ?? 0 : 0,
          openai_calls: classify.openai_calls ?? 0,
        })
        .eq("id", runId);
    }

    return {
      runId,
      marketOpen,
      ingest,
      classify,
      prices,
      scoring,
      pairing,
      sentiment,
      bias,
      dailySummary: dailySummary.length,
    };
  } catch (err) {
    if (runId) {
      await supabase
        .from("pipeline_runs")
        .update({
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - startedAt.getTime(),
          status: "error",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", runId);
    }
    console.error("[PIPELINE] Error:", err);
    throw err;
  }
}
