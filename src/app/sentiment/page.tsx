import { ASSETS, ASSET_PAIRS } from "@/lib/constants";
import { getAssetBias } from "@/lib/queries";
import { getHotAsset, getBiasHistory, getLatestSignal, getBiasAgo } from "@/lib/queries-bias";
import { getMarketQuotes } from "@/lib/market-data";
import { MarketBiasSection } from "@/components/bias/market-bias-section";

export const revalidate = 30;

export default async function SentimentPage() {
  const [biases, hotAsset, histories, quotes, latestSignals, biasAgos] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset)) }))),
    getHotAsset(),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset) }))),
    getMarketQuotes(),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getLatestSignal(asset) }))),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasAgo(asset) }))),
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

  return (
    <div className="animate-fade-in space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
            Community Sentiment
          </h1>
          <span className="font-sans text-xs text-tv-secondary">
            Gold &middot; Silver &middot; Oil
          </span>
        </div>
        <MarketBiasSection biases={biasData} />
      </section>

    </div>
  );
}
