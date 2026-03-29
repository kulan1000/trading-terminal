"use client";

import { useEffect, useState } from "react";

interface BiasAccRow {
  asset: string;
  direction: string;
  total: number;
  correct: number;
  pct: number;
}

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C5CE",
  Oil: "#E8833A",
};

export function BiasAccuracy() {
  const [data, setData] = useState<BiasAccRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bias-accuracy")
      .then((r) => r.json())
      .then((d) => setData(d.rows ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const hasData = data && data.length > 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-sans text-[13px] font-semibold tracking-wide text-white">
            Historical Bias Accuracy
          </h2>
          <span className="font-mono text-[10px] text-white/20">bias vs price 4h later</span>
        </div>

        <p className="mb-4 font-sans text-[11px] leading-relaxed text-white/30">
          Hur ofta stämde vår bias-riktning med faktisk prisrörelse 4 timmar senare?
          Mäter systemets prediktiva förmåga.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <span className="animate-pulse font-sans text-[11px] text-white/20">Laddar...</span>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] py-8">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
              <span className="text-[16px] text-white/20">📊</span>
            </div>
            <p className="font-sans text-[12px] font-medium text-white/30">Samlar data...</p>
            <p className="mt-1 max-w-[240px] text-center font-sans text-[10px] leading-relaxed text-white/15">
              Kräver prisdata (price_snapshots) med 4h historik per bias-snapshot.
              Fylls automatiskt när pipeline körs under marknadstid.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(["Gold", "Silver", "Oil"] as const).map((asset) => {
              const rows = data.filter((r) => r.asset === asset);
              if (!rows.length) return null;
              const color = ASSET_COLOR[asset];
              const total = rows.reduce((s, r) => s + r.total, 0);
              const correct = rows.reduce((s, r) => s + r.correct, 0);
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              const quality = pct >= 65 ? "text-[#26A69A]" : pct >= 50 ? "text-[#FF9800]" : "text-[#EF5350]";

              return (
                <div key={asset} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                  <div className="h-8 w-1 rounded-full" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[12px] font-medium text-white">{asset}</span>
                      <span className={`font-mono text-[18px] font-bold tabular-nums ${quality}`}>{pct}%</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1 w-full rounded-full bg-white/[0.04]">
                          <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-white/20">{correct}/{total} correct</span>
                    </div>
                    {rows.map((r) => (
                      <span key={r.direction} className="mr-2 font-mono text-[9px] text-white/15">
                        {r.direction}: {Math.round(r.pct)}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
