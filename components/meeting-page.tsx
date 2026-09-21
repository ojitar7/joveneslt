"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAnonymousId } from "@/lib/anonymous-id";
import type { Meeting, MeetingBlock, Poll, PollOption, Question } from "@/lib/types";
import { ArrowLeft, BookOpen, Check, Clock3, Flame, LockKeyhole, MessageCircleQuestion, Music2, Send, Sparkles, Timer } from "lucide-react";
import Link from "next/link";

function Countdown({start,end}:{start:string|null,end:string|null}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
  if(!start&&!end)return null;
  const s=start?new Date(start).getTime():now, e=end?new Date(end).getTime():s;
  const live=now>=s&&now<e, remaining=Math.max(0,(live?e:s)-now);
  const sec=Math.floor(remaining/1000), mm=String(Math.floor(sec/60)).padStart(2,"0"), ss=String(sec%60).padStart(2,"0");
  return <div className={`mt-4 rounded-2xl p-4 text-center ${live&&remaining<=300?"bg-[#c98362]/15 border border-[#c98362]/30":"bg-black/20 border border-white/8"}`}>
    {live&&<span className="pill-live"><span className="pulse-dot"/> En directo</span>}
    <div className={`marquee-number mt-2 text-5xl font-black ${live&&remaining<=300?"text-[#f0a27f]":""}`}>{mm}:{ss}</div>
    <p className="text-xs text-[#8f9a93]">{now<s?"Empieza en":now<e?"Tiempo restante":"Finalizada"}</p>
  </div>
}

