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
    <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
      <span className="text-terminal-muted">Channel:</span>
      {CHANNELS.map((ch) => (
        <button
          key={ch}
          onClick={() => navigate(ch, activeAsset)}
          className={`rounded px-2 py-1 transition ${
            activeChannel === ch
              ? "bg-terminal-accent/20 text-terminal-accent"
              : "text-terminal-muted hover:text-terminal-text"
          }`}
        >
          {ch === "all" ? "All" : `#${ch}`}
        </button>
      ))}
      <span className="ml-4 text-terminal-muted">Asset:</span>
      {ASSETS.map((a) => (
        <button
          key={a}
          onClick={() => navigate(activeChannel, a)}
          className={`rounded px-2 py-1 transition ${
            activeAsset === a
              ? "bg-terminal-accent/20 text-terminal-accent"
              : "text-terminal-muted hover:text-terminal-text"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
