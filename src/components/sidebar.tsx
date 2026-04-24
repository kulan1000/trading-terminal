"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useReviewBadge } from "@/hooks/use-review-badge";
import {
  TrendingUp,
  Trophy,
  Search,
  ClipboardList,
  LineChart,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

// /community, /data and /bias are WIP placeholders — hide until they ship
// so the sidebar only shows the pages that actually work.
const navItems = [
  { name: "Market", href: "/market", icon: LineChart },
  { name: "Sentiment", href: "/sentiment", icon: TrendingUp },
  { name: "Scoring", href: "/scoring", icon: Trophy },
  { name: "Discord Intel", href: "/discord-intel", icon: Search },
  { name: "Stocks", href: "/stocks", icon: Briefcase },
  { name: "Trades", href: "/trades", icon: ClipboardList },
  { name: "Admin", href: "/admin", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const pendingReviews = useReviewBadge();

  return (
    <aside
      className={`flex h-screen flex-col border-r border-tv-border bg-tv-sidebar transition-[width] duration-200 ${
        expanded ? "w-60" : "w-[60px]"
      }`}
      style={{ backgroundImage: "linear-gradient(180deg, rgba(20,25,40,0.15) 0%, transparent 40%)" }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-tv-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-tv-blue to-tv-blue/60 shadow-[0_0_16px_-4px_rgba(41,98,255,0.35)]">
          <span className="text-[11px] font-bold text-white">TT</span>
        </div>
        {expanded && (
          <span className="truncate text-[13px] font-bold tracking-wider text-tv-heading">
            Trading Terminal
          </span>
        )}
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
              aria-label={item.name}
              className={`relative mx-0 flex h-11 items-center gap-3 rounded-[6px] px-4 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-tv-blue/10 text-tv-blue"
                  : "text-tv-secondary hover:bg-white/[0.04] hover:text-tv-text"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-tv-blue" />
              )}
              <span className="relative shrink-0">
                <Icon size={18} strokeWidth={1.8} />
                {item.name === "Scoring" && pendingReviews > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF9800] px-1 text-[9px] font-bold text-black">
                    {pendingReviews > 9 ? "9+" : pendingReviews}
                  </span>
                )}
              </span>
              {expanded && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      <div className="border-t border-tv-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-tv-secondary">
          <span className="h-2 w-2 rounded-full bg-tv-bull" />
          {expanded && <span className="font-mono text-[11px]">LIVE</span>}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex h-10 items-center justify-center border-t border-tv-border text-tv-secondary transition-colors hover:bg-tv-elevated hover:text-tv-text"
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
