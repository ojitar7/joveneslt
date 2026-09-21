"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function PrayerPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [prayed, setPrayed] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");

  async function loadRequests() {
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setRequests(data);
    }
  }

  useEffect(() => {
    loadRequests();

    const saved = localStorage.getItem("jlt-prayed-requests");
    if (saved) {
      try {
        setPrayed(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const ch = supabase
      .channel("prayer-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_requests" },
        loadRequests
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function createRequest() {
    if (!title.trim() || sending) return;
    setSending(true);
    setErrorMsg("");

    const { error } = await supabase
      .from("prayer_requests")
      .insert([{ title: title.trim(), prayers_count: 0 }]);

    if (error) {
      console.error("Error al publicar intención:", error);
      setErrorMsg("No se pudo publicar la intención. Revisa la base de datos.");
    } else {
      setTitle("");
      await loadRequests(); // Recargar la lista inmediatamente
    }
    setSending(false);
  }

  async function pray(id: string, currentCount: number) {
    if (prayed[id]) return;

    const newCount = currentCount + 1;

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, prayers_count: newCount } : r))
    );

    const updatedPrayed = { ...prayed, [id]: true };
    setPrayed(updatedPrayed);
    localStorage.setItem("jlt-prayed-requests", JSON.stringify(updatedPrayed));

    await supabase
      .from("prayer_requests")
      .update({ prayers_count: newCount })
      .eq("id", id);
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15} /> Volver
      </Link>

      <h1 className="text-2xl font-light text-[#F2F2F2]">Rincón de Oración</h1>
      <p className="mt-1 text-xs font-light text-[#8C6969]">
        Comparte tus intenciones y únete en oración por las de los demás.
      </p>

      <div className="card mt-4 p-4 space-y-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#BFB8AE]">
          Publicar una intención
        </label>
        <textarea
          className="input text-xs min-h-20 resize-none"
          placeholder="Escribe aquí tu petición u oración..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errorMsg && <p className="text-xs text-red-400 font-light">{errorMsg}</p>}
        <button
          onClick={createRequest}
          disabled={sending || !title.trim()}
          className="btn btn-primary w-full text-xs"
        >
          <Send size={14} /> {sending ? "Publicando..." : "Publicar intención"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6969]">
          Últimas intenciones ({requests.length})
        </p>

        {requests.length === 0 ? (
          <div className="card p-6 text-center text-xs font-light text-[#8C6969]">
            Aún no hay intenciones publicadas. ¡Sé el primero en compartir una!
          </div>
        ) : (
          requests.map((r) => {
            const hasPrayed = prayed[r.id];
            const count = r.prayers_count || 0;

            return (
              <div
                key={r.id}
                className="card p-4 flex items-start justify-between gap-3 transition-all"
              >
                <div className="flex-1">
                  <p className="text-xs font-light leading-relaxed text-[#F2F2F2]">
                    {r.title}
                  </p>
                  <p className="mt-2 text-[10px] text-[#8C6969] font-light">
                    {new Intl.DateTimeFormat("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(r.created_at))}
                  </p>
                </div>

                <button
                  onClick={() => pray(r.id, count)}
                  disabled={hasPrayed}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-all shrink-0 ${
                    hasPrayed
                      ? "border-[#BFB8AE]/40 bg-[#590A1F]/60 text-[#BFB8AE]"
                      : "border-[#BFB8AE]/15 bg-black/30 text-[#8C6969] hover:border-[#BFB8AE]/30 active:scale-95"
                  }`}
                >
                  <span className="text-sm">🙏</span>
                  <span className="font-mono text-xs font-medium">
                    {count}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}