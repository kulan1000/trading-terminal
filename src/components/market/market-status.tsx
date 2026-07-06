"use client";

import { useState, useEffect } from "react";

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
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;

  if (day === 6) {
    const hoursToSun18 = (24 - h) + 18;
    return { open: false, label: "Closed — Weekend", countdown: formatHM(hoursToSun18, m) };
  }
  if (day === 0 && mins < 18 * 60) {
    const left = 18 * 60 - mins;
    return { open: false, label: "Closed — Opens Sunday 18:00 ET", countdown: formatMins(left) };
  }
  if (day === 5 && mins >= 17 * 60) {
    const hoursToSun18 = (24 - h) + 24 + 18;
    return { open: false, label: "Closed — Weekend", countdown: formatHM(hoursToSun18, m) };
  }
  if (day >= 1 && day <= 4 && mins >= 17 * 60 && mins < 18 * 60) {
    const left = 18 * 60 - mins;
    return { open: false, label: "Daily Pause — Reopens 18:00 ET", countdown: formatMins(left) };
  }
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
  // null until mounted: the countdown depends on the clock, so computing it
  // during SSR guarantees a hydration text mismatch (React #418) — server
  // renders one minute-count, the client hydrates seconds later with another.
  const [state, setState] = useState<MarketState | null>(null);

  useEffect(() => {
    setState(computeState());
    const id = setInterval(() => setState(computeState()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="flex items-center gap-3 px-5 py-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            state === null ? "bg-white/20" : state.open ? "bg-tv-bull animate-pulse" : "bg-tv-bear"
          }`}
        />
        <span className="font-sans text-[13px] font-medium text-white/80">
          {state === null ? "Checking market hours…" : state.label}
        </span>
        {state?.countdown && (
          <span className="font-sans text-[12px] text-white/30">
            {state.open ? "closes in " : "opens in "}
            {state.countdown}
          </span>
        )}
      </div>
    </div>
  );
}
