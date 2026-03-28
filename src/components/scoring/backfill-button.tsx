"use client";

import { useState } from "react";

export function BackfillButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runBackfill() {
    setLoading(true);
    setStatus("Kor backfill...");
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
        className="bg-[#2962FF] text-white rounded-md px-3 py-1 font-sans text-[12px] font-medium shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)] transition-all disabled:opacity-50"
      >
        {loading ? "Scorar..." : "⟳ Backfill Scoring"}
      </button>
      {status && (
        <span className="font-sans text-[11px] text-white/40">{status}</span>
      )}
    </div>
  );
}
