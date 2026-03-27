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
    <div className={`rounded-md border p-4 ${DIRECTION_BG[direction]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-terminal-muted">
            {asset} — {pair}
          </h3>
          <p className={`mt-1 text-2xl font-bold ${DIRECTION_COLOR[direction]}`}>
            {direction.toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-terminal-text">{score}%</p>
          <p className="text-xs text-terminal-muted">{count} signals</p>
        </div>
      </div>
    </div>
  );
}
