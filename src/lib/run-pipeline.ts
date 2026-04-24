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
  ingest: { ingested: number };
  classify: {
    processed: number;
    signals: number;
    skipped?: number;
    flagged?: number;
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
    const classify = await processUnclassified();

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
