"use client";

interface Props {
  todayOpenAICalls: number;
  todayCostUsd: number;
}

export function CostCard({ todayOpenAICalls, todayCostUsd }: Props) {
  const monthlyEstimate = todayCostUsd * 30;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-center justify-between">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            OpenAI (idag)
          </p>
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[8px] tabular-nums text-white/30">
            {todayOpenAICalls} calls
          </span>
        </div>
        <p className={`mt-2 font-mono text-[24px] font-bold tabular-nums ${todayCostUsd > 1 ? "text-[#FF9800]" : "text-[#26A69A]"}`}>
          ${todayCostUsd.toFixed(4)}
        </p>
        <p className="mt-1 font-sans text-[10px] text-white/25">
          ~${monthlyEstimate.toFixed(2)}/mån prognos
        </p>
      </div>
    </div>
  );
}
