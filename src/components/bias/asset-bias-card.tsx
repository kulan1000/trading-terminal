import type { Asset } from "@/lib/types";
import { DIRECTION_COLOR, DIRECTION_BG } from "@/lib/constants";
import { BiasSparkline } from "./bias-sparkline";

interface BiasPoint {
  score: number;
  direction: string;
  created_at: string;
}

interface AssetBiasCardProps {
  asset: Asset;
  pair: string;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
  isHot?: boolean;
  history?: BiasPoint[];
}

export function AssetBiasCard({ asset, pair, direction, score, count, isHot, history }: AssetBiasCardProps) {
  return (
    <div className={`animate-fade-in rounded-lg border p-5 transition-all duration-150 hover:border-tv-border-hover ${DIRECTION_BG[direction]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-secondary">
              {asset} — {pair}
            </h3>
            {isHot && (
              <span className="animate-pulse rounded-full bg-tv-orange/20 px-2 py-0.5 text-[9px] font-bold uppercase text-tv-orange ring-1 ring-tv-orange/30">
                Hot
              </span>
            )}
          </div>
          <p className={`mt-1 font-sans text-2xl font-bold ${DIRECTION_COLOR[direction]}`}>
            {direction.toUpperCase()}
          </p>
          {history && history.length >= 2 && <BiasSparkline data={history} />}
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-tv-heading">{score}%</p>
          <p className="font-mono text-xs text-tv-secondary">{count} signals</p>
        </div>
      </div>
    </div>
  );
}
