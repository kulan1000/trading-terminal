"use client";

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

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  success: { dot: "bg-[#26A69A]", text: "text-[#26A69A]" },
  error: { dot: "bg-[#EF5350]", text: "text-[#EF5350]" },
  running: { dot: "bg-[#2962FF] animate-pulse", text: "text-[#2962FF]" },
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function PipelineLog({ runs }: { runs: PipelineRun[] }) {
  if (!runs.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <h2 className="font-sans text-[13px] font-medium text-white/70">Pipeline-logg</h2>
        <p className="mt-3 font-sans text-[12px] text-white/25">Inga körningar loggade ännu. Kör pipelinen manuellt eller vänta på nästa cron-körning.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-[13px] font-medium text-white/70">Pipeline-logg (senaste 20)</h2>
        <span className="font-mono text-[10px] text-white/20">
          {runs.filter((r) => r.status === "success").length} lyckade / {runs.filter((r) => r.status === "error").length} misslyckade
        </span>
      </div>

      <div className="space-y-1">
        {runs.map((run) => {
          const s = STATUS_STYLE[run.status] ?? STATUS_STYLE.error;
          return (
            <div key={run.id} className="flex items-center gap-2 rounded-md bg-white/[0.02] px-3 py-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              <span className="w-16 shrink-0 font-mono text-[10px] text-white/40">
                {fmtTime(run.started_at)}
              </span>
              <span className={`w-14 shrink-0 font-mono text-[10px] font-bold ${s.text}`}>
                {run.status.toUpperCase()}
              </span>
              {run.duration_ms != null && (
                <span className="w-12 shrink-0 text-right font-mono text-[10px] text-white/25">
                  {run.duration_ms < 1000 ? `${run.duration_ms}ms` : `${(run.duration_ms / 1000).toFixed(1)}s`}
                </span>
              )}
              <span className="flex gap-2 font-mono text-[9px] text-white/20">
                {run.ingested > 0 && <span>+{run.ingested} msg</span>}
                {run.processed > 0 && <span>{run.processed} proc</span>}
                {run.signals > 0 && <span className="text-[#26A69A]/60">{run.signals} sig</span>}
                {run.scored > 0 && <span>{run.scored} scored</span>}
                {run.market_open === false && <span className="text-[#FF9800]/50">CLOSED</span>}
              </span>
              {run.error_message && (
                <span className="ml-auto truncate font-mono text-[9px] text-[#EF5350]/60" style={{ maxWidth: "250px" }}>
                  {run.error_message}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
