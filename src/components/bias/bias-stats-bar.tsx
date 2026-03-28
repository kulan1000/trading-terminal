"use client";

import type { BiasDetailStats } from "./bias-detail-types";

export function BiasStatsBar({ stats }: { stats: BiasDetailStats }) {
  const items = [
    { label: "Bullish", value: `${stats.weightedBullPct}%`, sub: `${stats.bullish} st`, cls: "text-[#26A69A]" },
    { label: "Bearish", value: `${stats.weightedBearPct}%`, sub: `${stats.bearish} st`, cls: "text-[#EF5350]" },
    { label: "Entries", value: String(stats.entries), sub: null, cls: "text-[#2962FF]" },
    { label: "Exits", value: String(stats.exits), sub: null, cls: "text-white/50" },
    { label: "Traders", value: String(stats.uniqueTraders), sub: null, cls: "text-white" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((s) => (
        <div key={s.label} className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="p-3">
            <p className={`font-mono text-[18px] font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">{s.label}</p>
            {s.sub && <p className="mt-0.5 font-mono text-[9px] text-white/20">{s.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
