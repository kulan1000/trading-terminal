import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { FEW_SHOT_EXAMPLES } from "@/lib/few-shot";
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

/** Strip Discord custom emojis, role mentions, channel mentions */
function cleanDiscordContent(text: string): string {
  return text
    .replace(/<a?:\w+:\d+>/g, "")          // custom emojis <:name:id> / <a:name:id>
    .replace(/<@!?\d+>/g, "@user")          // user mentions <@123> / <@!123>
    .replace(/<@&\d+>/g, "@role")           // role mentions <@&123>
    .replace(/<#\d+>/g, "#channel")         // channel mentions <#123>
    .replace(/https?:\/\/\S+/g, "[link]")   // URLs (rarely useful for classification)
    .replace(/\s{2,}/g, " ")               // collapse whitespace
    .trim();
}

// ──────────────────────────────────────────────────────
// STEP 1: Fast local pre-filter (zero API cost)
// Skips messages that have no possible commodity relevance
// ──────────────────────────────────────────────────────
const COMMODITY_KEYWORDS = new RegExp(
  [
    // Gold
    "gold", "xau", "xauusd", "\\bgc\\b", "gld", "gdx", "gdxj", "\\bau\\b",
    "guld", "yellow metal", "miner", "precious metal",
    // Silver
    "silver", "xag", "xagusd", "\\bsi\\b", "slv", "\\bag\\b",
    // Oil
    "\\boil\\b", "crude", "wti", "brent", "\\bcl\\b", "uso", "uco", "sco",
    "olja", "energy", "petroleum", "opec", "ukoil",
    // General
    "commodit", "metal", "long", "short", "bull", "bear",
    "bought", "sold", "buying", "selling", "position", "trade",
    "entry", "exit", "profit", "loss", "stop", "target",
    "calls", "puts", "option",
  ].join("|"),
  "i"
);

const COMMODITY_CHANNELS = new Set([
  "gold-commodities",
  "traders-lounge",
]);

/** Returns true if message MIGHT contain a commodity signal (fast, cheap) */
function maybeCommodityRelevant(content: string, channel?: string): boolean {
  // Always process messages from commodity-focused channels
  if (channel && COMMODITY_CHANNELS.has(channel)) return true;
  // Check for keyword match
  return COMMODITY_KEYWORDS.test(content);
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

/** Build a one-line trader profile hint for GPT */
async function getTraderHint(
  supabase: ReturnType<typeof getSupabase>,
  author: string
): Promise<string | null> {
  const { data } = await supabase
    .from("trader_profiles")
    .select("primary_asset, primary_direction, assets_traded, total_signals")
    .eq("author", author)
    .single();
  if (!data || data.total_signals < 3) return null;
  return `[Trader profile: ${author} primarily trades ${data.assets_traded?.join("/")} with ${data.primary_direction} bias on ${data.primary_asset}, ${data.total_signals} signals total]`;
}

/** Refresh a single trader's profile after new signals */
async function refreshTraderProfile(
  supabase: ReturnType<typeof getSupabase>,
  author: string
) {
  await supabase.rpc("refresh_trader_profile", { p_author: author }).catch(() => {
    // RPC doesn't exist yet — silently skip
  });
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
    // STEP 1: Fast local pre-filter — skip obviously irrelevant messages
    if (!maybeCommodityRelevant(msg.content, msg.channel)) {
      await supabase
        .from("discord_messages")
        .update({ processed: true })
        .eq("id", msg.id);
      skipped++;
      continue;
    }

    // STEP 2: Fetch context + trader profile + full GPT classification
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

    // Add trader profile hint as first context line
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

    // Refresh trader profile if we found signals
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
