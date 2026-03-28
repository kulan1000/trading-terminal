import type { FeedMessage, SignalTag } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";

const STRENGTH_STYLE: Record<string, string> = {
  strong: "border-l-2 border-terminal-accent",
  medium: "border-l-2 border-terminal-muted",
  weak: "border-l border-terminal-border opacity-80",
};

/** Combined action tag: merges signal_type + position into one readable tag */
function ActionTag({ signal }: { signal: SignalTag }) {
  const { signal_type, position, direction } = signal;

  // Opinions: show direction only (no trade action)
  if (!signal_type || signal_type === "opinion") {
    const dir: Record<string, { label: string; cls: string }> = {
      bullish: { label: "BULLISH", cls: "bg-green-500/20 text-green-400" },
      bearish: { label: "BEARISH", cls: "bg-red-500/20 text-red-400" },
      neutral: { label: "NEUTRAL", cls: "bg-yellow-500/20 text-yellow-400" },
    };
    const d = dir[direction] ?? dir.neutral;
    return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${d.cls}`}>{d.label}</span>;
  }

  // Trades: combine action + position into one tag
  const posLabel = position === "short" ? "SHORT" : "LONG";
  const isShort = position === "short";

  const combos: Record<string, { label: string; cls: string }> = {
    "entry-long": {
      label: "ENTRY LONG",
      cls: "bg-green-500/25 text-green-300 ring-1 ring-green-400/40",
    },
    "entry-short": {
      label: "ENTRY SHORT",
      cls: "bg-red-500/25 text-red-300 ring-1 ring-red-400/40",
    },
    "position-long": {
      label: "HOLDING LONG",
      cls: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30",
    },
    "position-short": {
      label: "HOLDING SHORT",
      cls: "bg-purple-500/20 text-orange-300 ring-1 ring-orange-400/30",
    },
    "exited-long": {
      label: "EXIT LONG",
      cls: "bg-zinc-500/25 text-zinc-300 ring-1 ring-zinc-400/30",
    },
    "exited-short": {
      label: "EXIT SHORT",
      cls: "bg-zinc-500/25 text-zinc-300 ring-1 ring-zinc-400/30",
    },
  };

  const key = `${signal_type}-${position ?? (isShort ? "short" : "long")}`;
  const combo = combos[key] ?? {
    label: `${signal_type.toUpperCase()} ${posLabel}`,
    cls: "bg-terminal-border text-terminal-muted",
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${combo.cls}`}>
      {combo.label}
    </span>
  );
}

function SignalRow({ signal, index }: { signal: SignalTag; index: number }) {
  return (
    <div key={index} className="flex flex-wrap items-center gap-1 mt-1">
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[signal.asset] ?? "bg-terminal-border text-terminal-muted"}`}
      >
        {signal.asset}
      </span>
      <ActionTag signal={signal} />
      {signal.interpretation && (
        <span className="text-[10px] italic text-terminal-muted ml-1 truncate max-w-[60%]">
          {signal.interpretation}
        </span>
      )}
    </div>
  );
}

export function SignalFeed({ messages }: { messages: FeedMessage[] }) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">
        Signal Feed
      </h3>
      <div className="space-y-3">
        {messages.map((m) => {
          const topStrength = m.assets[0]?.strength ?? "medium";
          return (
            <div
              key={m.id}
              className={`border-b border-terminal-border pb-2 pl-2 last:border-0 ${STRENGTH_STYLE[topStrength] ?? ""}`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-terminal-accent">{m.author}</span>
                <span className="text-terminal-muted">#{m.channel}</span>
                <span className="ml-auto text-terminal-muted">
                  {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Stockholm",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-terminal-text">
                {m.content}
              </p>
              {m.assets.map((a, i) => (
                <SignalRow key={`${a.asset}-${i}`} signal={a} index={i} />
              ))}
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-xs italic text-terminal-muted">No signals yet</p>
        )}
      </div>
    </div>
  );
}
