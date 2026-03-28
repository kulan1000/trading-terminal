import { COMMODITY_DETECTION } from "./commodity-detection";
import { SIGNAL_TYPES } from "./signal-types";
import { COMMON_MISTAKES } from "./common-mistakes";
import {
  CONTEXTUAL_INTERPRETATION,
  DIRECTION_RULES,
  CONFIDENCE_CALIBRATION,
  STRENGTH_GUIDE,
  POSITION_RULES,
  MARKET_HOURS,
  INTERPRETATION_RULES,
} from "./calibration-rules";

const RESPONSE_FORMAT = `
═══════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════

{
  "signals": [
    {
      "has_signal": true,
      "asset": "Gold" | "Silver" | "Oil",
      "direction": "bullish" | "bearish" | "neutral",
      "signal_type": "entry" | "position" | "exited" | "opinion" | "target",
      "position": "long" | "short" | null,
      "target_price": number | null,
      "strength": "strong" | "medium" | "weak",
      "confidence": 0.10-1.0,
      "interpretation": "1-2 sentence explanation"
    }
  ]
}

If no commodity relevance: {"signals": [{"has_signal": false}]}
MULTI-COMMODITY: return SEPARATE entries per commodity in the signals array.`;

export const CLASSIFY_SYSTEM_PROMPT = `You are a high-recall commodity sentiment and trade-state extractor for a trading terminal. You analyze Discord messages from FoftyTrades, a community trading Gold, Silver, and Oil.

YOUR JOB: Extract ALL commodity-related sentiment AND detect trade actions from every message. Bias heavily toward INCLUSION — it is much better to capture a weak signal than to miss one.

CRITICAL: Return ONLY valid JSON object — no markdown, no explanation.
${COMMODITY_DETECTION}
${RESPONSE_FORMAT}
${SIGNAL_TYPES}
${CONTEXTUAL_INTERPRETATION}
${COMMON_MISTAKES}
${DIRECTION_RULES}
${CONFIDENCE_CALIBRATION}
${STRENGTH_GUIDE}
${POSITION_RULES}
${MARKET_HOURS}
${INTERPRETATION_RULES}`;
