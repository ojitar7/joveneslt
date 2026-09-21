"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Maximize2, Minimize2, ArrowLeft, MessageCircleQuestion, BarChart2, Clock } from "lucide-react";

export function ThinkGlaoPresentation({ id }: { id: string }) {
  const [s, setS] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [full, setFull] = useState(false);

  // Estados para la proyección de votaciones
  const [mode, setMode] = useState<"timer" | "poll">("timer");
  const [poll, setPoll] = useState<any | null>(null);
  const [options, setOptions] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase.from("thinkglao_sessions").select("*").eq("id", id).maybeSingle();
    setS(data);
  }

  async function loadQ() {
    if (!s) return;
    const { data } = await supabase.from("questions")
      .select("*")
      .eq("meeting_id", s.meeting_id)
      .eq("status", "featured")
      .order("created_at", { ascending: false });
    setQuestions(data ?? []);
  }

  async function loadPollData(meetingId: string) {
    const { data: p } = await supabase
      .from("polls")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("active", true)
      .maybeSingle();

    setPoll(p);

    if (p) {
      const { data: opts } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", p.id);
      setOptions(opts ?? []);
    } else {
      setOptions([]);
    }
  }

  useEffect(() => {
    load();
    const c = supabase.channel(`think-present-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "thinkglao_sessions", filter: `id=eq.${id}` }, load)
      .subscribe();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      supabase.removeChannel(c);
      clearInterval(t);
    };
  }, [id]);

  useEffect(() => {
    if (!s) return;
    loadQ();
    loadPollData(s.meeting_id);

    // Canales en tiempo real para preguntas, votaciones y opciones
    const cQuestions = supabase.channel(`think-q-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `meeting_id=eq.${s.meeting_id}` }, loadQ)
      .subscribe();

    const cPolls = supabase.channel(`think-polls-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `meeting_id=eq.${s.meeting_id}` }, () => loadPollData(s.meeting_id))
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_options" }, () => poll && loadPollData(s.meeting_id))
      .subscribe();

    return () => {
      supabase.removeChannel(cQuestions);
      supabase.removeChannel(cPolls);
    };
  }, [s?.meeting_id, poll?.id]);

  if (!s) {
    return (
      <div className="grid min-h-screen place-items-center text-xs font-light text-[#8C6969]">
        Cargando ThinkGlao…
      </div>
    );
  }

  const end = s.ends_at ? new Date(s.ends_at).getTime() : null;
  const remaining = end ? Math.max(0, end - now) : s.duration_seconds * 1000;
  const sec = Math.floor(remaining / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const critical = remaining <= 300000 && remaining > 0;

  const totalVotes = options.reduce((acc, curr) => acc + (curr.votes_count || 0), 0);

  return (
    <main className={`min-h-screen bg-[#0F0104] px-6 py-8 ${full ? "fixed inset-0 z-[200] overflow-auto" : ""}`}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-between">
        {/* Barra Superior con Controles */}
        <div className="flex items-center justify-between">
          <a href="/admin" className="btn btn-secondary text-xs">
            <ArrowLeft size={15} /> Admin
          </a>

          {/* Selector de Modo: Ponente vs Votación */}
          <div className="flex rounded-xl border border-[#BFB8AE]/15 bg-black/40 p-1">
            <button
              onClick={() => setMode("timer")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-light transition-all ${
                mode === "timer"
                  ? "bg-[#590A1F]/60 text-[#F2F2F2] border border-[#BFB8AE]/20"
                  : "text-[#8C6969]"
              }`}
            >
              <Clock size={14} /> Tiempo
            </button>
            <button
              onClick={() => setMode("poll")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-light transition-all ${
                mode === "poll"
                  ? "bg-[#590A1F]/60 text-[#F2F2F2] border border-[#BFB8AE]/20"
                  : "text-[#8C6969]"
              }`}
            >
              <BarChart2 size={14} /> Votación en directo
            </button>
          </div>

          <button className="btn btn-secondary px-3" onClick={() => setFull(!full)}>
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        {/* Vista A: Temporizador y Preguntas Destacadas */}
        {mode === "timer" ? (
          <div className="py-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#BFB8AE]">THINKGLAO</p>
            
            <div className="mt-6">
              {s.status === "live" ? (
                <span className="pill-live"><span className="pulse-dot" /> En directo</span>
              ) : (
                <span className="rounded-full border border-[#BFB8AE]/15 px-3 py-1 text-[10px] font-medium text-[#8C6969]">
                  {s.status}
                </span>
              )}
            </div>

            <div className={`mt-6 font-mono text-[clamp(4.5rem,18vw,10rem)] font-light leading-none tracking-tight ${
              critical ? "text-[#8C6969]" : "text-[#F2F2F2]"
            }`}>
              {mm}:{ss}
            </div>

            <h1 className="mt-6 text-2xl font-light text-[#F2F2F2]">{s.speaker_name}</h1>
            <p className="mt-2 text-xs font-light text-[#8C6969]">
              <MessageCircleQuestion className="mr-1.5 inline text-[#BFB8AE]" size={15} />
              {questions.length} preguntas destacadas
            </p>

            {questions.length > 0 && (
              <div className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
                {questions.map((q: any) => (
                  <div key={q.id} className="card p-4 text-sm font-light leading-relaxed text-[#F2F2F2]">
                    <span className="mr-2 text-[#BFB8AE]">⭐</span> {q.body}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Vista B: Proyección de Votación en Tiempo Real */
          <div className="py-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#BFB8AE]">VOTACIÓN EN DIRECTO</p>

            {!poll ? (
              <div className="mt-12 text-center text-sm font-light text-[#8C6969]">
                No hay ninguna votación activa en esta reunión.
              </div>
            ) : (
              <div className="mx-auto mt-6 max-w-2xl text-left space-y-6">
                <h2 className="text-2xl font-normal text-center text-[#F2F2F2]">{poll.question}</h2>

                <div className="space-y-4 mt-8">
                  {options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;

                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="flex justify-between text-sm font-light text-[#F2F2F2]">
                          <span>{opt.option_text}</span>
                          <span className="font-mono text-[#BFB8AE]">{percentage}% ({opt.votes_count} votos)</span>
                        </div>
                        <div className="h-10 w-full overflow-hidden rounded-xl border border-[#BFB8AE]/20 bg-black/50 p-1">
                          <div
                            className="h-full rounded-lg bg-[#590A1F] transition-all duration-700 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="pt-4 text-center text-xs font-light text-[#8C6969]">
                  Total de votos registrados: <span className="font-mono text-[#BFB8AE]">{totalVotes}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <p className="pb-2 text-center text-[10px] font-light tracking-widest text-[#8C6969] uppercase">
          Modo presentación · Pantalla de proyector
        </p>
      </div>
    </main>
  );
}