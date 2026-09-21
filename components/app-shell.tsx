"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Shield } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const nav = [
    { href: "/", label: "Este mes", icon: Home },
    { href: "/planes", label: "Planes", icon: CalendarDays },
    { href: "/admin", label: "Admin", icon: Shield }
  ];
  return (
    <main className="min-h-screen">
      <div className="mx-auto min-h-screen w-full max-w-[560px] safe-bottom">{children}</div>
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080d0c]/90 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-[560px] grid-cols-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-bold ${active ? "text-[#b6c76d]" : "text-[#aab5ae]"}`}>
              <Icon size={21} strokeWidth={active ? 2.6 : 2} />
              <span>{label}</span>
            </Link>;
          })}
        </div>
      </nav>
    </main>
  );
}