"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Bias", href: "/bias" },
  { name: "Community", href: "/community" },
  { name: "Discord Intel", href: "/discord-intel" },
  { name: "Data", href: "/data" },
  { name: "Market", href: "/market" },
  { name: "Trades", href: "/trades" },
] as const;

export function TerminalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-terminal-border bg-terminal-surface px-4">
      <span className="mr-4 text-sm font-bold tracking-wider text-terminal-accent">
        TT
      </span>
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              isActive
                ? "border-b-2 border-terminal-accent text-terminal-accent"
                : "text-terminal-muted hover:text-terminal-text"
            }`}
          >
            {tab.name.toUpperCase()}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-3 text-xs text-terminal-muted">
        <span className="h-2 w-2 rounded-full bg-terminal-green" />
        <span>LIVE</span>
      </div>
    </nav>
  );
}
