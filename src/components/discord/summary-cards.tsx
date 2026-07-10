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
    cls: "bg-[#26A69A]/15 text-[#26A69A] border-[#26A69A]/25",
  },
  exited: {
    label: "EXIT",
    cls: "bg-[#FF9800]/15 text-[#FF9800] border-[#FF9800]/25",
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


function confColor(direction: string): string {
  if (direction === "bullish") return "text-[#26A69A]";
  if (direction === "bearish") return "text-[#EF5350]";
  return "text-white/70";
}

function CardShell({
  title,
  sub,
  accent,
  children,
}: {
  title: string;
  sub: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity group-hover:opacity-90"
        style={{
          background: `radial-gradient(ellipse 70% 90% at 100% 0%, ${accent}, transparent 60%)`,
        }}
      />
      <div className="relative mb-3 flex items-baseline justify-between">
        <span className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
          {title}
        </span>
        <span className="font-sans text-[11px] text-white/50">{sub}</span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Row({
  rank,
  last,
  children,
}: {
  rank: number;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 py-2.5 ${last ? "" : "border-b border-white/[0.05]"}`}
    >
      <span className="min-w-[22px] font-mono text-[11px] font-semibold tabular-nums text-white/40">
        {String(rank).padStart(2, "0")}
      </span>
      {children}
    </div>
  );
}

interface Props {
  data: DailyBriefing;
}

/**
 * Discord Intel — two ranked-list cards below the briefing:
 * "Most Active" (top contributors) + "Strongest Signals" (highest confidence).
 * Same row anatomy as the scoring leaderboard teaser so list cards read
 * identically across pages.
 */
export function SummaryCards({ data }: Props) {
  const topTraders = data.topTraders.slice(0, 3);
  const topSignals = data.highConfidenceSignals.slice(0, 3);
  const moreTraders = Math.max(0, data.topTraders.length - 3);

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {/* Most Active */}
      <CardShell
        title="Most Active"
        sub={`${data.topTraders.length} contributors · last 24h`}
        accent="rgba(41,98,255,0.10)"
      >
        {topTraders.length === 0 ? (
          <div className="py-2 font-sans text-[12px] text-white/30">No data</div>
        ) : (
          topTraders.map((t, i) => {
            const color = ASSET_COLOR[t.dominantAsset] ?? "#787B86";
            return (
              <Row key={t.author} rank={i + 1} last={i === topTraders.length - 1 && moreTraders === 0}>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span className="flex-1 truncate font-sans text-[14px] font-medium text-white">
                  {t.author}
                </span>
                <span className="font-sans text-[11px] text-white/40">
                  mostly {t.dominantAsset}
                </span>
                <span className="min-w-[64px] text-right font-mono text-[13px] font-medium tabular-nums text-white/80">
                  {t.signalCount} sig
                </span>
              </Row>
            );
          })
        )}
        {moreTraders > 0 && (
          <div className="flex items-center justify-center gap-2 pt-3 font-sans text-[11px] text-white/30">
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>+ {moreTraders} more contributors</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
          </div>
        )}
      </CardShell>

      {/* Strongest Signals */}
      <CardShell
        title="Strongest Signals"
        sub="highest confidence · last 24h"
        accent="rgba(38,166,154,0.10)"
      >
        {topSignals.length === 0 ? (
          <div className="py-2 font-sans text-[12px] text-white/30">No data</div>
        ) : (
          topSignals.map((s, i) => {
            const type = TYPE_LABEL[s.signal_type] ?? TYPE_LABEL.opinion;
            const conf = s.confidence <= 1 ? Math.round(s.confidence * 100) : Math.round(s.confidence);
            return (
              <Row key={`${s.author}-${i}`} rank={i + 1} last={i === topSignals.length - 1}>
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-sans text-[9px] font-bold tracking-[0.06em] ${type.cls}`}
                >
                  {type.label}
                </span>
                <span className="flex-1 truncate font-sans text-[13px] text-white/85">
                  <span className="font-medium text-white">{s.author}</span>
                  {/* registry tickers already carry display case (Gold, ES, VIX) */}
                  <span className="text-white/40"> · {s.asset}</span>
                </span>
                <span
                  className={`min-w-[48px] text-right font-mono text-[13px] font-semibold tabular-nums ${confColor(s.direction)}`}
                >
                  {conf}%
                </span>
              </Row>
            );
          })
        )}
      </CardShell>
    </div>
  );
}
