import { getTrades, getTradeStats } from "@/lib/queries-trades";
import { TradeStats } from "@/components/trades/trade-stats";
import { TradeTable } from "@/components/trades/trade-table";

export const revalidate = 30;

export default async function TradesPage() {
  const emptyStats = { openCount: 0, closedCount: 0, totalPnl: 0, wins: 0, losses: 0, winRate: 0 };

  const [openTrades, closedTrades, stats] = await Promise.all([
    getTrades("open").catch(() => []),
    getTrades("closed", 30).catch(() => []),
    getTradeStats().catch(() => emptyStats),
  ]);

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
        Trades — Log & P&L
      </h1>
      <TradeStats {...stats} />
      <TradeTable trades={openTrades} title="Open Positions" />
      <TradeTable trades={closedTrades} title="Closed Trades" />
    </div>
  );
}
