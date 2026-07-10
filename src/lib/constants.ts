import type { Asset, CommodityAsset } from "@/lib/instruments";
import { INSTRUMENTS, COMMODITY_ASSETS } from "@/lib/instruments";

// Legacy commodity trio — the bias/sentiment/market surfaces still iterate
// this. The full universe lives in ALL_ASSETS (src/lib/instruments.ts).
export const ASSETS: readonly CommodityAsset[] = COMMODITY_ASSETS;

export const ASSET_PAIRS: Record<Asset, string> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.ticker, i.displayPair])
) as Record<Asset, string>;

// Yahoo Finance ticker symbols for price fetching
export const YAHOO_SYMBOLS: Record<Asset, string> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.ticker, i.yahooSymbol])
) as Record<Asset, string>;

// Polling & cache intervals (ms)
export const MARKET_POLL_MS = 15_000;
export const SNAPSHOT_MATCH_WINDOW_MS = 1_200_000; // 20 min — max distance from target for price match

// Asset tag colors for signal feed & message list — commodities keep their
// signature colors, everything else gets a class-based tint.
const CLASS_TAG_COLORS: Record<string, string> = {
  index_future: "bg-[#2962FF]/15 text-[#5B8DEF]",
  index: "bg-[#7C4DFF]/15 text-[#9E7DFF]",
  etf: "bg-[#26A69A]/15 text-[#4DB6AC]",
  equity: "bg-[#EC407A]/15 text-[#F06292]",
};

export const ASSET_TAG_COLORS: Record<string, string> = {
  Gold: "bg-[#FFEB3B]/15 text-[#FFEB3B]",
  Silver: "bg-white/[0.08] text-white/70",
  Oil: "bg-[#FF9800]/15 text-[#FF9800]",
  ...Object.fromEntries(
    INSTRUMENTS.filter((i) => i.assetClass !== "commodity").map((i) => [
      i.ticker,
      CLASS_TAG_COLORS[i.assetClass],
    ])
  ),
};

// Classifier model — change in one place, propagates to classify.ts + admin cost display.
// Primary transport is the ChatGPT subscription (CLASSIFY_TRANSPORT=codex via
// src/lib/codex-transport.ts) → marginal cost per call is ZERO.
// COST_PER_CALL below applies only to the emergency API fallback path
// (gpt-5.6-sol API: $5/M input, $0.50/M cached, $30/M output ≈ $0.02/call —
// same rates as gpt-5.5).
// Upgraded from gpt-4o-mini 2026-07-04 after A/B eval (scripts/eval-classifier.ts):
// zero asset hallucinations, correct inverse-ETF + macro-narrative reads.
// Switched gpt-5.5 → gpt-5.6-sol 2026-07-09 (GA day): identical subscription
// credit burn and API pricing, stronger agentic/extraction evals upstream.
// Eval numbers shown in the admin panel are from the 2026-07-04 gpt-5.5 run
// until a Sol re-eval lands (scripts/eval-classifier.ts).
export const CLASSIFIER_MODEL = "gpt-5.6-sol";
export const CLASSIFIER_REASONING_EFFORT = "low";
export const CLASSIFIER_COST_PER_CALL = 0.02;

// Cheap model for low-stakes AI summaries (bias-detail blurbs etc.) —
// no effect on signal quality, so no need for the flagship here.
export const SUMMARY_MODEL = "gpt-5-mini";
