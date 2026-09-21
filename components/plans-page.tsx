"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Plan } from "@/lib/types";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  async function load() {
    const { data } = await supabase.from("plans").select("*").eq("published", true).gte("starts_at", new Date().toISOString()).order("starts_at");
    setPlans(data ?? []);
  }
  useEffect(() => {
    load();
    const c = supabase.channel("jlt-plans-v2").on("postgres_changes", { event: "*", schema: "public", table: "plans" }, load).subscribe();
    return () => { supabase.removeChannel(c); };
  }, []);

  return (
    <div className="px-4 pb-8 pt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#BFB8AE]">Jóvenes LT</p>
      <h1 className="mt-1 text-3xl font-light text-[#F2F2F2]">Planes</h1>
      <p className="mt-1 text-xs font-light leading-relaxed text-[#8C6969]">Convivencias, retiros, cenas y todo lo que hacemos fuera del jueves.</p>
      
      <div className="mt-5 space-y-3">
        {plans.map(p => (
          <article key={p.id} className="card overflow-hidden p-5">
            {p.image_url && <img src={p.image_url} alt="" className="mb-4 aspect-[16/8] w-full rounded-lg object-cover border border-[#BFB8AE]/10"/>}
            <h2 className="text-lg font-normal text-[#F2F2F2]">{p.title}</h2>
            <p className="mt-2 text-xs font-light text-[#BFB8AE]">
              <CalendarDays size={13} className="mr-1.5 inline text-[#BFB8AE]"/>
              {new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short" }).format(new Date(p.starts_at))}
            </p>
            {p.location && (
              <p className="mt-1 text-xs font-light text-[#BFB8AE]">
                <MapPin size={13} className="mr-1.5 inline text-[#BFB8AE]"/>
                {p.location}
              </p>
            )}
            {p.description && <p className="mt-3 text-xs font-light leading-relaxed text-[#8C6969]">{p.description}</p>}
            <div className="mt-4 flex items-center justify-between border-t border-[#BFB8AE]/10 pt-3">
              <span className="text-sm font-medium text-[#F2F2F2]">
                {p.price_cents === 0 ? "Gratis" : `${(p.price_cents / 100).toFixed(2).replace(".", ",")} €`}
              </span>
              {p.signup_url && (
                <a href={p.signup_url} target="_blank" rel="noreferrer" className="btn btn-primary text-xs">
                  Inscribirme <ArrowUpRight size={14}/>
                </a>
              )}
            </div>
          </article>
        ))}
        {!plans.length && (
          <div className="card p-7 text-center text-xs font-light text-[#8C6969]">
            No hay planes próximos publicados.
          </div>
        )}
      </div>
    </div>
  );
}