import type { Asset, Direction, Strength, SignalType } from "@/lib/types";
import { isKnownAsset } from "@/lib/instruments";

export interface ClassifyResult {
  has_signal: boolean;
  asset: Asset | null;
  direction: Direction | null;
  strength: Strength | null;
  confidence: number | null;
  signal_type: SignalType | null;
  position: "long" | "short" | null;
  interpretation: string | null;
  target_price: number | null;
}

const VALID_DIRECTIONS = new Set(["bullish", "bearish", "neutral"]);
const VALID_STRENGTHS = new Set(["strong", "medium", "weak"]);
const VALID_SIGNAL_TYPES = new Set(["entry", "position", "exited", "opinion", "target"]);

export function deriveStrength(confidence: number): Strength {
  if (confidence >= 0.7) return "strong";
  if (confidence >= 0.4) return "medium";
  return "weak";
}

export function sanitizeResult(r: ClassifyResult): ClassifyResult | null {
  if (!r.has_signal) return null;
  if (!r.asset || !isKnownAsset(r.asset)) return null;

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

  // Enforce direction consistency for entries and positions:
  // long must be bullish, short must be bearish.
  // BUT for exits, direction reflects OUTLOOK, not the position held.
  // E.g. "exited my gold long, think it's going down" = position: long, direction: bearish — valid!
  if (r.signal_type !== "exited") {
    if (r.position === "long" && r.direction !== "bullish") {
      r.direction = "bullish";
    }
    if (r.position === "short" && r.direction !== "bearish") {
      r.direction = "bearish";
    }
  }

  r.interpretation = r.interpretation ?? null;

  // Validate target_price
  r.target_price = typeof r.target_price === "number" && r.target_price > 0
    ? r.target_price
    : null;

  // Target signals should have a target_price and position null
  if (r.signal_type === "target") {
    r.position = null;
  }

  return r;
}
