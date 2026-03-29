// Classification review queue — flags uncertain asset detections for human review
// and injects learned feedback into future GPT calls

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { ClassifyResult } from "@/lib/classify-sanitize";

// ── Asset source detection ──────────────────────────────────────────
// Determines HOW GPT figured out the commodity — explicit mention vs inference

const GOLD_EXPLICIT = /\b(gold|xau|xauusd|gld|gdx|gdxj|nugt|dust|barrick|newmont)\b/i;
const SILVER_EXPLICIT = /\b(silver|xag|xagusd|slv|first\s*majestic|paas)\b/i;
const OIL_EXPLICIT = /\b(oil|crude|wti|brent|uso|uco|sco|petroleum|opec)\b/i;

const ASSET_PATTERNS: Record<string, RegExp> = {
  Gold: GOLD_EXPLICIT,
  Silver: SILVER_EXPLICIT,
  Oil: OIL_EXPLICIT,
};

export type AssetSource = "explicit" | "context" | "profile" | "channel" | "unknown";

/** Check if the original message explicitly mentions the classified asset */
export function detectAssetSource(
  message: string,
  asset: string,
  channel?: string,
  contextMessages?: string[],
): AssetSource {
  // 1. Check if asset is explicitly named in the message
  const pattern = ASSET_PATTERNS[asset];
  if (pattern && pattern.test(message)) return "explicit";

  // 2. Check if asset appears in recent context messages
  if (contextMessages?.length) {
    const contextText = contextMessages.join(" ");
    if (pattern && pattern.test(contextText)) return "context";
  }

  // 3. Channel-based inference
  if (channel === "gold-commodities") return "channel";

  // 4. If none of the above, GPT inferred from trader profile or guessed
  return "unknown";
}

// ── Flag uncertain classifications for review ───────────────────────

interface FlagInput {
  signalId: number;
  messageId: number;
  result: ClassifyResult;
  originalMessage: string;
  contextMessages: string[];
  channel?: string;
  author?: string;
  assetSource: AssetSource;
}

export async function flagForReview(input: FlagInput) {
  const supabase = getSupabaseAdmin();

  // Build flag reason
  let reason = "";
  if (input.assetSource === "unknown") {
    reason = `Asset "${input.result.asset}" not mentioned in message or context — GPT guessed from trader profile or channel`;
  } else if (input.assetSource === "channel") {
    reason = `Asset "${input.result.asset}" inferred only from channel name (#${input.channel}) — no explicit mention`;
  } else if (input.assetSource === "context") {
    reason = `Asset "${input.result.asset}" found in context but not in the message itself`;
  }

  // Only flag entry/exited signals with non-explicit asset (opinions are low-stakes)
  const isHighStakes = input.result.signal_type === "entry" || input.result.signal_type === "exited";
  if (!isHighStakes && input.assetSource !== "unknown") return;

  await supabase.from("classification_reviews").insert({
    signal_id: input.signalId,
    message_id: input.messageId,
    gpt_asset: input.result.asset,
    gpt_direction: input.result.direction,
    gpt_signal_type: input.result.signal_type ?? "opinion",
    gpt_confidence: input.result.confidence,
    gpt_interpretation: input.result.interpretation,
    asset_source: input.assetSource,
    flag_reason: reason,
    original_message: input.originalMessage,
    context_messages: input.contextMessages.slice(0, 8),
    channel: input.channel,
    author: input.author,
  });
}

// ── Load learned feedback for GPT prompt injection ──────────────────

export async function getLearnedFeedback(): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("classification_feedback")
    .select("category, rule_text")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data?.length) return null;

  const rules = (data as Array<{ category: string; rule_text: string }>)
    .map((r) => `- ${r.rule_text}`)
    .join("\n");

  return `\n═══════════════════════════════════════
LEARNED CORRECTIONS (from human review)
═══════════════════════════════════════
These rules come from verified human feedback on past classifications. Follow them strictly:
${rules}`;
}
