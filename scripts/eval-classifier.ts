// Classifier eval harness — compares models on real FoftyTrades messages.
// Usage: npx tsx scripts/eval-classifier.ts [--limit 20]
// Reads env from .env.production.local / .env.local. Prints NO secrets.
//
// Eval set = flagged hard cases (classification_reviews) + recent live messages.
// For each message, every model classifies with the SAME prompt/few-shots/context
// as production. Output: side-by-side JSON for human/agent judging.

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { CLASSIFY_SYSTEM_PROMPT } from "../src/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "../src/lib/few-shot";
import { sanitizeResult, type ClassifyResult } from "../src/lib/classify-sanitize";
import { cleanDiscordContent } from "../src/lib/pre-filter";
import { isMarketOpen } from "../src/lib/market-hours";

// ── env ──────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
function loadEnv(file: string) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(line)) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.production.local");
loadEnv(".env.local");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── model configs ────────────────────────────────────────────────
interface ModelConfig {
  label: string;
  model: string;
  legacyParams: boolean; // temperature + max_tokens (gpt-4o family)
  reasoningEffort?: "none" | "low" | "medium" | "high";
}

const CONFIGS: ModelConfig[] = [
  { label: "gpt-4o-mini (current)", model: "gpt-4o-mini", legacyParams: true },
  { label: "gpt-5.5 effort=none", model: "gpt-5.5", legacyParams: false, reasoningEffort: "none" },
  { label: "gpt-5.5 effort=low", model: "gpt-5.5", legacyParams: false, reasoningEffort: "low" },
  { label: "gpt-5.6-sol effort=none", model: "gpt-5.6-sol", legacyParams: false, reasoningEffort: "none" },
  { label: "gpt-5.6-sol effort=low", model: "gpt-5.6-sol", legacyParams: false, reasoningEffort: "low" },
];

