"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  MessageSquare,
  Search,
  ClipboardList,
  LineChart,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Bias", href: "/bias", icon: TrendingUp },
  { name: "Scoring", href: "/scoring", icon: Trophy },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Discord Intel", href: "/discord-intel", icon: Search },
  { name: "Data", href: "/data", icon: BarChart3 },
  { name: "Market", href: "/market", icon: LineChart },
  { name: "Stocks", href: "/stocks", icon: Briefcase },
  { name: "Trades", href: "/trades", icon: ClipboardList },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`flex h-screen flex-col bg-tv-black transition-all duration-200 ${
        expanded ? "w-60" : "w-[60px]"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        <span className="text-sm font-bold tracking-wider text-tv-blue">
          {expanded ? "TRADING TERMINAL" : "TT"}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-2 pt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={expanded ? undefined : item.name}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-tv-blue/15 text-tv-blue"
                  : "text-tv-text-secondary hover:bg-tv-hover hover:text-tv-text"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} className="shrink-0" />
              {expanded && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator + Toggle */}
      <div className="border-t border-tv-border px-3 py-3">
        <div className="flex items-center gap-2 text-xs text-tv-text-secondary">
          <span className="h-2 w-2 rounded-full bg-tv-green" />
          {expanded && <span className="font-mono text-[11px]">LIVE</span>}
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex h-10 items-center justify-center border-t border-tv-border text-tv-text-secondary transition-colors hover:bg-tv-hover hover:text-tv-text"
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
