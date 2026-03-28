import { changeColor } from "@/lib/utils";

interface TradeStatsProps {
  openCount: number;
  closedCount: number;
  totalPnl: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function TradeStats({ openCount, closedCount, totalPnl, wins, losses, winRate }: TradeStatsProps) {
  const pnlColor = changeColor(totalPnl);
  const pnlSign = totalPnl >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <Stat label="Open" value={String(openCount)} />
      <Stat label="Closed" value={String(closedCount)} />
      <Stat label="Total P&L" value={`${pnlSign}$${totalPnl.toFixed(2)}`} className={pnlColor} />
      <Stat label="Wins" value={String(wins)} className="text-tv-green" />
      <Stat label="Losses" value={String(losses)} className="text-tv-red" />
      <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} className={winRate >= 50 ? "text-tv-green" : "text-tv-red"} />
    </div>
  );
}

function Stat({ label, value, className = "text-tv-text-bright" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-[6px] border border-tv-border bg-tv-surface p-3 transition-all duration-150 hover:border-tv-border-hover">
      <div className="font-sans text-[10px] uppercase tracking-wider text-tv-text-secondary">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}