export function MeetingPage({id}:{id:string}) {
  const [meeting,setMeeting]=useState<Meeting|null>(null);
  const [blocks,setBlocks]=useState<MeetingBlock[]>([]);
  const [poll,setPoll]=useState<Poll|null>(null);
  const [options,setOptions]=useState<PollOption[]>([]);
  const [voted,setVoted]=useState(false);
  const [question,setQuestion]=useState("");
  const [petition,setPetition]=useState("");
  const [sent,setSent]=useState("");
  const [questions,setQuestions]=useState<Question[]>([]);

  async function load(){
    const [{data:m},{data:b},{data:p}]=await Promise.all([
      supabase.from("meetings").select("*").eq("id",id).maybeSingle(),
      supabase.from("meeting_blocks").select("*").eq("meeting_id",id).eq("enabled",true).order("sort_order"),
      supabase.from("polls").select("*").eq("meeting_id",id).eq("active",true).maybeSingle()
    ]);
    setMeeting(m);setBlocks(b??[]);setPoll(p);
    if(p){const {data:o}=await supabase.from("poll_options").select("*").eq("poll_id",p.id).order("sort_order");setOptions(o??[]);setVoted(localStorage.getItem(`jlt-voted-${p.id}`)==="1")}
    else {setOptions([])}
  }

  async function loadQuestions(){
    const {data}=await supabase.from("questions").select("*").eq("meeting_id",id).in("status",["visible","featured","answered"]).order("status").order("created_at",{ascending:false});
    setQuestions(data??[]);
  }

  useEffect(()=>{
    load();loadQuestions();
    const ch=supabase.channel(`jlt-meeting-${id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"meetings",filter:`id=eq.${id}`},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"meeting_blocks",filter:`meeting_id=eq.${id}`},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"polls",filter:`meeting_id=eq.${id}`},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"questions",filter:`meeting_id=eq.${id}`},loadQuestions)
      .subscribe();
    return()=>{supabase.removeChannel(ch)}
  },[id]);

  async function vote(optionId:string){
    if(voted||!poll)return;
    const {error}=await supabase.from("poll_votes").insert({poll_id:poll.id,option_id:optionId,anonymous_id:getAnonymousId()});
    if(!error){localStorage.setItem(`jlt-voted-${poll.id}`,"1");setVoted(true);setSent("Voto registrado. ¡Gracias!")}
  }
  async function submit(table:"questions"|"petitions",body:string){
    if(!body.trim())return;
    const {error}=await supabase.from(table).insert({meeting_id:id,body:body.trim(),anonymous_id:getAnonymousId()});
    setSent(error?"No se ha podido enviar.":table==="questions"?"Pregunta enviada al coordinador.":"Petición enviada de forma anónima.");
    if(!error) table==="questions"?setQuestion(""):setPetition("");
  }

  const blocksByType=useMemo(()=>new Map(blocks.map(b=>[b.type,b])),[blocks]);
  if(!meeting)return <div className="p-5"><p className="text-[#aab5ae]">Cargando reunión…</p></div>;

  return <div className="px-4 pb-8 pt-4">
    <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#aab5ae]"><ArrowLeft size={17}/> Este mes</Link>
    <header className="card glow-card p-5">
      <p className="text-xs font-black uppercase tracking-widest text-[#b6c76d]">{new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long"}).format(new Date(meeting.starts_at))}</p>
      <h1 className="mt-2 text-3xl font-black leading-tight">{meeting.title}</h1>
      {meeting.subtitle&&<p className="mt-2 text-[#aab5ae]">{meeting.subtitle}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-white/7 px-3 py-2"><Clock3 size={13} className="mr-1 inline"/>{new Intl.DateTimeFormat("es-ES",{hour:"2-digit",minute:"2-digit"}).format(new Date(meeting.starts_at))}</span>{meeting.location&&<span className="rounded-full bg-white/7 px-3 py-2">{meeting.location}</span>}</div>
    </header>

    {meeting.description&&<p className="mt-4 leading-6 text-[#c3cbc5]">{meeting.description}</p>}

    <div className="mt-5 space-y-3">
      {blocks.map(b=><Block key={b.id} block={b} poll={poll} options={options} voted={voted} vote={vote}/>)}
    </div>

    {blocksByType.has("thermometer")&&poll&&<Thermometer poll={poll} options={options} voted={voted} vote={vote}/>}
    {blocksByType.has("thinkglao")&&<section className="card mt-4 p-5">
      <div className="flex items-center gap-2 text-[#b6c76d]"><MessageCircleQuestion size={20}/><p className="font-black">Muro de preguntas</p></div>
      <p className="mt-1 text-xs text-[#8f9a93]">Tu pregunta llega al coordinador y puede aparecer en directo.</p>
      <textarea className="input mt-3 min-h-24 resize-none" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="¿Qué quieres preguntar?"/>
      <button className="btn btn-primary mt-3 w-full" onClick={()=>submit("questions",question)}><Send size={17}/> Enviar pregunta</button>
      <div className="mt-5 space-y-2">{questions.map(q=><div key={q.id} className={`rounded-2xl p-3 ${q.status==="featured"?"border border-[#b6c76d]/35 bg-[#b6c76d]/8":"bg-white/4"}`}><span className="mr-2">{q.status==="featured"?"⭐":"•"}</span>{q.body}</div>)}</div>
    </section>}

    {blocksByType.has("petition")&&<section className="card mt-4 p-5">
      <div className="flex items-center gap-2 text-[#ead8b2]"><LockKeyhole size={18}/><p className="font-black">Petición privada</p></div>
      <p className="mt-1 text-xs text-[#8f9a93]">🔒 Solo los coordinadores pueden leer las peticiones.</p>
      <textarea className="input mt-3 min-h-24 resize-none" value={petition} onChange={e=>setPetition(e.target.value)} placeholder="Escribe tu intención…"/>
      <button className="btn btn-primary mt-3 w-full" onClick={()=>submit("petitions",petition)}><Send size={17}/> Enviar anónimamente</button>
    </section>}

    {sent&&<p className="mt-4 text-center text-sm font-bold text-[#b6c76d]">{sent}</p>}
  </div>;
}

function Block({block,poll,options,voted,vote}:{block:MeetingBlock,poll:Poll|null,options:PollOption[],voted:boolean,vote:(id:string)=>void}){
  const icons:any={bible:BookOpen,alabanza:Music2,dynamic:Sparkles,thinkglao:MessageCircleQuestion,dinner:Flame,thermometer:Timer};
  const Icon=icons[block.type]||Sparkles;
  return <section className="card p-5">
    <div className="flex items-center gap-2"><Icon size={19} className="text-[#b6c76d]"/><p className="font-black">{block.title}</p></div>
    {block.content&&<p className="mt-3 whitespace-pre-wrap leading-6 text-[#c4ccc6]">{block.content}</p>}
    {block.type==="thinkglao"&&block.metadata&&<Think block={block}/>}
    {block.type==="thermometer"&&poll&&<Thermometer poll={poll} options={options} voted={voted} vote={vote}/>}
    {block.type==="dinner"&&<p className="mt-3 text-sm text-[#aab5ae]">El coordinador puede sortear las tareas de la cena desde Admin.</p>}
  </section>
}

function Think({block}:{block:MeetingBlock}){
  const md=block.metadata||{}; return <div className="mt-4"><p className="text-lg font-black">{String(md.speaker||"Ponente por confirmar")}</p><Countdown start={typeof md.starts_at==="string"?md.starts_at:null} end={typeof md.ends_at==="string"?md.ends_at:null}/></div>
}

function Thermometer({poll,options,voted,vote}:{poll:Poll,options:PollOption[],voted:boolean,vote:(id:string)=>void}){
  return <div className="mt-4 space-y-2">{options.map(o=><button disabled={voted} key={o.id} onClick={()=>vote(o.id)} className={`w-full rounded-2xl border p-4 text-left transition ${voted?"opacity-70":"border-white/8 bg-white/3 active:scale-[.99]"}`}><span className="mr-3 text-2xl">{o.emoji}</span><span className="font-bold">{o.label}</span></button>)}{voted&&<p className="pt-2 text-center text-xs text-[#b6c76d]"><Check size={15} className="mr-1 inline"/> Ya has votado en este dispositivo.</p>}</div>
}