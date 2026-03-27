import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { sanitizeResult, deriveStrength } from "@/lib/classify-sanitize";
import type { ClassifyResult } from "@/lib/classify-sanitize";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    max_tokens: 600,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(text);
    const results: ClassifyResult[] = Array.isArray(parsed) ? parsed : [parsed];

    // Sanitize, deduplicate by asset+direction+signal_type
    const seen = new Set<string>();
    return results
      .map(sanitizeResult)
      .filter((r): r is ClassifyResult => {
        if (!r) return false;
        const key = `${r.asset}-${r.direction}-${r.signal_type}`;
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
        await supabase.from("signals").upsert(
          {
            message_id: msg.id,
            asset: result.asset,
            direction: result.direction,
            confidence: result.confidence,
            strength: result.strength ?? deriveStrength(result.confidence),
            signal_type: result.signal_type ?? "opinion",
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
