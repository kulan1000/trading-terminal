import { ASSETS, ASSET_PAIRS } from "@/lib/constants";
import { getAssetBias, getRecentSignals, getSignalFeed } from "@/lib/queries";
import { getRecentTargets, getHotAsset, getBiasHistory } from "@/lib/queries-bias";
import { getTraderScores } from "@/lib/queries-stats";
import { AssetBiasCard } from "@/components/bias/asset-bias-card";
import { RecentSignals } from "@/components/bias/recent-signals";
import { SignalFeed } from "@/components/bias/signal-feed";
import { TargetsPanel } from "@/components/bias/targets-panel";
import { BiasSummary } from "@/components/bias/bias-summary";
import { TraderLeaderboard } from "@/components/bias/trader-leaderboard";

export const revalidate = 30;

export default async function BiasPage() {
  const [biases, signals, messages, traderScores, targets, hotAsset, histories] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset)) }))),
    getRecentSignals(),
    getSignalFeed(),
    getTraderScores(),
    getRecentTargets(),
    getHotAsset(),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset) }))),
  ]);

  const historyMap = Object.fromEntries(histories.map((h) => [h.asset, h.data]));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Market Bias
        </h1>
        <span className="font-sans text-[12px] text-white/30">
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

      <div className="grid grid-cols-3 gap-4">
        <RecentSignals signals={signals} />
        <SignalFeed messages={messages} traderScores={traderScores} />
        <TargetsPanel targets={targets} />
      </div>

      <TraderLeaderboard />
    </div>
  );
}
