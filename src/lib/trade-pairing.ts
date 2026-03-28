// Trade pairing: match entry signals with exit signals per author+asset
// Runs after each classify batch to compute PnL

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
  const supabase = getSupabase();

  // Get all entry signals not yet paired
  const { data: entries } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, price_at_signal, created_at")
    .eq("signal_type", "entry")
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
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

  // Get all exit signals
  const { data: exits } = await supabase
    .from("signals")
    .select("id, author, asset, signal_type, position, price_at_signal, created_at")
    .eq("signal_type", "exited")
    .not("price_at_signal", "is", null)
    .order("created_at", { ascending: true });

  const { data: pairedExits } = await supabase
    .from("trade_pairs")
    .select("exit_signal_id");
  const exitPairedSet = new Set((pairedExits ?? []).map((p: { exit_signal_id: number }) => p.exit_signal_id));
  const availableExits = ((exits ?? []) as Signal[]).filter((e) => !exitPairedSet.has(e.id));

  let paired = 0;

  for (const entry of unmatched) {
    // Find first matching exit: same author + asset, after entry time
    const matchIdx = availableExits.findIndex(
      (ex) =>
        ex.author === entry.author &&
        ex.asset === entry.asset &&
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
      await refreshCredibility(supabase, author);
    }
  }

  return { paired };
}

/** Recalculate credibility stats for an author */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshCredibility(supabase: any, author: string) {
  const { data } = await supabase
    .from("trade_pairs")
    .select("pnl")
    .eq("author", author);

  const trades = (data ?? []) as Array<{ pnl: number }>;
  if (!trades.length) return;

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

  // Score: win_rate weighted by trade count (more data = more reliable)
  const reliability = Math.min(totalTrades / 10, 1); // max reliability at 10+ trades
  const score = winRate * reliability * 100;

  await supabase.from("user_credibility").upsert(
    {
      discord_user: author,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      total_pnl: totalPnl,
      win_rate: winRate,
      score: Math.round(score),
      total_signals: totalTrades,
      correct_signals: winningTrades,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "discord_user" }
  );
}
