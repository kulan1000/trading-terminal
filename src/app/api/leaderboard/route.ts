import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Trader leaderboard: credibility ranking by win rate + PnL
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("user_credibility")
    .select("discord_user, total_trades, winning_trades, total_pnl, win_rate, score, updated_at")
    .gt("total_trades", 0)
    .order("score", { ascending: false })
    .limit(20);

  return NextResponse.json({ traders: data ?? [] });
}
