import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { ASSETS } from "@/lib/constants";
import { getAssetPrice } from "@/lib/price-snapshot";
import { fetchYahoo } from "@/lib/data-yahoo";
import type { Asset } from "@/lib/types";

const YAHOO_SYMBOLS: Record<Asset, string> = { Gold: "GC=F", Silver: "SI=F", Oil: "CL=F" };

export const revalidate = 60;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Same decay logic as getAssetBias — single source of truth
const STR: Record<string, number> = { strong: 3, medium: 2, weak: 1 };
function timeDecay(iso: string, now: number): number {
  const ageH = (now - new Date(iso).getTime()) / 3600000;
  if (ageH <= 1) return 1.0;
  if (ageH <= 3) return 0.7;
  return 0.4;
}

export async function GET(req: NextRequest) {
  const asset = req.nextUrl.searchParams.get("asset") as Asset | null;
  if (!asset || !ASSETS.includes(asset)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  }

  const now = Date.now();
  const since6h = new Date(now - 6 * 60 * 60 * 1000).toISOString();
  const around7hAgo = new Date(now - 7 * 60 * 60 * 1000).toISOString();

  const [signalsRes, historyRes, price, oldBiasRes, yahooData, credibilityRes] = await Promise.all([
    // Only 6h signals — matches getAssetBias window
    supabase
      .from("signals")
      .select("id, direction, confidence, strength, signal_type, position, interpretation, author, created_at, discord_messages(content)")
      .eq("asset", asset)
      .gte("created_at", since6h)
      .order("created_at", { ascending: false })
      .limit(50),
    // Chart history 6h to match decay window
    supabase
      .from("bias_snapshots")
      .select("score, direction, created_at")
      .eq("asset", asset)
      .gte("created_at", since6h)
      .order("created_at", { ascending: true }),
    getAssetPrice(asset),
    supabase
      .from("bias_snapshots")
      .select("score, direction")
      .eq("asset", asset)
      .gte("created_at", around7hAgo)
      .order("created_at", { ascending: true })
      .limit(1),
    fetchYahoo(asset, YAHOO_SYMBOLS[asset]),
    supabase
      .from("user_credibility")
      .select("discord_user, score, win_rate, total_signals, correct_signals"),
  ]);

  type RawSignal = {
    id: number; direction: string; confidence: number; strength: string;
    signal_type: string | null; position: string | null; interpretation: string | null;
    author: string; created_at: string;
    discord_messages: { content: string } | null;
  };

  const signals = (signalsRes.data ?? []) as RawSignal[];
  const history = (historyRes.data ?? []) as Array<{ score: number; direction: string; created_at: string }>;

  // AI summary — uses all 6h signals
  let summary = "No recent activity.";
  if (signals.length > 0) {
    const sBull = signals.filter((s) => s.direction === "bullish").length;
    const sBear = signals.filter((s) => s.direction === "bearish").length;
    const sEntries = signals.filter((s) => s.signal_type === "entry").length;
    const sExits = signals.filter((s) => s.signal_type === "exited").length;

    const prompt = `You are a trading terminal AI. Summarize the community sentiment for ${asset} in exactly 2-3 sentences. Be concise and terminal-style.

Recent signals (last 6h): ${signals.length} total, ${sEntries} entries, ${sExits} exits, ${sBull} bullish, ${sBear} bearish.
Key interpretations: ${signals.slice(0, 8).map((s) => `${s.author}: "${s.interpretation ?? s.discord_messages?.content ?? ""}"`).filter(Boolean).join("; ")}

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
      summary = `${sBull} bullish vs ${sBear} bearish signals. ${sEntries} entries, ${sExits} exits in the last 6h.`;
    }
  }

  // Raw counts + decay-weighted percentages
  const rawBull = signals.filter((s) => s.direction === "bullish").length;
  const rawBear = signals.filter((s) => s.direction === "bearish").length;
  const rawEntries = signals.filter((s) => s.signal_type === "entry").length;
  const rawExits = signals.filter((s) => s.signal_type === "exited").length;
  const uniqueTraders = new Set(signals.map((s) => s.author)).size;

  // Decay-weighted bull/bear for accurate representation
  let wBull = 0, wBear = 0;
  for (const s of signals) {
    const w = timeDecay(s.created_at, now) * (STR[s.strength] ?? 2) * s.confidence * (s.signal_type === "position" ? 1.5 : 1);
    if (s.direction === "bullish") wBull += w;
    else if (s.direction === "bearish") wBear += w;
  }
  const wTotal = wBull + wBear;
  // When no directional signals exist, show 50/50 instead of misleading 0/100
  const weightedBullPct = wTotal > 0 ? Math.round((wBull / wTotal) * 100) : 50;
  const weightedBearPct = wTotal > 0 ? 100 - weightedBullPct : 50;

  // Latest signal
  const latestSignal = signals[0]
    ? { author: signals[0].author, direction: signals[0].direction, signal_type: signals[0].signal_type, position: signals[0].position, created_at: signals[0].created_at }
    : null;

  // 24h-ago bias for comparison
  const oldSnap = (oldBiasRes.data ?? [])[0] as { score: number; direction: string } | undefined;
  const biasChange = oldSnap ? { score: oldSnap.score, direction: oldSnap.direction } : null;

  // Trader consensus with decay weight + latest signal time
  // Direction = majority weighted direction (not first signal)
  const traderMap = new Map<string, { bullW: number; bearW: number; totalW: number; count: number; types: string[]; latestAt: string }>();
  for (const s of signals) {
    const w = timeDecay(s.created_at, now) * (STR[s.strength] ?? 2) * s.confidence;
    const ex = traderMap.get(s.author);
    if (ex) {
      if (s.direction === "bullish") ex.bullW += w;
      else if (s.direction === "bearish") ex.bearW += w;
      ex.totalW += w;
      ex.count++;
      if (s.signal_type && !ex.types.includes(s.signal_type)) ex.types.push(s.signal_type);
      if (s.created_at > ex.latestAt) ex.latestAt = s.created_at;
    } else {
      traderMap.set(s.author, {
        bullW: s.direction === "bullish" ? w : 0,
        bearW: s.direction === "bearish" ? w : 0,
        totalW: w, count: 1,
        types: s.signal_type ? [s.signal_type] : [],
        latestAt: s.created_at,
      });
    }
  }
  // Build credibility lookup map
  type CredRow = { discord_user: string; score: number; win_rate: number; total_signals: number; correct_signals: number };
  const credMap = new Map<string, CredRow>();
  for (const row of (credibilityRes.data ?? []) as CredRow[]) {
    credMap.set(row.discord_user, row);
  }

  const traderConsensus = [...traderMap.entries()]
    .map(([author, d]) => {
      const cred = credMap.get(author);
      return {
        author,
        direction: d.bullW > d.bearW ? "bullish" : d.bearW > d.bullW ? "bearish" : "neutral",
        count: d.count, types: d.types, latestAt: d.latestAt,
        credibility: cred ? { score: cred.score, winRate: cred.win_rate, totalScored: cred.total_signals } : null,
      };
    })
    .sort((a, b) => (traderMap.get(b.author)?.totalW ?? 0) - (traderMap.get(a.author)?.totalW ?? 0));

  // Build intraday price series — show last 6h of available data
  // When market is closed, Yahoo still returns last trading session data
  // so we show the most recent 6h window of whatever is available
  let intradayPrices: { ts: number; price: number }[] = [];
  if (yahooData && yahooData.intraday.length >= 2) {
    const allPoints: { ts: number; price: number }[] = [];
    for (let i = 0; i < yahooData.intraday.length; i++) {
      const ts = yahooData.intradayTs[i] ?? 0;
      if (ts > 0) allPoints.push({ ts, price: yahooData.intraday[i] });
    }

    if (allPoints.length >= 2) {
      // Try 6h window from now first
      const sixHAgoEpoch = Math.floor((now - 6 * 60 * 60 * 1000) / 1000);
      const recent = allPoints.filter((p) => p.ts >= sixHAgoEpoch);

      if (recent.length >= 2) {
        // Market was active in last 6h — use those points
        intradayPrices = recent;
      } else {
        // Market closed — show last 6h of available data from last session
        const lastTs = allPoints[allPoints.length - 1].ts;
        const sessionStart = lastTs - 6 * 60 * 60;
        intradayPrices = allPoints.filter((p) => p.ts >= sessionStart);
      }
    }
  }

  return NextResponse.json({
    asset,
    price,
    intradayPrices,
    stats: {
      bullish: rawBull,
      bearish: rawBear,
      entries: rawEntries,
      exits: rawExits,
      uniqueTraders,
      total: signals.length,
      weightedBullPct,
      weightedBearPct,
    },
    signals: signals.map((s) => ({
      id: s.id, direction: s.direction, confidence: s.confidence, strength: s.strength,
      signal_type: s.signal_type, position: s.position, interpretation: s.interpretation,
      author: s.author, created_at: s.created_at, content: s.discord_messages?.content ?? null,
    })),
    history,
    summary,
    latestSignal,
    biasChange,
    traderConsensus,
  });
}
