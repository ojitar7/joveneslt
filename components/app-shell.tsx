"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Sparkles, Heart, Music2, ShieldCheck } from "lucide-react";
import { PwaRegister } from "./pwa-register";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Si estamos en la vista de presentación a pantalla completa (ThinkGlao), no mostramos el menú
  if (pathname?.startsWith("/thinkglao/")) {
    return <>{children}</>;
  }

  const items = [
    { href: "/", label: "Este mes", icon: Calendar },
    { href: "/alabanza", label: "Alabanza", icon: Music2 },
    { href: "/oracion", label: "Oración", icon: Heart },
    { href: "/planes", label: "Planes", icon: Sparkles },
    { href: "/admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#0F0104] text-[#F2F2F2] selection:bg-[#590A1F] selection:text-[#BFB8AE]">
      <PwaRegister />
      <main className="mx-auto max-w-md pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#BFB8AE]/10 bg-[#0F0104]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition-all ${
                  active
                    ? "text-[#BFB8AE]"
                    : "text-[#8C6969] hover:text-[#BFB8AE]/70"
                }`}
              >
                <Icon size={18} className={active ? "text-[#BFB8AE]" : "text-[#8C6969]"} />
                <span className="text-[10px] font-light tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}