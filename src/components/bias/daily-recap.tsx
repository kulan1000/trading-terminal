"use client";

import { usePollingFetch } from "@/hooks/use-polling-fetch";

interface TopTrader {
  author: string;
  count: number;
  direction: string;
  winRate: number | null;
}

interface Summary {
  asset: string;
  direction: string;
  bias_score: number;
  signal_count: number;
  top_traders: TopTrader[];
  summary_date: string;
}

const BIAS_STYLE: Record<string, { label: string; chipBg: string; chipText: string; num: string }> = {
  bullish: { label: "BULLISH", chipBg: "bg-[#26A69A]/15", chipText: "text-[#26A69A]", num: "text-[#26A69A]" },
  bearish: { label: "BEARISH", chipBg: "bg-[#EF5350]/15", chipText: "text-[#EF5350]", num: "text-[#EF5350]" },
  neutral: { label: "NEUTRAL", chipBg: "bg-[#FF9800]/15", chipText: "text-[#FF9800]", num: "text-[#FF9800]" },
};

const DIR_DOT: Record<string, string> = {
  bullish: "text-[#26A69A]",
  bearish: "text-[#EF5350]",
  neutral: "text-[#FF9800]",
};

function credBadge(winRate: number | null) {
  if (winRate == null) return null;
  const pct = Math.round(winRate * 100);
  const cls = pct >= 70 ? "text-[#26A69A]" : pct >= 50 ? "text-[#FF9800]" : "text-[#EF5350]";
  return <span className={`ml-1 font-mono text-[10px] tabular-nums ${cls}`}>{pct}%</span>;
}

export function DailyRecap() {
  const { data } = usePollingFetch<Summary[]>({ url: "/api/daily-summary", intervalMs: 120_000 });

  if (!data || data.length === 0) return null;

  const date = data[0].summary_date;

  return (
    <section className="animate-fade-in space-y-2.5">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">
          Daily Recap
        </h2>
        <span className="font-mono text-[10px] tabular-nums text-white/40">{date}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {data.map((s) => {
          const b = BIAS_STYLE[s.direction] ?? BIAS_STYLE.neutral;
          return (
            <div
              key={s.asset}
              className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.12] hover:bg-[#151515]"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-[14px] font-medium text-white">{s.asset}</span>
                <span
                  className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${b.chipBg} ${b.chipText}`}
                >
                  {b.label}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className={`font-mono text-[28px] font-bold tabular-nums ${b.num}`}>
                  {s.bias_score}
                  <span className="text-[16px] opacity-60">%</span>
                </span>
                <span className="font-sans text-[12px] text-white/40">
                  · {s.signal_count} signals
                </span>
              </div>

              {s.top_traders.length > 0 && (
                <div className="mt-3 border-t border-white/[0.05] pt-2.5">
                  {s.top_traders.slice(0, 3).map((t) => (
                    <div
                      key={t.author}
                      className="flex items-center gap-2 py-1.5"
                    >
                      <span className={`font-sans text-[9px] ${DIR_DOT[t.direction] ?? "text-white/40"}`}>
                        ●
                      </span>
                      <span className="flex-1 truncate font-sans text-[12px] text-white">
                        {t.author}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-white/40">
                        {t.count} signals
                      </span>
                      {credBadge(t.winRate)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
