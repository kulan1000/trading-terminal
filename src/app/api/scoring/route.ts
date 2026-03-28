import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

interface ScoreRow {
  id: number;
  signal_id: number;
  signal_type: string;
  position: string | null;
  asset: string;
  author: string;
  price_at_signal: number;
  price_30m: number | null;
  price_1h: number | null;
  price_2h: number | null;
  price_4h: number | null;
  score_30m: number | null;
  score_1h: number | null;
  score_2h: number | null;
  score_4h: number | null;
  weighted_score: number;
  consistency_bonus: boolean;
  scored_at: string;
}

interface OpenEntry {
  id: number;
  author: string;
  asset: string;
  position: string | null;
  price_at_signal: number | null;
  created_at: string;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  // 1) All scored signals
  const { data: scores } = await supabase
    .from("signal_scores")
    .select("*")
    .order("scored_at", { ascending: false });

  const allScores = (scores ?? []) as ScoreRow[];

  // 2) Build per-trader scoreboard from time-horizon scores
  const traderMap = new Map<string, {
    author: string;
    signals: number;
    entries: number;
    exits: number;
    wins: number;
    totalScore: number;
    avgScore: number;
    winRate: number;
    consistency: number;
  }>();

  for (const s of allScores) {
    const t = traderMap.get(s.author) ?? {
      author: s.author, signals: 0, entries: 0, exits: 0,
      wins: 0, totalScore: 0, avgScore: 0, winRate: 0, consistency: 0,
    };
    t.signals++;
    if (s.signal_type === "entry") t.entries++;
    else t.exits++;
    if (s.weighted_score > 0) t.wins++;
    if (s.consistency_bonus) t.consistency++;
    t.totalScore += s.weighted_score;
    traderMap.set(s.author, t);
  }

  const scoreboard = Array.from(traderMap.values())
    .filter((t) => t.signals >= 3)
    .map((t) => ({
      ...t,
      avgScore: t.totalScore / t.signals,
      winRate: t.wins / t.signals,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // 3) Per-trader signal details (for drilldown)
  const traderSignals: Record<string, Array<{
    signalType: string;
    position: string | null;
    asset: string;
    priceAtSignal: number;
    score30m: number | null;
    score1h: number | null;
    score2h: number | null;
    score4h: number | null;
    weightedScore: number;
    consistent: boolean;
    scoredAt: string;
  }>> = {};

  for (const s of allScores) {
    if (!traderSignals[s.author]) traderSignals[s.author] = [];
    traderSignals[s.author].push({
      signalType: s.signal_type,
      position: s.position,
      asset: s.asset,
      priceAtSignal: s.price_at_signal,
      score30m: s.score_30m,
      score1h: s.score_1h,
      score2h: s.score_2h,
      score4h: s.score_4h,
      weightedScore: s.weighted_score,
      consistent: s.consistency_bonus,
      scoredAt: s.scored_at,
    });
  }

  // 4) Open positions: entry signals not yet scored (< 4h old)
  const { data: scoredIds } = await supabase
    .from("signal_scores")
    .select("signal_id");
  const scoredSet = new Set(
    ((scoredIds ?? []) as Array<{ signal_id: number }>).map((r) => r.signal_id)
  );

  const { data: allEntries } = await supabase
    .from("signals")
    .select("id, author, asset, position, price_at_signal, created_at")
    .in("signal_type", ["entry", "exited"])
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .order("created_at", { ascending: false });

  const openPositions = ((allEntries ?? []) as OpenEntry[]).filter(
    (e) => !scoredSet.has(e.id)
  );

  // 5) Recent scored signals (last 20)
  const recentScored = allScores.slice(0, 20).map((s) => ({
    author: s.author,
    asset: s.asset,
    signalType: s.signal_type,
    position: s.position,
    priceAtSignal: s.price_at_signal,
    score30m: s.score_30m,
    score1h: s.score_1h,
    score2h: s.score_2h,
    score4h: s.score_4h,
    weightedScore: s.weighted_score,
    consistent: s.consistency_bonus,
    scoredAt: s.scored_at,
  }));

  return NextResponse.json({
    scoreboard, openPositions, recentScored, traderSignals,
  });
}
