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

const COLUMNS = [
  { label: "#", align: "text-center" },
  { label: "Trader", align: "text-left" },
  { label: "Trades", align: "text-right" },
  { label: "Win Rate", align: "text-right" },
  { label: "PnL", align: "text-right" },
];

export function TraderLeaderboard() {
  const [traders, setTraders] = useState<Trader[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setTraders(d.traders ?? []))
      .catch((err) => console.error("[TraderLeaderboard]", err));
  }, []);

  if (!traders.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Trader Ranking
          </h3>
          <p className="mt-3 font-sans text-[12px] text-white/30">
            No completed trades yet. Rankings appear after entries are paired with exits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Trader Ranking
        </h3>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_80px_80px_90px] border-y border-white/[0.04] bg-white/[0.015] px-5 py-2.5">
        {COLUMNS.map((col) => (
          <span key={col.label} className={`font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 ${col.align}`}>
            {col.label}
          </span>
        ))}
      </div>

      {/* Table rows */}
      <div>
        {traders.map((t, i) => {
          const pnlColor = t.total_pnl >= 0 ? "text-[#26A69A]" : "text-[#EF5350]";
          const wrColor = t.win_rate >= 0.6 ? "text-[#26A69A]" : t.win_rate >= 0.4 ? "text-[#FF9800]" : "text-[#EF5350]";
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

          return (
            <div key={t.discord_user} className="grid grid-cols-[40px_1fr_80px_80px_90px] items-center border-b border-white/[0.03] px-5 py-3 transition-colors hover:bg-white/[0.025]">
              <span className="text-center font-sans text-[13px] text-white/50">{medal}</span>
              <span className="truncate font-sans text-[14px] font-semibold text-white">{t.discord_user}</span>
              <span className="text-right font-mono text-[13px] tabular-nums text-white/50">{t.total_trades}</span>
              <span className={`text-right font-mono text-[13px] tabular-nums ${wrColor}`}>
                {(t.win_rate * 100).toFixed(0)}%
              </span>
              <span className={`text-right font-mono text-[13px] font-medium tabular-nums ${pnlColor}`}>
                {t.total_pnl >= 0 ? "+" : ""}{t.total_pnl.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
