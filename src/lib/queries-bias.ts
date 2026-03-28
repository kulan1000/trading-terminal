// Bias-related queries: targets, hot asset detection, bias history snapshots

import { supabase } from "@/lib/supabase";
import type { Asset } from "@/lib/types";

/** Recent price targets from traders */
export async function getRecentTargets(limit = 15) {
  const { data } = await supabase
    .from("signals")
    .select("id, asset, direction, target_price, confidence, author, created_at")
    .eq("signal_type", "target")
    .not("target_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    id: number;
    asset: string;
    direction: string;
    target_price: number;
    confidence: number;
    author: string;
    created_at: string;
  }>;
}

/** Which commodity has the most signals in the last 4h */
export async function getHotAsset(): Promise<{ asset: Asset; count: number } | null> {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("signals")
    .select("asset")
    .gte("created_at", since);

  const rows = (data ?? []) as Array<{ asset: string }>;
  if (!rows.length) return null;
  const counts: Record<string, number> = {};
  for (const s of rows) {
    counts[s.asset] = (counts[s.asset] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? { asset: top[0] as Asset, count: top[1] } : null;
}

/** Latest signal per asset (card preview) */
export async function getLatestSignal(asset: Asset) {
  const { data } = await supabase
    .from("signals")
    .select("author, direction, signal_type, position, created_at")
    .eq("asset", asset)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data ?? [])[0] as { author: string; direction: string; signal_type: string | null; position: string | null; created_at: string } | undefined;
  return row ?? null;
}

/** Oldest bias snapshot ~24h ago for card comparison */
export async function getBiasAgo(asset: Asset) {
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("bias_snapshots")
    .select("score, direction")
    .eq("asset", asset)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1);
  const row = (data ?? [])[0] as { score: number; direction: string } | undefined;
  return row ?? null;
}

/** Bias history snapshots for sparklines */
export async function getBiasHistory(asset: Asset, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("bias_snapshots")
    .select("score, direction, created_at")
    .eq("asset", asset)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  return (data ?? []) as Array<{
    score: number;
    direction: string;
    created_at: string;
  }>;
}
