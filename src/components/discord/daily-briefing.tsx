import Link from "next/link";
import type { DailyBriefing } from "@/lib/queries-briefing";
import { DIRECTION_COLOR, ASSET_TAG_COLORS } from "@/lib/constants";
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

export function DailyBriefingPanel({ data }: { data: DailyBriefing }) {
  const hasActivity = data.signalCount > 0;

  return (
    <div className="space-y-3 rounded-[6px] border border-tv-border bg-tv-elevated/40 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-tv-heading">
            Daglig Briefing
          </span>
          <span className="rounded bg-tv-blue/15 px-1.5 py-0.5 font-mono text-[10px] text-tv-blue">
            24H
          </span>
        </div>
        <span className="font-mono text-[10px] text-tv-muted">
          {data.messageCount} meddelanden · {data.signalCount} signaler
        </span>
      </div>

      {!hasActivity ? (
        <p className="py-2 text-center font-mono text-xs text-tv-muted">
          Ingen aktivitet senaste 24h.
        </p>
      ) : (
        <>
          {/* Overall direction + dominant asset */}
          <div className="flex items-center gap-3 rounded border border-tv-divider bg-tv-panel/50 px-3 py-2">
            <span className={`font-mono text-lg font-bold ${DIRECTION_COLOR[data.overallDirection]}`}>
              {DIR_ARROW[data.overallDirection]}
            </span>
            <div>
              <span className={`font-mono text-sm font-bold ${DIRECTION_COLOR[data.overallDirection]}`}>
                Community är {DIR_LABEL[data.overallDirection]}
              </span>
              {data.dominantAsset && (
                <span className="ml-2 font-mono text-xs text-tv-secondary">
                  — mest aktivitet på{" "}
                  <span className={ASSET_TAG_COLORS[data.dominantAsset]?.split(" ")[1] ?? "text-tv-text"}>
                    {data.dominantAsset}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Asset breakdown row */}
          <div className="grid grid-cols-3 gap-2">
            {data.assetBreakdown.map((ab) => {
              const total = ab.entries + ab.exits + ab.opinions + ab.targets;
              if (total === 0) return (
                <div key={ab.asset} className="rounded border border-tv-divider bg-tv-panel/30 px-3 py-2 text-center">
                  <span className={`text-xs font-bold ${ASSET_TAG_COLORS[ab.asset]?.split(" ")[1] ?? "text-tv-text"}`}>
                    {ab.asset}
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-tv-muted">Ingen data</p>
                </div>
              );
              return (
                <div key={ab.asset} className="rounded border border-tv-divider bg-tv-panel/30 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${ASSET_TAG_COLORS[ab.asset]?.split(" ")[1] ?? "text-tv-text"}`}>
                      {ab.asset}
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${DIRECTION_COLOR[ab.direction]}`}>
                      {DIR_ARROW[ab.direction]} {DIR_LABEL[ab.direction]}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-2 font-mono text-[10px] text-tv-secondary">
                    {ab.entries > 0 && <span className="text-tv-bull">{ab.entries} entry</span>}
                    {ab.exits > 0 && <span className="text-tv-bear">{ab.exits} exit</span>}
                    {ab.targets > 0 && <span className="text-tv-orange">{ab.targets} target</span>}
                    {ab.opinions > 0 && <span>{ab.opinions} opinion</span>}
                  </div>
                  {/* Bull/bear micro-bar */}
                  <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-tv-divider">
                    {(ab.bullCount + ab.bearCount) > 0 && (
                      <>
                        <div className="bg-tv-bull" style={{ width: `${(ab.bullCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                        <div className="bg-tv-bear" style={{ width: `${(ab.bearCount / (ab.bullCount + ab.bearCount)) * 100}%` }} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top traders + high confidence side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top traders */}
            <div className="rounded border border-tv-divider bg-tv-panel/30 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tv-muted">
                Mest aktiva traders
              </span>
              {data.topTraders.length === 0 ? (
                <p className="mt-1 font-mono text-[10px] text-tv-muted">—</p>
              ) : (
                <div className="mt-1 space-y-1">
                  {data.topTraders.map((t) => (
                    <div key={t.author} className="flex items-center justify-between">
                      <Link href={`/trader/${encodeURIComponent(t.author)}`}
                        className="font-mono text-xs text-tv-blue hover:underline">
                        {t.author}
                      </Link>
                      <span className="flex items-center gap-1.5">
                        <span className={`text-[10px] ${ASSET_TAG_COLORS[t.dominantAsset]?.split(" ")[1] ?? ""}`}>
                          {t.dominantAsset}
                        </span>
                        <span className={`font-mono text-[10px] font-bold ${DIRECTION_COLOR[t.dominantDirection]}`}>
                          {DIR_ARROW[t.dominantDirection]} {t.signalCount}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High confidence signals */}
            <div className="rounded border border-tv-divider bg-tv-panel/30 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tv-muted">
                Starkaste signalerna
              </span>
              {data.highConfidenceSignals.length === 0 ? (
                <p className="mt-1 font-mono text-[10px] text-tv-muted">Inga hög-confidence signaler</p>
              ) : (
                <div className="mt-1 space-y-1">
                  {data.highConfidenceSignals.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-bold ${DIRECTION_COLOR[s.direction]}`}>
                        {DIR_ARROW[s.direction]}
                      </span>
                      <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${ASSET_TAG_COLORS[s.asset] ?? ""}`}>
                        {s.asset}
                      </span>
                      <span className="rounded bg-tv-panel px-1 py-0.5 text-[9px] text-tv-secondary">
                        {TYPE_LABEL[s.signal_type] ?? s.signal_type}
                      </span>
                      <Link href={`/trader/${encodeURIComponent(s.author)}`}
                        className="text-[10px] text-tv-blue hover:underline">
                        {s.author}
                      </Link>
                      <span className="font-mono text-[10px] text-tv-muted">{fmtTime(s.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
