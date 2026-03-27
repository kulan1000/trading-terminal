import type { Asset } from "@/lib/types";
import { ASSET_PAIRS } from "@/lib/constants";

interface AssetBiasCardProps {
  asset: Asset;
  pair: string;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
}

const directionColor = {
  bullish: "text-terminal-green",
  bearish: "text-terminal-red",
  neutral: "text-terminal-yellow",
};

const directionBg = {
  bullish: "bg-terminal-green/10 border-terminal-green/20",
  bearish: "bg-terminal-red/10 border-terminal-red/20",
  neutral: "bg-terminal-yellow/10 border-terminal-yellow/20",
};

export function AssetBiasCard({ asset, pair, direction, score, count }: AssetBiasCardProps) {
  return (
    <div className={`rounded-md border p-4 ${directionBg[direction]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-terminal-muted">
            {asset} — {pair}
          </h3>
          <p className={`mt-1 text-2xl font-bold ${directionColor[direction]}`}>
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
