import type { Asset } from "@/lib/types";
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

const DIR_TEXT: Record<string, string> = {
  bullish: "text-[#26A69A]",
  bearish: "text-[#EF5350]",
  neutral: "text-[#FF9800]",
};

const DIR_GLOW: Record<string, string> = {
  bullish: "shadow-[0_0_50px_-8px_rgba(38,166,154,0.3),0_0_20px_-4px_rgba(38,166,154,0.12)]",
  bearish: "shadow-[0_0_50px_-8px_rgba(239,83,80,0.3),0_0_20px_-4px_rgba(239,83,80,0.12)]",
  neutral: "",
};

const DIR_ACCENT: Record<string, string> = {
  bullish: "#26A69A",
  bearish: "#EF5350",
  neutral: "#FF9800",
};

export function AssetBiasCard({ asset, pair, direction, score, count, isHot, history }: AssetBiasCardProps) {
  const accent = DIR_ACCENT[direction] ?? "#FF9800";

  return (
    <div className={`animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-200 hover:border-white/[0.12] hover:bg-[#151515] ${DIR_GLOW[direction] ?? ""}`}>
      {/* Accent gradient line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-[13px] font-medium text-white/50">
                {asset} — {pair}
              </h3>
              {isHot && (
                <span className="animate-pulse rounded-md bg-[#FF9800]/20 px-2 py-0.5 font-sans text-[9px] font-bold uppercase text-[#FF9800] ring-1 ring-[#FF9800]/30">
                  Hot
                </span>
              )}
            </div>
            <p className={`mt-1.5 font-sans text-[22px] font-bold ${DIR_TEXT[direction] ?? "text-[#FF9800]"}`}>
              {direction.toUpperCase()}
            </p>
            {history && history.length >= 2 && <BiasSparkline data={history} />}
          </div>
          <div className="text-right">
            <p className="font-mono text-[28px] font-bold tabular-nums text-white">{score}%</p>
            <p className="font-sans text-[12px] text-white/30">{count} signals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
