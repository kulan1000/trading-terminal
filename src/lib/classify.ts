import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { Asset, Direction } from "@/lib/types";

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

const SYSTEM_PROMPT = `You are an expert commodities trading analyst classifying Discord messages from a trading community (FoftyTrades). Your job is to determine whether each message contains a directional opinion on Gold, Silver, or Oil.

CRITICAL RULES:
1. You must return ONLY valid JSON — no markdown, no explanation.
2. A message can contain signals for MULTIPLE assets. Return an array.
3. Be INCLUSIVE — if a message can reasonably be interpreted as even weakly bullish or bearish for any of these commodities, include it. It is better to capture a weak signal than to miss one.
4. But do NOT include messages that have absolutely nothing to do with Gold, Silver, or Oil (e.g. crypto talk, personal chat, off-topic jokes).

RESPONSE FORMAT (always an array):
[
  {
    "has_signal": true,
    "asset": "Gold" | "Silver" | "Oil",
    "direction": "bullish" | "bearish",
    "confidence": 0.0-1.0,
    "reasoning": "brief 5-10 word explanation"
  }
]

Return [{"has_signal": false, "asset": null, "direction": null, "confidence": null, "reasoning": "not relevant"}] if the message has nothing to do with Gold/Silver/Oil.

CLASSIFICATION GUIDE:

STRONG BULLISH signals (confidence 0.7-1.0):
- Explicit buy/long calls: "going long gold", "buying silver here", "oil calls loaded"
- Price targets above current: "gold to 5000", "silver 80 incoming"
- Technical breakout language: "gold breaking out of resistance", "silver cup and handle confirmed"
- Fundamental bullish: "inflation data hot, gold should fly", "OPEC cutting production"
- High conviction language: "loading up", "all in", "this is the move"

MODERATE BULLISH signals (confidence 0.4-0.7):
- Implied optimism: "gold looking strong", "silver setup looks clean", "oil holding support well"
- Question with bullish lean: "anyone else think gold is ready to rip?"
- Sharing bullish analysis/charts without explicit position
- Mentioning accumulation: "adding to my gold position"
- Weak technical: "gold at support", "silver bouncing"

WEAK BULLISH signals (confidence 0.15-0.4):
- Vague positive sentiment: "gold is interesting here", "watching silver closely for a move up"
- Reposting bullish news without commentary
- "not shorting gold here" (implies bullish by negation)
- Emojis suggesting up: rocket/moon emojis with gold/silver/oil mention

STRONG BEARISH signals (confidence 0.7-1.0):
- Explicit sell/short calls: "shorting gold", "puts on oil", "selling silver"
- Price targets below current: "gold back to 4000", "oil heading to 60"
- Technical breakdown: "gold lost support", "silver head and shoulders confirmed"
- Fundamental bearish: "strong dollar crushing gold", "demand destruction for oil"

MODERATE BEARISH signals (confidence 0.4-0.7):
- Implied pessimism: "gold looks heavy", "silver struggling here", "oil can't hold"
- Profit-taking mentions: "taking profits on gold longs" (implies reversal expectation)
- "I wouldn't be long here"
- Weak technical: "gold at resistance", "silver failing to break out"

WEAK BEARISH signals (confidence 0.15-0.4):
- Vague negative sentiment: "not sure about gold here", "oil looking tired"
- Cautionary statements: "be careful with silver longs"
- "reducing exposure to gold"

IMPORTANT ASSET RECOGNITION:
- Gold: gold, AU, XAU, XAUUSD, GC, GLD, yellow metal, guld
- Silver: silver, AG, XAG, XAGUSD, SI, SLV, white metal
- Oil: oil, crude, WTI, CL, brent, petroleum, USO, olja
- If someone says "metals" → applies to both Gold AND Silver
- If commodity context is unclear but message discusses "the market" in a channel called gold-commodities → try to infer from context

THINGS TO FILTER OUT (has_signal: false):
- Pure crypto discussion (BTC, ETH, etc.) with no commodity connection
- Personal chat, greetings, jokes unrelated to markets
- Bot commands, link-only messages with no context
- Messages purely about stocks/equities with no commodity angle
- "gm", "gn", "lol", memes without commodity context`;

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
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(text);
    // Handle both array and single object responses
    const results: ClassifyResult[] = Array.isArray(parsed)
      ? parsed
      : [parsed];
    return results;
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
        result.confidence >= 0.15
      ) {
        await supabase.from("signals").insert({
          message_id: msg.id,
          asset: result.asset,
          direction: result.direction,
          confidence: result.confidence,
          model_used: "gpt-4o-mini",
        });
        signalCount++;
      }
    }

    // Mark as processed regardless
    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  return { processed: messages.length, signals: signalCount };
}
