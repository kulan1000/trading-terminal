// Trade pairing: match entry signals with exit signals per author+asset
// Runs after each classify batch to compute PnL

import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface Signal {
  id: number;
  author: string;
  asset: string;
  signal_type: string;
  position: string | null;
  price_at_signal: number | null;
  created_at: string;
}

/** Pair unmatched entries with exits and compute PnL */
export async function pairTrades() {
  const supabase = getSupabaseAdmin();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

  // Get entry signals not yet paired (last 30 days to bound query size)
  const { data: entries } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, price_at_signal, created_at")
    .eq("signal_type", "entry")
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .gte("created_at", since30d)
    .order("created_at", { ascending: true });

  if (!entries?.length) return { paired: 0 };

  // Get already-paired entry IDs
  const { data: pairedEntries } = await supabase
    .from("trade_pairs")
    .select("entry_signal_id");
  const pairedSet = new Set((pairedEntries ?? []).map((p: { entry_signal_id: number }) => p.entry_signal_id));

  // Filter to unmatched entries
  const unmatched = (entries as Signal[]).filter((e) => !pairedSet.has(e.id));
  if (!unmatched.length) return { paired: 0 };

  // Get exit signals (last 30 days)
  const { data: exits } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, price_at_signal, created_at")
    .eq("signal_type", "exited")
    .not("price_at_signal", "is", null)
    .gte("created_at", since30d)
    .order("created_at", { ascending: true });

  const { data: pairedExits } = await supabase
    .from("trade_pairs")
    .select("exit_signal_id");
  const exitPairedSet = new Set((pairedExits ?? []).map((p: { exit_signal_id: number }) => p.exit_signal_id));
  const availableExits = ((exits ?? []) as Signal[]).filter((e) => !exitPairedSet.has(e.id));

  let paired = 0;

  for (const entry of unmatched) {
    // Find first matching exit: same author + asset, after entry time,
    // and same side — a long entry must not pair with a short-cover exit.
    // Exits with unknown side (position null) may match either.
    const matchIdx = availableExits.findIndex(
      (ex) =>
        ex.author === entry.author &&
        ex.asset === entry.asset &&
        (ex.position == null || ex.position === entry.position) &&
        new Date(ex.created_at) > new Date(entry.created_at)
    );

    if (matchIdx === -1) continue;
    const exit = availableExits.splice(matchIdx, 1)[0];

    // Calculate PnL
    const entryPrice = entry.price_at_signal!;
    const exitPrice = exit.price_at_signal!;
    const pnl = entry.position === "long"
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;

    await supabase.from("trade_pairs").insert({
      author: entry.author,
      asset: entry.asset,
      entry_signal_id: entry.id,
      exit_signal_id: exit.id,
      entry_price: entryPrice,
      exit_price: exitPrice,
      position: entry.position,
      pnl,
    });

    paired++;
  }

  // Refresh credibility for affected authors
  if (paired > 0) {
    const authors = [...new Set(unmatched.map((e) => e.author))];
    for (const author of authors) {
      try {
        await refreshCredibility(supabase, author);
      } catch (err) {
        console.error(`[TRADE-PAIR] Credibility refresh failed for ${author}:`, err);
      }
    }
  }

  return { paired };
}

/** Recalculate completed-trade PnL stats for an author.
 *  Owns: total_trades, winning_trades, total_pnl.
 *  (Signal-accuracy fields — score/win_rate/total_signals/correct_signals —
 *  are owned by score-signals' refreshTimeScoring, which has far more data.
 *  Previously both functions overwrote ALL fields with different semantics,
 *  so the leaderboard mixed "share of profitable trade pairs" with "share of
 *  positive time-horizon scores" depending on which ran last.) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshCredibility(supabase: any, author: string) {
  const { data } = await supabase
    .from("trade_pairs")
    .select("pnl")
    .eq("author", author)
    .order("created_at", { ascending: false })
    .limit(200);

  const trades = (data ?? []) as Array<{ pnl: number }>;
  if (!trades.length) return;

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  await supabase.from("user_credibility").upsert(
    {
      discord_user: author,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      total_pnl: Math.round(totalPnl * 100) / 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "discord_user" }
  );
}
