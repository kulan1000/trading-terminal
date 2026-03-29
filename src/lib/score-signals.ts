// Time-horizon scoring: evaluate entries and exits at 30m, 1h, 2h, 4h
// Entry: did price move in the trader's predicted direction?
// Exit: did the trader exit at a good time (price reversed after)?

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPriceAtTime } from "@/lib/price-snapshots";

const CHECKPOINTS = [
  { key: "30m", minutes: 30, weight: 0.15 },
  { key: "1h", minutes: 60, weight: 0.25 },
  { key: "2h", minutes: 120, weight: 0.30 },
  { key: "4h", minutes: 240, weight: 0.30 },
] as const;

interface UnscoredSignal {
  id: number;
  author: string;
  asset: string;
  signal_type: string;
  position: string | null;
  price_at_signal: number;
  created_at: string;
}

/** Calculate score for a single checkpoint */
function checkpointScore(
  signalType: string,
  position: string | null,
  entryPrice: number,
  checkpointPrice: number
): number {
  const pctChange = ((checkpointPrice - entryPrice) / entryPrice) * 100;

  if (signalType === "entry" || signalType === "position") {
    // Long entry/position: price up = good. Short: price down = good.
    return position === "short" ? -pctChange : pctChange;
  } else {
    // Exit scoring: did the trader exit at the right time?
    // Long exit (sold): price drops after = good exit
    // Short exit (covered): price rises after = good exit
    return position === "short" ? pctChange : -pctChange;
  }
}

/** Score all unscored signals that are old enough (4h+) */
export async function scoreSignals() {
  const supabase = getSupabaseAdmin();

  // Find entry/exit signals not yet scored, older than 4h
  const cutoff = new Date(Date.now() - 4 * 60 * 60_000).toISOString();

  const { data: signals } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, price_at_signal, created_at")
    .in("signal_type", ["entry", "exited", "position"])
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(50);

  if (!signals?.length) return { scored: 0 };

  // Filter out already scored
  const signalIds = (signals as UnscoredSignal[]).map((s) => s.id);
  const { data: existing } = await supabase
    .from("signal_scores")
    .select("signal_id")
    .in("signal_id", signalIds);

  const scoredSet = new Set(
    ((existing ?? []) as Array<{ signal_id: number }>).map((e) => e.signal_id)
  );
  const unscored = (signals as UnscoredSignal[]).filter((s) => !scoredSet.has(s.id));
  if (!unscored.length) return { scored: 0 };

  let scored = 0;

  for (const signal of unscored) {
    const signalTime = new Date(signal.created_at);
    const prices: Record<string, number | null> = {};
    const scores: Record<string, number | null> = {};

    // Fetch price at each checkpoint
    let allFetched = true;
    for (const cp of CHECKPOINTS) {
      const targetTime = new Date(signalTime.getTime() + cp.minutes * 60_000);
      const price = await getPriceAtTime(signal.asset, targetTime);
      prices[cp.key] = price;

      if (price != null) {
        scores[cp.key] = checkpointScore(
          signal.signal_type, signal.position, signal.price_at_signal, price
        );
      } else {
        scores[cp.key] = null;
        allFetched = false;
      }
    }

    // Need at least 2 checkpoints with data to score
    const validScores = CHECKPOINTS.filter((cp) => scores[cp.key] != null);
    if (validScores.length < 2) continue;

    // Weighted score (normalize weights for available checkpoints)
    const totalWeight = validScores.reduce((sum, cp) => sum + cp.weight, 0);
    const weighted = validScores.reduce(
      (sum, cp) => sum + (scores[cp.key]! * cp.weight) / totalWeight, 0
    );

    // Consistency bonus: all checkpoints agree on direction
    const directions = validScores.map((cp) => Math.sign(scores[cp.key]!));
    const consistent = directions.every((d) => d === directions[0]) && directions[0] !== 0;
    const finalScore = consistent ? weighted * 1.2 : weighted;

    await supabase.from("signal_scores").insert({
      signal_id: signal.id,
      signal_type: signal.signal_type,
      position: signal.position,
      asset: signal.asset,
      author: signal.author,
      price_at_signal: signal.price_at_signal,
      price_30m: prices["30m"],
      price_1h: prices["1h"],
      price_2h: prices["2h"],
      price_4h: prices["4h"],
      score_30m: scores["30m"],
      score_1h: scores["1h"],
      score_2h: scores["2h"],
      score_4h: scores["4h"],
      weighted_score: Math.round(finalScore * 100) / 100,
      consistency_bonus: consistent,
    });

    scored++;
  }

  // Refresh credibility for scored authors
  if (scored > 0) {
    const authors = [...new Set(unscored.map((s) => s.author))];
    for (const author of authors) {
      await refreshTimeScoring(supabase, author);
    }
  }

  return { scored };
}

/** Recalculate credibility based on time-horizon scores */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshTimeScoring(supabase: any, author: string) {
  const { data } = await supabase
    .from("signal_scores")
    .select("weighted_score, signal_type")
    .eq("author", author)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Array<{ weighted_score: number; signal_type: string }>;
  if (!rows.length) return;

  const totalSignals = rows.length;
  const wins = rows.filter((r) => r.weighted_score > 0).length;
  const totalScore = rows.reduce((sum, r) => sum + r.weighted_score, 0);
  const winRate = wins / totalSignals;

  // Reliability factor: max at 10+ scored signals
  const reliability = Math.min(totalSignals / 10, 1);
  const score = Math.round(winRate * reliability * 100);

  await supabase.from("user_credibility").upsert(
    {
      discord_user: author,
      total_trades: totalSignals,
      winning_trades: wins,
      total_pnl: Math.round(totalScore * 100) / 100,
      win_rate: Math.round(winRate * 1000) / 1000,
      score,
      total_signals: totalSignals,
      correct_signals: wins,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "discord_user" }
  );
}
