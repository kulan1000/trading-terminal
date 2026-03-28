import type { Asset } from "@/lib/types";
import { DIRECTION_COLOR, DIRECTION_BG } from "@/lib/constants";

interface AssetBiasCardProps {
  asset: Asset;
  pair: string;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
}

export function AssetBiasCard({ asset, pair, direction, score, count }: AssetBiasCardProps) {
  return (
    <div className={`animate-fade-in rounded-lg border p-5 transition-all duration-150 hover:border-tv-border-hover ${DIRECTION_BG[direction]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-secondary">
            {asset} — {pair}
          </h3>
          <p className={`mt-1 font-sans text-2xl font-bold ${DIRECTION_COLOR[direction]}`}>
            {direction.toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-tv-heading">{score}%</p>
          <p className="font-mono text-xs text-tv-secondary">{count} signals</p>
        </div>
      </div>
    </div>
  );
}
