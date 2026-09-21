"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Challenge, Meeting, Theme } from "@/lib/types";
import { CalendarDays, ChevronRight, Clock3, Flame, MessageCircle, PartyPopper, Sparkles } from "lucide-react";
import Image from "next/image";

const fmt = (iso: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-ES", options || { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const timeFmt = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function Home() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  async function load() {
    const now = new Date().toISOString();
    const [{ data: t }, { data: m }, { data: c }, { data: s }, { data: l }] = await Promise.all([
      supabase.from("themes").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("meetings").select("*").eq("published", true).gte("meeting_date", now.slice(0, 10)).order("meeting_date").limit(8),
      supabase.from("challenges").select("*").eq("published", true).lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`).order("starts_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("site_settings").select("*"),
      supabase.from("links").select("*").eq("published", true).order("sort_order")
    ]);
    setTheme(t); setMeetings(m ?? []); setChallenge(c);
    setSettings(Object.fromEntries((s ?? []).map((x: any) => [x.key, x.value])));
    setLinks(l ?? []);
    if (!selected && m?.[0]) setSelected(m[0].id);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel("jlt-v2-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "themes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch) };
  }, []);

  const next = meetings[0];
  return (
    <div className="px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Jóvenes LT Logo" 
            width={38} 
            height={38} 
            className="rounded-lg object-cover border border-[#BFB8AE]/20"
          />        
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#BFB8AE]">JÓVENES LT</p>
            <p className="text-[11px] font-light text-[#8C6969]">Fiat voluntas tua</p>
          </div>
        </div>
        <div className="rounded-full border border-[#BFB8AE]/15 px-3 py-0.5 text-[10px] font-medium text-[#BFB8AE]">2026/27</div>
      </header>

      <section className="glow-card card mt-4 p-5 fade-in">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#BFB8AE]">{theme?.month_label || "Tema del mes"}</p>
        <h1 className="mt-1 text-3xl font-light leading-tight text-[#F2F2F2]">{theme?.title || "Jóvenes LT"}</h1>
        <p className="mt-2 text-xs font-light leading-relaxed text-[#BFB8AE]/80">{theme?.subtitle || "Todo lo que vivimos juntos, en un solo sitio."}</p>
      </section>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#BFB8AE]/15 bg-[#590A1F]/20 p-3">
        <Clock3 size={17} className="text-[#BFB8AE] shrink-0"/>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-[#8C6969]">Recordatorio</p>
          <p className="truncate text-xs font-medium text-[#F2F2F2]">{settings.weekly_banner || "Todos los jueves a las 21:00h"}</p>
        </div>
        <Sparkles size={15} className="text-[#BFB8AE]/70 shrink-0"/>
      </div>

      {next && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8C6969]">Este jueves</p>
            <span className="text-xs font-light text-[#8C6969]">{fmt(next.meeting_date)}</span>
          </div>
          <Link href={`/reunion/${next.id}`} className="card card-interactive block overflow-hidden p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-normal text-[#F2F2F2]">{next.title}</p>
                <p className="mt-1.5 text-xs font-light leading-relaxed text-[#8C6969]">{next.subtitle || next.description || "Todo preparado para el grupo."}</p>
              </div>
              <ChevronRight className="mt-1 shrink-0 text-[#BFB8AE]"/>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#BFB8AE]">
              <span className="rounded-md border border-[#BFB8AE]/10 bg-white/5 px-2.5 py-1 text-[11px] font-light">
                <CalendarDays size={12} className="mr-1 inline text-[#BFB8AE]"/> {fmt(next.starts_at, { dateStyle: "short" })}
              </span>
              <span className="rounded-md border border-[#BFB8AE]/10 bg-white/5 px-2.5 py-1 text-[11px] font-light">
                <Clock3 size={12} className="mr-1 inline text-[#BFB8AE]"/> {timeFmt(next.starts_at)}
              </span>
              {next.location && (
                <span className="rounded-md border border-[#BFB8AE]/10 bg-white/5 px-2.5 py-1 text-[11px] font-light">{next.location}</span>
              )}
            </div>
          </Link>
        </section>
      )}

      {challenge && (
        <section className="card mt-4 overflow-hidden p-5">
          <div className="flex items-center gap-2 text-[#BFB8AE]">
            <Flame size={16}/>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em]">Reto de la semana</p>
          </div>
          <h2 className="mt-2 text-lg font-normal text-[#F2F2F2]">{challenge.title}</h2>
          <p className="mt-1.5 text-xs font-light leading-relaxed text-[#8C6969]">{challenge.body}</p>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8C6969]">Calendario</p>
          <span className="text-xs font-light text-[#8C6969]">2026/27</span>
        </div>
        <div className="space-y-2">
          {meetings.slice(0, 6).map(m => (
            <button 
              key={m.id} 
              onClick={() => setSelected(m.id)} 
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                selected === m.id 
                  ? "border-[#BFB8AE]/40 bg-[#590A1F]/30" 
                  : "border-[#BFB8AE]/10 bg-[#1E0308]/60 hover:border-[#BFB8AE]/25"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#BFB8AE]">{fmt(m.meeting_date, { weekday: "short", day: "2-digit", month: "short" })}</p>
                  <p className="mt-0.5 text-xs font-light text-[#F2F2F2]">{m.title}</p>
                </div>
                <ChevronRight size={15} className="text-[#8C6969]"/>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-[#BFB8AE]/10 bg-[#1E0308]/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6969]">Accesos rápidos</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={next ? `/reunion/${next.id}` : "#"} className="btn btn-secondary text-xs">
            <PartyPopper size={15} className="text-[#BFB8AE]"/> Reunión
          </Link>
          <a href={settings.whatsapp_url || process.env.NEXT_PUBLIC_WHATSAPP_URL || "#"} target="_blank" rel="noreferrer" className="btn btn-primary text-xs">
            <MessageCircle size={15}/> WhatsApp
          </a>
        </div>
        {links.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {links.map((l: any) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="btn btn-secondary text-xs">
                {l.icon} {l.title}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}