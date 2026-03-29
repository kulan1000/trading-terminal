"use client";

interface AssetStats {
  total: number;
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
}

const ASSET_ORDER = ["Gold", "Silver", "Oil"];
const ASSET_ACCENT: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C5CE",
  Oil: "#E8833A",
};

export function AssetBreakdown({ data }: { data: Record<string, AssetStats> }) {
  const assets = ASSET_ORDER.filter((a) => data[a]);

  if (!assets.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Signal-fördelning (24h)</h2>
          <p className="mt-3 font-sans text-[12px] text-white/25">Inga signaler senaste 24h</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-5">
        <h2 className="mb-4 font-sans text-[15px] font-semibold tracking-wide text-white">Signal-fördelning (24h)</h2>
        <div className="space-y-5">
          {assets.map((asset) => {
            const s = data[asset];
            const bullPct = s.total > 0 ? Math.round((s.bullish / s.total) * 100) : 50;
            const bearPct = 100 - bullPct;
            return (
              <div key={asset}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: ASSET_ACCENT[asset] }} />
                    <span className="font-sans text-[13px] font-medium text-white/70">{asset}</span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-white/30">{s.total} signals</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                  <div className="bg-[#26A69A]/60 transition-all duration-500" style={{ width: `${bullPct}%` }} />
                  <div className="bg-[#EF5350]/60 transition-all duration-500" style={{ width: `${bearPct}%` }} />
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="font-mono text-[9px] tabular-nums text-[#26A69A]/70">BULL {bullPct}%</span>
                  <div className="flex gap-3 font-mono text-[9px] tabular-nums text-white/20">
                    <span>{s.entries} entries</span>
                    <span>{s.exits} exits</span>
                  </div>
                  <span className="font-mono text-[9px] tabular-nums text-[#EF5350]/70">BEAR {bearPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
