"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Play, Pause, RotateCcw, ArrowLeft, Plus, Minus } from "lucide-react";
import Link from "next/link";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function transposeChord(chord: string, semitones: number): string {
  return chord.replace(/[A-G][#b]?/g, (match) => {
    let index = NOTES.indexOf(match);
    if (index === -1) {
      const map: Record<string, string> = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
      index = NOTES.indexOf(map[match] || match);
    }
    if (index === -1) return match;
    const newIndex = (index + semitones + 12) % 12;
    return NOTES[newIndex];
  });
}

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [scrolling, setScrolling] = useState(false);

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
    <div className="px-4 pb-20 pt-4">
      {!selected ? (
        <>
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
            <ArrowLeft size={15}/> Volver
          </Link>
          <h1 className="text-2xl font-light text-[#F2F2F2]">Cancionero LT</h1>
          <div className="mt-4 space-y-2">
            {songs.map((s) => (
              <div 
                key={s.id} 
                onClick={() => { setSelected(s); setSemitones(0); setScrolling(false); }}
                className="card card-interactive p-4"
              >
                <p className="text-sm font-medium text-[#F2F2F2]">{s.title}</p>
                {s.artist && <p className="text-xs font-light text-[#8C6969]">{s.artist}</p>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sticky top-0 z-40 bg-[#0F0104]/90 backdrop-blur-md pb-3 pt-2 border-b border-[#BFB8AE]/10 flex items-center justify-between">
            <button onClick={() => setSelected(null)} className="btn btn-secondary text-xs py-1 px-3">
              <ArrowLeft size={14}/> Atrás
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-[#BFB8AE]/20 bg-black/40 px-2 py-1 text-xs">
                <span className="text-[#8C6969] mr-2">Tono:</span>
                <button onClick={() => setSemitones(s => s - 1)} className="px-1.5"><Minus size={12}/></button>
                <span className="w-6 text-center font-mono text-[#BFB8AE]">{semitones > 0 ? `+${semitones}` : semitones}</span>
                <button onClick={() => setSemitones(s => s + 1)} className="px-1.5"><Plus size={12}/></button>
              </div>
              <button 
                onClick={() => setScrolling(!scrolling)} 
                className={`btn text-xs py-1.5 px-3 ${scrolling ? "btn-primary" : "btn-secondary"}`}
              >
                {scrolling ? <Pause size={14}/> : <Play size={14}/>}
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