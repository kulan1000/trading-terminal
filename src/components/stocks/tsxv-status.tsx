"use client";

import { useState, useEffect } from "react";

function getETNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

function getStockholmTime() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface MarketState {
  open: boolean;
  label: string;
  countdown: string;
  localTime: string;
}

function computeState(): MarketState {
  const et = getETNow();
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;
  const localTime = getStockholmTime();
  const OPEN = 9 * 60 + 30;
  const CLOSE = 16 * 60;

  if (day === 0 || day === 6) {
    const daysToMon = day === 6 ? 2 : 1;
    const hLeft = (daysToMon - 1) * 24 + (24 - h) + 9;
    return { open: false, label: "TSX-V Closed", countdown: `~${hLeft}h`, localTime };
  }
  if (mins < OPEN) {
    const left = OPEN - mins;
    return { open: false, label: "TSX-V Pre-Market", countdown: fmtMins(left), localTime };
  }
  if (mins >= CLOSE) {
    if (day === 5) return { open: false, label: "TSX-V Closed", countdown: "~63h", localTime };
    const left = (24 * 60 - mins) + OPEN;
    return { open: false, label: "TSX-V After Hours", countdown: fmtMins(left), localTime };
  }
  const left = CLOSE - mins;
  return { open: true, label: "TSX-V Open", countdown: fmtMins(left), localTime };
}

function fmtMins(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TsxvStatus() {
  const [state, setState] = useState<MarketState>(computeState);

  useEffect(() => {
    setState(computeState());
    const id = setInterval(() => setState(computeState()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 font-sans text-[11px]">
      <span
        className={`inline-block h-[6px] w-[6px] rounded-full ${
          state.open ? "animate-pulse bg-[#26A69A]" : "bg-[#EF5350]"
        }`}
      />
      <span className="font-medium text-white/60">{state.label}</span>
      {state.countdown && (
        <span className="tabular-nums text-white/25">
          {state.open ? "closes " : "opens "}
          {state.countdown}
        </span>
      )}
      <span className="tabular-nums text-white/15">{state.localTime}</span>
    </div>
  );
}
