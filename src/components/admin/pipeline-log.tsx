"use client";

import { useState } from "react";
import { Chip } from "./primitives";
import { fmtAgoShort, fmtMs, fmtCost } from "@/lib/format-utils";
import { CLASSIFIER_COST_PER_CALL } from "@/lib/constants";

interface PipelineRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: string;
  market_open: boolean | null;
  ingested: number;
  processed: number;
  signals: number;
  skipped: number;
  scored: number;
  openai_calls: number;
  error_message: string | null;
}

export function PipelineLog({ runs }: { runs: PipelineRun[] }) {
  const [expandId, setExpandId] = useState<number | null>(null);

  if (!runs.length) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-white/30">No runs logged yet.</div>
    );
  }

  return (
    <div>
      {runs.slice(0, 10).map((r) => {
        const failed = r.status !== "success";
        const open = expandId === r.id;
        const cost = (r.openai_calls ?? 0) * CLASSIFIER_COST_PER_CALL;
        return (
          <div key={r.id} className="border-b" style={{ borderColor: "var(--color-tv-border)" }}>
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left hover:bg-white/[0.02]"
              onClick={() => setExpandId(open ? null : r.id)}
            >
              <div className="grid grid-cols-12 items-center gap-2 text-[12px]">
                <span className="tick col-span-2 text-[10px] text-white/30">#{r.id}</span>
                <span className="tick col-span-3 text-[11px] text-white/50">
                  {fmtAgoShort(r.finished_at ?? r.started_at)} ago
                </span>
                <span className="col-span-1">
                  <Chip tone={failed ? "bear" : "bull"}>{failed ? "ERROR" : "OK"}</Chip>
                </span>
                <span className="tick col-span-2 text-white">{fmtMs(r.duration_ms)}</span>
                <span className="tick col-span-2 text-white/50">
                  {r.ingested}→{r.signals} sig
                </span>
                <span className="tick col-span-2 text-right text-white">{fmtCost(cost)}</span>
              </div>
            </button>
            {open && (
              <div className="animate-expand px-4 pb-3">
                <div className="lbl mb-1.5">stats</div>
                <div className="tick grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-white/50 md:grid-cols-4">
                  <span>
                    ingested <span className="ml-1 text-white">{r.ingested}</span>
                  </span>
                  <span>
                    processed <span className="ml-1 text-white">{r.processed}</span>
                  </span>
                  <span>
                    openai <span className="ml-1 text-white">{r.openai_calls}</span>
                  </span>
                  <span>
                    signals <span className="ml-1 text-white">{r.signals}</span>
                  </span>
                  <span>
                    skipped <span className="ml-1 text-white">{r.skipped}</span>
                  </span>
                  <span>
                    scored <span className="ml-1 text-white">{r.scored}</span>
                  </span>
                  <span>
                    cost <span className="ml-1 text-white">{fmtCost(cost)}</span>
                  </span>
                  <span>
                    market{" "}
                    <span className="ml-1 text-white">
                      {r.market_open === false ? "closed" : "open"}
                    </span>
                  </span>
                </div>
                {r.error_message && (
                  <pre
                    className="mt-3 overflow-x-auto whitespace-pre-wrap rounded p-3 text-[10px]"
                    style={{
                      background: "rgba(239,83,80,0.06)",
                      border: "1px solid rgba(239,83,80,0.3)",
                      color: "#FCA5A5",
                    }}
                  >
                    {r.error_message}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
