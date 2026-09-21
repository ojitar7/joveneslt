"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Plan } from "@/lib/types";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

export function PlansPage(){
  const [plans,setPlans]=useState<Plan[]>([]);
  async function load(){const {data}=await supabase.from("plans").select("*").eq("published",true).gte("starts_at",new Date().toISOString()).order("starts_at");setPlans(data??[])}
  useEffect(()=>{load();const c=supabase.channel("jlt-plans-v2").on("postgres_changes",{event:"*",schema:"public",table:"plans"},load).subscribe();return()=>{supabase.removeChannel(c)}},[]);
  return <div className="px-4 pb-8 pt-5">
    <p className="text-xs font-black uppercase tracking-[.2em] text-[#b6c76d]">Jóvenes LT</p>
    <h1 className="mt-1 text-4xl font-black">Planes</h1>
    <p className="mt-2 text-sm leading-6 text-[#aab5ae]">Convivencias, retiros, cenas y todo lo que hacemos fuera del jueves.</p>
    <div className="mt-5 space-y-3">{plans.map(p=><article key={p.id} className="card overflow-hidden p-5">
      {p.image_url&&<img src={p.image_url} alt="" className="mb-4 aspect-[16/8] w-full rounded-2xl object-cover"/>}
      <h2 className="text-xl font-black">{p.title}</h2>
      <p className="mt-2 text-sm text-[#c5ccc7]"><CalendarDays size={15} className="mr-1 inline"/>{new Intl.DateTimeFormat("es-ES",{dateStyle:"full",timeStyle:"short"}).format(new Date(p.starts_at))}</p>
      {p.location&&<p className="mt-2 text-sm text-[#c5ccc7]"><MapPin size={15} className="mr-1 inline"/>{p.location}</p>}
      {p.description&&<p className="mt-3 leading-6 text-[#aab5ae]">{p.description}</p>}
      <div className="mt-4 flex items-center justify-between"><b>{p.price_cents===0?"Gratis":`${(p.price_cents/100).toFixed(2).replace(".",",")} €`}</b>{p.signup_url&&<a href={p.signup_url} target="_blank" rel="noreferrer" className="btn btn-primary">Inscribirme <ArrowUpRight size={16}/></a>}</div>
    </article>)}{!plans.length&&<div className="card p-7 text-center text-[#aab5ae]">No hay planes próximos publicados.</div>}</div>
  </div>
}