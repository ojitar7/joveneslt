"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAnonymousId } from "@/lib/anonymous-id";
import type { Meeting, MeetingBlock, Poll, PollOption, Question } from "@/lib/types";
import { ArrowLeft, BookOpen, Check, Clock3, Flame, LockKeyhole, MessageCircleQuestion, Music2, Send, Sparkles, Timer } from "lucide-react";
import Link from "next/link";

function Countdown({ start, end }: { start: string | null; end: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!start && !end) return null;
  const s = start ? new Date(start).getTime() : now;
  const e = end ? new Date(end).getTime() : s;
  const live = now >= s && now < e;
  const remaining = Math.max(0, (live ? e : s) - now);
  const sec = Math.floor(remaining / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className={`mt-4 rounded-xl p-4 text-center transition-all ${
      live && remaining <= 300000 
        ? "border border-[#8C6969]/50 bg-[#590A1F]/30" 
        : "border border-[#BFB8AE]/10 bg-black/30"
    }`}>
      {live && <span className="pill-live"><span className="pulse-dot" /> En directo</span>}
      <div className={`mt-2 font-mono text-4xl font-light tracking-tight ${live && remaining <= 300000 ? "text-[#BFB8AE]" : "text-[#F2F2F2]"}`}>
        {mm}:{ss}
      </div>
      <p className="mt-1 text-xs font-light text-[#8C6969]">
        {now < s ? "Empieza en" : now < e ? "Tiempo restante" : "Finalizada"}
      </p>
    </div>
  );
}

