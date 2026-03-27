import type { MarketQuote } from "@/lib/market-data";

interface PriceCardProps {
  quote: MarketQuote;
  pair: string;
}

export function PriceCard({ quote, pair }: PriceCardProps) {
  const isUp = quote.change >= 0;
  const color = isUp ? "text-terminal-green" : "text-terminal-red";
  const arrow = isUp ? "▲" : "▼";
  const borderColor = isUp
    ? "border-terminal-green/30"
    : "border-terminal-red/30";

  return (
    <div
      className={`rounded-lg border ${borderColor} bg-terminal-surface p-4 font-mono`}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-terminal-muted">
          {quote.asset} — {pair}
        </span>
        <span className="text-xs text-terminal-muted">
          {quote.volume > 0
            ? `Vol: ${(quote.volume / 1000).toFixed(0)}K`
            : ""}
        </span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-terminal-text">
          {quote.price > 0 ? quote.price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) : "—"}
        </span>
        <span className={`text-sm font-semibold ${color}`}>
          {arrow} {Math.abs(quote.change).toFixed(2)} (
          {Math.abs(quote.changePercent).toFixed(2)}%)
        </span>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-terminal-muted">
        <span>
          H:{" "}
          <span className="text-terminal-text">
            {quote.high > 0 ? quote.high.toLocaleString() : "—"}
          </span>
        </span>
        <span>
          L:{" "}
          <span className="text-terminal-text">
            {quote.low > 0 ? quote.low.toLocaleString() : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
