import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { Asset, Direction } from "@/lib/types";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";

// Lazy init — avoid crashing at build time when env vars are missing
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
  confidence: number | null;
  reasoning: string | null;
}

export async function classifyMessage(
  content: string
): Promise<ClassifyResult[]> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      { role: "user", content },
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(text);
    const results: ClassifyResult[] = Array.isArray(parsed)
      ? parsed
      : [parsed];
    // Deduplicate by asset+direction (GPT sometimes returns duplicates)
    const seen = new Set<string>();
    return results.filter((r) => {
      const key = `${r.asset}-${r.direction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [
      {
        has_signal: false,
        asset: null,
        direction: null,
        confidence: null,
        reasoning: "parse_error",
      },
    ];
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
    const results = await classifyMessage(msg.content);

    for (const result of results) {
      if (
        result.has_signal &&
        result.asset &&
        result.direction &&
        result.confidence &&
        result.confidence >= 0.25
      ) {
        await supabase.from("signals").upsert(
          {
            message_id: msg.id,
            asset: result.asset,
            direction: result.direction,
            confidence: result.confidence,
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
