import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { ASSETS } from "@/lib/constants";
import { getAssetPrice } from "@/lib/price-snapshot";
import type { Asset } from "@/lib/types";

export const revalidate = 60;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: NextRequest) {
  const asset = req.nextUrl.searchParams.get("asset") as Asset | null;
  if (!asset || !ASSETS.includes(asset)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  }

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since6h = new Date(now - 6 * 60 * 60 * 1000).toISOString();
  const around24hAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();

  const [signalsRes, historyRes, price, oldBiasRes] = await Promise.all([
    supabase
      .from("signals")
      .select("id, direction, confidence, strength, signal_type, position, interpretation, author, created_at, discord_messages(content)")
      .eq("asset", asset)
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("bias_snapshots")
      .select("score, direction, created_at")
      .eq("asset", asset)
      .gte("created_at", since24h)
      .order("created_at", { ascending: true }),
    getAssetPrice(asset),
    // Oldest snapshot ~24h ago for bias change comparison
    supabase
      .from("bias_snapshots")
      .select("score, direction")
      .eq("asset", asset)
      .gte("created_at", around24hAgo)
      .order("created_at", { ascending: true })
      .limit(1),
  ]);

  type RawSignal = {
    id: number; direction: string; confidence: number; strength: string;
    signal_type: string | null; position: string | null; interpretation: string | null;
    author: string; created_at: string;
    discord_messages: { content: string } | null;
  };

  const signals = (signalsRes.data ?? []) as RawSignal[];
  const history = (historyRes.data ?? []) as Array<{ score: number; direction: string; created_at: string }>;

  // Generate AI summary for this specific asset
  const recentSignals = signals.filter((s) => s.created_at >= since6h);
  let summary = "No recent activity.";

  if (recentSignals.length > 0) {
    const entries = recentSignals.filter((s) => s.signal_type === "entry").length;
    const exits = recentSignals.filter((s) => s.signal_type === "exited").length;
    const bullish = recentSignals.filter((s) => s.direction === "bullish").length;
    const bearish = recentSignals.filter((s) => s.direction === "bearish").length;

    const prompt = `You are a trading terminal AI. Summarize the community sentiment for ${asset} in exactly 2-3 sentences. Be concise and terminal-style.

Recent signals (last 6h): ${recentSignals.length} total, ${entries} entries, ${exits} exits, ${bullish} bullish, ${bearish} bearish.
Key interpretations: ${recentSignals.slice(0, 8).map((s) => `${s.author}: "${s.interpretation ?? s.discord_messages?.content ?? ""}"`).filter(Boolean).join("; ")}

Write a brief, factual summary. No fluff.`;

    try {
      const resp = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      });
      summary = resp.choices[0]?.message?.content?.trim() ?? summary;
    } catch {
      summary = `${bullish} bullish vs ${bearish} bearish signals. ${entries} entries, ${exits} exits in the last 6h.`;
    }
  }

  // Compute stats
  const allBullish = signals.filter((s) => s.direction === "bullish").length;
  const allBearish = signals.filter((s) => s.direction === "bearish").length;
  const allEntries = signals.filter((s) => s.signal_type === "entry").length;
  const allExits = signals.filter((s) => s.signal_type === "exited").length;
  const uniqueTraders = new Set(signals.map((s) => s.author)).size;

  // Latest signal for card preview
  const latestSignal = signals.length > 0 ? {
    author: signals[0].author,
    direction: signals[0].direction,
    signal_type: signals[0].signal_type,
    position: signals[0].position,
    created_at: signals[0].created_at,
  } : null;

  // 24h-ago bias for comparison
  const oldBias = (oldBiasRes.data ?? [])[0] as { score: number; direction: string } | undefined;
  const biasChange = oldBias ? { score: oldBias.score, direction: oldBias.direction } : null;

  // Trader consensus: group by author with their stance
  const traderMap = new Map<string, { direction: string; count: number; types: string[] }>();
  for (const s of signals) {
    const existing = traderMap.get(s.author);
    if (existing) {
      existing.count++;
      if (s.signal_type && !existing.types.includes(s.signal_type)) existing.types.push(s.signal_type);
    } else {
      traderMap.set(s.author, { direction: s.direction, count: 1, types: s.signal_type ? [s.signal_type] : [] });
    }
  }
  const traderConsensus = Array.from(traderMap.entries())
    .map(([author, data]) => ({ author, ...data }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    asset,
    price,
    stats: { bullish: allBullish, bearish: allBearish, entries: allEntries, exits: allExits, uniqueTraders, total: signals.length },
    signals: signals.map((s) => ({
      id: s.id,
      direction: s.direction,
      confidence: s.confidence,
      strength: s.strength,
      signal_type: s.signal_type,
      position: s.position,
      interpretation: s.interpretation,
      author: s.author,
      created_at: s.created_at,
      content: s.discord_messages?.content ?? null,
    })),
    history,
    summary,
    latestSignal,
    biasChange,
    traderConsensus,
  });
}
