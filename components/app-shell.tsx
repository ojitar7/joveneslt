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
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-[#BFB8AE]/15 bg-[#0F0104]/90 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-[560px] grid-cols-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link 
                key={href} 
                href={href}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  active ? "text-[#BFB8AE]" : "text-[#8C6969] hover:text-[#BFB8AE]/70"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
                <span className="font-light tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}