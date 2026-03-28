import type { Asset, Direction, Strength, SignalType } from "@/lib/types";

export interface ClassifyResult {
  has_signal: boolean;
  asset: Asset | null;
  direction: Direction | null;
  strength: Strength | null;
  confidence: number | null;
  signal_type: SignalType | null;
  position: "long" | "short" | null;
  interpretation: string | null;
}

const VALID_ASSETS = new Set(["Gold", "Silver", "Oil"]);
const VALID_DIRECTIONS = new Set(["bullish", "bearish", "neutral"]);
const VALID_STRENGTHS = new Set(["strong", "medium", "weak"]);
const VALID_SIGNAL_TYPES = new Set(["entry", "position", "exited", "opinion"]);

export function deriveStrength(confidence: number): Strength {
  if (confidence >= 0.7) return "strong";
  if (confidence >= 0.4) return "medium";
  return "weak";
}

export function sanitizeResult(r: ClassifyResult): ClassifyResult | null {
  if (!r.has_signal) return null;
  if (!r.asset || !VALID_ASSETS.has(r.asset)) return null;

  if (!r.direction || !VALID_DIRECTIONS.has(r.direction)) {
    r.direction = "neutral";
  }

  r.confidence = typeof r.confidence === "number"
    ? Math.max(0.1, Math.min(1.0, r.confidence))
    : 0.2;

  if (!r.strength || !VALID_STRENGTHS.has(r.strength)) {
    r.strength = deriveStrength(r.confidence);
  }

  if (!r.signal_type || !VALID_SIGNAL_TYPES.has(r.signal_type)) {
    r.signal_type = "opinion";
  }

  if (r.position && r.position !== "long" && r.position !== "short") {
    r.position = null;
  }

  // Enforce position rules based on signal_type
  if ((r.signal_type === "entry" || r.signal_type === "position") && !r.position) {
    r.position = r.direction === "bearish" ? "short" : "long";
  }
  if (r.signal_type === "opinion") {
    r.position = null;
  }

  // Enforce direction consistency: long must be bullish, short must be bearish
  if (r.position === "long" && r.direction !== "bullish") {
    r.direction = "bullish";
  }
  if (r.position === "short" && r.direction !== "bearish") {
    r.direction = "bearish";
  }

  r.interpretation = r.interpretation ?? null;

  return r;
}
