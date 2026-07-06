"use client";

import { useState } from "react";

/**
 * Manual scoring backfill. Posts to /api/scoring/backfill with a typed key
 * (CLASSIFY_SECRET or CRON_SECRET), same pattern as the admin pipeline trigger —
 * secrets are never bundled into client JS.
 */
export function BackfillButton() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runBackfill() {
    if (!key.trim() || loading) return;
    setLoading(true);
    setStatus("Running backfill...");
    try {
      const res = await fetch("/api/scoring/backfill", {
        method: "POST",
        headers: { authorization: `Bearer ${key.trim()}` },
      });
      const data = await res.json();
      if (res.status === 401) {
        setStatus("Wrong key — check CLASSIFY_SECRET");
      } else if (data.error) {
        setStatus(`Error: ${data.error}`);
      } else {
        setStatus(`Done! ${data.backfilled} scored, ${data.skipped} missing price data`);
      }
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="password"
        placeholder="CLASSIFY_SECRET"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runBackfill()}
        className="h-[30px] w-36 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 font-sans text-[11px] text-white/80 placeholder:text-white/20 focus:border-white/[0.16] focus:outline-none"
      />
      <button
        onClick={runBackfill}
        disabled={loading || !key.trim()}
        className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-sans text-[11px] font-medium text-white/60 transition-all hover:border-white/[0.16] hover:text-white disabled:opacity-50"
      >
        {loading ? "Scoring..." : "⟳ Backfill scoring"}
      </button>
      {status && (
        <span className="font-sans text-[11px] text-white/40">{status}</span>
      )}
    </div>
  );
}
