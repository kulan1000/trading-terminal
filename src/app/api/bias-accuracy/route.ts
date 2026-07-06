import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 300; // 5 min cache

// How far back the accuracy stats look. Both tables grow ~100-300 rows/day
// per asset, so the window keeps row counts small enough to page through —
// an un-windowed select silently caps at 1000 rows (PostgREST default) and
// was computing "accuracy" against only the oldest 1000 price snapshots.
const WINDOW_DAYS = 14;
const PAGE = 1000;

interface SnapRow { asset: string; direction: string; score: number; created_at: string }
interface PriceRow { asset: string; price: number; created_at: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
async function pageAll<T>(build: (from: number, to: number) => any, maxPages: number): Promise<T[]> {
  const rows: T[] = [];
  for (let p = 0; p < maxPages; p++) {
    const { data } = await build(p * PAGE, p * PAGE + PAGE - 1);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600_000).toISOString();

    const snapshots = await pageAll<SnapRow>(
      (from, to) =>
        supabase
          .from("bias_snapshots")
          .select("asset, direction, score, created_at")
          .in("direction", ["bullish", "bearish"])
          .gte("score", 60)
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .range(from, to),
      10,
    );
    if (!snapshots.length) return NextResponse.json({ rows: [] });

    const prices = await pageAll<PriceRow>(
      (from, to) =>
        supabase
          .from("price_snapshots")
          .select("asset, price, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .range(from, to),
      20,
    );
    if (prices.length < 10) return NextResponse.json({ rows: [] });

    const pricesByAsset: Record<string, Array<{ ms: number; price: number }>> = {};
    for (const p of prices) {
      (pricesByAsset[p.asset] ??= []).push({ ms: new Date(p.created_at).getTime(), price: p.price });
    }
    // rows arrive created_at-ascending, so each per-asset array is sorted by ms

    // For each bias snapshot, find closest price at snapshot time and 4h later
    const results: Record<string, { total: number; correct: number }> = {};

    for (const snap of snapshots) {
      const assetPrices = pricesByAsset[snap.asset];
      if (!assetPrices?.length) continue;

      const snapTime = new Date(snap.created_at).getTime();
      const priceNow = findClosest(assetPrices, snapTime, 20 * 60_000);
      const priceLater = findClosest(assetPrices, snapTime + 4 * 3600_000, 20 * 60_000);
      if (!priceNow || !priceLater) continue;

      const key = `${snap.asset}|${snap.direction}`;
      if (!results[key]) results[key] = { total: 0, correct: 0 };
      results[key].total++;

      const priceWentUp = priceLater.price > priceNow.price;
      if (
        (snap.direction === "bullish" && priceWentUp) ||
        (snap.direction === "bearish" && !priceWentUp)
      ) {
        results[key].correct++;
      }
    }

    const rows = Object.entries(results).map(([key, v]) => {
      const [asset, direction] = key.split("|");
      return {
        asset,
        direction,
        total: v.total,
        correct: v.correct,
        pct: v.total > 0 ? Math.round((v.correct / v.total) * 100 * 10) / 10 : 0,
      };
    });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[BIAS-ACCURACY]", err);
    return NextResponse.json({ rows: [] });
  }
}

/** Binary search over an ms-sorted price array — the linear scan was
 *  O(snapshots × prices) and blew up once both tables held weeks of data. */
function findClosest(
  sorted: Array<{ ms: number; price: number }>,
  targetMs: number,
  maxDiffMs: number,
): { price: number } | null {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].ms < targetMs) lo = mid + 1;
    else hi = mid;
  }
  let best: { ms: number; price: number } | null = null;
  for (const cand of [sorted[lo - 1], sorted[lo]]) {
    if (!cand) continue;
    const diff = Math.abs(cand.ms - targetMs);
    if (diff <= maxDiffMs && (!best || diff < Math.abs(best.ms - targetMs))) best = cand;
  }
  return best ? { price: best.price } : null;
}
