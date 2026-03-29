"use client";

import { fmtAgo } from "@/lib/format-utils";

interface Activity {
  lastSignal: string | null;
  lastMessage: string | null;
  totalSignals: number;
  entryCount: number;
  exitCount: number;
  positionCount: number;
  avgConfidence: number;
  assetAccuracy: Record<string, { scored: number; positive: number; avgScore: number }>;
}

export function TraderActivitySummary({ activity }: { activity: Activity }) {
  const items = [
    { label: "Signaler", value: `${activity.totalSignals}`, sub: `${activity.entryCount}E ${activity.exitCount}X ${activity.positionCount}P` },
    { label: "Snitt-confidence", value: `${activity.avgConfidence}%`, sub: null },
    { label: "Senaste signal", value: activity.lastSignal ? fmtAgo(activity.lastSignal) : "—", sub: null },
    { label: "Senaste meddelande", value: activity.lastMessage ? fmtAgo(activity.lastMessage) : "—", sub: null },
  ];

  const accuracyEntries = Object.entries(activity.assetAccuracy);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Aktivitetsöversikt
        </h4>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-mono text-[16px] font-bold text-white tabular-nums">{item.value}</p>
              <p className="font-sans text-[9px] uppercase tracking-[0.06em] text-white/30">{item.label}</p>
              {item.sub && <p className="font-mono text-[9px] text-white/20 mt-0.5">{item.sub}</p>}
            </div>
          ))}
        </div>
        {accuracyEntries.length > 0 && (
          <>
            <h5 className="mt-3 mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.06em] text-white/25">
              Träffsäkerhet per asset
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {accuracyEntries.map(([asset, acc]) => (
                <div key={asset} className="rounded-lg bg-white/[0.03] px-3 py-2 text-center">
                  <p className="font-sans text-[10px] text-white/50">{asset}</p>
                  <p className={`font-mono text-[14px] font-bold tabular-nums ${acc.avgScore > 0 ? "text-[#26A69A]" : acc.avgScore < 0 ? "text-[#EF5350]" : "text-white/40"}`}>
                    {acc.positive}/{acc.scored}
                  </p>
                  <p className="font-mono text-[9px] text-white/20">snitt {acc.avgScore > 0 ? "+" : ""}{acc.avgScore}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
