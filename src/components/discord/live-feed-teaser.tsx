"use client";

import { fmtTime } from "@/lib/format-utils";

interface FeedMessage {
  id?: number | string;
  author: string;
  content: string;
  created_at: string;
  confidence?: number | null;
  tags?: string[];
  asset?: string;
  signal_type?: string | null;
  direction?: string | null;
}

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#D0D5DE",
  Oil: "#C9843F",
  GOLD: "#FFD700",
  SILVER: "#D0D5DE",
  OIL: "#C9843F",
};

function pickAccent(m: FeedMessage): string {
  if (m.asset && ASSET_COLOR[m.asset]) return ASSET_COLOR[m.asset];
  if (m.tags) {
    const tag = m.tags.find((t) => ASSET_COLOR[t]);
    if (tag) return ASSET_COLOR[tag];
  }
  return "rgba(255,255,255,0.3)";
}

function confColor(dir?: string | null): string {
  if (dir === "bullish") return "text-[#26A69A]";
  if (dir === "bearish") return "text-[#EF5350]";
  return "text-white/55";
}

interface Props {
  messages: FeedMessage[];
  totalCount: number;
  onBrowse: () => void;
}

/**
 * Discord Intel v2 Live Feed teaser — 2 latest messages compact, with a
 * "Browse all" CTA that scrolls into the full feed below.
 */
export function LiveFeedTeaser({ messages, totalCount, onBrowse }: Props) {
  const latest = messages.slice(0, 2);

  return (
    <button
      type="button"
      onClick={onBrowse}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity group-hover:opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(41,98,255,0.08), transparent 65%)",
        }}
      />

      <div className="relative mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
          </span>
          <span className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
            Live Message Feed
          </span>
          <span className="font-sans text-[11px] text-white/50">
            {totalCount.toLocaleString()} indexed · updating now
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-[#2962FF]/20 bg-[#2962FF]/[0.08] px-3 py-1.5 font-sans text-[11px] font-semibold text-[#2962FF]">
          Browse all
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

      <div className="relative flex flex-col gap-2">
        {latest.length === 0 ? (
          <div className="py-2 font-sans text-[12px] text-white/30">No messages</div>
        ) : (
          latest.map((m, i) => {
            const accent = pickAccent(m);
            const conf =
              m.confidence != null
                ? m.confidence <= 1
                  ? Math.round(m.confidence * 100)
                  : Math.round(m.confidence)
                : null;
            return (
              <div
                key={m.id ?? i}
                className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px] opacity-70"
                  style={{ background: accent }}
                />
                <span className="min-w-[130px] truncate font-sans text-[12px] font-semibold text-white">
                  {m.author}
                </span>
                <span className="flex-1 truncate font-sans text-[12px] leading-normal text-white/75">
                  {m.content}
                </span>
                {conf != null && (
                  <span
                    className={`font-mono text-[11px] font-semibold tabular-nums ${confColor(m.direction)}`}
                  >
                    {conf}%
                  </span>
                )}
                <span className="min-w-[40px] text-right font-mono text-[10px] tabular-nums text-white/40">
                  {fmtTime(m.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </button>
  );
}
