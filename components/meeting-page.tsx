"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAnonymousId } from "@/lib/anonymous-id";
import type { Meeting, MeetingBlock, Question } from "@/lib/types";
import { ArrowLeft, BookOpen, Check, Clock3, Flame, LockKeyhole, MessageCircleQuestion, Music2, Send, Sparkles, BarChart2, Users } from "lucide-react";
import Link from "next/link";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
}

interface Poll {
  id: string;
  meeting_id: string;
  question: string;
  active: boolean;
}

interface DinnerTeam {
  id: string;
  meeting_id: string;
  team_name: string;
  responsible_name?: string;
  menu_info?: string;
}

export function MeetingPage({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [blocks, setBlocks] = useState<MeetingBlock[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [dinnerTeam, setDinnerTeam] = useState<DinnerTeam | null>(null);
  const [voted, setVoted] = useState(false);
  const [question, setQuestion] = useState("");
  const [petition, setPetition] = useState("");
  const [sent, setSent] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  async function loadData() {
    const [{ data: m }, { data: b }, { data: p }, { data: d }] = await Promise.all([
      supabase.from("meetings").select("*").eq("id", id).maybeSingle(),
      supabase.from("meeting_blocks").select("*").eq("meeting_id", id).eq("enabled", true).order("sort_order"),
      supabase.from("polls").select("*").eq("meeting_id", id).eq("active", true).maybeSingle(),
      supabase.from("dinner_teams").select("*").eq("meeting_id", id).maybeSingle()
    ]);

    setMeeting(m);
    setBlocks(b ?? []);
    setPoll(p);
    setDinnerTeam(d);

    if (p) {
      loadOptions(p.id);
    }
  }

  async function loadOptions(pollId: string) {
    const { data: o } = await supabase.from("poll_options").select("*").eq("poll_id", pollId);
    setOptions(o ?? []);
    
    // Comprobar si ya ha votado
    const deviceId = getAnonymousId();
    const { data: vote } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_device_id", deviceId)
      .maybeSingle();

    setVoted(!!vote || localStorage.getItem(`jlt-voted-${pollId}`) === "1");
  }

  async function loadQuestions() {
    const { data } = await supabase.from("questions")
      .select("*")
      .eq("meeting_id", id)
      .in("status", ["visible", "featured", "answered"])
      .order("created_at", { ascending: false });
    setQuestions(data ?? []);
  }

  useEffect(() => {
    loadData();
    loadQuestions();

    const ch = supabase.channel(`jlt-meeting-live-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings", filter: `id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_blocks", filter: `meeting_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `meeting_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_options" }, () => poll && loadOptions(poll.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "dinner_teams", filter: `meeting_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `meeting_id=eq.${id}` }, loadQuestions)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [id, poll?.id]);

  async function handleVote(optionId: string, currentVotes: number) {
    if (voted || !poll) return;
    const deviceId = getAnonymousId();

    const { error } = await supabase.from("poll_votes").insert({
      poll_id: poll.id,
      option_id: optionId,
      user_device_id: deviceId
    });

    if (!error) {
      await supabase.from("poll_options").update({ votes_count: currentVotes + 1 }).eq("id", optionId);
      localStorage.setItem(`jlt-voted-${poll.id}`, "1");
      setVoted(true);
      loadOptions(poll.id);
    }
  }

  async function submit(table: "questions" | "petitions", body: string) {
    if (!body.trim()) return;
    const { error } = await supabase.from(table).insert({ meeting_id: id, body: body.trim(), anonymous_id: getAnonymousId() });
    setSent(error ? "No se ha podido enviar." : table === "questions" ? "Pregunta enviada." : "Petición enviada anónimamente.");
    if (!error) table === "questions" ? setQuestion("") : setPetition("");
  }

  const blocksByType = useMemo(() => new Map(blocks.map(b => [b.type, b])), [blocks]);

  if (!meeting) {
    return <div className="p-5 text-xs text-[#8C6969]">Cargando reunión…</div>;
  }

  const totalVotes = options.reduce((acc, curr) => acc + (curr.votes_count || 0), 0);

  return (
    <div className="px-4 pb-12 pt-4">
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

      {/* Bloques estándar de la reunión */}
      <div className="mt-5 space-y-3">
        {blocks.map(b => {
          const icons: any = { bible: BookOpen, alabanza: Music2, dynamic: Sparkles, thinkglao: MessageCircleQuestion, dinner: Flame, poll: BarChart2 };
          const Icon = icons[b.type] || Sparkles;

          return (
            <section key={b.id} className="card p-5">
              <div className="flex items-center gap-2 text-[#BFB8AE]">
                <Icon size={17} />
                <p className="text-[10px] font-semibold uppercase tracking-[.2em]">{b.title}</p>
              </div>

              {b.content && <p className="mt-3 whitespace-pre-wrap text-xs font-light leading-relaxed text-[#BFB8AE]/90">{b.content}</p>}

              {/* Bloque Dinámico: Votación / Encuesta en Tiempo Real */}
              {b.type === "poll" && poll && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-[#F2F2F2]">{poll.question}</p>
                  <div className="space-y-2">
                    {options.map((opt) => {
                      const percentage = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
                      return (
                        <div key={opt.id} className="relative overflow-hidden rounded-xl border border-[#BFB8AE]/15 bg-black/40 p-3">
                          {/* Barra de progreso gráfica */}
                          <div
                            className="absolute bottom-0 left-0 top-0 bg-[#590A1F]/50 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                          <button
                            disabled={voted}
                            onClick={() => handleVote(opt.id, opt.votes_count)}
                            className="relative z-10 flex w-full items-center justify-between text-left"
                          >
                            <span className="text-xs font-light text-[#F2F2F2]">{opt.option_text}</span>
                            <span className="font-mono text-xs text-[#BFB8AE]">{percentage}% ({opt.votes_count})</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {voted ? (
                    <p className="text-center text-[10px] text-[#BFB8AE] flex items-center justify-center gap-1">
                      <Check size={12} /> Voto guardado. Mostrando resultados en directo.
                    </p>
                  ) : (
                    <p className="text-center text-[10px] text-[#8C6969]">Haz clic en una opción para votar</p>
                  )}
                </div>
              )}

              {/* Bloque Dinámico: Equipo y Menú de Cena */}
              {b.type === "dinner" && dinnerTeam && (
                <div className="mt-4 rounded-xl border border-[#BFB8AE]/15 bg-black/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#BFB8AE]">
                    <Users size={16} />
                    <p className="text-xs font-medium text-[#F2F2F2]">Equipo encargado: {dinnerTeam.team_name}</p>
                  </div>
                  {dinnerTeam.responsible_name && (
                    <p className="text-xs font-light text-[#8C6969]">Responsable: <span className="text-[#BFB8AE]">{dinnerTeam.responsible_name}</span></p>
                  )}
                  {dinnerTeam.menu_info && (
                    <div className="mt-2 rounded-lg bg-[#1E0308]/60 p-3 text-xs font-light text-[#BFB8AE]">
                      <p className="text-[10px] uppercase tracking-wider text-[#8C6969]">Menú de hoy:</p>
                      <p className="mt-1">{dinnerTeam.menu_info}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Muro de preguntas si el bloque thinkglao está activo */}
      {blocksByType.has("thinkglao") && (
        <section className="card mt-4 p-5">
          <div className="flex items-center gap-2 text-[#BFB8AE]">
            <MessageCircleQuestion size={18} />
            <p className="text-[10px] font-semibold uppercase tracking-[.2em]">Muro de preguntas</p>
          </div>
          <textarea
            className="input mt-3 min-h-20 resize-none text-xs"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="¿Qué quieres preguntar?"
          />
          <button className="btn btn-primary mt-2 w-full text-xs" onClick={() => submit("questions", question)}>
            <Send size={14} /> Enviar pregunta
          </button>
          
          <div className="mt-4 space-y-2">
            {questions.map(q => (
              <div key={q.id} className="rounded-lg border border-[#BFB8AE]/10 bg-black/20 p-3 text-xs font-light text-[#BFB8AE]">
                {q.body}
              </div>
            ))}
          </div>
        </section>
      )}

      {sent && <p className="mt-4 text-center text-xs font-light text-[#BFB8AE]">{sent}</p>}
    </div>
  );
}