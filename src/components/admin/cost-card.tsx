"use client";

interface Props {
  todayOpenAICalls: number;
  todayCostUsd: number;
}

export function CostCard({ todayOpenAICalls, todayCostUsd }: Props) {
  // Monthly estimate based on today's usage (rough)
  const monthlyEstimate = todayCostUsd * 30;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
      <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/40">
        OpenAI-kostnad (idag)
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-mono text-[24px] font-bold tabular-nums ${todayCostUsd > 1 ? "text-[#FF9800]" : "text-[#26A69A]"}`}>
          ${todayCostUsd.toFixed(4)}
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/30">
          {todayOpenAICalls} anrop
        </span>
      </div>
      <p className="mt-1 font-sans text-[10px] text-white/25">
        ~${monthlyEstimate.toFixed(2)}/mån om samma takt
      </p>
    </div>
  );
}
