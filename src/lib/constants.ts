import type { Asset } from "@/lib/types";

export const ASSETS: readonly Asset[] = ["Gold", "Silver", "Oil"];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

// Yahoo Finance ticker symbols for price fetching
export const YAHOO_SYMBOLS: Record<Asset, string> = {
  Gold: "GC=F",
  Silver: "SI=F",
  Oil: "CL=F",
};

// Polling & cache intervals (ms)
export const MARKET_POLL_MS = 15_000;
export const SNAPSHOT_MATCH_WINDOW_MS = 1_200_000; // 20 min — max distance from target for price match

// Asset tag colors for signal feed & message list
export const ASSET_TAG_COLORS: Record<string, string> = {
  Gold: "bg-[#FFEB3B]/15 text-[#FFEB3B]",
  Silver: "bg-white/[0.08] text-white/70",
  Oil: "bg-[#FF9800]/15 text-[#FF9800]",
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
