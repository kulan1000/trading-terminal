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
  try {
  const supabase = getSupabaseAdmin();

  // 1) Scored signals from the last 30 days of TRADING activity (the signal's
  // own timestamp, not scored_at — backfills would otherwise inflate recency),
  // joined to the original message. Paginated explicitly: PostgREST silently
  // caps un-ranged selects at 1000 rows, which truncated the leaderboard to
  // whichever authors happened to be in the newest 1000 scores.
  const since30d = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const scores: Record<string, unknown>[] = [];
  for (let page = 0; page < 10; page++) {
    const { data: chunk } = await supabase
      .from("signal_scores")
      .select("*, signals!inner(created_at, direction, message_id, discord_messages(content))")
      .gte("signals.created_at", since30d)
      .order("scored_at", { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    if (!chunk?.length) break;
    scores.push(...chunk);
    if (chunk.length < 1000) break;
  }

  const allScores = (scores ?? []).map((s: Record<string, unknown>) => {
    const sig = s.signals as { created_at?: string; direction?: string; message_id?: number; discord_messages?: { content?: string } | null } | null;
    return {
      ...s,
      signal_created_at: sig?.created_at ?? s.scored_at,
      direction: sig?.direction ?? null,
      message_content: sig?.discord_messages?.content ?? null,
    };
  }) as (ScoreRow & { signal_created_at: string; direction: string | null; message_content: string | null })[];

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
    .filter((t) => t.signals >= 1)
    .map((t) => ({
      ...t,
      avgScore: t.totalScore / t.signals,
      winRate: t.wins / t.signals,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // 3) Per-trader signal details (for drilldown)
  type SignalDetail = {
    signalType: string;
    position: string | null;
    asset: string;
    direction: string | null;
    priceAtSignal: number;
    score30m: number | null;
    score1h: number | null;
    score2h: number | null;
    score4h: number | null;
    weightedScore: number;
    consistent: boolean;
    scoredAt: string;
    signalCreatedAt: string;
    messageContent: string | null;
  };
  const traderSignals: Record<string, SignalDetail[]> = {};

  for (const s of allScores) {
    if (!traderSignals[s.author]) traderSignals[s.author] = [];
    traderSignals[s.author].push({
      signalType: s.signal_type,
      position: s.position,
      asset: s.asset,
      direction: s.direction,
      priceAtSignal: s.price_at_signal,
      score30m: s.score_30m,
      score1h: s.score_1h,
      score2h: s.score_2h,
      score4h: s.score_4h,
      weightedScore: s.weighted_score,
      consistent: s.consistency_bonus,
      scoredAt: s.scored_at,
      signalCreatedAt: s.signal_created_at,
      messageContent: s.message_content,
    });
  }

  // 4) Open positions: signals awaiting their first score. The scorer only
  // grades signals older than 4h, so "< 4h old and still pending" IS the
  // open set — no need to diff against the whole signal_scores table (which
  // silently caps at 1000 un-ranged rows and would mislabel scored signals
  // as open once it overflows).
  const since4h = new Date(Date.now() - 4 * 60 * 60_000).toISOString();
  const { data: pendingEntries } = await supabase
    .from("signals")
    .select("id, author, asset, position, price_at_signal, created_at")
    .in("signal_type", ["entry", "exited"])
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .is("scoring_status", null)
    .gte("created_at", since4h)
    .order("created_at", { ascending: false })
    .limit(200);

  const openPositions = (pendingEntries ?? []) as OpenEntry[];

  // 5) Recent scored signals (last 20)
  const recentScored = allScores.slice(0, 20).map((s) => ({
    author: s.author,
    asset: s.asset,
    signalType: s.signal_type,
    position: s.position,
    direction: s.direction,
    priceAtSignal: s.price_at_signal,
    score30m: s.score_30m,
    score1h: s.score_1h,
    score2h: s.score_2h,
    score4h: s.score_4h,
    weightedScore: s.weighted_score,
    consistent: s.consistency_bonus,
    scoredAt: s.scored_at,
    signalCreatedAt: s.signal_created_at,
    messageContent: s.message_content,
  }));

  // 6) Score history: aggregate by hour for timeline chart
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
    tradePairs, scoreHistory,
  });
  } catch (err) {
    console.error("[SCORING] API error:", err);
    return NextResponse.json({
      scoreboard: [], openPositions: [], recentScored: [],
      traderSignals: {}, tradePairs: [], scoreHistory: [],
    });
  }
}
