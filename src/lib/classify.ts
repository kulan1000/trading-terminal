import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "@/lib/few-shot";
import { sanitizeResult } from "@/lib/classify-sanitize";
import type { ClassifyResult } from "@/lib/classify-sanitize";
import { cleanDiscordContent } from "@/lib/pre-filter";
import { CLASSIFIER_MODEL, CLASSIFIER_REASONING_EFFORT } from "@/lib/constants";
import { buildChatParams } from "@/lib/openai-params";
import { codexChatComplete } from "@/lib/codex-transport";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// CLASSIFY_TRANSPORT=codex routes classification through the ChatGPT
// subscription (Codex backend) instead of pay-per-token API billing.
// Set locally (worker/backfill); never set on Vercel.
const useCodexTransport = () => process.env.CLASSIFY_TRANSPORT === "codex";

// Strict structured-output schema — the model CANNOT return malformed JSON
// or out-of-enum values. Nullable fields use ["type","null"] per OpenAI spec.
const SIGNAL_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "commodity_signals",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["signals"],
      properties: {
        signals: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "has_signal", "asset", "direction", "signal_type",
              "position", "target_price", "strength", "confidence", "interpretation",
            ],
            properties: {
              has_signal: { type: "boolean" },
              asset: { type: ["string", "null"], enum: ["Gold", "Silver", "Oil", null] },
              direction: { type: ["string", "null"], enum: ["bullish", "bearish", "neutral", null] },
              signal_type: { type: ["string", "null"], enum: ["entry", "position", "exited", "opinion", "target", null] },
              position: { type: ["string", "null"], enum: ["long", "short", null] },
              target_price: { type: ["number", "null"] },
              strength: { type: ["string", "null"], enum: ["strong", "medium", "weak", null] },
              confidence: { type: ["number", "null"] },
              interpretation: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
} as const;

/** Retry wrapper for OpenAI rate limits (429): honors Retry-After when the
 *  API provides it, otherwise exponential backoff. Other errors propagate. */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const isRateLimit =
        status === 429 ||
        (err instanceof Error &&
          (err.message.includes("429") || err.message.includes("Rate limit")));
      if (!isRateLimit || attempt === maxRetries) throw err;

      const headers = (err as { headers?: Record<string, string> }).headers;
      const retryAfterS = Number(headers?.["retry-after"]);
      const delay = Number.isFinite(retryAfterS) && retryAfterS > 0
        ? Math.min(retryAfterS * 1000, 30_000)
        : Math.min(1000 * Math.pow(2, attempt), 8000);
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
  marketOpen?: boolean,
  model: string = CLASSIFIER_MODEL
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

  let text: string;
  let finishReason: string | undefined;

  if (useCodexTransport()) {
    const turns = [
      ...FEW_SHOT_EXAMPLES.map((m) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : "",
      })),
      { role: "user" as const, content: userContent },
    ];
    const result = await withRetry(() =>
      codexChatComplete({
        model,
        system: CLASSIFY_SYSTEM_PROMPT,
        turns,
        maxOutput: 4000,
        reasoningEffort: CLASSIFIER_REASONING_EFFORT as "low",
        jsonSchema: SIGNAL_SCHEMA.json_schema as unknown as {
          name: string;
          strict: boolean;
          schema: unknown;
        },
      })
    );
    text = result.content;
    finishReason = result.finishReason;
  } else {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      ...FEW_SHOT_EXAMPLES,
      { role: "user", content: userContent },
    ];

    // Model-aware params: gpt-5.x gets max_completion_tokens (must cover
    // reasoning tokens too) + reasoning_effort; gpt-4x gets legacy params.
    // 4000 gives generous headroom — a truncated response would otherwise
    // half-parse into silent signal loss.
    const params = {
      ...buildChatParams(model, {
        maxOutput: 4000,
        temperature: 0.1,
        reasoningEffort: CLASSIFIER_REASONING_EFFORT as "low",
        responseFormat: SIGNAL_SCHEMA,
      }),
      messages,
    } as unknown as OpenAI.ChatCompletionCreateParamsNonStreaming;

    const response = await withRetry(() => getOpenAI().chat.completions.create(params));
    const choice = response.choices[0];
    finishReason = choice?.finish_reason;
    text = choice?.message?.content ?? "";
  }

  if (finishReason === "length") {
    // Never trust half a JSON payload — fail loudly instead of emitting
    // whatever signals happened to fit before the cutoff.
    throw new Error(`classification truncated at max output tokens for: ${content.slice(0, 80)}`);
  }
  if (!text.trim()) {
    // An SSE stream that dies mid-flight yields empty content with a normal
    // finish — parsing "" would silently mark the message processed with no
    // signal. Throw retryably so the batch leaves it for the next run.
    throw new Error("classification returned empty response (stream cut) — network");
  }
  try {
    const raw = JSON.parse(text);
    const parsed = raw.signals ?? (Array.isArray(raw) ? raw : [raw]);
    const results: ClassifyResult[] = Array.isArray(parsed) ? parsed : [parsed];

    // Sanitize, then dedupe on asset+signal_type — the DB constraint is
    // (message_id, asset, signal_type), so a contradictory duplicate
    // (Gold-bullish-entry + Gold-bearish-entry) would silently last-write-win
    // on upsert. Sorting by confidence first means the strongest one wins.
    const seen = new Set<string>();
    return results
      .map(sanitizeResult)
      .filter((r): r is ClassifyResult => r != null)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .filter((r) => {
        const key = `${r.asset}-${r.signal_type}`;
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
