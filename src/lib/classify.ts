import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "@/lib/few-shot";
import { sanitizeResult, deriveStrength } from "@/lib/classify-sanitize";
import type { ClassifyResult } from "@/lib/classify-sanitize";
import { cleanDiscordContent, maybeCommodityRelevant } from "@/lib/pre-filter";
import { getTraderHint, refreshTraderProfile } from "@/lib/trader-profiles";

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
  channel?: string,
  contextMessages?: string[]
): Promise<ClassifyResult[]> {
  const cleaned = cleanDiscordContent(content);

  // Build user message with optional conversation context
  let userContent = "";
  if (contextMessages?.length) {
    userContent += "RECENT CONTEXT (previous messages in channel):\n";
    userContent += contextMessages.map((m) => `- ${cleanDiscordContent(m)}`).join("\n");
    userContent += "\n\nMESSAGE TO CLASSIFY:\n";
  }
  if (channel) userContent += `[Channel: #${channel}]\n`;
  userContent += cleaned;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
    ...FEW_SHOT_EXAMPLES,
    { role: "user", content: userContent },
  ];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.1,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const raw = JSON.parse(text);
    // JSON mode returns an object — extract signals array
    const parsed = raw.signals ?? (Array.isArray(raw) ? raw : [raw]);
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
    .select("id, content, channel, timestamp, author")
    .eq("processed", false)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (!messages?.length) return { processed: 0, signals: 0 };
  let signalCount = 0;
  let skipped = 0;

  for (const msg of messages) {
    // STEP 1: Fast local pre-filter
    if (!maybeCommodityRelevant(msg.content, msg.channel)) {
      await supabase
        .from("discord_messages")
        .update({ processed: true })
        .eq("id", msg.id);
      skipped++;
      continue;
    }

    // STEP 2: Fetch context + trader profile + GPT classification
    let contextMessages: string[] = [];
    if (msg.channel && msg.timestamp) {
      const { data: ctx } = await supabase
        .from("discord_messages")
        .select("author, content")
        .eq("channel", msg.channel)
        .lt("timestamp", msg.timestamp)
        .order("timestamp", { ascending: false })
        .limit(3);
      if (ctx?.length) {
        contextMessages = ctx
          .reverse()
          .map((c: { author: string; content: string }) => `${c.author}: ${c.content}`);
      }
    }

    const traderHint = await getTraderHint(supabase, msg.author);
    if (traderHint) {
      contextMessages = [traderHint, ...contextMessages];
    }

    const results = await classifyMessage(msg.content, msg.channel, contextMessages);
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

    if (signalCount > 0 && msg.author) {
      await refreshTraderProfile(supabase, msg.author);
    }

    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  return { processed: messages.length, signals: signalCount, skipped };
}
