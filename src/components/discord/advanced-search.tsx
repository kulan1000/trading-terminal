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

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-sans text-[12px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/50 focus:outline-none focus:bg-white/[0.04]";
  const selectCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-sans text-[12px] text-white transition-colors focus:border-[#2962FF]/50 focus:outline-none";

  return (
    <form onSubmit={search} className="space-y-2">
      <div className="flex gap-2">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Sök meddelanden... (gold, short, 2400)" className={`flex-1 ${inputCls}`} />
        <button type="submit"
          className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-medium text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)]">
          Sök
        </button>
        <button type="button" onClick={() => setOpen(!open)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-sans text-[12px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70">
          {open ? "Färre filter" : "▼ Fler filter"}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-[#111111] p-4 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Trader</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
              placeholder="Namn..." className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Kanal</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectCls}>
              {CHANNELS.map((c) => <option key={c} value={c}>{c === "all" ? "Alla kanaler" : `#${c}`}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Asset</label>
            <select value={asset} onChange={(e) => setAsset(e.target.value)} className={selectCls}>
              {ASSETS.map((a) => <option key={a} value={a}>{a === "all" ? "Alla" : a}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Signal-typ</label>
            <select value={signalType} onChange={(e) => setSignalType(e.target.value)} className={selectCls}>
              {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "Alla typer" : t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Från datum</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Till datum</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2 flex items-end gap-2 md:col-span-2">
            <button type="submit"
              className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-medium text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5]">
              Filtrera
            </button>
            <button type="button" onClick={reset}
              className="rounded-lg border border-white/[0.08] px-3 py-2 font-sans text-[12px] text-white/40 transition-colors hover:text-white/70 hover:bg-white/[0.04]">
              Rensa
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
