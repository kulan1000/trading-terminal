import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { Asset, Direction } from "@/lib/types";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";

type Strength = "strong" | "medium" | "weak";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface ClassifyResult {
  has_signal: boolean;
  asset: Asset | null;
  direction: Direction | null;
  strength: Strength | null;
  confidence: number | null;
  position: "long" | "short" | null;
  interpretation: string | null;
}

const VALID_ASSETS = new Set(["Gold", "Silver", "Oil"]);
const VALID_DIRECTIONS = new Set(["bullish", "bearish", "neutral"]);
const VALID_STRENGTHS = new Set(["strong", "medium", "weak"]);

function deriveStrength(confidence: number): Strength {
  if (confidence >= 0.7) return "strong";
  if (confidence >= 0.4) return "medium";
  return "weak";
}

function sanitizeResult(r: ClassifyResult): ClassifyResult | null {
  if (!r.has_signal) return null;
  if (!r.asset || !VALID_ASSETS.has(r.asset)) return null;

  // Default direction to neutral if missing
  if (!r.direction || !VALID_DIRECTIONS.has(r.direction)) {
    r.direction = "neutral";
  }

  // Ensure confidence is valid
  r.confidence = typeof r.confidence === "number" ? Math.max(0.1, Math.min(1.0, r.confidence)) : 0.2;

  // Derive or validate strength
  if (!r.strength || !VALID_STRENGTHS.has(r.strength)) {
    r.strength = deriveStrength(r.confidence);
  }

  // Validate position
  if (r.position && r.position !== "long" && r.position !== "short") {
    r.position = null;
  }
  r.position = r.position ?? null;
  r.interpretation = r.interpretation ?? null;

  return r;
}

export async function classifyMessage(
  content: string,
  channel?: string
): Promise<ClassifyResult[]> {
  const userContent = channel
    ? `[Channel: #${channel}]\n${content}`
    : content;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.15,
    max_tokens: 500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(text);
    const results: ClassifyResult[] = Array.isArray(parsed) ? parsed : [parsed];

    // Sanitize, deduplicate by asset+direction
    const seen = new Set<string>();
    return results
      .map(sanitizeResult)
      .filter((r): r is ClassifyResult => {
        if (!r) return false;
        const key = `${r.asset}-${r.direction}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
}

export async function processUnclassified(limit = 50) {
  const supabase = getSupabase();

  const { data: messages } = await supabase
    .from("discord_messages")
    .select("id, content, channel")
    .eq("processed", false)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (!messages?.length) return { processed: 0, signals: 0 };

  let signalCount = 0;

  for (const msg of messages) {
    const results = await classifyMessage(msg.content, msg.channel);

    for (const result of results) {
      if (result.asset && result.direction && result.confidence) {
        // No minimum threshold — store ALL signals, even weak ones
        await supabase.from("signals").upsert(
          {
            message_id: msg.id,
            asset: result.asset,
            direction: result.direction,
            confidence: result.confidence,
            strength: result.strength ?? deriveStrength(result.confidence),
            position: result.position,
            interpretation: result.interpretation,
            model_used: "gpt-4o-mini",
          },
          { onConflict: "message_id,asset,direction" }
        );
        signalCount++;
      }
    }

    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  return { processed: messages.length, signals: signalCount };
}
