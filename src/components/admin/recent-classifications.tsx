"use client";

import { useState } from "react";
import { Seg, Chip } from "./primitives";
import { fmtAgoShort } from "@/lib/format-utils";

interface Classification {
  asset: string | null;
  direction: string | null;
  signal_type: string | null;
  confidence: number | null;
  author: string | null;
  interpretation: string | null;
  created_at: string;
}

type Filter = "all" | "flagged";
const FILTERS: readonly Filter[] = ["all", "flagged"] as const;

/**
 * `flagged` is derived from a low-confidence heuristic until the review table
 * is wired through the API. Keeps the UX intact without inventing data.
 */
function isFlagged(c: Classification): boolean {
  const conf = c.confidence ?? 0;
  if (conf < 0.5) return true;
  if (c.signal_type === "opinion" && conf > 0.7) return true;
  return false;
}

export function RecentClassifications({ data }: { data: Classification[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const list = filter === "flagged" ? data.filter(isFlagged) : data;

  return (
    <div>
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: "var(--color-tv-border)" }}
      >
        <Seg options={FILTERS} value={filter} onChange={setFilter} />
        <span className="text-[11px] text-white/30">{list.length} shown</span>
      </div>
      {list.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-white/30">
          {filter === "flagged" ? "Nothing flagged." : "No classifications yet."}
        </div>
      ) : (
        <div>
          {list.map((c, i) => {
            const dirColor =
              c.direction === "bullish"
                ? "var(--color-tv-bull)"
                : c.direction === "bearish"
                ? "var(--color-tv-bear)"
                : "var(--color-tv-orange)";
            const flagged = isFlagged(c);
            return (
              <div
                key={i}
                className="flex items-start gap-3 border-b px-4 py-2.5 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--color-tv-border)" }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: dirColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <span className="font-semibold text-white">{c.asset ?? "?"}</span>
                    <span>·</span>
                    <span>{c.signal_type ?? "—"}</span>
                    <span>·</span>
                    <span className="tick">conf {(c.confidence ?? 0).toFixed(2)}</span>
                    <span className="tick ml-auto text-[10px] text-white/30">
                      {fmtAgoShort(c.created_at)} ago
                    </span>
                  </div>
                  {c.interpretation && (
                    <div className="mt-0.5 truncate text-[12px] text-white">
                      "{c.interpretation}"
                    </div>
                  )}
                  <div className="tick mt-0.5 flex items-center gap-2 text-[10px] text-white/30">
                    <span>@{c.author ?? "unknown"}</span>
                    {flagged ? <Chip tone="warn">FLAGGED</Chip> : <Chip tone="muted">AUTO</Chip>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
