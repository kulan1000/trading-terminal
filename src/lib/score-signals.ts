// Time-horizon scoring: evaluate entries and exits at 30m, 1h, 2h, 4h
// Entry: did price move in the trader's predicted direction?
// Exit: did the trader exit at a good time (price reversed after)?
//
// Signals track scoring via signals.scoring_status:
//   null         → pending (not yet attempted, or retrying)
//   'scored'     → row exists in signal_scores
//   'unscorable' → permanently lacks price coverage (e.g. weekend tail,
//                  pre-snapshot era) — excluded so it can never clog the queue.
// This replaces the old oldest-50 query that deadlocked forever on a batch
// of unscorable signals and never reached newer ones.

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPriceAtTime } from "@/lib/price-snapshots";

const CHECKPOINTS = [
  { key: "30m", minutes: 30, weight: 0.15 },
  { key: "1h", minutes: 60, weight: 0.25 },
  { key: "2h", minutes: 120, weight: 0.30 },
  { key: "4h", minutes: 240, weight: 0.30 },
] as const;

// A signal younger than this with missing checkpoints may still get data
// (pipeline lag); older than this, missing checkpoints are permanent.
const UNSCORABLE_AFTER_MS = 6 * 60 * 60_000; // 6h

interface UnscoredSignal {
  id: number;
  author: string;
  asset: string;
  signal_type: string;
  position: string | null;
  direction: string | null;
  price_at_signal: number;
  created_at: string;
}

/** Resolve effective position from position field or direction fallback */
function resolvePosition(signal: UnscoredSignal): string | null {
  if (signal.position) return signal.position;
  // Fallback: derive from direction
  if (signal.direction === "bearish") return "short";
  if (signal.direction === "bullish") return "long";
  return null;
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

/** Score all pending signals that are old enough (4h+) */
export async function scoreSignals() {
  const supabase = getSupabaseAdmin();

  const cutoff = new Date(Date.now() - 4 * 60 * 60_000).toISOString();

  const { data: signals } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, direction, price_at_signal, created_at")
    .in("signal_type", ["entry", "exited", "position"])
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .is("scoring_status", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!signals?.length) return { scored: 0 };

  let scored = 0;
  let markedUnscorable = 0;
  const scoredAuthors = new Set<string>();

  for (const signal of signals as UnscoredSignal[]) {
    const signalTime = new Date(signal.created_at);
    const effectivePosition = resolvePosition(signal);
    const prices: Record<string, number | null> = {};
    const scores: Record<string, number | null> = {};

    // If ANY checkpoint lookup fails (transient DB error), skip this signal
    // entirely this run — "could not check" must never become 'unscorable'.
    try {
      for (const cp of CHECKPOINTS) {
        const targetTime = new Date(signalTime.getTime() + cp.minutes * 60_000);
        const price = await getPriceAtTime(signal.asset, targetTime);
        prices[cp.key] = price;
        scores[cp.key] = price != null
          ? checkpointScore(signal.signal_type, effectivePosition, signal.price_at_signal, price)
          : null;
      }
    } catch (err) {
      console.warn(`[SCORING] Checkpoint lookup failed for signal ${signal.id} — retrying next run:`, String(err).slice(0, 120));
      continue;
    }

    const validScores = CHECKPOINTS.filter((cp) => scores[cp.key] != null);

    // Need at least 2 checkpoints with data to score
    if (validScores.length < 2) {
      const ageMs = Date.now() - signalTime.getTime();
      if (ageMs > UNSCORABLE_AFTER_MS) {
        // Missing checkpoints are permanent (market closed / no snapshot
        // coverage) — mark so this signal never blocks the queue again
        await supabase
          .from("signals")
          .update({ scoring_status: "unscorable" })
          .eq("id", signal.id);
        markedUnscorable++;
      }
      continue;
    }

    // Weighted score (normalize weights for available checkpoints)
    const totalWeight = validScores.reduce((sum, cp) => sum + cp.weight, 0);
    const weighted = validScores.reduce(
      (sum, cp) => sum + (scores[cp.key]! * cp.weight) / totalWeight, 0
    );

    // Consistency bonus: all checkpoints agree on direction
    const directions = validScores.map((cp) => Math.sign(scores[cp.key]!));
    const consistent = directions.every((d) => d === directions[0]) && directions[0] !== 0;
    const finalScore = consistent ? weighted * 1.2 : weighted;

    // Upsert on signal_id: idempotent even if two runs overlap (TOCTOU-safe
    // thanks to the unique index uq_signal_scores_signal_id)
    const { error } = await supabase.from("signal_scores").upsert({
      signal_id: signal.id,
      signal_type: signal.signal_type,
      position: effectivePosition ?? signal.position,
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
    }, { onConflict: "signal_id", ignoreDuplicates: true });

    if (!error) {
      await supabase
        .from("signals")
        .update({ scoring_status: "scored" })
        .eq("id", signal.id);
      scored++;
      scoredAuthors.add(signal.author);
    } else {
      console.error(`[SCORING] Insert failed for signal ${signal.id}:`, error.message);
    }
  }

  // Refresh credibility for scored authors
  for (const author of scoredAuthors) {
    await refreshTimeScoring(supabase, author);
  }

  return { scored, markedUnscorable };
}

/** Recalculate signal-accuracy credibility from time-horizon scores.
 *  Owns: score, win_rate, total_signals, correct_signals.
 *  (PnL fields are owned by trade-pairing's refreshCredibility.) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshTimeScoring(supabase: any, author: string) {
  const { data } = await supabase
    .from("signal_scores")
    .select("weighted_score, signal_type")
    .eq("author", author)
    .order("scored_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Array<{ weighted_score: number; signal_type: string }>;
  if (!rows.length) return;

  const totalSignals = rows.length;
  const wins = rows.filter((r) => r.weighted_score > 0).length;
  const winRate = wins / totalSignals;

  // Reliability factor: max at 10+ scored signals
  const reliability = Math.min(totalSignals / 10, 1);
  const score = Math.round(winRate * reliability * 100);

  await supabase.from("user_credibility").upsert(
    {
      discord_user: author,
      win_rate: Math.round(winRate * 1000) / 1000,
      score,
      total_signals: totalSignals,
      correct_signals: wins,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "discord_user" }
  );
}
