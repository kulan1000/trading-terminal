"use client";

import type { RecentTrade } from "@/hooks/use-scoring-data";

function duration(entryTime: string, exitTime: string): string {
  const ms = new Date(exitTime).getTime() - new Date(entryTime).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function RecentTrades({ trades }: { trades: RecentTrade[] }) {
  if (!trades.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-6">
        <h3 className="mb-2 text-sm font-semibold text-terminal-muted">RECENT TRADES</h3>
        <p className="text-xs text-zinc-500">Inga stängda trades ännu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-terminal-muted">RECENT CLOSED TRADES</h3>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-terminal-muted">
            <th className="pb-2 text-left">Trader</th>
            <th className="pb-2 text-left">Asset</th>
            <th className="pb-2 text-left">Dir</th>
            <th className="pb-2 text-right">Entry</th>
            <th className="pb-2 text-right">Exit</th>
            <th className="pb-2 text-right">P/L</th>
            <th className="pb-2 text-right">P/L %</th>
            <th className="pb-2 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const win = t.pnl > 0;
            const pnlColor = win ? "text-green-400" : t.pnl < 0 ? "text-red-400" : "text-zinc-400";
            return (
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-2 text-terminal-text">{t.author}</td>
                <td className="py-2 uppercase text-terminal-accent">{t.asset}</td>
                <td className="py-2">
                  <span className={
                    t.position === "long"
                      ? "rounded bg-green-900/40 px-1.5 py-0.5 text-green-400"
                      : "rounded bg-red-900/40 px-1.5 py-0.5 text-red-400"
                  }>
                    {t.position}
                  </span>
                </td>
                <td className="py-2 text-right text-terminal-text">${t.entryPrice.toFixed(2)}</td>
                <td className="py-2 text-right text-terminal-text">${t.exitPrice.toFixed(2)}</td>
                <td className={`py-2 text-right ${pnlColor}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </td>
                <td className={`py-2 text-right ${pnlColor}`}>
                  {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent.toFixed(1)}%
                </td>
                <td className="py-2 text-right text-zinc-500">
                  {duration(t.entryTime, t.exitTime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
