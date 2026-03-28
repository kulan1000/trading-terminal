import { NextResponse } from "next/server";
import { ASSETS } from "@/lib/constants";
import { getAssetBias } from "@/lib/queries";
import { getHotAsset, getBiasHistory, getLatestSignal, getBiasAgo } from "@/lib/queries-bias";
import { getMarketQuotes } from "@/lib/market-data";

export const revalidate = 30;

export async function GET() {
  const fallbackBias = { direction: "neutral" as const, score: 0, count: 0, activeCount: 0 };

  const [biases, hotAsset, histories, quotes, latestSignals, biasAgos] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset).catch(() => fallbackBias)) }))),
    getHotAsset().catch(() => null),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset).catch(() => []) }))),
    getMarketQuotes().catch(() => [] as Awaited<ReturnType<typeof getMarketQuotes>>),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getLatestSignal(asset).catch(() => null) }))),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasAgo(asset).catch(() => null) }))),
  ]);

  const historyMap = Object.fromEntries(histories.map((h) => [h.asset, h.data]));
  const priceMap = Object.fromEntries(quotes.map((q) => [q.asset, { price: q.price, change: q.change, changePercent: q.changePercent }]));
  const latestMap = Object.fromEntries(latestSignals.map((l) => [l.asset, l.data]));
  const agoMap = Object.fromEntries(biasAgos.map((a) => [a.asset, a.data]));

  const biasData = biases.map((b) => {
    const ago = agoMap[b.asset];
    const flipped = ago ? ago.direction !== b.direction : false;
    return {
      asset: b.asset,
      direction: b.direction,
      score: b.score,
      count: b.count,
      activeCount: b.activeCount ?? 0,
      isHot: hotAsset?.asset === b.asset,
      flipped,
      history: historyMap[b.asset] ?? [],
      price: priceMap[b.asset]?.price ?? 0,
      change: priceMap[b.asset]?.change ?? 0,
      changePercent: priceMap[b.asset]?.changePercent ?? 0,
      latestSignal: latestMap[b.asset] ?? null,
      biasAgo: ago ?? null,
    };
  });

  return NextResponse.json(biasData);
}
