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
        setResult(`OK — ${body.processed ?? 0} classified, ${body.signals ?? 0} signals, ${body.ingest?.ingested ?? 0} new messages`);
      } else if (res.status === 429) {
        setResult(`Rate limited — wait ${Math.ceil((body.retryAfterMs ?? 60000) / 1000)}s`);
      } else if (res.status === 401) {
        setResult("Wrong key — check CLASSIFY_SECRET");
      } else {
        setResult(`Error: ${body.error ?? body.message ?? "Unknown"}`);
      }
      onComplete();
    } catch {
      setResult("Connection error — could not reach the server");
    } finally {
      setRunning(false);
    }
  }, [secret, onComplete]);

  const isOk = result?.startsWith("OK");

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-5">
        <div className="mb-1">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Manual pipeline trigger</h2>
          <p className="mt-1 font-sans text-[11px] text-white/25">
            Ingest → Classify → Prices → Score → Sentiment → Bias
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="password"
            placeholder="CLASSIFY_SECRET"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && trigger()}
            className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 font-mono text-[12px] text-white/70 placeholder:text-white/20 focus:border-[#FF9800]/40 focus:outline-none transition-colors"
          />
          <button
            onClick={trigger}
            disabled={running || !secret.trim()}
            className="h-9 shrink-0 rounded-lg bg-[#FF9800] px-5 font-sans text-[12px] font-medium text-white shadow-[0_0_12px_-3px_rgba(255,152,0,0.4)] transition-all hover:shadow-[0_0_16px_-3px_rgba(255,152,0,0.5)] disabled:opacity-30 disabled:shadow-none"
          >
            {running ? "Running..." : "Run pipeline"}
          </button>
        </div>
        {result && (
          <div className={`mt-3 overflow-hidden rounded-lg border ${isOk ? "border-[#26A69A]/20 bg-[#26A69A]/[0.04]" : "border-[#EF5350]/20 bg-[#EF5350]/[0.04]"}`}>
            <div className={`h-px w-full bg-gradient-to-r from-transparent ${isOk ? "via-[#26A69A]/30" : "via-[#EF5350]/30"} to-transparent`} />
            <p className={`px-3 py-2 font-mono text-[11px] ${isOk ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
