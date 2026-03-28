// Short-term sentiment engine: weighted, time-decayed bias per asset
// Uses existing classified signals — no reprocessing

import type { Asset, Direction } from "@/lib/types";

// --- CONFIGURATION ---

/** Signal type weights: actions > holdings > opinions */
const TYPE_WEIGHT: Record<string, number> = {
  entry: 5.0,
  exited: 4.0,
  position: 2.5,
  opinion: 1.0,
};

/** Strength multipliers */
const STRENGTH_MULT: Record<string, number> = {
  strong: 1.5,
  medium: 1.0,
  weak: 0.5,
};

/** Exponential decay: half-life ~35 min (decay=0.02) */
const DECAY_RATE = 0.02;

/** Time windows in minutes */
export const WINDOWS = {
  hot: 20,       // recent acceleration
  primary: 60,   // main bias window
  extended: 120,  // trend context
} as const;

// --- TYPES ---

export interface RawSignal {
  id: number;
  asset: Asset;
  direction: Direction;
  signal_type: string;
  position: string | null;
  strength: string;
  confidence: number;
  author: string;
  created_at: string;
}

export interface AssetSentiment {
  asset: Asset;
  bias: Direction;
  confidence: number;        // 0-10
  bullPressure: number;
  bearPressure: number;
  netScore: number;
  signalCount: number;
  // Microstructure
  entries: number;
  exits: number;
  holdings: number;
  opinions: number;
  longCount: number;
  shortCount: number;
  uniqueTraders: number;
  // Acceleration
  hotSignals: number;        // signals in last 20 min
  coldSignals: number;       // signals in 20-60 min range
  acceleration: number;      // hot vs cold ratio (>1 = accelerating)
  // Per-window scores
  hotBias: Direction;
  hotConfidence: number;
}

// --- CORE LOGIC ---

/** Determine directional force of a signal */
function signalForce(signal: RawSignal): "bull" | "bear" | "neutral" {
  const { signal_type, position, direction } = signal;

  // Entries/holdings: direction matches position
  if (signal_type === "entry" || signal_type === "position") {
    if (position === "long") return "bull";
    if (position === "short") return "bear";
    return direction === "bullish" ? "bull" : direction === "bearish" ? "bear" : "neutral";
  }

  // Exits: OPPOSITE pressure (exit long = selling = bearish force)
  if (signal_type === "exited") {
    if (position === "long") return "bear";
    if (position === "short") return "bull";
    return "neutral";
  }

  // Opinions: follow direction
  if (direction === "bullish") return "bull";
  if (direction === "bearish") return "bear";
  return "neutral";
}

/** Calculate weighted score for a single signal */
function weightedScore(signal: RawSignal, nowMs: number): number {
  const typeW = TYPE_WEIGHT[signal.signal_type] ?? 1.0;
  const strengthW = STRENGTH_MULT[signal.strength] ?? 1.0;
  const ageMinutes = (nowMs - new Date(signal.created_at).getTime()) / 60_000;
  const decay = Math.exp(-DECAY_RATE * Math.max(0, ageMinutes));

  return typeW * strengthW * signal.confidence * decay;
}

/** Calculate sentiment for one asset from a set of signals */
function calcAssetSentiment(asset: Asset, signals: RawSignal[], nowMs: number): AssetSentiment {
  let bullPressure = 0;
  let bearPressure = 0;
  let entries = 0, exits = 0, holdings = 0, opinions = 0;
  let longCount = 0, shortCount = 0;
  let hotSignals = 0, coldSignals = 0;
  let hotBull = 0, hotBear = 0;
  const traders = new Set<string>();

  const hotCutoff = nowMs - WINDOWS.hot * 60_000;

  for (const s of signals) {
    const score = weightedScore(s, nowMs);
    const force = signalForce(s);
    const signalMs = new Date(s.created_at).getTime();
    const isHot = signalMs >= hotCutoff;

    // Accumulate pressure
    if (force === "bull") {
      bullPressure += score;
      if (isHot) hotBull += score;
    } else if (force === "bear") {
      bearPressure += score;
      if (isHot) hotBear += score;
    }

    // Microstructure counts
    if (s.signal_type === "entry") entries++;
    else if (s.signal_type === "exited") exits++;
    else if (s.signal_type === "position") holdings++;
    else opinions++;

    if (s.position === "long") longCount++;
    else if (s.position === "short") shortCount++;

    if (isHot) hotSignals++;
    else coldSignals++;

    traders.add(s.author);
  }

  // Net score and bias
  const netScore = bullPressure - bearPressure;
  const totalPressure = bullPressure + bearPressure;

  // Confidence: 0-10 scale, based on how one-sided + signal volume
  const directionality = totalPressure > 0 ? Math.abs(netScore) / totalPressure : 0;
  const volumeFactor = Math.min(signals.length / 5, 1); // max confidence needs 5+ signals
  const confidence = Math.round(directionality * volumeFactor * 100) / 10;

  const bias: Direction = netScore > 0.5 ? "bullish" : netScore < -0.5 ? "bearish" : "neutral";

  // Hot window bias
  const hotNet = hotBull - hotBear;
  const hotTotal = hotBull + hotBear;
  const hotDir = hotTotal > 0 ? Math.abs(hotNet) / hotTotal : 0;
  const hotBias: Direction = hotNet > 0.3 ? "bullish" : hotNet < -0.3 ? "bearish" : "neutral";
  const hotConfidence = Math.round(hotDir * Math.min(hotSignals / 3, 1) * 100) / 10;

  // Acceleration: normalize to per-minute rate
  const hotRate = hotSignals / WINDOWS.hot;
  const coldRate = coldSignals / (WINDOWS.primary - WINDOWS.hot);
  const acceleration = coldRate > 0 ? Math.round((hotRate / coldRate) * 100) / 100 : hotSignals > 0 ? 2.0 : 0;

  return {
    asset, bias, confidence: Math.min(confidence, 10),
    bullPressure: Math.round(bullPressure * 10) / 10,
    bearPressure: Math.round(bearPressure * 10) / 10,
    netScore: Math.round(netScore * 10) / 10,
    signalCount: signals.length,
    entries, exits, holdings, opinions,
    longCount, shortCount,
    uniqueTraders: traders.size,
    hotSignals, coldSignals,
    acceleration,
    hotBias, hotConfidence: Math.min(hotConfidence, 10),
  };
}

/** Calculate sentiment for all assets */
export function calcSentiment(
  allSignals: RawSignal[],
  assets: readonly Asset[],
  windowMinutes: number = WINDOWS.primary
): AssetSentiment[] {
  const nowMs = Date.now();
  const cutoff = nowMs - windowMinutes * 60_000;

  // Filter to window
  const windowSignals = allSignals.filter(
    (s) => new Date(s.created_at).getTime() >= cutoff
  );

  return assets.map((asset) => {
    const assetSignals = windowSignals.filter((s) => s.asset === asset);
    return calcAssetSentiment(asset, assetSignals, nowMs);
  });
}
