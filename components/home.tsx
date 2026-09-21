"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAnonymousId } from "@/lib/anonymous-id";
import type { Challenge, Meeting, MeetingBlock, Plan, Poll, PollOption, Theme } from "@/lib/types";
import { CalendarDays, ChevronRight, Clock3, Flame, MessageCircle, PartyPopper, Send, Sparkles, Timer, LockKeyhole } from "lucide-react";

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {day: "numeric", month: "short", year: "numeric"}).format(new Date(iso));
const timeFmt = (iso:string) =>
  new Intl.DateTimeFormat("es-ES",{hour:"2-digit",minute:"2-digit"}).format(new Date(iso));

export function Home() {
  const [theme,setTheme]=useState<Theme|null>(null);
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [challenge,setChallenge]=useState<Challenge|null>(null);
  const [settings,setSettings]=useState<Record<string,string>>({});
  const [links,setLinks]=useState<any[]>([]);
  const [selected,setSelected]=useState<string|null>(null);

  async function load(){
    const now=new Date().toISOString();
    const [{data:t},{data:m},{data:c},{data:s},{data:l}]=await Promise.all([
      supabase.from("themes").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("meetings").select("*").eq("published",true).gte("meeting_date",now.slice(0,10)).order("meeting_date").limit(8),
      supabase.from("challenges").select("*").eq("published",true).lte("starts_at",now).or(`ends_at.is.null,ends_at.gt.${now}`).order("starts_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("site_settings").select("*"),
      supabase.from("links").select("*").eq("published",true).order("sort_order")
    ]);
    setTheme(t); setMeetings(m??[]); setChallenge(c);
    setSettings(Object.fromEntries((s??[]).map((x:any)=>[x.key,x.value])));
    setLinks(l??[]);
    if(!selected && m?.[0]) setSelected(m[0].id);
  }

  useEffect(()=>{
    load();
    const ch=supabase.channel("jlt-v2-home")
      .on("postgres_changes",{event:"*",schema:"public",table:"themes"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"meetings"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"challenges"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"site_settings"},load)
      .subscribe();
    return ()=>{supabase.removeChannel(ch)};
  },[]);

  const next=meetings[0];
  return <div className="px-4 pb-8 pt-4">
    <header className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#b6c76d]">JÓVENES LT</p>
        <p className="mt-1 text-xs text-[#aab5ae]">Comunidad · 18–26</p>
      </div>
      <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#aab5ae]">2026/27</div>
    </header>

    <section className="glow-card card mt-4 p-5 fade-in">
      <p className="text-xs font-black uppercase tracking-[.16em] text-[#b6c76d]">{theme?.month_label || "Tema del mes"}</p>
      <h1 className="mt-1 text-4xl font-black leading-none">{theme?.title || "Jóvenes LT"}</h1>
      <p className="mt-3 max-w-[90%] text-sm leading-6 text-[#b7c0ba]">{theme?.subtitle || "Todo lo que vivimos juntos, en un solo sitio."}</p>
    </section>

    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#b6c76d]/20 bg-[#b6c76d]/8 p-3">
      <Clock3 size={19} className="text-[#b6c76d]"/>
      <div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-widest text-[#8f9a93]">Recordatorio</p><p className="truncate text-sm font-extrabold">{settings.weekly_banner || "Todos los jueves a las 21:00h"}</p></div>
      <Sparkles size={16} className="text-[#ead8b2]"/>
    </div>

    {next && <section className="mt-5">
      <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.16em] text-[#aab5ae]">Este jueves</p><span className="text-xs text-[#aab5ae]">{fmt(next.meeting_date)}</span></div>
      <Link href={`/reunion/${next.id}`} className="card block overflow-hidden p-5 transition active:scale-[.99]">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-2xl font-black">{next.title}</p><p className="mt-2 text-sm text-[#aab5ae]">{next.subtitle || next.description || "Todo preparado para el grupo."}</p></div>
          <ChevronRight className="mt-1 shrink-0 text-[#b6c76d]"/>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#cbd2cd]">
          <span className="rounded-full bg-white/6 px-3 py-2"><CalendarDays size={13} className="mr-1 inline"/> {fmt(next.starts_at,{dateStyle:"short"})}</span>
          <span className="rounded-full bg-white/6 px-3 py-2"><Clock3 size={13} className="mr-1 inline"/> {timeFmt(next.starts_at)}</span>
          {next.location && <span className="rounded-full bg-white/6 px-3 py-2">{next.location}</span>}
        </div>
      </Link>
    </section>}

    {challenge && <section className="card mt-4 overflow-hidden p-5">
      <div className="flex items-center gap-2 text-[#ead8b2]"><Flame size={18}/><p className="text-xs font-black uppercase tracking-[.16em]">Reto de la semana</p></div>
      <h2 className="mt-3 text-xl font-black">{challenge.title}</h2>
      <p className="mt-2 leading-6 text-[#c2cbc4]">{challenge.body}</p>
    </section>}

    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.16em] text-[#aab5ae]">Calendario</p><span className="text-xs text-[#69746d]">2026/27</span></div>
      <div className="space-y-2">
        {meetings.slice(0,6).map(m=><button key={m.id} onClick={()=>setSelected(m.id)} className={`w-full rounded-2xl border p-4 text-left ${selected===m.id?"border-[#b6c76d]/50 bg-[#b6c76d]/8":"border-white/8 bg-[#111917]"}`}>
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black">{fmt(m.meeting_date,{weekday:"short",day:"2-digit",month:"short"})}</p><p className="mt-1 text-sm text-[#aab5ae]">{m.title}</p></div><ChevronRight size={17} className="text-[#7d8981]"/></div>
        </button>)}
      </div>
    </section>

    <section className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-[#aab5ae]">Accesos rápidos</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={next?`/reunion/${next.id}`:"#"} className="btn btn-secondary"><PartyPopper size={17}/> Reunión</Link>
        <a href={settings.whatsapp_url||process.env.NEXT_PUBLIC_WHATSAPP_URL||"#"} target="_blank" rel="noreferrer" className="btn btn-primary"><MessageCircle size={17}/> WhatsApp</a>
      </div>
      {links.length>0&&<div className="mt-3 grid grid-cols-2 gap-2">{links.map((l:any)=><a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="btn btn-secondary text-xs">{l.icon} {l.title}</a>)}</div>}
    </section>
  </div>;
}