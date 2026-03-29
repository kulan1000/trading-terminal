"use client";

import { useEffect, useState, useCallback } from "react";
import { ASSET_PAIRS } from "@/lib/constants";
import type { Asset } from "@/lib/types";
import { AssetBiasCard } from "@/components/bias/asset-bias-card";
import { RecentSignals } from "@/components/bias/recent-signals";
import { SignalFeed } from "@/components/bias/signal-feed";
import { TargetsPanel } from "@/components/bias/targets-panel";
import { BiasSummary } from "@/components/bias/bias-summary";
import { TraderLeaderboard } from "@/components/bias/trader-leaderboard";
import { FetchError } from "@/components/ui/fetch-error";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BiasData {
  biases: any[];
  signals: any[];
  messages: any[];
  traderScores: Record<string, number>;
  targets: any[];
  hotAsset: { asset: string } | null;
  historyMap: Record<string, any[]>;
}

export default function BiasPage() {
  const [data, setData] = useState<BiasData | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/bias-data")
      .then((r) => r.json())
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (error) {
    return (
      <div className="py-10">
        <FetchError onRetry={fetchData} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">Market Bias</h1>
          <span className="font-sans text-[12px] text-white/30">Gold &middot; Silver &middot; Oil</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">Market Bias</h1>
        <span className="font-sans text-[12px] text-white/30">Gold &middot; Silver &middot; Oil</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {data.biases.map((b: any) => (
          <AssetBiasCard
            key={b.asset}
            asset={b.asset}
            pair={ASSET_PAIRS[b.asset as Asset]}
            direction={b.direction}
            score={b.score}
            count={b.count}
            isHot={data.hotAsset?.asset === b.asset}
            history={data.historyMap[b.asset]}
          />
        ))}
      </div>

      <BiasSummary />

      <div className="grid grid-cols-3 gap-4">
        <RecentSignals signals={data.signals} />
        <SignalFeed messages={data.messages} traderScores={data.traderScores} />
        <TargetsPanel targets={data.targets} />
      </div>

      <TraderLeaderboard />
    </div>
  );
}