export function MeetingPage({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [blocks, setBlocks] = useState<MeetingBlock[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [voted, setVoted] = useState(false);
  const [question, setQuestion] = useState("");
  const [petition, setPetition] = useState("");
  const [sent, setSent] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  async function load() {
    const [{ data: m }, { data: b }, { data: p }] = await Promise.all([
      supabase.from("meetings").select("*").eq("id", id).maybeSingle(),
      supabase.from("meeting_blocks").select("*").eq("meeting_id", id).eq("enabled", true).order("sort_order"),
      supabase.from("polls").select("*").eq("meeting_id", id).eq("active", true).maybeSingle()
    ]);
    setMeeting(m);
    setBlocks(b ?? []);
    setPoll(p);

    if (p) {
      const { data: o } = await supabase.from("poll_options").select("*").eq("poll_id", p.id).order("sort_order");
      setOptions(o ?? []);
      setVoted(localStorage.getItem(`jlt-voted-${p.id}`) === "1");
    } else {
      setOptions([]);
    }
  }

  async function loadQuestions() {
    const { data } = await supabase.from("questions")
      .select("*")
      .eq("meeting_id", id)
      .in("status", ["visible", "featured", "answered"])
      .order("status")
      .order("created_at", { ascending: false });
    setQuestions(data ?? []);
  }

  useEffect(() => {
    load();
    loadQuestions();
    const ch = supabase.channel(`jlt-meeting-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_blocks", filter: `meeting_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `meeting_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `meeting_id=eq.${id}` }, loadQuestions)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  async function vote(optionId: string) {
    if (voted || !poll) return;
    const { error } = await supabase.from("poll_votes").insert({ poll_id: poll.id, option_id: optionId, anonymous_id: getAnonymousId() });
    if (!error) {
      localStorage.setItem(`jlt-voted-${poll.id}`, "1");
      setVoted(true);
      setSent("Voto registrado. ¡Gracias!");
    }
  }

  async function submit(table: "questions" | "petitions", body: string) {
    if (!body.trim()) return;
    const { error } = await supabase.from(table).insert({ meeting_id: id, body: body.trim(), anonymous_id: getAnonymousId() });
    setSent(error ? "No se ha podido enviar." : table === "questions" ? "Pregunta enviada al coordinador." : "Petición enviada de forma anónima.");
    if (!error) table === "questions" ? setQuestion("") : setPetition("");
  }

  const blocksByType = useMemo(() => new Map(blocks.map(b => [b.type, b])), [blocks]);

  if (!meeting) {
    return (
      <div className="p-5">
        <p className="text-xs font-light text-[#8C6969]">Cargando reunión…</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-4">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-light text-[#8C6969] transition-colors hover:text-[#BFB8AE]">
        <ArrowLeft size={15} /> Este mes
      </Link>

      <header className="card glow-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#BFB8AE]">
          {new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date(meeting.starts_at))}
        </p>
        <h1 className="mt-2 text-2xl font-normal leading-tight text-[#F2F2F2]">{meeting.title}</h1>
        {meeting.subtitle && <p className="mt-1.5 text-xs font-light text-[#8C6969]">{meeting.subtitle}</p>}
        
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-light text-[#BFB8AE]">
          <span className="rounded-md border border-[#BFB8AE]/10 bg-white/5 px-2.5 py-1 text-[11px]">
            <Clock3 size={12} className="mr-1 inline text-[#BFB8AE]" />
            {new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(meeting.starts_at))}
          </span>
          {meeting.location && (
            <span className="rounded-md border border-[#BFB8AE]/10 bg-white/5 px-2.5 py-1 text-[11px]">{meeting.location}</span>
          )}
        </div>
      </header>

      {meeting.description && (
        <p className="mt-4 text-xs font-light leading-relaxed text-[#BFB8AE]/90">{meeting.description}</p>
      )}

      <div className="mt-5 space-y-3">
        {blocks.map(b => (
          <Block key={b.id} block={b} poll={poll} options={options} voted={voted} vote={vote} />
        ))}
      </div>

      {blocksByType.has("thermometer") && poll && <Thermometer poll={poll} options={options} voted={voted} vote={vote} />}

      {blocksByType.has("thinkglao") && (
        <section className="card mt-4 p-5">
          <div className="flex items-center gap-2 text-[#BFB8AE]">
            <MessageCircleQuestion size={18} />
            <p className="text-[10px] font-semibold uppercase tracking-[.2em]">Muro de preguntas</p>
          </div>
          <p className="mt-1 text-xs font-light text-[#8C6969]">Tu pregunta llega al coordinador y puede aparecer en directo.</p>
          <textarea
            className="input mt-3 min-h-24 resize-none text-xs"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="¿Qué quieres preguntar?"
          />
          <button className="btn btn-primary mt-3 w-full text-xs" onClick={() => submit("questions", question)}>
            <Send size={14} /> Enviar pregunta
          </button>
          
          <div className="mt-5 space-y-2">
            {questions.map(q => (
              <div
                key={q.id}
                className={`rounded-lg p-3 text-xs font-light ${
                  q.status === "featured"
                    ? "border border-[#BFB8AE]/30 bg-[#590A1F]/30 text-[#F2F2F2]"
                    : "border border-[#BFB8AE]/10 bg-black/20 text-[#BFB8AE]"
                }`}
              >
                <span className="mr-2 text-[#BFB8AE]">{q.status === "featured" ? "⭐" : "•"}</span>
                {q.body}
              </div>
            ))}
          </div>
        </section>
      )}

      {blocksByType.has("petition") && (
        <section className="card mt-4 p-5">
          <div className="flex items-center gap-2 text-[#BFB8AE]">
            <LockKeyhole size={16} />
            <p className="text-[10px] font-semibold uppercase tracking-[.2em]">Petición privada</p>
          </div>
          <p className="mt-1 text-xs font-light text-[#8C6969]">🔒 Solo los coordinadores pueden leer las peticiones.</p>
          <textarea
            className="input mt-3 min-h-24 resize-none text-xs"
            value={petition}
            onChange={e => setPetition(e.target.value)}
            placeholder="Escribe tu intención…"
          />
          <button className="btn btn-secondary mt-3 w-full text-xs" onClick={() => submit("petitions", petition)}>
            <Send size={14} /> Enviar anónimamente
          </button>
        </section>
      )}

      {sent && <p className="mt-4 text-center text-xs font-light text-[#BFB8AE]">{sent}</p>}
    </div>
  );
}

function Block({ block, poll, options, voted, vote }: { block: MeetingBlock; poll: Poll | null; options: PollOption[]; voted: boolean; vote: (id: string) => void }) {
  const icons: any = { bible: BookOpen, alabanza: Music2, dynamic: Sparkles, thinkglao: MessageCircleQuestion, dinner: Flame, thermometer: Timer };
  const Icon = icons[block.type] || Sparkles;

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 text-[#BFB8AE]">
        <Icon size={17} />
        <p className="text-[10px] font-semibold uppercase tracking-[.2em]">{block.title}</p>
      </div>
      {block.content && <p className="mt-3 whitespace-pre-wrap text-xs font-light leading-relaxed text-[#BFB8AE]/90">{block.content}</p>}
      {block.type === "thinkglao" && block.metadata && <Think block={block} />}
      {block.type === "thermometer" && poll && <Thermometer poll={poll} options={options} voted={voted} vote={vote} />}
      {block.type === "dinner" && (
        <p className="mt-3 text-xs font-light text-[#8C6969]">El coordinador puede sortear las tareas de la cena desde Admin.</p>
      )}
    </section>
  );
}

function Think({ block }: { block: MeetingBlock }) {
  const md = block.metadata || {};
  return (
    <div className="mt-4">
      <p className="text-base font-normal text-[#F2F2F2]">{String(md.speaker || "Ponente por confirmar")}</p>
      <Countdown start={typeof md.starts_at === "string" ? md.starts_at : null} end={typeof md.ends_at === "string" ? md.ends_at : null} />
    </div>
  );
}

function Thermometer({ poll, options, voted, vote }: { poll: Poll; options: PollOption[]; voted: boolean; vote: (id: string) => void }) {
  return (
    <div className="mt-4 space-y-2">
      {options.map(o => (
        <button
          disabled={voted}
          key={o.id}
          onClick={() => vote(o.id)}
          className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
            voted
              ? "border-[#BFB8AE]/10 bg-black/20 opacity-60"
              : "border-[#BFB8AE]/15 bg-[#1E0308]/60 hover:border-[#BFB8AE]/30 active:scale-[.99]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{o.emoji}</span>
            <span className="text-xs font-light text-[#F2F2F2]">{o.label}</span>
          </div>
        </button>
      ))}
      {voted && (
        <p className="pt-2 text-center text-[11px] font-light text-[#BFB8AE]">
          <Check size={13} className="mr-1 inline text-[#BFB8AE]" /> Ya has votado en este dispositivo.
        </p>
      )}
    </div>
  );
}