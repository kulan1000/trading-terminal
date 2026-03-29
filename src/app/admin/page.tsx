"use client";

import { useEffect, useState, useCallback } from "react";
import { FetchError } from "@/components/ui/fetch-error";

interface PipelineStatus {
  unprocessed: number;
  recentSignals: number;
  recentMessages: number;
  latestSignal: string | null;
  latestMessage: string | null;
  checkedAt: string;
}

function fmtAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m sedan`;
}

export default function AdminPage() {
  const [data, setData] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch("/api/pipeline-status")
      .then((r) => r.json())
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const triggerPipeline = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${prompt("Enter CLASSIFY_SECRET:")}` },
      });
      const body = await res.json();
      setTriggerResult(res.ok ? `OK — ${body.processed ?? 0} processed, ${body.signals ?? 0} signals` : `Error: ${body.error}`);
      fetchStatus();
    } catch {
      setTriggerResult("Request failed");
    } finally {
      setTriggering(false);
    }
  };

  if (error) return <div className="py-10"><FetchError onRetry={fetchStatus} /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Pipeline Admin
        </h1>
        <span className="font-mono text-[11px] text-white/25">
          Uppdateras var 15:e sekund
        </span>
      </div>

      {!data ? (
        <div className="h-[200px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatusCard
            label="Obehandlade"
            value={data.unprocessed}
            color={data.unprocessed > 20 ? "red" : data.unprocessed > 5 ? "orange" : "green"}
            sub="Discord-meddelanden i kö"
          />
          <StatusCard
            label="Signaler (1h)"
            value={data.recentSignals}
            color={data.recentSignals > 0 ? "green" : "muted"}
            sub="Klassificerade senaste timmen"
          />
          <StatusCard
            label="Meddelanden (1h)"
            value={data.recentMessages}
            color={data.recentMessages > 0 ? "green" : "muted"}
            sub="Nya från Discord"
          />
          <StatusCard
            label="Senaste signal"
            value={fmtAgo(data.latestSignal)}
            color={
              !data.latestSignal ? "muted"
                : Date.now() - new Date(data.latestSignal).getTime() < 15 * 60_000 ? "green"
                  : Date.now() - new Date(data.latestSignal).getTime() < 60 * 60_000 ? "orange"
                    : "red"
            }
            sub={data.latestSignal ? new Date(data.latestSignal).toLocaleString("sv-SE") : "Ingen data"}
          />
        </div>
      )}

      {/* Manual trigger */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans text-[13px] font-medium text-white/70">Manuell pipeline-trigger</h2>
            <p className="mt-1 font-sans text-[11px] text-white/30">
              Kör hela pipelinen: Ingest → Classify → Prices → Score → Sentiment → Bias
            </p>
          </div>
          <button
            onClick={triggerPipeline}
            disabled={triggering}
            className="rounded-lg border border-[#2962FF]/30 bg-[#2962FF]/10 px-5 py-2 font-sans text-[12px] font-medium text-[#2962FF] transition-colors hover:bg-[#2962FF]/20 disabled:opacity-40"
          >
            {triggering ? "Kör..." : "Kör pipeline"}
          </button>
        </div>
        {triggerResult && (
          <div className={`mt-3 rounded-md px-3 py-2 font-mono text-[11px] ${triggerResult.startsWith("OK") ? "bg-[#26A69A]/10 text-[#26A69A]" : "bg-[#EF5350]/10 text-[#EF5350]"}`}>
            {triggerResult}
          </div>
        )}
      </div>
    </div>
  );
}

const COLORS: Record<string, { text: string; bg: string }> = {
  green: { text: "text-[#26A69A]", bg: "bg-[#26A69A]/10" },
  orange: { text: "text-[#FF9800]", bg: "bg-[#FF9800]/10" },
  red: { text: "text-[#EF5350]", bg: "bg-[#EF5350]/10" },
  muted: { text: "text-white/40", bg: "bg-white/5" },
};

function StatusCard({ label, value, color, sub }: {
  label: string; value: string | number; color: string; sub: string;
}) {
  const c = COLORS[color] ?? COLORS.muted;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
      <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-mono text-[24px] font-bold tabular-nums ${c.text}`}>
          {value}
        </span>
        <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${c.bg} ${c.text}`}>
          {color === "green" ? "OK" : color === "orange" ? "WARN" : color === "red" ? "ALERT" : "—"}
        </span>
      </div>
      <p className="mt-1 font-sans text-[10px] text-white/25">{sub}</p>
    </div>
  );
}
