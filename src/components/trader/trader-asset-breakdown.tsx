"use client";

interface AssetBreakdown {
  [asset: string]: { total: number; bullish: number; bearish: number; entries: number; exits: number };
}

export function TraderAssetBreakdown({ breakdown }: { breakdown: AssetBreakdown }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Asset Breakdown
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(breakdown).map(([asset, d]) => {
            const bullPct = d.total > 0 ? Math.round((d.bullish / d.total) * 100) : 50;
            return (
              <div key={asset} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[13px] font-medium text-white/70">{asset}</span>
                  <span className="font-mono text-[11px] text-white/30">{d.total} signaler</span>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                  <div className="bg-[#26A69A]/60" style={{ width: `${bullPct}%` }} />
                  <div className="bg-[#EF5350]/60" style={{ width: `${100 - bullPct}%` }} />
                </div>
                <div className="flex justify-between font-mono text-[9px] text-white/20">
                  <span>{d.entries} entries</span>
                  <span>{d.exits} exits</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
