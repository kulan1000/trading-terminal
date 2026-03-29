"use client";

interface AssetStats {
  total: number;
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
}

const ASSET_ORDER = ["Gold", "Silver", "Oil"];

export function AssetBreakdown({ data }: { data: Record<string, AssetStats> }) {
  const assets = ASSET_ORDER.filter((a) => data[a]);

  if (!assets.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <h2 className="font-sans text-[13px] font-medium text-white/70">Signal-fördelning (24h)</h2>
        <p className="mt-3 font-sans text-[12px] text-white/25">Inga signaler senaste 24h</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h2 className="mb-4 font-sans text-[13px] font-medium text-white/70">Signal-fördelning (24h)</h2>
      <div className="space-y-4">
        {assets.map((asset) => {
          const s = data[asset];
          const bullPct = s.total > 0 ? Math.round((s.bullish / s.total) * 100) : 50;
          const bearPct = 100 - bullPct;
          return (
            <div key={asset}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-sans text-[12px] font-medium text-white/60">{asset}</span>
                <span className="font-mono text-[11px] text-white/30">{s.total} signaler</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div className="bg-[#26A69A]/70 transition-all" style={{ width: `${bullPct}%` }} />
                <div className="bg-[#EF5350]/70 transition-all" style={{ width: `${bearPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[9px]">
                <span className="text-[#26A69A]/70">BULL {bullPct}%</span>
                <div className="flex gap-2 text-white/25">
                  <span>{s.entries} entries</span>
                  <span>{s.exits} exits</span>
                </div>
                <span className="text-[#EF5350]/70">BEAR {bearPct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
