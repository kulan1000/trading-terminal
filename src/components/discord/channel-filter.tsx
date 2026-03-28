"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CHANNELS = ["all", "traders-lounge", "gold-commodities", "main-discussion"];
const ASSETS = ["all", "Gold", "Silver", "Oil"];

export function ChannelFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const activeChannel = params.get("channel") ?? "all";
  const activeAsset = params.get("asset") ?? "all";

  function navigate(channel: string, asset: string) {
    const sp = new URLSearchParams();
    if (channel !== "all") sp.set("channel", channel);
    if (asset !== "all") sp.set("asset", asset);
    const qs = sp.toString();
    router.push(`/discord-intel${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-sans text-xs">
      <span className="text-tv-secondary">Channel:</span>
      {CHANNELS.map((ch) => (
        <button
          key={ch}
          onClick={() => navigate(ch, activeAsset)}
          className={`rounded-[6px] px-2.5 py-1 transition-all duration-150 ${
            activeChannel === ch
              ? "bg-tv-blue/20 text-tv-blue"
              : "text-tv-secondary hover:bg-tv-elevated hover:text-tv-text"
          }`}
        >
          {ch === "all" ? "All" : `#${ch}`}
        </button>
      ))}
      <span className="ml-4 text-tv-secondary">Asset:</span>
      {ASSETS.map((a) => (
        <button
          key={a}
          onClick={() => navigate(activeChannel, a)}
          className={`rounded-[6px] px-2.5 py-1 transition-all duration-150 ${
            activeAsset === a
              ? "bg-tv-blue/20 text-tv-blue"
              : "text-tv-secondary hover:bg-tv-elevated hover:text-tv-text"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
