"use client";

interface Props {
  traderSignals: Record<string, Array<{
    asset: string;
    weightedScore: number;
    consistent: boolean;
  }>>;
}

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C5CE",
  Oil: "#E8833A",
};

export function AssetAccuracy({ traderSignals }: Props) {
  // Aggregate all scored signals per asset
  const assetMap: Record<string, { total: number; wins: number; totalScore: number }> = {};

  for (const signals of Object.values(traderSignals)) {
    for (const s of signals) {
      if (!assetMap[s.asset]) assetMap[s.asset] = { total: 0, wins: 0, totalScore: 0 };
      assetMap[s.asset].total++;
      if (s.weightedScore > 0) assetMap[s.asset].wins++;
      assetMap[s.asset].totalScore += s.weightedScore;
    }
  }

  const assets = ["Gold", "Silver", "Oil"].map((asset) => ({
    asset,
    ...(assetMap[asset] ?? { total: 0, wins: 0, totalScore: 0 }),
    winRate: assetMap[asset] ? assetMap[asset].wins / assetMap[asset].total : 0,
  }));

  const hasData = assets.some((a) => a.total > 0);

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[13px] font-semibold tracking-wide text-white">
            Signal Accuracy per Asset
          </h2>
          <span className="font-mono text-[10px] text-white/20">all time</span>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-2 h-8 w-8 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
              <span className="text-[14px] text-white/20">⏳</span>
            </div>
            <p className="font-sans text-[12px] text-white/30">Collecting data...</p>
            <p className="mt-1 font-sans text-[10px] text-white/15">
              Shown once enough signals have been scored
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {assets.map((a) => {
              const color = ASSET_COLOR[a.asset] ?? "#fff";
              const pct = Math.round(a.winRate * 100);
              const quality = pct >= 65 ? "text-[#26A69A]" : pct >= 50 ? "text-[#FF9800]" : pct > 0 ? "text-[#EF5350]" : "text-white/20";

              return (
                <div key={a.asset} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-sans text-[11px] font-medium text-white/60">{a.asset}</span>
                  </div>

                  {a.total > 0 ? (
                    <>
                      <span className={`font-mono text-[22px] font-bold tabular-nums ${quality}`}>
                        {pct}%
                      </span>
                      <p className="mt-0.5 font-mono text-[10px] text-white/20">
                        {a.wins}/{a.total} correct
                      </p>
                      {/* Mini bar */}
                      <div className="mt-2 h-1 w-full rounded-full bg-white/[0.04]">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="font-mono text-[12px] text-white/15">No data</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
