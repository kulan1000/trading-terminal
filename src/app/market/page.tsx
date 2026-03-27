import { getMarketQuotes } from "@/lib/market-data";
import { ASSET_PAIRS } from "@/lib/constants";
import { PriceCard } from "@/components/market/price-card";
import { MarketOverview } from "@/components/market/market-overview";

export const revalidate = 30;

export default async function MarketPage() {
  const quotes = await getMarketQuotes();

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Market — Live Prices
      </h1>
      <div className="grid grid-cols-3 gap-4">
        {quotes.map((q) => (
          <PriceCard key={q.asset} quote={q} pair={ASSET_PAIRS[q.asset]} />
        ))}
      </div>
      <MarketOverview quotes={quotes} />
    </div>
  );
}
