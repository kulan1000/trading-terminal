"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Sentiment", href: "/sentiment" },
  { name: "Scoring", href: "/scoring" },
  { name: "Community", href: "/community" },
  { name: "Discord Intel", href: "/discord-intel" },
  { name: "Data", href: "/data" },
  { name: "Market", href: "/market" },
  { name: "Stocks", href: "/stocks" },
  { name: "Trades", href: "/trades" },
] as const;

export function TerminalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-white/[0.06] bg-[#111111] px-4">
      <span className="mr-4 text-sm font-bold tracking-wider text-[#2962FF]">
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
                ? "border-b-2 border-[#2962FF] text-[#2962FF]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.name.toUpperCase()}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-3 text-xs text-white/40">
        <span className="h-2 w-2 rounded-full bg-[#26A69A]" />
        <span>LIVE</span>
      </div>
    </nav>
  );
}
