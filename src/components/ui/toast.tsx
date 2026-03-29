"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";

interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "error";
}

interface ToastCtx {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastOverlay toasts={toasts} />
    </ToastContext.Provider>
  );
}

const TYPE_STYLE: Record<Toast["type"], string> = {
  info: "border-white/10 text-white/50",
  success: "border-[#26A69A]/30 text-[#26A69A]/80",
  error: "border-[#EF5350]/30 text-[#EF5350]/80",
};

const TYPE_DOT: Record<Toast["type"], string> = {
  info: "bg-white/30",
  success: "bg-[#26A69A]",
  error: "bg-[#EF5350]",
};

function ToastOverlay({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`rounded-lg border bg-[#111111]/95 px-4 py-2 font-mono text-[11px] shadow-lg backdrop-blur-sm transition-all duration-300 ${TYPE_STYLE[t.type]}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[t.type]}`} />
        {t.message}
      </div>
    </div>
  );
}
