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
// gpt-4o-mini: $0.15/M input + $0.60/M output. At ~1.5k input + ~300 output
// tokens per call that's ~$0.0004/call on average.
export const CLASSIFIER_MODEL = "gpt-4o-mini";
export const CLASSIFIER_COST_PER_CALL = 0.0004;
