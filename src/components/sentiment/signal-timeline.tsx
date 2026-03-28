"use client";

import { useState } from "react";
import Link from "next/link";
import type { TimelineSignal } from "@/hooks/use-sentiment";

const TYPE_SHAPE: Record<string, string> = {
  entry: "w-2.5 h-2.5 rounded-sm",
  exited: "w-2.5 h-2.5 rounded-full",
  position: "w-2 h-2 rotate-45",
  opinion: "w-1.5 h-1.5 rounded-full",
};

const DIR_COLOR: Record<string, string> = {
  bullish: "bg-tv-bull",
  bearish: "bg-tv-bear",
  neutral: "bg-tv-secondary",
};

const ASSET_FILTERS = ["All", "Gold", "Silver", "Oil"] as const;

function timeLabel(time: string): string {
  return new Date(time).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
}

function minutesAgo(time: string): number {
  return Math.floor((Date.now() - new Date(time).getTime()) / 60_000);
}

export function SignalTimeline({ signals }: { signals: TimelineSignal[] }) {
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All" ? signals : signals.filter((s) => s.asset === filter);

  if (!signals.length) {
    return (
      <div className="rounded-lg border border-tv-border bg-tv-surface p-5">
        <h3 className="mb-2 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
          Signal Timeline
        </h3>
        <p className="text-xs text-tv-muted">Inga signaler inom tidsfönstret.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
            Signal Timeline
          </h3>
          <div className="flex gap-1">
            {ASSET_FILTERS.map((a) => (
              <button key={a} onClick={() => setFilter(a)}
                className={`rounded px-2 py-0.5 font-sans text-[10px] font-medium transition-colors ${
                  filter === a ? "bg-tv-blue/20 text-tv-blue" : "text-tv-muted hover:text-tv-secondary"
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-tv-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-tv-secondary" /> Entry
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-tv-secondary" /> Exit
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rotate-45 bg-tv-secondary" /> Hold
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-tv-secondary" /> Opinion
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((s, i) => {
          const shape = TYPE_SHAPE[s.signalType] ?? TYPE_SHAPE.opinion;
          const color = DIR_COLOR[s.direction] ?? DIR_COLOR.neutral;
          const age = minutesAgo(s.time);
          const opacity = age > 45 ? "opacity-40" : age > 20 ? "opacity-70" : "";

          return (
            <div key={i}
              className={`flex items-center gap-2 rounded px-2 py-1 text-[11px] transition-colors hover:bg-tv-elevated ${opacity}`}>
              <span className={`inline-block shrink-0 ${shape} ${color}`} />
              <span className="w-10 font-mono text-tv-muted">{timeLabel(s.time)}</span>
              <span className="w-14 font-sans font-semibold text-tv-text">{s.asset}</span>
              <span className={`w-16 font-mono text-[10px] uppercase ${
                s.direction === "bullish" ? "text-tv-bull" : s.direction === "bearish" ? "text-tv-bear" : "text-tv-secondary"
              }`}>
                {s.signalType === "entry" || s.signalType === "exited"
                  ? `${s.signalType} ${s.position ?? ""}`
                  : s.signalType === "position"
                  ? `hold ${s.position ?? ""}`
                  : s.direction}
              </span>
              <Link href={`/trader/${encodeURIComponent(s.author)}`}
                className="flex-1 truncate text-tv-blue transition-colors hover:text-tv-blue-hover hover:underline">
                {s.author}
              </Link>
              <span className="font-mono text-[10px] text-tv-muted">{age}m ago</span>
            </div>
          );
        })}
        {!filtered.length && (
          <p className="py-2 text-center text-xs text-tv-muted">Inga {filter}-signaler.</p>
        )}
      </div>
    </div>
  );
}
