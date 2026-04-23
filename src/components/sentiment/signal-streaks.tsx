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
  Silver: "#D0D5DE",
  Oil: "#C9843F",
};

const DIR_COLOR: Record<string, string> = {
  bullish: "#26A69A",
  bearish: "#EF5350",
  neutral: "#FF9800",
};

function timeSpan(earliest: string): string {
  const mins = Math.round((Date.now() - new Date(earliest).getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = mins / 60;
  return hours < 10 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`;
}

function trendLabel(accel: number): { label: string; dir: "up" | "down" | "flat" } {
  if (accel >= 1.5) return { label: "Accelerating", dir: "up" };
  if (accel >= 0.8) return { label: "Steady", dir: "flat" };
  if (accel > 0) return { label: "Slowing", dir: "down" };
  return { label: "Quiet", dir: "flat" };
}

function perHour(recent: number): string {
  // recentCount is "signals in last hour" so per/h is just the count
  return `${recent}/h`;
}

/**
 * Sentiment v2 split: Active streaks (1.4fr) + Signal velocity (1fr).
 * Both cards have hover lift matching the hero cards above.
 */
export function SignalStreaks() {
  const { data } = usePollingFetch<StreakData>({
    url: "/api/streaks",
    intervalMs: 30_000,
    toastOnRefresh: false,
  });

  if (!data) return null;

  const streaks = data.streaks ?? [];
  const momentum = (data.momentum ?? []).filter((m) => m.recentCount > 0 || m.previousCount > 0);

  if (streaks.length === 0 && momentum.length === 0) return null;

  return (
    <section className="animate-fade-in space-y-2.5">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">
          Streaks &amp; Momentum
        </h2>
        <span className="font-sans text-[10px] text-white/40">24h window</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* Active streaks */}
        <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#141414]">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="font-sans text-[11px] font-medium text-white/60">
              Active streaks
            </span>
          </div>
          <div className="px-5 pb-2">
            {streaks.length === 0 ? (
              <div className="py-6 text-center font-sans text-[12px] text-white/30">
                No active streaks
              </div>
            ) : (
              streaks.map((s, i) => {
                const color = DIR_COLOR[s.direction] ?? "#FF9800";
                const span = timeSpan(s.earliest);
                const last = i === streaks.length - 1;
                return (
                  <div
                    key={s.asset + i}
                    className={`flex items-center gap-4 py-3.5 ${last ? "" : "border-b border-white/[0.05]"}`}
                  >
                    <span
                      className="block h-7 w-[3px] rounded-sm"
                      style={{
                        background: color,
                        boxShadow: `0 0 10px ${color}`,
                      }}
                    />
                    <div className="min-w-[60px]">
                      <div className="font-sans text-[14px] font-medium text-white">
                        {s.asset}
                      </div>
                      <div className="mt-0.5 font-sans text-[11px] text-white/50">
                        {s.direction}
                      </div>
                    </div>
                    <div className="flex-1" />
                    <span
                      className="font-mono text-[22px] font-semibold leading-none tracking-tight tabular-nums"
                      style={{ color }}
                    >
                      {s.count}
                      <span className="text-[14px] opacity-60">×</span>
                    </span>
                    <span className="min-w-[36px] text-right font-mono text-[12px] tabular-nums text-white/50">
                      {span}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Signal velocity */}
        <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#141414]">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="font-sans text-[11px] font-medium text-white/60">
              Signal velocity
            </span>
          </div>
          <div className="px-5 pb-2">
            {momentum.length === 0 ? (
              <div className="py-6 text-center font-sans text-[12px] text-white/30">
                No recent signals
              </div>
            ) : (
              momentum.map((m, i) => {
                const color = ASSET_COLOR[m.asset] ?? "#ffffff";
                const t = trendLabel(m.acceleration);
                const tColor =
                  t.dir === "up"
                    ? "text-[#26A69A]"
                    : t.dir === "down"
                      ? "text-[#EF5350]"
                      : "text-white/50";
                const arrow = t.dir === "up" ? "▲" : t.dir === "down" ? "▼" : "—";
                const last = i === momentum.length - 1;
                return (
                  <div
                    key={m.asset + i}
                    className={`flex items-center gap-3 py-3.5 ${last ? "" : "border-b border-white/[0.05]"}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <span className="font-sans text-[14px] font-medium text-white">
                      {m.asset}
                    </span>
                    <div className="flex-1" />
                    <span className="font-mono text-[14px] font-medium tabular-nums text-white">
                      {perHour(m.recentCount)}
                    </span>
                    <span
                      className={`min-w-[90px] text-right font-sans text-[11px] ${tColor}`}
                    >
                      {arrow} {t.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
