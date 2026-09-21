"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, MessageSquare, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    meetingsCount: 0,
    questionsCount: 0,
    votesCount: 0,
    prayersCount: 0
  });

  useEffect(() => {
    async function loadStats() {
      const [{ count: m }, { count: q }, { count: v }, { count: p }] = await Promise.all([
        supabase.from("meetings").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("poll_votes").select("*", { count: "exact", head: true }),
        supabase.from("prayer_requests").select("*", { count: "exact", head: true })
      ]);

      setStats({
        meetingsCount: m || 0,
        questionsCount: q || 0,
        votesCount: v || 0,
        prayersCount: p || 0
      });
    }
    loadStats();
  }, []);

  return (
    <div className="px-4 pb-12 pt-4">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15}/> Admin
      </Link>
      <h1 className="text-2xl font-light text-[#F2F2F2]">Panel de Participación</h1>
      <p className="mt-1 text-xs font-light text-[#8C6969]">Métricas consolidadas de la actividad anónima del grupo.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <BarChart3 size={18} className="text-[#BFB8AE]"/>
          <p className="mt-2 text-2xl font-light text-[#F2F2F2]">{stats.meetingsCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#8C6969] mt-1 font-medium">Reuniones</p>
        </div>

        <div className="card p-4">
          <MessageSquare size={18} className="text-[#BFB8AE]"/>
          <p className="mt-2 text-2xl font-light text-[#F2F2F2]">{stats.questionsCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#8C6969] mt-1 font-medium">Preguntas</p>
        </div>

        <div className="card p-4">
          <BarChart3 size={18} className="text-[#BFB8AE]"/>
          <p className="mt-2 text-2xl font-light text-[#F2F2F2]">{stats.votesCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#8C6969] mt-1 font-medium">Votos en Directo</p>
        </div>

        <div className="card p-4">
          <Heart size={18} className="text-[#BFB8AE]"/>
          <p className="mt-2 text-2xl font-light text-[#F2F2F2]">{stats.prayersCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#8C6969] mt-1 font-medium">Oraciones</p>
        </div>
      </div>
    </div>
  );
}