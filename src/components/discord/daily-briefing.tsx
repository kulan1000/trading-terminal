import Link from "next/link";
import type { DailyBriefing } from "@/lib/queries-briefing";
import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtTime } from "@/lib/format-utils";

const DIR_LABEL: Record<string, string> = {
  bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL",
};
const DIR_ARROW: Record<string, string> = {
  bullish: "▲", bearish: "▼", neutral: "—",
};
const TYPE_LABEL: Record<string, string> = {
  entry: "ENTRY", exited: "EXIT", position: "HOLD", target: "TARGET",
};
const DIR_CLS: Record<string, string> = {
  bullish: "text-[#26A69A]", bearish: "text-[#EF5350]", neutral: "text-[#FF9800]",
};

export function DailyBriefingPanel({ data }: { data: DailyBriefing }) {
  const hasActivity = data.signalCount > 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[14px] font-semibold text-white">
            Daglig Briefing
          </span>
          <span className="rounded-md bg-[#2962FF]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#2962FF]">
            24H
          </span>
        </div>
        <span className="font-sans text-[11px] tabular-nums text-white/25">
          {data.messageCount} meddelanden · {data.signalCount} signaler
        </span>
      </div>

      <div className="px-5 pb-5">
        {!hasActivity ? (
          <p className="py-4 text-center font-sans text-[12px] text-white/30">
            Ingen aktivitet senaste 24h.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Overall direction */}
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
              <span className={`text-[18px] font-bold ${DIR_CLS[data.overallDirection] ?? "text-white"}`}>
                {DIR_ARROW[data.overallDirection]}
              </span>
              <div>
                <span className={`font-sans text-[13px] font-semibold ${DIR_CLS[data.overallDirection] ?? "text-white"}`}>
                  Community är {DIR_LABEL[data.overallDirection]}
                </span>
                {data.dominantAsset && (
                  <span className="ml-2 font-sans text-[12px] text-white/40">
                    — mest aktivitet på{" "}
                    <span className="text-white/70">{data.dominantAsset}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Asset breakdown */}
            <div className="grid grid-cols-3 gap-2.5">
              {data.assetBreakdown.map((ab) => {
                const total = ab.entries + ab.exits + ab.opinions + ab.targets;
                if (total === 0) return (
                  <div key={ab.asset} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-center">
                    <span className="font-sans text-[12px] font-semibold text-white/50">{ab.asset}</span>
                    <p className="mt-1 font-sans text-[10px] text-white/20">Ingen data</p>
                  </div>
                );
                return (
                  <div key={ab.asset} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[12px] font-semibold text-white/70">{ab.asset}</span>
                      <span className={`font-sans text-[10px] font-bold ${DIR_CLS[ab.direction] ?? "text-white/50"}`}>
                        {DIR_ARROW[ab.direction]} {DIR_LABEL[ab.direction]}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-2 font-sans text-[10px]">
                      {ab.entries > 0 && <span className="text-[#26A69A]">{ab.entries} entry</span>}
                      {ab.exits > 0 && <span className="text-[#EF5350]">{ab.exits} exit</span>}
                      {ab.targets > 0 && <span className="text-[#FF9800]">{ab.targets} target</span>}
                      {ab.opinions > 0 && <span className="text-white/40">{ab.opinions} opinion</span>}
                    </div>
                    {/* Bull/bear bar */}
                    <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-white/[0.04]">
                      {(ab.bullCount + ab.bearCount) > 0 && (
                        <>
                          <div className="bg-[#26A69A]" style={{ width: `${(ab.bullCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                          <div className="bg-[#EF5350]" style={{ width: `${(ab.bearCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top traders + high confidence */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                  Mest aktiva traders
                </span>
                {data.topTraders.length === 0 ? (
                  <p className="mt-2 font-sans text-[11px] text-white/20">—</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {data.topTraders.map((t) => (
                      <div key={t.author} className="flex items-center justify-between">
                        <Link href={`/trader/${encodeURIComponent(t.author)}`}
                          className="font-sans text-[12px] font-medium text-[#2962FF] transition-colors hover:text-[#1E53E5]">
                          {t.author}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          <span className="font-sans text-[10px] text-white/40">{t.dominantAsset}</span>
                          <span className={`font-sans text-[10px] font-bold tabular-nums ${DIR_CLS[t.dominantDirection] ?? "text-white/50"}`}>
                            {DIR_ARROW[t.dominantDirection]} {t.signalCount}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                  Starkaste signalerna
                </span>
                {data.highConfidenceSignals.length === 0 ? (
                  <p className="mt-2 font-sans text-[11px] text-white/20">Inga hög-confidence signaler</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {data.highConfidenceSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className={`font-sans text-[10px] font-bold ${DIR_CLS[s.direction] ?? "text-white/50"}`}>
                          {DIR_ARROW[s.direction]}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${ASSET_TAG_COLORS[s.asset] ?? "bg-white/[0.04] text-white/50"}`}>
                          {s.asset}
                        </span>
                        <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-sans text-[9px] text-white/40">
                          {TYPE_LABEL[s.signal_type] ?? s.signal_type}
                        </span>
                        <Link href={`/trader/${encodeURIComponent(s.author)}`}
                          className="font-sans text-[10px] text-[#2962FF] hover:text-[#1E53E5]">
                          {s.author}
                        </Link>
                        <span className="font-sans text-[10px] tabular-nums text-white/20">{fmtTime(s.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
