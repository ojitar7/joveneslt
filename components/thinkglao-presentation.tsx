"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Maximize2, Minimize2, Play, Pause, RotateCcw, ArrowLeft, MessageCircleQuestion } from "lucide-react";

export function ThinkGlaoPresentation({id}:{id:string}){
 const [s,setS]=useState<any>(null); const [questions,setQuestions]=useState<any[]>([]); const [now,setNow]=useState(Date.now()); const [full,setFull]=useState(false);
 async function load(){const {data}=await supabase.from("thinkglao_sessions").select("*").eq("id",id).maybeSingle();setS(data)}
 async function loadQ(){if(!s)return;const {data}=await supabase.from("questions").select("*").eq("meeting_id",s.meeting_id).eq("status","featured").order("created_at",{ascending:false});setQuestions(data??[])}
 useEffect(()=>{load();const c=supabase.channel(`think-present-${id}`).on("postgres_changes",{event:"*",schema:"public",table:"thinkglao_sessions",filter:`id=eq.${id}`},load).subscribe();const t=setInterval(()=>setNow(Date.now()),1000);return()=>{supabase.removeChannel(c);clearInterval(t)}},[id]);
 useEffect(()=>{loadQ();if(!s)return;const c=supabase.channel(`think-q-${id}`).on("postgres_changes",{event:"*",schema:"public",table:"questions",filter:`meeting_id=eq.${s.meeting_id}`},loadQ).subscribe();return()=>{supabase.removeChannel(c)}},[s?.meeting_id]);
 if(!s)return <div className="grid min-h-screen place-items-center text-[#aab5ae]">Cargando ThinkGlao…</div>;
 const end=s.ends_at?new Date(s.ends_at).getTime():null;
 const remaining=end?Math.max(0,end-now):s.duration_seconds*1000;
 const sec=Math.floor(remaining/1000),mm=String(Math.floor(sec/60)).padStart(2,"0"),ss=String(sec%60).padStart(2,"0");
 const critical=remaining<=300000 && remaining>0;
 return <main className={`min-h-screen bg-[#050807] px-5 py-6 ${full?"fixed inset-0 z-[200] overflow-auto":""}`}>
  <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-between">
   <div className="flex items-center justify-between"><a href="/admin" className="btn btn-secondary"><ArrowLeft size={16}/> Admin</a><button className="btn btn-secondary px-3" onClick={()=>setFull(!full)}>{full?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div>
   <div className="py-10 text-center">
    <p className="text-sm font-black uppercase tracking-[.4em] text-[#b6c76d]">THINKGLAO</p>
    <div className="mt-8">{s.status==="live"?<span className="pill-live"><span className="pulse-dot"/> En directo</span>:<span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-[#aab5ae]">{s.status}</span>}</div>
    <div className={`marquee-number mt-7 text-[clamp(5rem,20vw,12rem)] font-black leading-none ${critical?"text-[#f0a27f]":"text-[#f7f5ef]"}`}>{mm}:{ss}</div>
    <h1 className="mt-8 text-3xl font-black">{s.speaker_name}</h1>
    <p className="mt-3 text-lg text-[#aab5ae]"><MessageCircleQuestion className="mr-2 inline" size={21}/>{questions.length} preguntas destacadas</p>
    {questions.length>0&&<div className="mx-auto mt-8 max-w-3xl space-y-3 text-left">{questions.map((q:any)=><div key={q.id} className="rounded-3xl border border-[#b6c76d]/20 bg-[#b6c76d]/7 p-5 text-xl font-bold">⭐ {q.body}</div>)}</div>}
   </div>
   <p className="pb-4 text-center text-xs text-[#68736d]">Modo presentación · preguntas moderadas en tiempo real</p>
  </div>
 </main>
}