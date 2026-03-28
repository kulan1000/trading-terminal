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
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-6">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Recent Trades
        </h3>
        <p className="text-xs text-tv-text-subtle">Inga stängda trades ännu.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Recent Closed Trades
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-text-secondary">
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Trader</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Asset</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Dir</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Entry</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Exit</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">P/L</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">P/L %</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Duration</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const win = t.pnl > 0;
            const pnlColor = win ? "text-tv-green" : t.pnl < 0 ? "text-tv-red" : "text-tv-text-secondary";
            return (
              <tr key={i} className="border-b border-tv-divider transition-colors hover:bg-tv-hover">
                <td className="py-1.5 font-sans text-tv-text">{t.author}</td>
                <td className="py-1.5 uppercase text-tv-blue">{t.asset}</td>
                <td className="py-1.5">
                  <span className={
                    t.position === "long"
                      ? "rounded bg-tv-green/15 px-1.5 py-0.5 text-tv-green"
                      : "rounded bg-tv-red/15 px-1.5 py-0.5 text-tv-red"
                  }>
                    {t.position}
                  </span>
                </td>
                <td className="py-1.5 text-right text-tv-text">${t.entryPrice.toFixed(2)}</td>
                <td className="py-1.5 text-right text-tv-text">${t.exitPrice.toFixed(2)}</td>
                <td className={`py-1.5 text-right ${pnlColor}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </td>
                <td className={`py-1.5 text-right ${pnlColor}`}>
                  {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent.toFixed(1)}%
                </td>
                <td className="py-1.5 text-right text-tv-text-subtle">
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
