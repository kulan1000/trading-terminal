import { ASSETS, ASSET_PAIRS } from "@/lib/constants";
import { getAssetBias } from "@/lib/queries";
import { getHotAsset, getBiasHistory } from "@/lib/queries-bias";
import { MarketBiasSection } from "@/components/bias/market-bias-section";
import { SentimentLive } from "@/components/sentiment/sentiment-live";

export const revalidate = 30;

export default async function SentimentPage() {
  const [biases, hotAsset, histories] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset)) }))),
    getHotAsset(),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset) }))),
  ]);

  const historyMap = Object.fromEntries(histories.map((h) => [h.asset, h.data]));

  const biasData = biases.map((b) => ({
    asset: b.asset,
    direction: b.direction,
    score: b.score,
    count: b.count,
    isHot: hotAsset?.asset === b.asset,
    history: historyMap[b.asset] ?? [],
  }));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Market Bias overview — clickable cards with detail modal */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
            Market Bias
          </h1>
          <span className="font-sans text-xs text-tv-secondary">
            Gold &middot; Silver &middot; Oil
          </span>
        </div>

        <MarketBiasSection biases={biasData} />
      </section>

      {/* Real-time sentiment — client-rendered */}
      <SentimentLive />
    </div>
  );
}
