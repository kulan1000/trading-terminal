import type { FeedMessage, SignalTag } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";

const STRENGTH_STYLE: Record<string, string> = {
  strong: "border-l-2 border-tv-blue",
  medium: "border-l-2 border-tv-secondary",
  weak: "border-l border-tv-border opacity-80",
};

function ActionTag({ signal }: { signal: SignalTag }) {
  const { signal_type, position, direction } = signal;

  if (!signal_type || signal_type === "opinion") {
    const dir: Record<string, { label: string; cls: string }> = {
      bullish: { label: "BULLISH", cls: "bg-tv-bull/20 text-tv-bull" },
      bearish: { label: "BEARISH", cls: "bg-tv-bear/20 text-tv-bear" },
      neutral: { label: "NEUTRAL", cls: "bg-tv-orange/20 text-tv-orange" },
    };
    const d = dir[direction] ?? dir.neutral;
    return <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-semibold ${d.cls}`}>{d.label}</span>;
  }

  const posLabel = position === "short" ? "SHORT" : "LONG";
  const isShort = position === "short";

  const combos: Record<string, { label: string; cls: string }> = {
    "entry-long": {
      label: "ENTRY LONG",
      cls: "bg-tv-bull/25 text-tv-bull ring-1 ring-tv-bull/40",
    },
    "entry-short": {
      label: "ENTRY SHORT",
      cls: "bg-tv-bear/25 text-tv-bear ring-1 ring-tv-bear/40",
    },
    "position-long": {
      label: "HOLDING LONG",
      cls: "bg-tv-purple/20 text-tv-purple ring-1 ring-tv-purple/30",
    },
    "position-short": {
      label: "HOLDING SHORT",
      cls: "bg-tv-orange/20 text-tv-orange ring-1 ring-tv-orange/30",
    },
    "exited-long": {
      label: "EXIT LONG",
      cls: "bg-tv-input/50 text-tv-secondary ring-1 ring-tv-border",
    },
    "exited-short": {
      label: "EXIT SHORT",
      cls: "bg-tv-input/50 text-tv-secondary ring-1 ring-tv-border",
    },
  };

  const key = `${signal_type}-${position ?? (isShort ? "short" : "long")}`;
  const combo = combos[key] ?? {
    label: `${signal_type.toUpperCase()} ${posLabel}`,
    cls: "bg-tv-input text-tv-secondary",
  };

  return (
    <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase ${combo.cls}`}>
      {combo.label}
    </span>
  );
}

function SignalRow({ signal, index }: { signal: SignalTag; index: number }) {
  return (
    <div key={index} className="mt-1 flex flex-wrap items-center gap-1">
      <span
        className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase ${ASSET_TAG_COLORS[signal.asset] ?? "bg-tv-input text-tv-secondary"}`}
      >
        {signal.asset}
      </span>
      <ActionTag signal={signal} />
      {signal.interpretation && (
        <span className="ml-1 max-w-[60%] truncate text-[10px] italic text-tv-secondary">
          {signal.interpretation}
        </span>
      )}
    </div>
  );
}

function ScoreBadge({ winRate }: { winRate: number }) {
  const pct = Math.round(winRate * 100);
  const color = winRate >= 0.6 ? "text-tv-bull bg-tv-bull/15" : winRate >= 0.4 ? "text-tv-orange bg-tv-orange/15" : "text-tv-bear bg-tv-bear/15";
  return (
    <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${color}`} title={`Win rate: ${pct}%`}>
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
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        Signal Feed
      </h3>
      <div className="space-y-3">
        {messages.map((m) => {
          const topStrength = m.assets[0]?.strength ?? "medium";
          return (
            <div
              key={m.id}
              className={`border-b border-tv-divider pb-2 pl-2 last:border-0 ${STRENGTH_STYLE[topStrength] ?? ""}`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-sans font-bold text-tv-blue">{m.author}</span>
                {traderScores?.[m.author] != null && (
                  <ScoreBadge winRate={traderScores[m.author]} />
                )}
                <span className="text-tv-secondary">#{m.channel}</span>
                <span className="ml-auto font-mono text-tv-muted">
                  {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Stockholm",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-tv-text">
                {m.content}
              </p>
              {m.assets.map((a, i) => (
                <SignalRow key={`${a.asset}-${i}`} signal={a} index={i} />
              ))}
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-xs italic text-tv-secondary">No signals yet</p>
        )}
      </div>
    </div>
  );
}
