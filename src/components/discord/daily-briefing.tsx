import Link from "next/link";
import type { DailyBriefing } from "@/lib/queries-briefing";
import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtTime } from "@/lib/format-utils";

const DIR: Record<string, { label: string; arrow: string; cls: string }> = {
  bullish: { label: "BULLISH", arrow: "▲", cls: "text-[#26A69A]" },
  bearish: { label: "BEARISH", arrow: "▼", cls: "text-[#EF5350]" },
  neutral: { label: "NEUTRAL", arrow: "—", cls: "text-[#FF9800]" },
};

const TYPE_LABEL: Record<string, string> = {
  entry: "ENTRY", exited: "EXIT", position: "HOLD", target: "TARGET",
};

export function DailyBriefingPanel({ data }: { data: DailyBriefing }) {
  if (data.signalCount === 0) return null;

  const d = DIR[data.overallDirection] ?? DIR.neutral;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Daglig Briefing
        </h3>
      </div>

      <div className="space-y-3 px-5 pb-5">
        {/* Direction banner */}
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <span className={`text-[18px] font-bold ${d.cls}`}>{d.arrow}</span>
          <div className="flex-1">
            <span className={`font-sans text-[13px] font-semibold ${d.cls}`}>
              Community är {d.label}
            </span>
            {data.dominantAsset && (
              <span className="ml-2 font-sans text-[12px] text-white/40">
                — mest på <span className="text-white/60">{data.dominantAsset}</span>
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] tabular-nums text-white/20">
            {data.signalCount} signaler
          </span>
        </div>

        {/* Asset grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {data.assetBreakdown.map((ab) => {
            const total = ab.entries + ab.exits + ab.opinions + ab.targets;
            const ad = DIR[ab.direction] ?? DIR.neutral;
            return (
              <div key={ab.asset} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.035]">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[13px] font-semibold text-white">{ab.asset}</span>
                  {total > 0 && (
                    <span className={`font-sans text-[10px] font-bold ${ad.cls}`}>
                      {ad.arrow} {ad.label}
                    </span>
                  )}
                </div>
                {total > 0 ? (
                  <>
                    <div className="mt-1.5 flex gap-2 font-sans text-[10px]">
                      {ab.entries > 0 && <span className="text-[#26A69A]">{ab.entries} entry</span>}
                      {ab.exits > 0 && <span className="text-[#EF5350]">{ab.exits} exit</span>}
                      {ab.targets > 0 && <span className="text-[#FF9800]">{ab.targets} target</span>}
                      {ab.opinions > 0 && <span className="text-white/40">{ab.opinions} opinion</span>}
                    </div>
                    <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-white/[0.04]">
                      {(ab.bullCount + ab.bearCount) > 0 && (
                        <>
                          <div className="bg-[#26A69A]" style={{ width: `${(ab.bullCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                          <div className="bg-[#EF5350]" style={{ width: `${(ab.bearCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 font-sans text-[10px] text-white/20">Ingen data</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Traders + strong signals */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Mest aktiva</span>
            <div className="mt-2 space-y-1.5">
              {data.topTraders.length === 0
                ? <p className="font-sans text-[11px] text-white/20">—</p>
                : data.topTraders.map((t) => (
                  <div key={t.author} className="flex items-center justify-between">
                    <Link href={`/trader/${encodeURIComponent(t.author)}`}
                      className="font-sans text-[12px] font-semibold text-white transition-colors hover:text-[#2962FF]">
                      {t.author}
                    </Link>
                    <span className="flex items-center gap-1.5">
                      <span className="font-sans text-[10px] text-white/30">{t.dominantAsset}</span>
                      <span className={`font-mono text-[10px] font-bold tabular-nums ${(DIR[t.dominantDirection] ?? DIR.neutral).cls}`}>
                        {(DIR[t.dominantDirection] ?? DIR.neutral).arrow} {t.signalCount}
                      </span>
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Starkaste signaler</span>
            <div className="mt-2 space-y-1.5">
              {data.highConfidenceSignals.length === 0
                ? <p className="font-sans text-[11px] text-white/20">—</p>
                : data.highConfidenceSignals.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`font-sans text-[10px] font-bold ${(DIR[s.direction] ?? DIR.neutral).cls}`}>
                      {(DIR[s.direction] ?? DIR.neutral).arrow}
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
                    <span className="ml-auto font-mono text-[10px] tabular-nums text-white/20">{fmtTime(s.created_at)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
