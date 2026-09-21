"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrayerPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [prayed, setPrayed] = useState<Record<string, boolean>>({});

  async function load() {
    const { data } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
    setRequests(data ?? []);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel("prayer-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "prayer_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function createRequest() {
    if (!title.trim()) return;
    await supabase.from("prayer_requests").insert({ title: title.trim() });
    setTitle("");
  }

  async function pray(id: string, current: number) {
    if (prayed[id]) return;
    await supabase.from("prayer_requests").update({ prayers_count: current + 1 }).eq("id", id);
    setPrayed(prev => ({ ...prev, [id]: true }));
  }

  return (
    <div className="px-4 pb-20 pt-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15}/> Inicio
      </Link>
      <h1 className="text-2xl font-light text-[#F2F2F2]">Rincón de Oración</h1>
      <p className="mt-1 text-xs font-light text-[#8C6969]">Comparte intenciones comunitarias y únete en oración.</p>

      <div className="mt-5 card p-4 space-y-3">
        <input 
          className="input text-xs" 
          placeholder="Escribe una intención..." 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />
        <button onClick={createRequest} className="btn btn-primary w-full text-xs">
          <Plus size={14}/> Publicar Intención
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {requests.map(r => (
          <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-light text-[#F2F2F2]">{r.title}</p>
              <p className="mt-1 text-[10px] text-[#8C6969] font-light">
                {r.prayers_count} {r.prayers_count === 1 ? "persona ha orado" : "personas han orado"}
              </p>
            </div>
            <button 
              onClick={() => pray(r.id, r.prayers_count)}
              className={`btn text-xs py-1.5 px-3 border transition-all ${
                prayed[r.id] 
                  ? "bg-[#590A1F] border-[#BFB8AE]/40 text-[#BFB8AE]" 
                  : "btn-secondary"
              }`}
            >
              <Heart size={13} className={prayed[r.id] ? "fill-current text-[#BFB8AE]" : ""} />
              {prayed[r.id] ? "Unido" : "Unirme"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}