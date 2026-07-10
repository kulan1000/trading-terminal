"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Typed-key login for the /admin console (middleware-gated). */
export default function AdminLogin() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      setError(res.status === 429 ? "Too many attempts — wait a minute" : "Invalid key");
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] p-6"
      >
        <div className="tick mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Restricted
        </div>
        <h1 className="mb-4 text-lg font-semibold text-white">Admin console</h1>
        <label className="tick mb-1 block text-[11px] text-white/50" htmlFor="admin-key">
          Access key
        </label>
        <input
          id="admin-key"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="tick w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#2962FF]"
          placeholder="••••••••••••"
        />
        {error && <div className="tick mt-2 text-[11px] text-[#F23645]">{error}</div>}
        <button
          type="submit"
          disabled={busy || !key.trim()}
          className="tick mt-4 w-full rounded bg-[#2962FF]/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2962FF] disabled:opacity-40"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
