import { ASSETS, ASSET_PAIRS } from "@/lib/constants";
import { getAssetBias, getRecentSignals, getSignalFeed } from "@/lib/queries";
import { getTraderScores } from "@/lib/queries-stats";
import { AssetBiasCard } from "@/components/bias/asset-bias-card";
import { RecentSignals } from "@/components/bias/recent-signals";
import { SignalFeed } from "@/components/bias/signal-feed";
import { TraderLeaderboard } from "@/components/bias/trader-leaderboard";

export const revalidate = 30;

export default async function BiasPage() {
  const [biases, signals, messages, traderScores] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset)) }))),
    getRecentSignals(),
    getSignalFeed(),
    getTraderScores(),
  ]);

  return (
    <div className="animate-fade-in space-y-4">
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
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RecentSignals signals={signals} />
        <SignalFeed messages={messages} traderScores={traderScores} />
      </div>

      <TraderLeaderboard />
    </div>
  );
}
