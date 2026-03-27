import type { FeedMessage, SignalTag } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";

const STRENGTH_STYLE: Record<string, string> = {
  strong: "border-l-2 border-terminal-accent",
  medium: "border-l-2 border-terminal-muted",
  weak: "border-l border-terminal-border opacity-80",
};

const DIR_TAG: Record<string, { label: string; cls: string }> = {
  bullish: { label: "BULLISH", cls: "bg-green-500/20 text-green-400" },
  bearish: { label: "BEARISH", cls: "bg-red-500/20 text-red-400" },
  neutral: { label: "NEUTRAL", cls: "bg-yellow-500/20 text-yellow-400" },
};

const TYPE_TAG: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-blue-500/25 text-blue-300 ring-1 ring-blue-400/40" },
  position: { label: "HOLDING", cls: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30" },
  exited: { label: "EXITED", cls: "bg-zinc-500/25 text-zinc-300 ring-1 ring-zinc-400/30" },
};

const POS_TAG: Record<string, { label: string; cls: string }> = {
  long: { label: "LONG", cls: "bg-green-600/30 text-green-300 ring-1 ring-green-500/30" },
  short: { label: "SHORT", cls: "bg-red-600/30 text-red-300 ring-1 ring-red-500/30" },
};

function SignalRow({ signal, index }: { signal: SignalTag; index: number }) {
  const dir = DIR_TAG[signal.direction];
  const typ = signal.signal_type ? TYPE_TAG[signal.signal_type] : null;
  const pos = signal.position ? POS_TAG[signal.position] : null;

  return (
    <div key={index} className="flex flex-wrap items-center gap-1 mt-1">
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[signal.asset] ?? "bg-terminal-border text-terminal-muted"}`}
      >
        {signal.asset}
      </span>
      {dir && (
        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${dir.cls}`}>
          {dir.label}
        </span>
      )}
      {typ && (
        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${typ.cls}`}>
          {typ.label}
        </span>
      )}
      {pos && (
        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${pos.cls}`}>
          {pos.label}
        </span>
      )}
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
