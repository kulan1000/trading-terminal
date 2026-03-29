"use client";

import { useState, useCallback } from "react";

interface Props {
  onComplete: () => void;
}

export function PipelineTrigger({ onComplete }: Props) {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const trigger = useCallback(async () => {
    if (!secret.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret.trim()}` },
      });
      const body = await res.json();
      if (res.ok) {
        setResult(`OK — ${body.processed ?? 0} klassificerade, ${body.signals ?? 0} signaler, ${body.ingest?.ingested ?? 0} nya meddelanden`);
      } else if (res.status === 429) {
        setResult(`Rate limited — vänta ${Math.ceil((body.retryAfterMs ?? 60000) / 1000)}s`);
      } else if (res.status === 401) {
        setResult("Fel nyckel — kontrollera CLASSIFY_SECRET");
      } else {
        setResult(`Fel: ${body.error ?? body.message ?? "Okänt"}`);
      }
      onComplete();
    } catch {
      setResult("Anslutningsfel — kunde inte nå servern");
    } finally {
      setRunning(false);
    }
  }, [secret, onComplete]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h2 className="font-sans text-[13px] font-medium text-white/70">Manuell pipeline-trigger</h2>
      <p className="mt-1 font-sans text-[11px] text-white/25">
        Ingest → Classify → Prices → Score → Sentiment → Bias
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="password"
          placeholder="CLASSIFY_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && trigger()}
          className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 font-mono text-[12px] text-white/70 placeholder:text-white/20 focus:border-[#2962FF]/40 focus:outline-none"
        />
        <button
          onClick={trigger}
          disabled={running || !secret.trim()}
          className="h-9 shrink-0 rounded-lg border border-[#2962FF]/30 bg-[#2962FF]/10 px-5 font-sans text-[12px] font-medium text-[#2962FF] transition-colors hover:bg-[#2962FF]/20 disabled:opacity-30"
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
