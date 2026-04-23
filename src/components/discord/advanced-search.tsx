"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ASSETS as ASSET_LIST } from "@/lib/constants";

const SIGNAL_TYPES = ["all", "entry", "exited", "position", "opinion", "target"];
const ASSETS = ["all", ...ASSET_LIST];
const CHANNELS = ["all", "traders-lounge", "gold-commodities", "main-discussion"];

const INPUT = "w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-sans text-[12px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/40 focus:outline-none";
const SELECT = "w-full appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-sans text-[12px] text-white/70 transition-colors focus:border-[#2962FF]/40 focus:outline-none";

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

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <form onSubmit={search} className="px-5 py-4">
        <div className="flex gap-2">
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search messages..." className={`flex-1 ${INPUT}`} />
          <button type="submit"
            className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-semibold text-white transition-all hover:bg-[#1E53E5]">
            Search
          </button>
          <button type="button" onClick={() => setOpen(!open)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-sans text-[11px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/60">
            {open ? "Close" : "Filter"}
          </button>
        </div>

        {open && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.04] pt-3 md:grid-cols-4">
            <Field label="Trader">
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="Name..." className={INPUT} />
            </Field>
            <Field label="Channel">
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={SELECT}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c === "all" ? "All channels" : `#${c}`}</option>)}
              </select>
            </Field>
            <Field label="Asset">
              <select value={asset} onChange={(e) => setAsset(e.target.value)} className={SELECT}>
                {ASSETS.map((a) => <option key={a} value={a}>{a === "all" ? "All" : a}</option>)}
              </select>
            </Field>
            <Field label="Signal type">
              <select value={signalType} onChange={(e) => setSignalType(e.target.value)} className={SELECT}>
                {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All types" : t.toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={INPUT} />
            </Field>
            <Field label="To">
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={INPUT} />
            </Field>
            <div className="col-span-2 flex items-end gap-2">
              <button type="submit"
                className="rounded-lg bg-[#2962FF] px-4 py-2 font-sans text-[12px] font-semibold text-white transition-all hover:bg-[#1E53E5]">
                Filter
              </button>
              <button type="button" onClick={reset}
                className="rounded-lg border border-white/[0.06] px-3 py-2 font-sans text-[12px] text-white/40 transition-colors hover:text-white/60 hover:bg-white/[0.04]">
                Clear
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">{label}</label>
      {children}
    </div>
  );
}
