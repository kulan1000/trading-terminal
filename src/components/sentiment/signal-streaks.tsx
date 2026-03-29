"use client";

import { usePollingFetch } from "@/hooks/use-polling-fetch";

interface Streak {
  asset: string;
  direction: string;
  count: number;
  latest: string;
  earliest: string;
}

interface Momentum {
  asset: string;
  recentCount: number;
  previousCount: number;
  acceleration: number;
  dominantDirection: string;
  bullish: number;
  bearish: number;
}

interface StreakData {
  streaks: Streak[];
  momentum: Momentum[];
}

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C5CE",
  Oil: "#E8833A",
};

const DIR_STYLE: Record<string, { label: string; bg: string; text: string; glow: string }> = {
  bullish: { label: "BULLISH", bg: "bg-[#26A69A]/10", text: "text-[#26A69A]", glow: "shadow-[0_0_12px_-3px_rgba(38,166,154,0.3)]" },
  bearish: { label: "BEARISH", bg: "bg-[#EF5350]/10", text: "text-[#EF5350]", glow: "shadow-[0_0_12px_-3px_rgba(239,83,80,0.3)]" },
  neutral: { label: "NEUTRAL", bg: "bg-[#FF9800]/10", text: "text-[#FF9800]", glow: "" },
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  return `${hours}h`;
}

function AccelIndicator({ value }: { value: number }) {
  if (value >= 1.5) return <span className="text-[10px] text-[#26A69A]">▲ Accelerating</span>;
  if (value >= 0.8) return <span className="text-[10px] text-white/30">→ Steady</span>;
  if (value > 0) return <span className="text-[10px] text-[#FF9800]">▽ Slowing</span>;
  return <span className="text-[10px] text-white/20">— Quiet</span>;
}

export function SignalStreaks() {
  const { data } = usePollingFetch<StreakData>({ url: "/api/streaks", intervalMs: 30_000, toastOnRefresh: false });

  if (!data) return null;

  const { streaks, momentum } = data;
  const hasStreaks = streaks.length > 0;
  const hasMomentum = momentum.some((m) => m.recentCount > 0);

  if (!hasStreaks && !hasMomentum) return null;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Streaks & Momentum
          </h2>
          <span className="font-mono text-[10px] text-white/20">24h window</span>
        </div>

        {/* Active streaks */}
        {hasStreaks && (
          <div className="mb-4 space-y-2">
            {streaks.map((s) => {
              const style = DIR_STYLE[s.direction] ?? DIR_STYLE.neutral;
              const color = ASSET_COLOR[s.asset] ?? "#fff";
              const duration = timeAgo(s.earliest);
              return (
                <div
                  key={s.asset}
                  className={`flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3 ${style.bg} ${style.glow}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full" style={{ backgroundColor: color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[13px] font-medium text-white">{s.asset}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-white/30">
                        {s.count} signals in a row · {duration} span
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-[20px] font-bold tabular-nums ${style.text}`}>
                      {s.count}×
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Momentum grid */}
        {hasMomentum && (
          <div className="grid grid-cols-3 gap-3">
            {momentum.map((m) => {
              const color = ASSET_COLOR[m.asset] ?? "#fff";
              const dir = DIR_STYLE[m.dominantDirection] ?? DIR_STYLE.neutral;
              return (
                <div
                  key={m.asset}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-sans text-[11px] font-medium text-white/60">{m.asset}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-mono text-[16px] font-bold tabular-nums ${dir.text}`}>
                      {m.recentCount}
                    </span>
                    <span className="font-mono text-[10px] text-white/20">signals/1h</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    {m.recentCount > 0 && (
                      <div className="flex gap-1.5">
                        {m.bullish > 0 && <span className="font-mono text-[10px] text-[#26A69A]">{m.bullish}↑</span>}
                        {m.bearish > 0 && <span className="font-mono text-[10px] text-[#EF5350]">{m.bearish}↓</span>}
                      </div>
                    )}
                    <AccelIndicator value={m.acceleration} />
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
