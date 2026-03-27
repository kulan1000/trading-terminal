import { getTrades, getTradeStats } from "@/lib/queries";
import { TradeStats } from "@/components/trades/trade-stats";
import { TradeTable } from "@/components/trades/trade-table";

export const revalidate = 30;

export default async function TradesPage() {
  const [openTrades, closedTrades, stats] = await Promise.all([
    getTrades("open"),
    getTrades("closed", 30),
    getTradeStats(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Trades — Log & P&L
      </h1>
      <TradeStats {...stats} />
      <TradeTable trades={openTrades} title="Open Positions" />
      <TradeTable trades={closedTrades} title="Closed Trades" />
    </div>
  );
}
