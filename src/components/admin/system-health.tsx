"use client";

interface PipelineRun {
  status: string;
  duration_ms: number | null;
  started_at: string;
}

interface Props {
  runs: PipelineRun[];
  latestSignal: string | null;
  latestMessage: string | null;
}

function check(ok: boolean, label: string, detail: string): { ok: boolean; label: string; detail: string } {
  return { ok, label, detail };
}

export function SystemHealth({ runs, latestSignal, latestMessage }: Props) {
  const now = Date.now();
  const recentRuns = runs.filter((r) => now - new Date(r.started_at).getTime() < 60 * 60_000);
  const errorRuns = recentRuns.filter((r) => r.status === "error");
  const avgDuration = recentRuns.length > 0
    ? Math.round(recentRuns.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / recentRuns.length)
    : 0;

  const signalAge = latestSignal ? now - new Date(latestSignal).getTime() : Infinity;
  const messageAge = latestMessage ? now - new Date(latestMessage).getTime() : Infinity;

  const checks = [
    check(recentRuns.length > 0, "Pipeline kör", recentRuns.length > 0 ? `${recentRuns.length} körningar senaste timmen` : "Inga körningar senaste timmen"),
    check(errorRuns.length === 0, "Inga fel", errorRuns.length === 0 ? "Alla senaste körningar lyckades" : `${errorRuns.length} fel senaste timmen`),
    check(avgDuration < 8000, "Snabb pipeline", avgDuration > 0 ? `Snitt ${(avgDuration / 1000).toFixed(1)}s` : "Ingen data"),
    check(signalAge < 30 * 60_000, "Signaler flödar", signalAge < Infinity ? `Senaste: ${Math.round(signalAge / 60_000)}m sedan` : "Inga signaler"),
    check(messageAge < 60 * 60_000, "Discord-koppling", messageAge < Infinity ? `Senaste: ${Math.round(messageAge / 60_000)}m sedan` : "Inga meddelanden"),
  ];

  const allGood = checks.every((c) => c.ok);

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Systemhälsa</h2>
          <span className={`rounded-md px-2.5 py-0.5 font-sans text-[10px] font-bold ${allGood ? "bg-[#26A69A]/15 text-[#26A69A]" : "bg-[#EF5350]/15 text-[#EF5350]"}`}>
            {allGood ? "ALL OK" : "ISSUES"}
          </span>
        </div>
        <div className="space-y-3">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.02]">
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${c.ok ? "bg-[#26A69A]" : "bg-[#EF5350] animate-pulse"}`} />
              <div>
                <span className={`font-sans text-[12px] font-medium ${c.ok ? "text-white/60" : "text-[#EF5350]"}`}>
                  {c.label}
                </span>
                <p className="mt-0.5 font-mono text-[10px] text-white/20">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
