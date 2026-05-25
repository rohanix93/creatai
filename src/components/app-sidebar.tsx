"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Activity,
  Library,
  Users,
  UserStar,
  Boxes,
  Radar,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";

const NAV: Array<{
  href: string;
  code: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  phase?: number;
}> = [
  { href: "/dashboard",            code: "00", label: "Dashboard",       Icon: LayoutDashboard },
  { href: "/brand",                code: "01", label: "Brand Profile",   Icon: Building2,  phase: 2 },
  { href: "/analyze",              code: "02", label: "Analyze Content", Icon: Activity,   phase: 2 },
  { href: "/library",              code: "03", label: "Content Library", Icon: Library,    phase: 3 },
  { href: "/competitors",          code: "04", label: "Competitors",     Icon: Users,      phase: 2 },
  { href: "/creators",             code: "05", label: "Creators",        Icon: UserStar,   phase: 2 },
  { href: "/clusters",             code: "06", label: "Creative Clusters", Icon: Boxes,    phase: 4 },
  { href: "/trends",               code: "07", label: "Trend Radar",     Icon: Radar,      phase: 4 },
  { href: "/analyst",              code: "08", label: "AI Analyst",      Icon: Bot,        phase: 4 },
  { href: "/settings",             code: "09", label: "Settings",        Icon: Settings },
];

export function AppSidebar({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line-100 bg-bg-1/60 backdrop-blur-sm">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-line-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="cret-display text-2xl text-scan-red cret-glow-red">
            CREATAI
          </span>
        </Link>
        <div className="cret-mono text-[9px] tracking-[0.25em] text-ink-400 mt-1 uppercase">
          creative_intelligence_os
        </div>
      </div>

      {/* Status block */}
      <div className="px-5 py-3 border-b border-line-100 cret-mono text-[10px] uppercase tracking-[0.2em] space-y-1">
        <div className="flex justify-between">
          <span className="text-ink-400">node</span>
          <span className="text-neon-green">● online</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">user</span>
          <span className="text-ink-200 truncate max-w-[140px]" title={email}>
            {email ?? "guest"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 border border-transparent cret-mono uppercase text-[11px] tracking-[0.15em] transition-colors",
                active
                  ? "bg-bg-3 text-scan-red border-scan-red cret-box-glow-red"
                  : "text-ink-200 hover:bg-bg-2 hover:text-scan-red hover:border-scan-red/50"
              )}
            >
              <span className="text-ink-400 group-hover:text-scan-red w-6">
                {item.code}
              </span>
              <item.Icon size={14} className="shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.phase && item.phase > 1 && (
                <span className="text-[9px] text-neon-amber border border-neon-amber px-1">
                  P{item.phase}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <form action="/auth/signout" method="post" className="px-2 py-3 border-t border-line-100">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2 cret-mono uppercase text-[11px] tracking-[0.15em] text-ink-300 hover:text-neon-red hover:border-neon-red border border-transparent transition-colors"
        >
          <span className="text-ink-400 w-6">!</span>
          <LogOut size={14} className="shrink-0" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
