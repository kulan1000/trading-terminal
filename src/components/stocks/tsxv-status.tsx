"use client";

import { useState, useEffect } from "react";

// TSX Venture Exchange: Mon-Fri 9:30-16:00 ET
// Closed weekends and Canadian holidays (holidays not tracked here)

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

  const OPEN = 9 * 60 + 30;  // 9:30 ET
  const CLOSE = 16 * 60;      // 16:00 ET

  // Weekend
  if (day === 0 || day === 6) {
    const daysToMon = day === 6 ? 2 : 1;
    const hLeft = (daysToMon - 1) * 24 + (24 - h) + 9;
    return { open: false, label: "TSX-V Closed — Weekend", countdown: `~${hLeft}h`, localTime };
  }

  // Before open
  if (mins < OPEN) {
    const left = OPEN - mins;
    return { open: false, label: "TSX-V Pre-Market", countdown: fmtMins(left), localTime };
  }

  // After close
  if (mins >= CLOSE) {
    // If Friday, show weekend
    if (day === 5) {
      return { open: false, label: "TSX-V Closed — Weekend", countdown: "~63h", localTime };
    }
    const left = (24 * 60 - mins) + OPEN;
    return { open: false, label: "TSX-V After Hours", countdown: fmtMins(left), localTime };
  }

  // Market open
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
    <div className="flex items-center gap-2 font-mono text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          state.open ? "animate-pulse bg-terminal-green" : "bg-terminal-red"
        }`}
      />
      <span className="text-terminal-text">{state.label}</span>
      {state.countdown && (
        <span className="text-terminal-muted">
          {state.open ? "closes in " : "opens in "}
          {state.countdown}
        </span>
      )}
      <span className="text-terminal-muted/60">{state.localTime}</span>
    </div>
  );
}
