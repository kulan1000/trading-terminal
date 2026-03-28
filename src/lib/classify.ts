import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "@/lib/few-shot";
import { sanitizeResult } from "@/lib/classify-sanitize";
import type { ClassifyResult } from "@/lib/classify-sanitize";
import { cleanDiscordContent } from "@/lib/pre-filter";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function classifyMessage(
  content: string,
  channel?: string,
  contextMessages?: string[],
  marketOpen?: boolean
): Promise<ClassifyResult[]> {
  const cleaned = cleanDiscordContent(content);

  // Build user message with market status + optional conversation context
  let userContent = `MARKET: ${marketOpen === false ? "CLOSED" : "OPEN"}\n`;
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

// Batch processing → lib/classify-batch.ts
