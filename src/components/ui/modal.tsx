"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  subtitle?: string;
  footer?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Custom max-width (default 960px matches ChartModal) */
  maxWidth?: number;
}

/**
 * Generic full-screen modal matching the ChartModal design DNA:
 * rgba(0,0,0,0.85) + blur(10px) backdrop, 960px max-width card,
 * modal-in animation curve, ESC closes.
 *
 * Used by all Scoring v2 drill-downs (Leaderboard, Live Feed, Trade
 * Pairs, Asset Accuracy, GPT Reviews) so every drill-down has the
 * same visual language as the market chart modal.
 */
export function Modal({
  title,
  subtitle,
  footer,
  onClose,
  children,
  maxWidth = 960,
}: ModalProps) {
  const [phase, setPhase] = useState<"entering" | "open" | "leaving" | "gone">("entering");

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  const handleClose = useCallback(() => {
    setPhase("leaving");
    setTimeout(() => {
      setPhase("gone");
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isVisible = phase === "open";
  if (phase === "gone") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <div
        className="relative z-10 flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] shadow-2xl"
        style={{
          maxWidth,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.92) translateY(24px)",
          transition: isVisible
            ? "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 0.2s ease-in, transform 0.2s ease-in",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.05] px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-[20px] font-bold tracking-tight text-white">
              {title}
            </span>
            {subtitle && (
              <span className="font-sans text-[12px] text-white/50">{subtitle}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-white/[0.06] px-6 py-2.5 font-sans text-[11px] text-white/30">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
