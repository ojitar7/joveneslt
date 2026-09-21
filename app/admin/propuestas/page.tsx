"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Check, Trash2, Music2 } from "lucide-react";
import Link from "next/link";

export default function SongProposalsAdmin() {
  const [proposals, setProposals] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase
      .from("song_proposals")
      .select("*")
      .order("created_at", { ascending: false });
    setProposals(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteProposal(id: string) {
    await supabase.from("song_proposals").delete().eq("id", id);
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="px-4 pb-20 pt-4">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15} /> Admin
      </Link>

      <h1 className="text-2xl font-light text-[#F2F2F2]">Propuestas de Canciones</h1>
      <p className="mt-1 text-xs font-light text-[#8C6969]">
        Sugerencias enviadas por el grupo para la alabanza.
      </p>

      <div className="mt-5 space-y-3">
        {proposals.length === 0 ? (
          <div className="card p-5 text-center text-xs font-light text-[#8C6969]">
            No hay propuestas pendientes de revisión.
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#F2F2F2]">{p.title}</p>
                  {p.artist && <p className="text-xs font-light text-[#8C6969]">{p.artist}</p>}
                </div>
                <button
                  onClick={() => deleteProposal(p.id)}
                  className="p-1.5 text-[#8C6969] hover:text-[#BFB8AE]"
                  title="Eliminar propuesta"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {p.notes && (
                <p className="text-xs font-light text-[#BFB8AE]/80 bg-black/30 p-2.5 rounded-lg border border-[#BFB8AE]/10">
                  {p.notes}
                </p>
              )}

              <p className="text-[10px] text-[#8C6969] font-light">
                Recibida el{" "}
                {new Intl.DateTimeFormat("es-ES", {
                  day: "numeric",
                  month: "short",
                }).format(new Date(p.created_at))}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}