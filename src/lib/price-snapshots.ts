// Save current commodity prices to price_snapshots table
// Called by cron every 5 minutes to build historical price data

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { fetchYahoo } from "@/lib/data-yahoo";
import { YAHOO_SYMBOLS, SNAPSHOT_MATCH_WINDOW_MS } from "@/lib/constants";
import type { Asset } from "@/lib/types";

/** Fetch current prices and insert into price_snapshots */
export async function savePriceSnapshots() {
  const supabase = getSupabaseAdmin();
  const assets = Object.keys(YAHOO_SYMBOLS) as Asset[];

  const results = await Promise.all(
    assets.map(async (asset) => {
      const data = await fetchYahoo(asset, YAHOO_SYMBOLS[asset]);
      if (!data?.price) return null;
      return { asset, price: data.price };
    })
  );

  const rows = results.filter(Boolean) as Array<{ asset: string; price: number }>;
  if (!rows.length) return { saved: 0 };

  const { error } = await supabase.from("price_snapshots").insert(rows);
  if (error) {
    console.error("[PRICE-SNAPSHOT] Insert failed:", error.message);
    return { saved: 0, error: error.message };
  }
  return { saved: rows.length };
}

/** Look up the closest price snapshot to a given timestamp.
 *  THROWS on query failure — callers must be able to distinguish
 *  "no snapshot exists" (null) from "could not check" (throw), otherwise a
 *  transient DB error would permanently mark signals unscorable. */
export async function getPriceAtTime(
  asset: string,
  targetTime: Date
): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  const ts = targetTime.toISOString();

  // Get closest snapshot before target
  const { data: before, error: errBefore } = await supabase
    .from("price_snapshots")
    .select("price, created_at")
    .eq("asset", asset)
    .lte("created_at", ts)
    .order("created_at", { ascending: false })
    .limit(1);
  if (errBefore) throw new Error(`price_snapshots query failed: ${errBefore.message}`);

  // Get closest snapshot after target
  const { data: after, error: errAfter } = await supabase
    .from("price_snapshots")
    .select("price, created_at")
    .eq("asset", asset)
    .gte("created_at", ts)
    .order("created_at", { ascending: true })
    .limit(1);
  if (errAfter) throw new Error(`price_snapshots query failed: ${errAfter.message}`);

  const b = (before as Array<{ price: number; created_at: string }> | null)?.[0];
  const a = (after as Array<{ price: number; created_at: string }> | null)?.[0];

  if (!b && !a) return null;
  if (!b) return a!.price;
  if (!a) return b.price;

  // Return whichever is closer in time
  const diffB = Math.abs(targetTime.getTime() - new Date(b.created_at).getTime());
  const diffA = Math.abs(new Date(a.created_at).getTime() - targetTime.getTime());

  // Only use if within 20 min of target (snapshots are every 15 min via cron)
  const closest = diffB <= diffA ? b : a;
  const closestDiff = Math.min(diffB, diffA);
  return closestDiff <= SNAPSHOT_MATCH_WINDOW_MS ? closest.price : null;
}
