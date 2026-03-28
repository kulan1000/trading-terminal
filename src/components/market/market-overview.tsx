import { TerminalCard } from "@/components/ui/terminal-card";
import type { MarketQuote } from "@/lib/market-data";
import { changeColor } from "@/lib/utils";

interface MarketOverviewProps {
  quotes: MarketQuote[];
}

export function MarketOverview({ quotes }: MarketOverviewProps) {
  const hasData = quotes.some((q) => q.price > 0);

  return (
    <TerminalCard title="Market Data — Futures">
      {hasData ? (
        <table className="w-full font-mono text-[13px]">
          <thead>
            <tr className="border-b border-tv-divider text-tv-text-secondary">
              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Asset</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Price</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Change</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">%</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">High</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Low</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Volume</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const isUp = q.change >= 0;
              const color = changeColor(q.change);
              return (
                <tr
                  key={q.asset}
                  className="border-b border-tv-divider transition-colors hover:bg-tv-hover"
                >
                  <td className="py-1.5 font-semibold text-tv-text">
                    {q.asset}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-tv-text">
                    {q.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums ${color}`}>
                    {isUp ? "+" : ""}
                    {q.change.toFixed(2)}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums ${color}`}>
                    {isUp ? "+" : ""}
                    {q.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-tv-text">
                    {q.high.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-tv-text">
                    {q.low.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-tv-text-secondary">
                    {q.volume > 0
                      ? `${(q.volume / 1000).toFixed(0)}K`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-tv-text-secondary">
          Market data unavailable. Prices update every 15 seconds.
        </p>
      )}
    </TerminalCard>
  );
}
