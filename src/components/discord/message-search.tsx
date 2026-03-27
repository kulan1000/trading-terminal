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
        className="flex-1 rounded-lg border border-terminal-border bg-terminal-surface px-3 py-2 font-mono text-sm text-terminal-text placeholder:text-terminal-muted focus:border-terminal-accent focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg border border-terminal-accent bg-terminal-accent/10 px-4 py-2 font-mono text-sm text-terminal-accent hover:bg-terminal-accent/20"
      >
        Search
      </button>
    </form>
  );
}
