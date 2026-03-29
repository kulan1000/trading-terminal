import Link from "next/link";
import type { FeedMessage } from "@/lib/types";
import { ASSET_TAG_COLORS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format-utils";

const SIGNAL_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  exited: { label: "EXIT", cls: "bg-[#EF5350]/15 text-[#EF5350]" },
  position: { label: "HOLD", cls: "bg-[#2962FF]/15 text-[#2962FF]" },
  opinion: { label: "OPINION", cls: "bg-white/[0.06] text-white/40" },
  target: { label: "TARGET", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
};

function HighlightText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? <mark key={i} className="rounded bg-[#FFEB3B]/20 px-0.5 text-white">{part}</mark>
          : part
      )}
    </>
  );
}

interface Props { messages: FeedMessage[]; highlight?: string }

export function MessageList({ messages, highlight }: Props) {
  if (!messages.length) {
    return <p className="py-8 text-center font-sans text-[13px] text-white/30">Inga meddelanden hittades.</p>;
  }

  return (
    <div className="max-h-[600px] space-y-0 overflow-y-auto pr-1">
      {messages.map((msg) => (
        <MessageRow key={msg.id} msg={msg} highlight={highlight} />
      ))}
    </div>
  );
}

function MessageRow({ msg, highlight }: { msg: FeedMessage; highlight?: string }) {
  const time = fmtDateTime(msg.timestamp);
  return (
    <div className="group flex items-start gap-3 border-b border-white/[0.03] px-1 py-2.5 transition-colors hover:bg-white/[0.02]">
      <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-white/20">{time}</span>
      <span className="shrink-0 pt-0.5 font-sans text-[10px] text-[#FF9800]/50">#{msg.channel}</span>
      <Link href={`/trader/${encodeURIComponent(msg.author)}`}
        className="shrink-0 pt-0.5 font-sans text-[11px] font-semibold text-[#2962FF] transition-colors hover:text-[#1E53E5]">
        {msg.author}
      </Link>
      <span className="min-w-0 flex-1 font-sans text-[12px] leading-relaxed text-white/60">
        <HighlightText text={msg.content} highlight={highlight} />
      </span>
      <span className="flex shrink-0 items-center gap-1 pt-0.5">
        {msg.assets.map((a, i) => {
          const typeInfo = a.signal_type ? SIGNAL_TYPE_LABELS[a.signal_type] : null;
          return (
            <span key={`${a.asset}-${i}`} className="flex items-center gap-0.5">
              {typeInfo && (
                <span className={`rounded-md px-1.5 py-0.5 font-sans text-[8px] font-bold ${typeInfo.cls}`}>
                  {typeInfo.label}
                </span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase ${ASSET_TAG_COLORS[a.asset] ?? "bg-white/[0.04] text-white/40"} ${a.strength === "weak" ? "opacity-50" : ""}`}
                title={a.interpretation ?? undefined}
              >
                {a.asset}
              </span>
            </span>
          );
        })}
        {msg.processed ? (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#26A69A]" title="Processed" />
        ) : (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-white/10" title="Unprocessed" />
        )}
      </span>
    </div>
  );
}
