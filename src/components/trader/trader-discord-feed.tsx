"use client";

import { fmtAgo } from "@/lib/format-utils";

interface Message {
  id: number;
  content: string;
  channel: string;
  timestamp: string;
}

const CHANNEL_CLR: Record<string, string> = {
  "traders-lounge": "text-[#FF9800]",
  "gold-commodities": "text-[#26A69A]",
};

export function TraderDiscordFeed({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Discord-aktivitet
        </h4>
        <div className="space-y-2">
          {messages.slice(0, 10).map((m) => (
            <div key={m.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-sans text-[9px] font-bold uppercase ${CHANNEL_CLR[m.channel] ?? "text-white/30"}`}>
                  #{m.channel}
                </span>
                <span className="ml-auto font-mono text-[9px] text-white/15">{fmtAgo(m.timestamp)}</span>
              </div>
              <p className="font-sans text-[11px] leading-relaxed text-white/60 line-clamp-2">
                {m.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
