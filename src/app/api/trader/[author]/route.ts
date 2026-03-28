import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

interface Params { params: Promise<{ author: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { author } = await params;
  const decoded = decodeURIComponent(author);
  const supabase = getSupabaseAdmin();

  // Parallel fetch all trader data
  const [credRes, profileRes, signalsRes, scoresRes, messagesRes] = await Promise.all([
    supabase.from("user_credibility").select("*").eq("discord_user", decoded).single(),
    supabase.from("trader_profiles").select("*").eq("author", decoded).single(),
    supabase.from("signals")
      .select("id, asset, direction, confidence, strength, signal_type, position, created_at")
      .eq("author", decoded).order("created_at", { ascending: false }).limit(50),
    supabase.from("signal_scores")
      .select("signal_id, asset, signal_type, position, price_at_signal, score_30m, score_1h, score_2h, score_4h, weighted_score, consistency_bonus, scored_at")
      .eq("author", decoded).order("scored_at", { ascending: false }).limit(50),
    supabase.from("discord_messages")
      .select("id, content, channel, timestamp")
      .ilike("author", decoded).order("timestamp", { ascending: false }).limit(20),
  ]);

  // Build asset breakdown
  const signals = (signalsRes.data ?? []) as Array<{
    id: number; asset: string; direction: string; confidence: number;
    strength: string; signal_type: string; position: string | null; created_at: string;
  }>;

  const assetBreakdown: Record<string, { total: number; bullish: number; bearish: number; entries: number; exits: number }> = {};
  for (const s of signals) {
    const ab = assetBreakdown[s.asset] ?? { total: 0, bullish: 0, bearish: 0, entries: 0, exits: 0 };
    ab.total++;
    if (s.direction === "bullish") ab.bullish++;
    if (s.direction === "bearish") ab.bearish++;
    if (s.signal_type === "entry") ab.entries++;
    if (s.signal_type === "exited") ab.exits++;
    assetBreakdown[s.asset] = ab;
  }

  return NextResponse.json({
    author: decoded,
    credibility: credRes.data ?? null,
    profile: profileRes.data ?? null,
    signals,
    scores: (scoresRes.data ?? []),
    messages: (messagesRes.data ?? []),
    assetBreakdown,
  });
}
