import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtTime } from "@/lib/format-utils";

interface Target {
  id: number;
  asset: string;
  direction: string;
  target_price: number;
  confidence: number;
  author: string;
  created_at: string;
}

const DIR_COLOR: Record<string, string> = {
  bullish: "text-[#26A69A]",
  bearish: "text-[#EF5350]",
  neutral: "text-[#FF9800]",
};

export function TargetsPanel({ targets }: { targets: Target[] }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Price Targets
        </h3>
      </div>

      <div className="space-y-1 px-5 pb-4">
        {targets.map((t) => {
          const arrow = t.direction === "bullish" ? "▲" : t.direction === "bearish" ? "▼" : "—";
          return (
            <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.025]">
              <span
                className={`w-14 shrink-0 rounded-md px-2 py-0.5 text-center font-sans text-[10px] font-bold uppercase ${ASSET_TAG_COLORS[t.asset] ?? "bg-white/[0.04] text-white/50"}`}
              >
                {t.asset}
              </span>
              <span className={`shrink-0 font-mono text-[13px] font-bold tabular-nums ${DIR_COLOR[t.direction] ?? "text-white/50"}`}>
                {arrow} {t.target_price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="shrink-0 font-sans text-[12px] font-medium text-[#2962FF]">{t.author}</span>
              <span className="ml-auto font-mono text-[11px] text-white/20">
                {fmtTime(t.created_at)}
              </span>
            </div>
          );
        })}
        {!targets.length && (
          <p className="px-2 font-sans text-[12px] italic text-white/30">No targets yet — will appear as traders post price levels</p>
        )}
      </div>
    </div>
  );
}
