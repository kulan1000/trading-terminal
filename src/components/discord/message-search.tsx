"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function MessageSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams(params.toString());
    if (query.trim()) {
      sp.set("q", query.trim());
    } else {
      sp.delete("q");
    }
    const qs = sp.toString();
    router.push(`/discord-intel${qs ? `?${qs}` : ""}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search messages... (e.g. gold, short, 2400)"
        className="flex-1 rounded-[6px] border border-tv-border bg-tv-input px-3 py-2 font-mono text-sm text-tv-text placeholder:text-tv-text-subtle focus:border-tv-blue focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-[6px] bg-tv-blue px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-tv-blue/80"
      >
        Search
      </button>
    </form>
  );
}
