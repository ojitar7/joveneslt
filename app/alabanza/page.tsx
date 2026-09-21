"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Play, Pause, ArrowLeft, Plus, Minus, Music2, Send, Check } from "lucide-react";
import Link from "next/link";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function transposeChord(chord: string, semitones: number): string {
  return chord.replace(/[A-G][#b]?/g, (match) => {
    let index = NOTES.indexOf(match);
    if (index === -1) {
      const map: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
      index = NOTES.indexOf(map[match] || match);
    }
    if (index === -1) return match;
    const newIndex = (index + semitones + 12) % 12;
    return NOTES[newIndex];
  });
}

export default function SongsPage() {
  const [activeTab, setActiveTab] = useState<"cancionero" | "proponer">("cancionero");
  const [songs, setSongs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [scrolling, setScrolling] = useState(false);

  // Formulario de propuesta
  const [propTitle, setPropTitle] = useState("");
  const [propArtist, setPropArtist] = useState("");
  const [propNotes, setPropNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [propSent, setPropSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.from("songs").select("*").order("title").then(({ data }) => setSongs(data ?? []));
  }, []);

  useEffect(() => {
    let interval: any;
    if (scrolling) {
      interval = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "smooth" });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [scrolling]);

  async function handlePropose() {
    if (!propTitle.trim() || sending) return;
    setSending(true);
    setErrorMsg("");

    const { error } = await supabase.from("song_proposals").insert([
      {
        title: propTitle.trim(),
        artist: propArtist.trim(),
        notes: propNotes.trim(),
      },
    ]);

    setSending(false);

    if (error) {
      console.error("Error proponiendo canción:", error);
      setErrorMsg("Error al enviar la propuesta. Revisa la base de datos.");
    } else {
      setPropTitle("");
      setPropArtist("");
      setPropNotes("");
      setPropSent(true);
      setTimeout(() => setPropSent(false), 5000);
    }
  }

  const renderContent = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const chord = part.slice(1, -1);
        return (
          <span key={i} className="font-semibold text-[#BFB8AE] mx-0.5">
            {transposeChord(chord, semitones)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="px-4 pb-24 pt-4">
      {!selected ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
              <ArrowLeft size={15} /> Volver
            </Link>
          </div>

          <h1 className="text-2xl font-light text-[#F2F2F2]">Alabanza</h1>
          <p className="mt-1 text-xs font-light text-[#8C6969]">Cancionero con acordes y propuestas para el grupo.</p>

          <div className="mt-4 flex rounded-xl border border-[#BFB8AE]/15 bg-black/40 p-1">
            <button
              onClick={() => setActiveTab("cancionero")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-light transition-all ${
                activeTab === "cancionero"
                  ? "bg-[#590A1F]/60 text-[#F2F2F2] border border-[#BFB8AE]/20"
                  : "text-[#8C6969]"
              }`}
            >
              Cancionero
            </button>
            <button
              onClick={() => setActiveTab("proponer")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-light transition-all ${
                activeTab === "proponer"
                  ? "bg-[#590A1F]/60 text-[#F2F2F2] border border-[#BFB8AE]/20"
                  : "text-[#8C6969]"
              }`}
            >
              Proponer canción
            </button>
          </div>

          {activeTab === "cancionero" ? (
            <div className="mt-4 space-y-2">
              {songs.length === 0 ? (
                <div className="card p-5 text-center text-xs font-light text-[#8C6969]">
                  No hay canciones publicadas todavía.
                </div>
              ) : (
                songs.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelected(s);
                      setSemitones(0);
                      setScrolling(false);
                    }}
                    className="card card-interactive p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F2F2F2]">{s.title}</p>
                      {s.artist && <p className="text-xs font-light text-[#8C6969]">{s.artist}</p>}
                    </div>
                    <Music2 size={16} className="text-[#8C6969]" />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="card mt-4 p-5 space-y-3">
              <p className="text-xs font-light text-[#BFB8AE]">
                ¿Quieres cantar alguna canción en la reunión del jueves? Escribe los detalles aquí.
              </p>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#8C6969]">Nombre de la canción *</label>
                <input
                  className="input mt-1 text-xs"
                  placeholder="Ej: Dios de mi corazón"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#8C6969]">Artista / Grupo</label>
                <input
                  className="input mt-1 text-xs"
                  placeholder="Ej: Hakuna Group Music"
                  value={propArtist}
                  onChange={(e) => setPropArtist(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#8C6969]">Comentarios o enlace</label>
                <textarea
                  className="input mt-1 text-xs min-h-20 resize-none"
                  placeholder="¿Por qué te gustaría cantarla? O añade un enlace de Spotify/YouTube..."
                  value={propNotes}
                  onChange={(e) => setPropNotes(e.target.value)}
                />
              </div>

              {errorMsg && <p className="text-xs text-red-400 font-light">{errorMsg}</p>}

              <button 
                onClick={handlePropose} 
                disabled={sending || !propTitle.trim()} 
                className="btn btn-primary w-full text-xs mt-2"
              >
                <Send size={14} /> {sending ? "Enviando..." : "Enviar propuesta"}
              </button>

              {propSent && (
                <div className="mt-2 rounded-lg border border-[#BFB8AE]/30 bg-[#590A1F]/40 p-2.5 text-center text-xs font-light text-[#BFB8AE] flex items-center justify-center gap-1.5">
                  <Check size={14} /> ¡Propuesta enviada al equipo de música!
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="sticky top-0 z-40 bg-[#0F0104]/90 backdrop-blur-md pb-3 pt-2 border-b border-[#BFB8AE]/10 flex items-center justify-between">
            <button onClick={() => setSelected(null)} className="btn btn-secondary text-xs py-1 px-3">
              <ArrowLeft size={14} /> Atrás
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-[#BFB8AE]/20 bg-black/40 px-2 py-1 text-xs">
                <span className="text-[#8C6969] mr-2">Tono:</span>
                <button onClick={() => setSemitones((s) => s - 1)} className="px-1.5">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center font-mono text-[#BFB8AE]">
                  {semitones > 0 ? `+${semitones}` : semitones}
                </span>
                <button onClick={() => setSemitones((s) => s + 1)} className="px-1.5">
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={() => setScrolling(!scrolling)}
                className={`btn text-xs py-1.5 px-3 ${scrolling ? "btn-primary" : "btn-secondary"}`}
              >
                {scrolling ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-normal text-[#F2F2F2]">{selected.title}</h2>
            <p className="text-xs font-light text-[#8C6969] mb-6">{selected.artist}</p>
            <pre className="whitespace-pre-wrap font-sans text-xs font-light leading-relaxed text-[#F2F2F2]/90">
              {renderContent(selected.lyrics)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}