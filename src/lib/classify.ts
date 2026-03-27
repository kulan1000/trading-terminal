import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { Asset, Direction } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a trading signal classifier for commodities (Gold, Silver, Oil).
Analyze the Discord message and extract trading signals.

Respond ONLY with valid JSON:
{
  "has_signal": boolean,
  "asset": "Gold" | "Silver" | "Oil" | null,
  "direction": "bullish" | "bearish" | "neutral" | null,
  "confidence": number (0.0 to 1.0) | null
}

Rules:
- has_signal=true only if the message expresses a clear directional opinion
- Questions, jokes, or general chat → has_signal=false
- "long", "buy", "calls", "breaking out", "support holding" → bullish
- "short", "sell", "puts", "breaking down", "resistance" → bearish
- confidence reflects how strong/specific the signal is (price targets = high)`;

interface ClassifyResult {
  has_signal: boolean;
  asset: Asset | null;
  direction: Direction | null;
  confidence: number | null;
}

export async function classifyMessage(content: string): Promise<ClassifyResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    temperature: 0.1,
    max_tokens: 100,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    return JSON.parse(text) as ClassifyResult;
  } catch {
    return { has_signal: false, asset: null, direction: null, confidence: null };
  }
}

export async function processUnclassified(limit = 20) {
  // Fetch unprocessed messages
  const { data: messages } = await supabase
    .from("discord_messages")
    .select("id, content")
    .eq("processed", false)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (!messages?.length) return { processed: 0, signals: 0 };

  let signalCount = 0;

  for (const msg of messages) {
    const result = await classifyMessage(msg.content);

    if (result.has_signal && result.asset && result.direction && result.confidence) {
      await supabase.from("signals").insert({
        message_id: msg.id,
        asset: result.asset,
        direction: result.direction,
        confidence: result.confidence,
        model_used: "gpt-4o-mini",
      });
      signalCount++;
    }

    // Mark as processed regardless
    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  return { processed: messages.length, signals: signalCount };
}