// ── classification (mirrors src/lib/classify.ts exactly) ────────
async function classifyWith(
  cfg: ModelConfig,
  content: string,
  channel: string | null,
  contextMessages: string[],
  marketOpen: boolean
): Promise<{ results: ClassifyResult[]; ms: number; tokens: number }> {
  const cleaned = cleanDiscordContent(content);
  let userContent = `MARKET: ${marketOpen ? "OPEN" : "CLOSED"}\n`;
  if (contextMessages.length) {
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

  const params: Record<string, unknown> = {
    model: cfg.model,
    messages,
    response_format: { type: "json_object" },
  };
  if (cfg.legacyParams) {
    params.temperature = 0.1;
    params.max_tokens = 900;
  } else {
    params.max_completion_tokens = 2500;
    if (cfg.reasoningEffort) params.reasoning_effort = cfg.reasoningEffort;
  }

  const t0 = Date.now();
  const response = await openai.chat.completions.create(
    params as unknown as OpenAI.ChatCompletionCreateParamsNonStreaming
  );
  const ms = Date.now() - t0;
  const tokens = response.usage?.total_tokens ?? 0;

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const raw = JSON.parse(text);
    const parsed = raw.signals ?? (Array.isArray(raw) ? raw : [raw]);
    const arr: ClassifyResult[] = Array.isArray(parsed) ? parsed : [parsed];
    const seen = new Set<string>();
    const results = arr.map(sanitizeResult).filter((r): r is ClassifyResult => {
      if (!r) return false;
      const key = `${r.asset}-${r.direction}-${r.signal_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { results, ms, tokens };
  } catch {
    return { results: [], ms, tokens };
  }
}

function fmt(results: ClassifyResult[]): string {
  if (!results.length) return "(no signal)";
  return results
    .map((r) => `${r.asset} ${r.direction} ${r.signal_type}${r.position ? "/" + r.position : ""} c=${r.confidence}${r.target_price ? " tgt=" + r.target_price : ""}`)
    .join(" | ");
}

// ── eval set ─────────────────────────────────────────────────────
interface EvalCase {
  source: string;
  message: string;
  channel: string | null;
  author: string | null;
  context: string[];
  marketOpen: boolean;
  originalVerdict?: string; // what prod (4o-mini) said at the time
}

async function buildEvalSet(limit: number): Promise<EvalCase[]> {
  const cases: EvalCase[] = [];

  // 1) Flagged hard cases — where asset was inferred, not explicit
  const { data: reviews } = await supabase
    .from("classification_reviews")
    .select("original_message, context_messages, channel, author, gpt_asset, gpt_direction, gpt_signal_type, gpt_confidence, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.ceil(limit * 0.6));

  for (const r of reviews ?? []) {
    cases.push({
      source: "flagged-hard",
      message: r.original_message,
      channel: r.channel,
      author: r.author,
      context: (r.context_messages ?? []) as string[],
      marketOpen: isMarketOpen(new Date(r.created_at)),
      originalVerdict: `${r.gpt_asset} ${r.gpt_direction} ${r.gpt_signal_type} c=${r.gpt_confidence}`,
    });
  }

  // 2) Recent live messages that produced signals (with their channel context)
  const { data: recent } = await supabase
    .from("signals")
    .select("asset, direction, signal_type, position, confidence, created_at, discord_messages!inner(id, content, channel, author, timestamp)")
    .order("created_at", { ascending: false })
    .limit(Math.floor(limit * 0.4));

  for (const s of recent ?? []) {
    const m = s.discord_messages as unknown as { id: number; content: string; channel: string; author: string; timestamp: string };
    // Rebuild channel context like prod does
    const { data: ctx } = await supabase
      .from("discord_messages")
      .select("author, content")
      .eq("channel", m.channel)
      .lt("timestamp", m.timestamp)
      .order("timestamp", { ascending: false })
      .limit(10);
    cases.push({
      source: "recent-live",
      message: m.content,
      channel: m.channel,
      author: m.author,
      context: (ctx ?? []).reverse().map((c) => `${c.author}: ${c.content}`),
      marketOpen: isMarketOpen(new Date(m.timestamp)),
      originalVerdict: `${s.asset} ${s.direction} ${s.signal_type}${s.position ? "/" + s.position : ""} c=${s.confidence}`,
    });
  }

  // Dedupe by message text
  const seen = new Set<string>();
  return cases.filter((c) => {
    const k = c.message.slice(0, 80);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── run ──────────────────────────────────────────────────────────
async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 20;

  console.log(`Building eval set (target ${limit} cases)...`);
  const cases = await buildEvalSet(limit);
  console.log(`Eval set: ${cases.length} cases (${cases.filter((c) => c.source === "flagged-hard").length} flagged-hard, ${cases.filter((c) => c.source === "recent-live").length} recent-live)\n`);

  const rows = await pool(cases, 4, async (c) => {
    const perModel: Record<string, { verdict: string; ms: number; tokens: number }> = {};
    for (const cfg of CONFIGS) {
      try {
        const { results, ms, tokens } = await classifyWith(cfg, c.message, c.channel, c.context, c.marketOpen);
        perModel[cfg.label] = { verdict: fmt(results), ms, tokens };
      } catch (err) {
        perModel[cfg.label] = { verdict: `ERROR: ${err instanceof Error ? err.message.slice(0, 80) : "?"}`, ms: 0, tokens: 0 };
      }
    }
    return { ...c, perModel };
  });

  // Report
  const report = rows.map((r, i) => ({
    n: i + 1,
    source: r.source,
    channel: r.channel,
    author: r.author,
    marketOpen: r.marketOpen,
    message: r.message.slice(0, 200),
    prodVerdictAtTime: r.originalVerdict ?? null,
    ...Object.fromEntries(Object.entries(r.perModel).map(([k, v]) => [k, v.verdict])),
  }));

  const stats = CONFIGS.map((cfg) => {
    const ms = rows.map((r) => r.perModel[cfg.label]?.ms ?? 0).filter(Boolean);
    const tok = rows.map((r) => r.perModel[cfg.label]?.tokens ?? 0).filter(Boolean);
    return {
      model: cfg.label,
      avgMs: Math.round(ms.reduce((a, b) => a + b, 0) / Math.max(ms.length, 1)),
      avgTokens: Math.round(tok.reduce((a, b) => a + b, 0) / Math.max(tok.length, 1)),
      errors: rows.filter((r) => r.perModel[cfg.label]?.verdict.startsWith("ERROR")).length,
    };
  });

  const outPath = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : path.join(ROOT, "scripts", "eval-result.json");
  fs.writeFileSync(outPath, JSON.stringify({ stats, report }, null, 2));
  console.log("STATS:", JSON.stringify(stats, null, 2));
  console.log(`\nFull comparison written to ${outPath}`);
}

main().catch((e) => {
  console.error("EVAL FAILED:", e.message);
  process.exit(1);
});
