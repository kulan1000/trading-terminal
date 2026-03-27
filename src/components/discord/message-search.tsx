"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MessageSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discord-intel/search?q=${encodeURIComponent(query.trim())}`);
    }
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
