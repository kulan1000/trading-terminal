"use client";

import { useEffect, useState } from "react";

interface Props {
  message?: string;
  onRetry?: () => void;
  autoRetryMs?: number;
}

export function FetchError({ message = "Kunde inte ladda data.", onRetry, autoRetryMs = 5000 }: Props) {
  const [countdown, setCountdown] = useState(Math.ceil(autoRetryMs / 1000));

  useEffect(() => {
    if (!onRetry || autoRetryMs <= 0) return;

    setCountdown(Math.ceil(autoRetryMs / 1000));
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timer = setTimeout(() => onRetry(), autoRetryMs);

    return () => { clearInterval(tick); clearTimeout(timer); };
  }, [onRetry, autoRetryMs]);

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#111111] py-16">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#EF5350]" />
        <p className="font-sans text-[13px] text-white/50">{message}</p>
      </div>
      {onRetry && (
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="rounded-md border border-white/10 bg-white/5 px-4 py-1.5 font-sans text-[12px] text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            Försök igen
          </button>
          {countdown > 0 && (
            <span className="font-sans tabular-nums text-[11px] text-white/25">
              auto-retry {countdown}s
            </span>
          )}
        </div>
      )}
    </div>
  );
}
