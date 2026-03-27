"use client";

import { useState, useEffect } from "react";

// CME Globex futures: Sunday 18:00 ET → Friday 17:00 ET
// Daily maintenance break: 17:00-18:00 ET (Mon-Thu)
// Fully closed: Friday 17:00 ET → Sunday 18:00 ET

function getETNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

interface MarketState {
  open: boolean;
  label: string;
  countdown: string;
}

function computeState(): MarketState {
  const et = getETNow();
  const day = et.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;

  // Saturday → always closed
  if (day === 6) {
    const hoursToSun18 = (24 - h) + 18;
    return { open: false, label: "Closed — Weekend", countdown: formatHM(hoursToSun18, m) };
  }

  // Sunday before 18:00 → closed
  if (day === 0 && mins < 18 * 60) {
    const left = 18 * 60 - mins;
    return { open: false, label: "Closed — Opens Sunday 18:00 ET", countdown: formatMins(left) };
  }

  // Friday after 17:00 → closed for weekend
  if (day === 5 && mins >= 17 * 60) {
    const hoursToSun18 = (24 - h) + 24 + 18;
    return { open: false, label: "Closed — Weekend", countdown: formatHM(hoursToSun18, m) };
  }

  // Mon-Fri 17:00-18:00 → daily maintenance
  if (day >= 1 && day <= 4 && mins >= 17 * 60 && mins < 18 * 60) {
    const left = 18 * 60 - mins;
    return { open: false, label: "Daily Pause — Reopens 18:00 ET", countdown: formatMins(left) };
  }

  // Otherwise → market is open
  // Next close: today at 17:00 ET (or Friday 17:00 if it's Fri)
  const closeAt = 17 * 60;
  const left = closeAt - mins;
  if (left > 0) {
    return { open: true, label: "Market Open", countdown: formatMins(left) };
  }

  return { open: true, label: "Market Open", countdown: "" };
}

function formatMins(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatHM(hours: number, minsOffset: number): string {
  const totalH = Math.max(0, hours - Math.floor(minsOffset / 60));
  const remM = 60 - (minsOffset % 60);
  return `${totalH}h ${remM === 60 ? 0 : remM}m`;
}

export function MarketStatus() {
  const [state, setState] = useState<MarketState>(computeState);

  useEffect(() => {
    const id = setInterval(() => setState(computeState()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded border border-terminal-border bg-terminal-surface px-3 py-2 font-mono text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          state.open ? "bg-terminal-green animate-pulse" : "bg-terminal-red"
        }`}
      />
      <span className="text-terminal-text">{state.label}</span>
      {state.countdown && (
        <span className="text-terminal-muted">
          {state.open ? "closes in " : "opens in "}
          {state.countdown}
        </span>
      )}
    </div>
  );
}
