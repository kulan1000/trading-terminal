import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "@/lib/few-shot";
import { sanitizeResult } from "@/lib/classify-sanitize";
import type { ClassifyResult } from "@/lib/classify-sanitize";
import { cleanDiscordContent } from "@/lib/pre-filter";
import { CLASSIFIER_MODEL } from "@/lib/constants";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Retry wrapper with exponential backoff for OpenAI rate limits (429) */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes("429") || err.message.includes("Rate limit"));
      if (!isRateLimit || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.warn(`[classify] 429 rate limit — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
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

  const response = await withRetry(() =>
    getOpenAI().chat.completions.create({
      model: CLASSIFIER_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 900,
      response_format: { type: "json_object" },
    })
  );

  const choice = response.choices[0];
  if (choice?.finish_reason === "length") {
    console.warn("[classify] Response truncated (hit max_tokens). Message:", content.slice(0, 80));
  }
  const text = choice?.message?.content ?? "";
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
  } catch (err) {
    console.error("[classify] JSON parse error:", err, "Raw response:", text.slice(0, 200));
    return [];
  }
}

// Batch processing → lib/classify-batch.ts
