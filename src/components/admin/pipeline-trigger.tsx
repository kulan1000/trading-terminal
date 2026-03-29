"use client";

import { useState } from "react";

interface Props {
  onComplete: () => void;
}

export function PipelineTrigger({ onComplete }: Props) {
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const trigger = async () => {
    setRunning(true);
    setResult(null);
    try {
      const secret = prompt("Ange CLASSIFY_SECRET:");
      if (!secret) { setRunning(false); return; }
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const body = await res.json();
      if (res.ok) {
        setResult(`OK — ${body.processed ?? 0} processed, ${body.signals ?? 0} signals, ${body.ingest?.ingested ?? 0} ingested`);
      } else {
        setResult(`Fel: ${body.error}${body.retryAfterMs ? ` (rate limited, vänta ${Math.ceil(body.retryAfterMs / 1000)}s)` : ""}`);
      }
      onComplete();
    } catch {
      setResult("Anslutningsfel");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-[13px] font-medium text-white/70">Manuell pipeline-trigger</h2>
          <p className="mt-1 font-sans text-[11px] text-white/30">
            Ingest → Classify → Prices → Score → Sentiment → Bias
          </p>
        </div>
        <button
          onClick={trigger}
          disabled={running}
          className="rounded-lg border border-[#2962FF]/30 bg-[#2962FF]/10 px-5 py-2 font-sans text-[12px] font-medium text-[#2962FF] transition-colors hover:bg-[#2962FF]/20 disabled:opacity-40"
        >
          {running ? "Kör..." : "Kör pipeline"}
        </button>
      </div>
      {result && (
        <div className={`mt-3 rounded-md px-3 py-2 font-mono text-[11px] ${result.startsWith("OK") ? "bg-[#26A69A]/10 text-[#26A69A]" : "bg-[#EF5350]/10 text-[#EF5350]"}`}>
          {result}
        </div>
      )}
    </div>
  );
}
