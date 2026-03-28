"use client";

import { useEffect, useState } from "react";

interface Trader {
  discord_user: string;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
  score: number;
}

export function TraderLeaderboard() {
  const [traders, setTraders] = useState<Trader[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setTraders(d.traders ?? []))
      .catch(() => {});
  }, []);

  if (!traders.length) {
    return (
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-4">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Trader Ranking
        </h3>
        <p className="text-xs text-tv-text-subtle">
          No completed trades yet. Rankings appear after entries are paired with exits.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Trader Ranking
      </h3>
      <div className="space-y-1.5">
        {traders.map((t, i) => {
          const pnlColor = t.total_pnl >= 0 ? "text-tv-green" : "text-tv-red";
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return (
            <div key={t.discord_user} className="flex items-center gap-2 font-mono text-xs">
              <span className="w-6 text-center">{medal}</span>
              <span className="flex-1 truncate font-sans text-tv-text">{t.discord_user}</span>
              <span className="text-tv-text-secondary">{t.total_trades} trades</span>
              <span className="w-12 text-right text-tv-orange">
                {(t.win_rate * 100).toFixed(0)}%
              </span>
              <span className={`w-16 text-right ${pnlColor}`}>
                {t.total_pnl >= 0 ? "+" : ""}{t.total_pnl.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
