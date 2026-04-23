import Link from "next/link";
import type { FeedMessage } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtTime } from "@/lib/format-utils";

const SIGNAL_BADGES: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-[#26A69A]/20 text-[#26A69A] ring-1 ring-[#26A69A]/30" },
  exited: { label: "EXIT", cls: "bg-white/[0.04] text-white/50 ring-1 ring-white/[0.06]" },
  position: { label: "HOLD", cls: "bg-[#2962FF]/15 text-[#2962FF] ring-1 ring-[#2962FF]/30" },
  opinion: { label: "OPINION", cls: "bg-[#FF9800]/10 text-[#FF9800]" },
  target: { label: "TARGET", cls: "bg-[#2962FF]/20 text-[#2962FF] ring-1 ring-[#2962FF]/30" },
};

const STRENGTH_BORDER: Record<string, string> = {
  strong: "border-l-2 border-l-[#2962FF]",
  medium: "border-l-2 border-l-white/15",
  weak: "border-l border-l-white/[0.06] opacity-70",
};

function Highlight({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return <>{text.split(re).map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded bg-[#FFEB3B]/20 px-0.5 text-white">{p}</mark>
      : p
  )}</>;
}

interface FeedProps {
  messages: FeedMessage[];
  highlight?: string;
  title: string;
  count: number;
}

export function MessageFeed({ messages, highlight, title, count }: FeedProps) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            {title}
          </h3>
          <span className="font-mono text-[11px] tabular-nums text-white/20">
            {count} messages
          </span>
        </div>
      </div>

      <div className="max-h-[700px] space-y-2 overflow-y-auto px-5 pb-5">
        {messages.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px] italic text-white/30">
            No messages found.
          </p>
        ) : messages.map((msg) => (
          <MessageCard key={msg.id} msg={msg} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}

function MessageCard({ msg, highlight }: { msg: FeedMessage; highlight?: string }) {
  const topStrength = msg.assets[0]?.strength ?? "medium";
  const hasSignals = msg.assets.length > 0;

  return (
    <div className={`rounded-lg border border-white/[0.04] bg-white/[0.02] p-4 transition-all hover:border-white/[0.08] hover:bg-white/[0.035] ${STRENGTH_BORDER[topStrength] ?? ""}`}>
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <Link href={`/trader/${encodeURIComponent(msg.author)}`}
          className="font-sans text-[13px] font-semibold text-white transition-colors hover:text-[#2962FF]">
          {msg.author}
        </Link>
        <span className="font-sans text-[11px] text-white/20">#{msg.channel}</span>
        {msg.processed && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#26A69A]" title="Processed" />
        )}
        <span className="ml-auto font-mono text-[11px] tabular-nums text-white/20">
          {fmtTime(msg.timestamp)}
        </span>
      </div>

      {/* Content */}
      <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-white/60">
        <Highlight text={msg.content} q={highlight} />
      </p>

      {/* Signal tags */}
      {hasSignals && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {msg.assets.map((a, i) => {
            const badge = a.signal_type ? SIGNAL_BADGES[a.signal_type] : null;
            return (
              <span key={`${a.asset}-${i}`} className="flex items-center gap-1">
                <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold uppercase ${ASSET_TAG_COLORS[a.asset] ?? "bg-white/[0.04] text-white/50"}`}>
                  {a.asset}
                </span>
                {badge && (
                  <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Keep backward compat export
export { MessageFeed as MessageList };
