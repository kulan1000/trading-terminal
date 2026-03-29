import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Trader leaderboard: credibility ranking by win rate + PnL
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("user_credibility")
      .select("discord_user, total_trades, winning_trades, total_pnl, win_rate, score, updated_at")
      .gt("total_trades", 0)
      .order("score", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ traders: data ?? [] });
  } catch (err) {
    console.error("[LEADERBOARD]", err);
    return NextResponse.json({ traders: [] });
  }
}
