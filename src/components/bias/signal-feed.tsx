import Link from "next/link";
import type { FeedMessage, SignalTag } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtTime } from "@/lib/format-utils";

const STRENGTH_STYLE: Record<string, string> = {
  strong: "border-l-2 border-l-[#2962FF]",
  medium: "border-l-2 border-l-white/20",
  weak: "border-l border-l-white/10 opacity-80",
};

function ActionTag({ signal }: { signal: SignalTag }) {
  const { signal_type, position, direction } = signal;

  if (!signal_type || signal_type === "opinion") {
    const dir: Record<string, { label: string; cls: string }> = {
      bullish: { label: "BULLISH", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
      bearish: { label: "BEARISH", cls: "bg-[#EF5350]/15 text-[#EF5350]" },
      neutral: { label: "NEUTRAL", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
    };
    const d = dir[direction] ?? dir.neutral;
    return <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${d.cls}`}>{d.label}</span>;
  }

  const posLabel = position === "short" ? "SHORT" : "LONG";
  const isShort = position === "short";

  const combos: Record<string, { label: string; cls: string }> = {
    "entry-long": {
      label: "ENTRY LONG",
      cls: "bg-[#26A69A]/25 text-[#26A69A] ring-1 ring-[#26A69A]/40",
    },
    "entry-short": {
      label: "ENTRY SHORT",
      cls: "bg-[#EF5350]/25 text-[#EF5350] ring-1 ring-[#EF5350]/40",
    },
    "position-long": {
      label: "CONVICTION LONG",
      cls: "bg-[#26A69A]/10 text-[#26A69A] ring-1 ring-[#26A69A]/20",
    },
    "position-short": {
      label: "CONVICTION SHORT",
      cls: "bg-[#EF5350]/10 text-[#EF5350] ring-1 ring-[#EF5350]/20",
    },
    "target-long": {
      label: "TARGET",
      cls: "bg-[#2962FF]/20 text-[#2962FF] ring-1 ring-[#2962FF]/30",
    },
    "target-short": {
      label: "TARGET",
      cls: "bg-[#2962FF]/20 text-[#2962FF] ring-1 ring-[#2962FF]/30",
    },
    "exited-long": {
      label: "EXIT LONG",
      cls: "bg-white/[0.04] text-white/50 ring-1 ring-white/[0.06]",
    },
    "exited-short": {
      label: "EXIT SHORT",
      cls: "bg-white/[0.04] text-white/50 ring-1 ring-white/[0.06]",
    },
  };

  const key = `${signal_type}-${position ?? (isShort ? "short" : "long")}`;
  const combo = combos[key] ?? {
    label: `${signal_type.toUpperCase()} ${posLabel}`,
    cls: "bg-white/[0.04] text-white/50",
  };

  return (
    <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold uppercase ${combo.cls}`}>
      {combo.label}
    </span>
  );
}

function SignalRow({ signal, index }: { signal: SignalTag; index: number }) {
  return (
    <div key={index} className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold uppercase ${ASSET_TAG_COLORS[signal.asset] ?? "bg-white/[0.04] text-white/50"}`}
      >
        {signal.asset}
      </span>
      <ActionTag signal={signal} />
      {signal.interpretation && (
        <span className="ml-1 max-w-[60%] truncate font-sans text-[10px] italic text-white/40">
          {signal.interpretation}
        </span>
      )}
    </div>
  );
}

function ScoreBadge({ winRate }: { winRate: number }) {
  const pct = Math.round(winRate * 100);
  const color = winRate >= 0.6 ? "text-[#26A69A] bg-[#26A69A]/15" : winRate >= 0.4 ? "text-[#FF9800] bg-[#FF9800]/15" : "text-[#EF5350] bg-[#EF5350]/15";
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${color}`} title={`Win rate: ${pct}%`}>
      {pct}%
    </span>
  );
}

interface FeedProps {
  messages: FeedMessage[];
  traderScores?: Record<string, number>;
}

export function SignalFeed({ messages, traderScores }: FeedProps) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Signal Feed
        </h3>
      </div>

      <div className="space-y-2.5 px-5 pb-5">
        {messages.map((m) => {
          const topStrength = m.assets[0]?.strength ?? "medium";
          return (
            <div
              key={m.id}
              className={`rounded-lg border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-150 hover:border-white/[0.08] hover:bg-white/[0.035] ${STRENGTH_STYLE[topStrength] ?? ""}`}
            >
              <div className="flex items-center gap-1.5">
                <Link href={`/trader/${encodeURIComponent(m.author)}`}
                  className="font-sans text-[13px] font-semibold text-white transition-colors hover:text-[#2962FF] hover:underline">
                  {m.author}
                </Link>
                {traderScores?.[m.author] != null && (
                  <ScoreBadge winRate={traderScores[m.author]} />
                )}
                <span className="font-sans text-[11px] text-white/25">#{m.channel}</span>
                <span className="ml-auto font-mono text-[11px] text-white/20">
                  {fmtTime(m.timestamp)}
                </span>
              </div>
              <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-white/60">
                {m.content}
              </p>
              {m.assets.map((a, i) => (
                <SignalRow key={`${a.asset}-${i}`} signal={a} index={i} />
              ))}
            </div>
          );
        })}
        {!messages.length && (
          <p className="font-sans text-[12px] italic text-white/30">No signals yet</p>
        )}
      </div>
    </div>
  );
}
