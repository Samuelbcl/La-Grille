"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ListChecks, Settings2, User, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/aujourdhui", label: "Aujourd'hui", icon: CalendarDays },
  { href: "/", label: "Matchs", icon: ListChecks },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/admin", label: "Gérer", icon: Settings2 },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="glass fixed bottom-0 inset-x-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium whitespace-nowrap transition",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
