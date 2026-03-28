"use client";

import { useState } from "react";

export function BackfillButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runBackfill() {
    setLoading(true);
    setStatus("Kör backfill...");
    try {
      const res = await fetch("/api/scoring/backfill", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      const data = await res.json();
      if (data.error) {
        setStatus(`Fel: ${data.error}`);
      } else {
        setStatus(`Klart! ${data.backfilled} scorade, ${data.skipped} saknar prisdata`);
      }
    } catch (err) {
      setStatus(`Fel: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runBackfill}
        disabled={loading}
        className="rounded-[6px] border border-tv-border bg-tv-elevated px-3 py-1 font-sans text-[11px] font-medium text-tv-secondary transition-colors hover:border-tv-blue hover:text-tv-blue disabled:opacity-50"
      >
        {loading ? "Scorar..." : "⟳ Backfill Scoring"}
      </button>
      {status && (
        <span className="font-mono text-[11px] text-tv-secondary">{status}</span>
      )}
    </div>
  );
}
