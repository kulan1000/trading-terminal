import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calcSentiment, WINDOWS } from "@/lib/sentiment-engine";
import type { RawSignal } from "@/lib/sentiment-engine";
import { getSentimentHistory } from "@/lib/sentiment-snapshots";
import { ASSETS } from "@/lib/constants";

export const revalidate = 15; // refresh every 15s for near-realtime

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Fetch signals within extended window (120 min) for both windows
  const cutoff = new Date(Date.now() - WINDOWS.extended * 60_000).toISOString();

  const { data } = await supabase
    .from("signals")
    .select("id, asset, direction, signal_type, position, strength, confidence, author, created_at")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  const signals = (data ?? []) as RawSignal[];

  // Calculate for primary (60 min) and extended (120 min) windows
  const primary = calcSentiment(signals, ASSETS, WINDOWS.primary);
  const extended = calcSentiment(signals, ASSETS, WINDOWS.extended);

  // Recent signal timeline (for dots/timeline visualization)
  const timeline = signals.slice(0, 50).map((s) => ({
    asset: s.asset,
    direction: s.direction,
    signalType: s.signal_type,
    position: s.position,
    strength: s.strength,
    author: s.author,
    time: s.created_at,
  }));

  // Sentiment history for sparklines (last 2 hours per asset)
  const historyResults = await Promise.all(
    ASSETS.map(async (asset) => ({
      asset,
      points: await getSentimentHistory(asset, 2),
    }))
  );
  const history: Record<string, Array<{ net_score: number; confidence: number; bias: string; created_at: string }>> = {};
  for (const h of historyResults) history[h.asset] = h.points;

  return NextResponse.json({
    primary,
    extended,
    timeline,
    history,
    window: WINDOWS.primary,
    updatedAt: new Date().toISOString(),
  });
}
