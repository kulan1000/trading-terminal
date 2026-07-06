import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPriceAtTime } from "@/lib/price-snapshots";
import { verifyBearerAuth } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Backfill scoring for signals that missed the 5min cron window
// This tries to score ANY unscored entry/exit signal that's old enough

// A full backfill scans every unscored signal and does 4 price lookups each —
// give it the same 300s window as the main pipeline so it isn't guillotined
// mid-loop (which would leave scoring_status writes half-applied).
export const maxDuration = 300;

const CHECKPOINTS = [
  { key: "30m", minutes: 30, weight: 0.15 },
  { key: "1h", minutes: 60, weight: 0.25 },
  { key: "2h", minutes: 120, weight: 0.30 },
  { key: "4h", minutes: 240, weight: 0.30 },
] as const;

function checkpointScore(
  signalType: string, position: string | null,
  entryPrice: number, checkpointPrice: number
): number {
  const pctChange = ((checkpointPrice - entryPrice) / entryPrice) * 100;
  // Same semantics as score-signals: entries AND holds are graded on the
  // position's direction; exits are graded on whether price reversed after.
  if (signalType === "entry" || signalType === "position") {
    return position === "short" ? -pctChange : pctChange;
  }
  return position === "short" ? pctChange : -pctChange;
}

export async function POST(request: Request) {
  // Auth: Bearer CRON_SECRET or CLASSIFY_SECRET (typed into the admin UI).
  // Both are server-only — never NEXT_PUBLIC, or the secret ships in client JS.
  // With no secret configured the route only opens under `next dev`; any
  // built/deployed env (Vercel sets NODE_ENV=production for Production AND
  // Preview) requires a valid secret and otherwise fails closed.
  const hasSecret = !!(
    process.env.CRON_SECRET?.trim() || process.env.CLASSIFY_SECRET?.trim()
  );
  const authed = verifyBearerAuth(request, [
    process.env.CRON_SECRET,
    process.env.CLASSIFY_SECRET,
  ]);
  const devOpen = !hasSecret && process.env.NODE_ENV !== "production";
  if (!authed && !devOpen) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // This endpoint fans out to a full-table scan plus many service-role writes
  // and is reachable by anyone holding the secret — cap it like /api/ingest.
  const limited = checkRateLimit("scoring-backfill", 6, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  const supabase = getSupabaseAdmin();

  type Sig = { id: number; author: string; asset: string; signal_type: string; position: string | null; direction: string | null; price_at_signal: number; created_at: string };

  // Find all entry/exit signals with prices that haven't been scored.
  // Paginated: PostgREST silently caps un-ranged selects at 1000 rows, which
  // would make the backfill permanently blind to newer signals. Position and
  // 'position' signal_type rows are handled by the main scorer; the backfill
  // mirrors its selection.
  const allSignals: Sig[] = [];
  for (let page = 0; page < 20; page++) {
    const { data: chunk, error: signalsError } = await supabase
      .from("signals")
      .select("id, author, asset, signal_type, position, direction, price_at_signal, created_at")
      .in("signal_type", ["entry", "exited", "position"])
      .not("price_at_signal", "is", null)
      .not("author", "is", null)
      .is("scoring_status", null)
      .order("created_at", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (signalsError) {
      return NextResponse.json(
        { error: `signals query failed: ${signalsError.message}` },
        { status: 500 }
      );
    }
    if (!chunk?.length) break;
    allSignals.push(...(chunk as Sig[]));
    if (chunk.length < 1000) break;
  }
  if (!allSignals.length) return NextResponse.json({ backfilled: 0, skipped: 0, failed: 0 });

  // Already-scored IDs (rows from before scoring_status existed) — paginated
  // for the same 1000-row-cap reason.
  const scoredSet = new Set<number>();
  for (let page = 0; page < 20; page++) {
    const { data: chunk, error: existingError } = await supabase
      .from("signal_scores")
      .select("signal_id")
      .order("signal_id", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (existingError) {
      return NextResponse.json(
        { error: `signal_scores query failed: ${existingError.message}` },
        { status: 500 }
      );
    }
    if (!chunk?.length) break;
    for (const e of chunk as Array<{ signal_id: number }>) scoredSet.add(e.signal_id);
    if (chunk.length < 1000) break;
  }

  const unscored = allSignals.filter((s) => !scoredSet.has(s.id));

  let backfilled = 0;
  let skipped = 0;
  let failed = 0;

  const backfilledAuthors = new Set<string>();

  for (const signal of unscored) {
    const signalTime = new Date(signal.created_at);

    // Same position resolution as the main scorer: entries/positions may fall
    // back to direction, exits NEVER guess their side (direction on an exit is
    // outlook, not the position held — guessing inverts perfect exits).
    let effectivePosition = signal.position;
    if (!effectivePosition && signal.signal_type !== "exited") {
      if (signal.direction === "bearish") effectivePosition = "short";
      else if (signal.direction === "bullish") effectivePosition = "long";
    }
    if (!effectivePosition) { skipped++; continue; }

    // The 4 checkpoint price lookups are independent — run them concurrently.
    const lookups = await Promise.all(
      CHECKPOINTS.map((cp) =>
        getPriceAtTime(signal.asset, new Date(signalTime.getTime() + cp.minutes * 60_000))
      )
    );
    const prices: Record<string, number | null> = {};
    const scores: Record<string, number | null> = {};
    CHECKPOINTS.forEach((cp, i) => {
      const price = lookups[i];
      prices[cp.key] = price;
      scores[cp.key] = price != null
        ? checkpointScore(signal.signal_type, effectivePosition, signal.price_at_signal, price)
        : null;
    });

    const valid = CHECKPOINTS.filter((cp) => scores[cp.key] != null);
    if (valid.length < 2) { skipped++; continue; }

    const totalWeight = valid.reduce((sum, cp) => sum + cp.weight, 0);
    const weighted = valid.reduce((sum, cp) => sum + (scores[cp.key]! * cp.weight) / totalWeight, 0);
    const dirs = valid.map((cp) => Math.sign(scores[cp.key]!));
    const consistent = dirs.every((d) => d === dirs[0]) && dirs[0] !== 0;
    const finalScore = consistent ? weighted * 1.2 : weighted;

    const { error: scoreError } = await supabase.from("signal_scores").upsert({
      signal_id: signal.id, signal_type: signal.signal_type,
      position: effectivePosition, asset: signal.asset, author: signal.author,
      price_at_signal: signal.price_at_signal,
      price_30m: prices["30m"], price_1h: prices["1h"],
      price_2h: prices["2h"], price_4h: prices["4h"],
      score_30m: scores["30m"], score_1h: scores["1h"],
      score_2h: scores["2h"], score_4h: scores["4h"],
      weighted_score: Math.round(finalScore * 100) / 100,
      consistency_bonus: consistent,
    }, { onConflict: "signal_id" });
    // A failed write must not be reported as a success — count it, don't swallow it.
    if (scoreError) { failed++; continue; }
    await supabase.from("signals").update({ scoring_status: "scored" }).eq("id", signal.id);
    backfilled++;
    backfilledAuthors.add(signal.author);
  }

  // Refresh credibility for authors that actually gained scores. Writes ONLY
  // the signal-accuracy fields refreshTimeScoring owns — total_trades/
  // winning_trades/total_pnl belong to trade-pairing and must not be
  // overwritten with score-count semantics.
  for (const author of backfilledAuthors) {
    const { data } = await supabase
      .from("signal_scores")
      .select("weighted_score, signal_type")
      .eq("author", author)
      .order("scored_at", { ascending: false })
      .limit(200);
    const rows = (data ?? []) as Array<{ weighted_score: number; signal_type: string }>;
    if (!rows.length) continue;
    const wins = rows.filter((r) => r.weighted_score > 0).length;
    const winRate = wins / rows.length;
    const reliability = Math.min(rows.length / 10, 1);
    await supabase.from("user_credibility").upsert({
      discord_user: author,
      win_rate: Math.round(winRate * 1000) / 1000,
      score: Math.round(winRate * reliability * 100),
      total_signals: rows.length, correct_signals: wins,
      updated_at: new Date().toISOString(),
    }, { onConflict: "discord_user" });
  }

  return NextResponse.json({ backfilled, skipped, failed, total: unscored.length });
}
