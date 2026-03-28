import { ASSETS, ASSET_PAIRS } from "@/lib/constants";
import { getAssetBias } from "@/lib/queries";
import { getHotAsset, getBiasHistory } from "@/lib/queries-bias";
import { AssetBiasCard } from "@/components/bias/asset-bias-card";
import { BiasSummary } from "@/components/bias/bias-summary";
import { SentimentLive } from "@/components/sentiment/sentiment-live";

export const revalidate = 30;

export default async function SentimentPage() {
  const [biases, hotAsset, histories] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset)) }))),
    getHotAsset(),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset) }))),
  ]);

  const historyMap = Object.fromEntries(histories.map((h) => [h.asset, h.data]));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Market Bias overview — server-rendered */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
            Market Bias
          </h1>
          <span className="font-sans text-xs text-tv-secondary">
            Gold &middot; Silver &middot; Oil
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {biases.map((b) => (
            <AssetBiasCard
              key={b.asset}
              asset={b.asset}
              pair={ASSET_PAIRS[b.asset]}
              direction={b.direction}
              score={b.score}
              count={b.count}
              isHot={hotAsset?.asset === b.asset}
              history={historyMap[b.asset]}
            />
          ))}
        </div>

        <BiasSummary />
      </section>

      {/* Real-time sentiment — client-rendered */}
      <SentimentLive />
    </div>
  );
}
