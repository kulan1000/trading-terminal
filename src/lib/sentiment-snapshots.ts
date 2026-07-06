// Save sentiment snapshots every 5 min (cron) for sparkline history

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calcSentiment, WINDOWS } from "@/lib/sentiment-engine";
import type { RawSignal } from "@/lib/sentiment-engine";
import { ASSETS } from "@/lib/constants";

export async function saveSentimentSnapshots() {
  const supabase = getSupabaseAdmin();

  // Fetch signals within primary window
  const cutoff = new Date(Date.now() - WINDOWS.primary * 60_000).toISOString();
  const { data } = await supabase
    .from("signals")
    .select("id, asset, direction, signal_type, position, strength, confidence, author, created_at")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(500);

  const signals = (data ?? []) as RawSignal[];
  const sentiments = calcSentiment(signals, ASSETS, WINDOWS.primary);

  const rows = sentiments.map((s) => ({
    asset: s.asset,
    bias: s.bias,
    confidence: s.confidence,
    bull_pressure: s.bullPressure,
    bear_pressure: s.bearPressure,
    net_score: s.netScore,
    signal_count: s.signalCount,
  }));

  const { error } = await supabase.from("sentiment_snapshots").insert(rows);
  if (error) {
    console.error("[SENTIMENT-SNAPSHOT] Insert failed:", error.message);
    return { saved: 0, error: error.message };
  }
  return { saved: rows.length };
}

/** Get sentiment history for sparklines (last N hours) */
export async function getSentimentHistory(asset: string, hours = 6) {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - hours * 60 * 60_000).toISOString();

  const { data } = await supabase
    .from("sentiment_snapshots")
    .select("net_score, confidence, bias, created_at")
    .eq("asset", asset)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  return (data ?? []) as Array<{
    net_score: number;
    confidence: number;
    bias: string;
    created_at: string;
  }>;
}
