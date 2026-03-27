import { TerminalCard } from "@/components/ui/terminal-card";
import type { MarketQuote } from "@/lib/market-data";

interface MarketOverviewProps {
  quotes: MarketQuote[];
}

export function MarketOverview({ quotes }: MarketOverviewProps) {
  const hasData = quotes.some((q) => q.price > 0);

  return (
    <TerminalCard title="Market Data">
      {hasData ? (
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-terminal-border text-left text-xs text-terminal-muted">
              <th className="pb-2">Asset</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Change</th>
              <th className="pb-2 text-right">%</th>
              <th className="pb-2 text-right">High</th>
              <th className="pb-2 text-right">Low</th>
              <th className="pb-2 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const isUp = q.change >= 0;
              const color = isUp ? "text-terminal-green" : "text-terminal-red";
              return (
                <tr key={q.asset} className="border-b border-terminal-border/50">
                  <td className="py-2 font-semibold text-terminal-text">
                    {q.asset}
                  </td>
                  <td className="py-2 text-right text-terminal-text">
                    {q.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className={`py-2 text-right ${color}`}>
                    {isUp ? "+" : ""}
                    {q.change.toFixed(2)}
                  </td>
                  <td className={`py-2 text-right ${color}`}>
                    {isUp ? "+" : ""}
                    {q.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-2 text-right text-terminal-text">
                    {q.high.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-terminal-text">
                    {q.low.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-terminal-muted">
                    {(q.volume / 1000).toFixed(0)}K
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-terminal-muted">
          Market data unavailable. Prices update every 30 seconds.
        </p>
      )}
    </TerminalCard>
  );
}
