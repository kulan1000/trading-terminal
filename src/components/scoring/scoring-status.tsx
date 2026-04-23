"use client";

interface Props {
  totalScored: number;
  totalTraders: number;
  totalEntries: number;
  totalExits: number;
  totalPairs: number;
}

export function ScoringStatus({ totalScored, totalTraders, totalEntries, totalExits, totalPairs }: Props) {
  const hasScores = totalScored > 0;

  const items = [
    { label: "Traders", value: totalTraders, color: "text-white" },
    { label: "Scored", value: totalScored, color: hasScores ? "text-[#26A69A]" : "text-white/30" },
    { label: "Entries", value: totalEntries, color: totalEntries > 0 ? "text-[#26A69A]" : "text-white/30" },
    { label: "Exits", value: totalExits, color: totalExits > 0 ? "text-[#FF9800]" : "text-white/30" },
    { label: "Trade Pairs", value: totalPairs, color: totalPairs > 0 ? "text-white" : "text-white/30" },
  ];

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="grid grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-center">
              <div className={`font-mono text-[18px] font-bold tabular-nums ${item.color}`}>
                {item.value}
              </div>
              <div className="mt-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {!hasScores && (
          <div className="mt-3 rounded-lg border border-[#FF9800]/20 bg-[#FF9800]/5 px-4 py-2.5">
            <p className="font-sans text-[12px] text-[#FF9800]/80">
              Scoring activates at market open (Sun 18:00 ET). Only entries and exits are scored — 30m, 1h, 2h and 4h after signal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
