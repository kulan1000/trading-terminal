interface TradeStatsProps {
  openCount: number;
  closedCount: number;
  totalPnl: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function TradeStats({ openCount, closedCount, totalPnl, wins, losses, winRate }: TradeStatsProps) {
  const pnlColor = totalPnl >= 0 ? "text-terminal-green" : "text-terminal-red";
  const pnlSign = totalPnl >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <Stat label="Open" value={String(openCount)} />
      <Stat label="Closed" value={String(closedCount)} />
      <Stat label="Total P&L" value={`${pnlSign}$${totalPnl.toFixed(2)}`} className={pnlColor} />
      <Stat label="Wins" value={String(wins)} className="text-terminal-green" />
      <Stat label="Losses" value={String(losses)} className="text-terminal-red" />
      <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} className={winRate >= 50 ? "text-terminal-green" : "text-terminal-red"} />
    </div>
  );
}

function Stat({ label, value, className = "text-terminal-text" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-3 font-mono">
      <div className="text-[10px] uppercase tracking-wider text-terminal-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}
