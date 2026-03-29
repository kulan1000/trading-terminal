"use client";

interface Props {
  totalScored: number;
  totalTraders: number;
  totalPairs: number;
  openPositions: number;
}

export function ScoringStatus({ totalScored, totalTraders, totalPairs, openPositions }: Props) {
  const hasScores = totalScored > 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="font-sans text-[22px] tabular-nums text-white">
              {totalTraders}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-wider text-white/40">
              Traders
            </div>
          </div>
          <div>
            <div className={`font-sans text-[22px] tabular-nums ${hasScores ? "text-[#26A69A]" : "text-white/30"}`}>
              {totalScored}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-wider text-white/40">
              Scored
            </div>
          </div>
          <div>
            <div className={`font-sans text-[22px] tabular-nums ${openPositions > 0 ? "text-[#FF9800]" : "text-white/30"}`}>
              {openPositions}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-wider text-white/40">
              Pending
            </div>
          </div>
          <div>
            <div className={`font-sans text-[22px] tabular-nums ${totalPairs > 0 ? "text-[#FF9800]" : "text-white/30"}`}>
              {totalPairs}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-wider text-white/40">
              Trade Pairs
            </div>
          </div>
        </div>

        {!hasScores && (
          <div className="mt-3 rounded-lg bg-[#FF9800]/10 px-4 py-2.5">
            <p className="font-sans text-[12px] text-[#FF9800]">
              Scoring aktiveras vid marknadsoppning (son 18:00 ET / man 00:00 sv).
              Signaler scornas automatiskt 4h efter skapande med prischecks vid 30m, 1h, 2h och 4h.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
