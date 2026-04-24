"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fmtAgoShort, fmtMs, fmtCost } from "@/lib/format-utils";
import { CLASSIFIER_COST_PER_CALL } from "@/lib/constants";

interface LastRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: string;
  ingested: number;
  processed: number;
  signals: number;
  openai_calls: number;
}

interface Props {
  onComplete: () => void;
  lastRun?: LastRun | null;
}

/**
 * Manual run trigger. Posts to /api/ingest with CLASSIFY_SECRET.
 * The button stays the blue accent color (matches /market active states); no orange.
 */
export function PipelineTrigger({ onComplete, lastRun }: Props) {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const resultTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!result) return;
    if (resultTimeout.current) clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => setResult(null), 8000);
    return () => {
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
    };
  }, [result]);

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
        setResult(
          `OK — ${body.processed ?? 0} classified, ${body.signals ?? 0} signals, ${
            body.ingest?.ingested ?? 0
          } new messages`,
        );
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
  const cost = lastRun ? (lastRun.openai_calls ?? 0) * CLASSIFIER_COST_PER_CALL : 0;

  return (
    <div>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--color-tv-border)" }}
      >
        <div>
          <div className="text-[12px] text-white">Manual run</div>
          <div className="mt-0.5 text-[10px] text-white/30">
            Ingest → classify → prices → score → sentiment
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="CLASSIFY_SECRET"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && trigger()}
            className="tick h-8 rounded border bg-[#0a0a0a] px-3 text-[11px] text-white placeholder:text-white/20 focus:outline-none"
            style={{ borderColor: "var(--color-tv-border)" }}
          />
          <button
            type="button"
            onClick={trigger}
            disabled={running || !secret.trim()}
            className="h-8 shrink-0 rounded px-4 text-[12px] font-semibold text-white disabled:opacity-50"
            style={{
              background: running ? "rgba(255,255,255,0.06)" : "rgba(41,98,255,0.20)",
              border: "1px solid rgba(41,98,255,0.4)",
            }}
          >
            {running ? "Running…" : "Trigger pipeline"}
          </button>
        </div>
      </div>

      {running && <div className="shimmer h-0.5" />}

      {result && (
        <div className="px-4 py-2 text-[11px]" style={{ color: isOk ? "var(--color-tv-bull)" : "var(--color-tv-bear)" }}>
          {result}
        </div>
      )}

      {lastRun && (
        <div className="px-4 py-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="lbl">
              Last run #{lastRun.id} · {fmtMs(lastRun.duration_ms)}
            </span>
            <span className="tick text-[10px] text-white/30">
              {fmtAgoShort(lastRun.finished_at ?? lastRun.started_at)} ago
            </span>
          </div>
          <div className="tick flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50">
            <span>
              ingested <span className="ml-1 text-white">{lastRun.ingested}</span>
            </span>
            <span>
              classified <span className="ml-1 text-white">{lastRun.processed}</span>
            </span>
            <span>
              openai <span className="ml-1 text-white">{lastRun.openai_calls}</span>
            </span>
            <span>
              signals <span className="ml-1 text-white">{lastRun.signals}</span>
            </span>
            <span>
              cost <span className="ml-1 text-white">{fmtCost(cost)}</span>
            </span>
            <span>
              status <span className="ml-1 text-white">{lastRun.status}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
