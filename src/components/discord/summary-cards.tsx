"use client";

import type { DailyBriefing } from "@/lib/queries-briefing";

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#D0D5DE",
  Oil: "#C9843F",
};

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  entry: {
    label: "ENTRY",
    cls: "bg-gradient-to-b from-[#26A69A]/25 to-[#26A69A]/10 text-[#26A69A] border-[#26A69A]/25",
  },
  exited: {
    label: "EXIT",
    cls: "bg-gradient-to-b from-[#FF9800]/25 to-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/25",
  },
  position: {
    label: "HOLD",
    cls: "bg-white/[0.04] text-white/55 border-white/[0.08]",
  },
  target: {
    label: "TARGET",
    cls: "bg-white/[0.04] text-white/55 border-white/[0.08]",
  },
  opinion: {
    label: "OPINION",
    cls: "bg-white/[0.04] text-white/55 border-white/[0.08]",
  },
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface Props {
  data: DailyBriefing;
}

/**
 * Discord Intel v2 — two hero summary cards below the briefing:
 * "Most Active" + "Strongest Signals". Each shows one headline + a colored
 * segmented bar hinting at the distribution.
 */
export function SummaryCards({ data }: Props) {
  const topTraders = data.topTraders;
  const topSignals = data.highConfidenceSignals;

  const topUser = topTraders[0];
  const topUserColor = topUser ? (ASSET_COLOR[topUser.dominantAsset] ?? "#fff") : "#fff";
  const totalContributors = topTraders.length;

  const topSignal = topSignals[0];
  const avgConf =
    topSignals.length > 0
      ? Math.round(
          topSignals.reduce((s, x) => s + (x.confidence ?? 0), 0) / topSignals.length,
        )
      : 0;

  const topSignalType = topSignal
    ? (TYPE_LABEL[topSignal.signal_type] ?? TYPE_LABEL.opinion)
    : null;

  // Max count for scaling the contributor bar
  const maxCount = Math.max(...topTraders.map((t) => t.signalCount), 1);

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {/* Most Active */}
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14]">
        <div
          className="pointer-events-none absolute inset-0 opacity-50 transition-opacity group-hover:opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 100% 0%, rgba(41,98,255,0.10), transparent 60%)",
          }}
        />
        <div className="relative mb-3.5 flex items-center justify-between">
          <div>
            <div className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
              Most Active
            </div>
            <div className="mt-[3px] font-sans text-[11px] text-white/50">
              top contributors · last 24h
            </div>
          </div>
          <div className="flex items-center gap-1 font-sans text-[11px] font-medium text-[#2962FF]">
            View all
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {topUser ? (
          <div className="relative flex items-baseline gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: topUserColor,
                    boxShadow: `0 0 8px ${topUserColor}`,
                  }}
                />
                <span className="font-sans text-[18px] font-semibold tracking-[-0.005em] text-white">
                  {topUser.author}
                </span>
              </div>
              <div className="mt-1 font-sans text-[11px] text-white/40">
                leading with{" "}
                <span className="font-mono font-semibold tabular-nums text-white/75">
                  {topUser.signalCount}
                </span>{" "}
                signals
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="font-mono text-[26px] font-bold leading-none tracking-tight tabular-nums text-white">
                {totalContributors}
              </div>
              <div className="mt-[3px] font-sans text-[10px] text-white/50">
                active users
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 font-sans text-[12px] text-white/30">No data</div>
        )}
        {/* Contributor bar */}
        {topTraders.length > 1 && (
          <div className="relative mt-4 flex h-[3px] gap-[3px]">
            {topTraders.slice(0, 7).map((t, i) => {
              const color = ASSET_COLOR[t.dominantAsset] ?? "#787B86";
              return (
                <div
                  key={t.author + i}
                  className="h-full rounded-sm opacity-70"
                  style={{ flex: t.signalCount / maxCount, background: color }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Strongest Signals */}
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14]">
        <div
          className="pointer-events-none absolute inset-0 opacity-50 transition-opacity group-hover:opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 100% 0%, rgba(38,166,154,0.10), transparent 60%)",
          }}
        />
        <div className="relative mb-3.5 flex items-center justify-between">
          <div>
            <div className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
              Strongest Signals
            </div>
            <div className="mt-[3px] font-sans text-[11px] text-white/50">
              highest confidence · last 24h
            </div>
          </div>
          <div className="flex items-center gap-1 font-sans text-[11px] font-medium text-[#2962FF]">
            View all
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {topSignal && topSignalType ? (
          <div className="relative flex items-baseline gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[22px] font-bold tracking-tight tabular-nums text-[#26A69A]">
                  {Math.round(topSignal.confidence * 100) || Math.round(topSignal.confidence)}%
                </span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-sans text-[9px] font-bold tracking-[0.06em] ${topSignalType.cls}`}
                >
                  {topSignalType.label}
                </span>
              </div>
              <div className="mt-1 font-sans text-[11px] text-white/40">
                <span className="text-white/75">{topSignal.author}</span> ·{" "}
                {titleCase(topSignal.asset)}
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="font-mono text-[26px] font-bold leading-none tracking-tight tabular-nums text-white">
                {avgConf > 0 && avgConf <= 1 ? Math.round(avgConf * 100) : avgConf}%
              </div>
              <div className="mt-[3px] font-sans text-[10px] text-white/50">
                avg confidence
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 font-sans text-[12px] text-white/30">No data</div>
        )}
        {/* Confidence bar */}
        {topSignals.length > 1 && (
          <div className="relative mt-4 flex h-[3px] gap-[3px]">
            {topSignals.slice(0, 5).map((s, i) => {
              const color = ASSET_COLOR[titleCase(s.asset)] ?? "#787B86";
              const conf = s.confidence <= 1 ? s.confidence * 100 : s.confidence;
              return (
                <div
                  key={i}
                  className="h-full rounded-sm opacity-70"
                  style={{ flex: conf, background: color }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
