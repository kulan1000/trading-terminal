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

  // 6) Trader activity: all traders ranked by signal count + types
  const { data: activityRows } = await supabase
    .from("signals")
    .select("author, asset, signal_type, direction, confidence, created_at")
    .not("author", "is", null)
    .not("author", "eq", "unknown")
    .order("created_at", { ascending: false })
    .limit(500);

  const activityMap = new Map<string, {
    author: string; total: number; opinions: number; positions: number;
    entries: number; exits: number; bullish: number; bearish: number;
    avgConf: number; confSum: number; lastActive: string;
    assets: Set<string>;
  }>();

  for (const r of (activityRows ?? []) as Array<{
    author: string; asset: string; signal_type: string;
    direction: string; confidence: number; created_at: string;
  }>) {
    const t = activityMap.get(r.author) ?? {
      author: r.author, total: 0, opinions: 0, positions: 0,
      entries: 0, exits: 0, bullish: 0, bearish: 0,
      avgConf: 0, confSum: 0, lastActive: r.created_at,
      assets: new Set<string>(),
    };
    t.total++;
    t.assets.add(r.asset);
    if (r.signal_type === "opinion") t.opinions++;
    else if (r.signal_type === "position") t.positions++;
    else if (r.signal_type === "entry") t.entries++;
    else if (r.signal_type === "exited") t.exits++;
    if (r.direction === "bullish") t.bullish++;
    else if (r.direction === "bearish") t.bearish++;
    t.confSum += r.confidence ?? 0;
    if (r.created_at > t.lastActive) t.lastActive = r.created_at;
    activityMap.set(r.author, t);
  }

  const traderActivity = Array.from(activityMap.values())
    .map((t) => ({
      author: t.author,
      total: t.total,
      opinions: t.opinions,
      positions: t.positions,
      entries: t.entries,
      exits: t.exits,
      bullish: t.bullish,
      bearish: t.bearish,
      avgConf: t.total > 0 ? Math.round((t.confSum / t.total) * 100) : 0,
      lastActive: t.lastActive,
      assets: Array.from(t.assets),
      scoreable: t.entries + t.exits + t.positions,
    }))
    .sort((a, b) => b.total - a.total);

  // 7) Score history: aggregate by hour for timeline chart
  const scoreHistory: Array<{
    hour: string; avgScore: number; count: number; wins: number; winRate: number;
  }> = [];

  if (allScores.length > 0) {
    const hourMap = new Map<string, { sum: number; count: number; wins: number }>();
    for (const s of allScores) {
      const d = new Date(s.scored_at);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      const h = hourMap.get(key) ?? { sum: 0, count: 0, wins: 0 };
      h.sum += s.weighted_score;
      h.count++;
      if (s.weighted_score > 0) h.wins++;
      hourMap.set(key, h);
    }
    for (const [hour, h] of Array.from(hourMap.entries()).sort()) {
      scoreHistory.push({
        hour,
        avgScore: h.count > 0 ? h.sum / h.count : 0,
        count: h.count,
        wins: h.wins,
        winRate: h.count > 0 ? h.wins / h.count : 0,
      });
    }
  }

  // 8) Trade pairs
  const { data: tradePairRows } = await supabase
    .from("trade_pairs")
    .select("author, asset, position, entry_price, exit_price, pnl, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const tradePairs = (tradePairRows ?? []) as Array<{
    author: string; asset: string; position: string;
    entry_price: number; exit_price: number; pnl: number; created_at: string;
  }>;

  return NextResponse.json({
    scoreboard, openPositions, recentScored, traderSignals,
    traderActivity, tradePairs, scoreHistory,
  });
}
