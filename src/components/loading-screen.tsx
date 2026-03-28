"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen loading splash shown on initial page load.
 * Fades out once the app is ready.
 */
export function LoadingScreen() {
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    // Start fade-out after a brief moment
    const fadeTimer = setTimeout(() => setPhase("fading"), 800);
    // Remove from DOM after animation completes
    const doneTimer = setTimeout(() => setPhase("done"), 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-tv-blue to-tv-blue/70 text-lg font-bold text-white shadow-[0_0_30px_-5px_rgba(41,98,255,0.4)]">
          TT
        </div>
        <span className="font-sans text-xl font-semibold tracking-tight text-white">
          Trading Terminal
        </span>
      </div>

      {/* Animated loading bar */}
      <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-transparent via-tv-blue to-transparent"
          style={{
            animation: "loading-sweep 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Subtle tagline */}
      <p className="mt-4 font-mono text-[11px] tracking-wider text-white/20">
        GOLD · SILVER · OIL
      </p>
    </div>
  );
}
