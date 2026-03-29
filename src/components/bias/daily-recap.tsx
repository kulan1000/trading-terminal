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

const DIR_COLORS: Record<string, string> = {
  bullish: "text-emerald-400",
  bearish: "text-red-400",
  neutral: "text-zinc-400",
};

const DIR_BG: Record<string, string> = {
  bullish: "bg-emerald-500/10 border-emerald-500/20",
  bearish: "bg-red-500/10 border-red-500/20",
  neutral: "bg-zinc-500/10 border-zinc-500/20",
};

function credBadge(winRate: number | null) {
  if (winRate == null) return null;
  const pct = Math.round(winRate * 100);
  const color = pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
  return <span className={`ml-1 text-[10px] ${color}`}>{pct}%</span>;
}

export function DailyRecap() {
  const { data } = usePollingFetch<Summary[]>({ url: "/api/daily-summary", intervalMs: 120_000 });

  if (!data || data.length === 0) return null;

  const date = data[0].summary_date;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-tv-heading">
          Daily Recap
        </h2>
        <span className="font-mono text-[10px] text-tv-secondary">{date}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {data.map((s) => (
          <div
            key={s.asset}
            className={`rounded-lg border p-3 ${DIR_BG[s.direction] ?? DIR_BG.neutral}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-tv-text">{s.asset}</span>
              <span className={`font-mono text-xs font-bold ${DIR_COLORS[s.direction] ?? ""}`}>
                {s.direction.toUpperCase()} {s.bias_score}%
              </span>
            </div>

            <div className="mt-1 font-mono text-[10px] text-tv-secondary">
              {s.signal_count} signals today
            </div>

            {s.top_traders.length > 0 && (
              <div className="mt-2 space-y-0.5">
                <div className="font-mono text-[10px] text-tv-secondary">Top traders:</div>
                {s.top_traders.slice(0, 3).map((t) => (
                  <div key={t.author} className="flex items-center gap-1 font-mono text-[10px]">
                    <span className={DIR_COLORS[t.direction] ?? "text-tv-text"}>
                      {t.direction === "bullish" ? "▲" : "▼"}
                    </span>
                    <span className="text-tv-text">{t.author}</span>
                    <span className="text-tv-secondary">({t.count})</span>
                    {credBadge(t.winRate)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
