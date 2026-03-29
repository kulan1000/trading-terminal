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

type Level = "ok" | "warn" | "error";

function check(level: Level, label: string, detail: string) {
  return { level, label, detail };
}

const DOT: Record<Level, string> = {
  ok: "bg-[#26A69A]",
  warn: "bg-[#FF9800] animate-pulse",
  error: "bg-[#EF5350] animate-pulse",
};

const TEXT: Record<Level, string> = {
  ok: "text-white/60",
  warn: "text-[#FF9800]",
  error: "text-[#EF5350]",
};

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
    // Pipeline running: green if runs exist, red if none
    check(
      recentRuns.length > 0 ? "ok" : "error",
      "Pipeline kör",
      recentRuns.length > 0 ? `${recentRuns.length} körningar senaste timmen` : "Inga körningar senaste timmen"
    ),
    // Errors: green if none, yellow if 1, red if 2+
    check(
      errorRuns.length === 0 ? "ok" : errorRuns.length === 1 ? "warn" : "error",
      "Inga fel",
      errorRuns.length === 0 ? "Alla senaste körningar lyckades" : `${errorRuns.length} fel senaste timmen`
    ),
    // Speed: green <60s, yellow <90s, red >90s (pipeline does Discord+GPT+scoring+snapshots)
    check(
      avgDuration === 0 ? "ok" : avgDuration < 60_000 ? "ok" : avgDuration < 90_000 ? "warn" : "error",
      "Snabb pipeline",
      avgDuration > 0 ? `Snitt ${(avgDuration / 1000).toFixed(1)}s` : "Ingen data"
    ),
    // Signals: green <2h, yellow <6h, red >6h (people don't post at night)
    check(
      signalAge < 2 * 60 * 60_000 ? "ok" : signalAge < 6 * 60 * 60_000 ? "warn" : "error",
      "Signaler flödar",
      signalAge < Infinity ? `Senaste: ${Math.round(signalAge / 60_000)}m sedan` : "Inga signaler"
    ),
    // Discord: green <1h, yellow <3h, red >3h
    check(
      messageAge < 60 * 60_000 ? "ok" : messageAge < 3 * 60 * 60_000 ? "warn" : "error",
      "Discord-koppling",
      messageAge < Infinity ? `Senaste: ${Math.round(messageAge / 60_000)}m sedan` : "Inga meddelanden"
    ),
  ];

  const hasError = checks.some((c) => c.level === "error");
  const hasWarn = checks.some((c) => c.level === "warn");
  const badge = hasError ? { text: "ISSUES", cls: "bg-[#EF5350]/15 text-[#EF5350]" }
    : hasWarn ? { text: "WARNING", cls: "bg-[#FF9800]/15 text-[#FF9800]" }
    : { text: "ALL OK", cls: "bg-[#26A69A]/15 text-[#26A69A]" };

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Systemhälsa</h2>
          <span className={`rounded-md px-2.5 py-0.5 font-sans text-[10px] font-bold ${badge.cls}`}>
            {badge.text}
          </span>
        </div>
        <div className="space-y-3">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.02]">
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.level]}`} />
              <div>
                <span className={`font-sans text-[12px] font-medium ${TEXT[c.level]}`}>
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
