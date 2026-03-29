"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const SIGNAL_TYPES = ["all", "entry", "exited", "position", "opinion", "target"];
const ASSETS = ["all", "Gold", "Silver", "Oil"];
const CHANNELS = ["all", "traders-lounge", "gold-commodities", "main-discussion"];

export function AdvancedSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(!!params.get("author") || !!params.get("signalType") || !!params.get("dateFrom"));

  const [q, setQ] = useState(params.get("q") ?? "");
  const [author, setAuthor] = useState(params.get("author") ?? "");
  const [channel, setChannel] = useState(params.get("channel") ?? "all");
  const [asset, setAsset] = useState(params.get("asset") ?? "all");
  const [signalType, setSignalType] = useState(params.get("signalType") ?? "all");
  const [dateFrom, setDateFrom] = useState(params.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(params.get("dateTo") ?? "");

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (author.trim()) sp.set("author", author.trim());
    if (channel !== "all") sp.set("channel", channel);
    if (asset !== "all") sp.set("asset", asset);
    if (signalType !== "all") sp.set("signalType", signalType);
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    const qs = sp.toString();
    router.push(`/discord-intel${qs ? `?${qs}` : ""}`);
  }

  function reset() {
    setQ(""); setAuthor(""); setChannel("all"); setAsset("all");
    setSignalType("all"); setDateFrom(""); setDateTo("");
    router.push("/discord-intel");
  }

  const inputCls = "w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 font-sans text-[12px] text-white placeholder:text-white/20 transition-all focus:border-[#2962FF]/40 focus:outline-none focus:ring-1 focus:ring-[#2962FF]/20";
  const selectCls = "w-full appearance-none rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 font-sans text-[12px] text-white/70 transition-all focus:border-[#2962FF]/40 focus:outline-none focus:ring-1 focus:ring-[#2962FF]/20";

  return (
    <form onSubmit={search}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Sök meddelanden..."
            className={`${inputCls} pl-9`} />
        </div>
        <button type="submit"
          className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-semibold text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)]">
          Sök
        </button>
        <button type="button" onClick={() => setOpen(!open)}
          className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 font-sans text-[11px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/60">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
            Filter
          </span>
        </button>
      </div>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            <FilterField label="Trader">
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="Namn..." className={inputCls} />
            </FilterField>
            <FilterField label="Kanal">
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectCls}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c === "all" ? "Alla kanaler" : `#${c}`}</option>)}
              </select>
            </FilterField>
            <FilterField label="Asset">
              <select value={asset} onChange={(e) => setAsset(e.target.value)} className={selectCls}>
                {ASSETS.map((a) => <option key={a} value={a}>{a === "all" ? "Alla" : a}</option>)}
              </select>
            </FilterField>
            <FilterField label="Signal-typ">
              <select value={signalType} onChange={(e) => setSignalType(e.target.value)} className={selectCls}>
                {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "Alla typer" : t.toUpperCase()}</option>)}
              </select>
            </FilterField>
            <FilterField label="Från datum">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </FilterField>
            <FilterField label="Till datum">
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
            </FilterField>
            <div className="col-span-2 flex items-end gap-2">
              <button type="submit"
                className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-semibold text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5]">
                Filtrera
              </button>
              <button type="button" onClick={reset}
                className="rounded-lg border border-white/[0.06] px-3 py-2 font-sans text-[12px] text-white/40 transition-colors hover:text-white/60 hover:bg-white/[0.04]">
                Rensa
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">{label}</label>
      {children}
    </div>
  );
}
