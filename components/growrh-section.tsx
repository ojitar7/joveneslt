"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Devotional, ResourceItem, PrayerRequest } from "@/lib/types";
import { BookOpen, Music, FileText, Headphones, Heart, Send, Sparkles, ExternalLink, Check, BookMarked } from "lucide-react";

export function GrowthSection() {
  const [activeTab, setActiveTab] = useState<"devotionals" | "resources" | "prayer">("devotionals");
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayedIds, setPrayedIds] = useState<string[]>([]);

  // Formulario nueva oración
  const [newPrayerTitle, setNewPrayerTitle] = useState("");
  const [newPrayerBody, setNewPrayerBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Obtener identificador único anónimo del dispositivo
    let deviceId = localStorage.getItem("lt_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("lt_device_id", deviceId);
    }
  }, []);

  async function loadData() {
    const [{ data: devData }, { data: resData }, { data: prayerData }] = await Promise.all([
      supabase.from("devotionals").select("*").eq("published", true).order("day_number"),
      supabase.from("resources").select("*").order("created_at", { ascending: false }),
      supabase.from("prayer_requests").select("*").order("created_at", { ascending: false })
    ]);

    setDevotionals(devData ?? []);
    setResources(resData ?? []);
    setPrayers(prayerData ?? []);

    const deviceId = localStorage.getItem("lt_device_id");
    if (deviceId) {
      const { data: supports } = await supabase.from("prayer_supports").select("request_id").eq("user_identifier", deviceId);
      if (supports) setPrayedIds(supports.map(s => s.request_id));
    }
  }

  async function handlePray(requestId: string) {
    const deviceId = localStorage.getItem("lt_device_id");
    if (!deviceId || prayedIds.includes(requestId)) return;

    setPrayedIds(prev => [...prev, requestId]);
    setPrayers(prev => prev.map(p => p.id === requestId ? { ...p, prayer_count: p.prayer_count + 1 } : p));

    await supabase.rpc("increment_prayer_count", {
      request_id: requestId,
      user_id_param: deviceId
    });
  }

  async function handleCreatePrayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrayerTitle.trim() || !newPrayerBody.trim()) return;
    setIsSubmitting(true);

    const { data, error } = await supabase.from("prayer_requests").insert([
      { title: newPrayerTitle.trim(), body: newPrayerBody.trim() }
    ]).select().single();

    if (!error && data) {
      setPrayers([data, ...prayers]);
      setNewPrayerTitle("");
      setNewPrayerBody("");
    }
    setIsSubmitting(false);
  }

  const activeDevotional = devotionals.find(d => d.day_number === selectedDay);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "song": return <Music size={18} className="text-[#BFB8AE]" />;
      case "slides": return <FileText size={18} className="text-[#BFB8AE]" />;
      case "podcast": return <Headphones size={18} className="text-[#BFB8AE]" />;
      default: return <BookMarked size={18} className="text-[#BFB8AE]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de pestañas */}
      <div className="flex rounded-xl border border-[#BFB8AE]/15 bg-black/40 p-1 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("devotionals")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
            activeTab === "devotionals" ? "bg-[#590A1F] text-[#F2F2F2] shadow-md" : "text-[#8C6969] hover:text-[#BFB8AE]"
          }`}
        >
          <BookOpen size={14} /> Devocional
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
            activeTab === "resources" ? "bg-[#590A1F] text-[#F2F2F2] shadow-md" : "text-[#8C6969] hover:text-[#BFB8AE]"
          }`}
        >
          <Sparkles size={14} /> Recursos
        </button>
        <button
          onClick={() => setActiveTab("prayer")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
            activeTab === "prayer" ? "bg-[#590A1F] text-[#F2F2F2] shadow-md" : "text-[#8C6969] hover:text-[#BFB8AE]"
          }`}
        >
          <Heart size={14} /> Oración
        </button>
      </div>

      {/* 1. SECCIÓN DEVOCIONALES */}
      {activeTab === "devotionals" && (
        <div className="space-y-4">
          <p className="text-xs font-light text-[#8C6969] text-center">Un espacio diario de 2 minutos vinculado al tema del jueves.</p>

          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  selectedDay === day
                    ? "border-[#BFB8AE] bg-[#590A1F]/60 text-[#F2F2F2]"
                    : "border-[#BFB8AE]/10 bg-black/30 text-[#8C6969] hover:border-[#BFB8AE]/30"
                }`}
              >
                Día {day}
              </button>
            ))}
          </div>

          {activeDevotional ? (
            <div className="card glow-card p-5 space-y-3">
              <div className="flex justify-between items-start border-b border-[#BFB8AE]/15 pb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6969]">Devocional · Día {activeDevotional.day_number}</span>
                  <h3 className="text-base font-normal text-[#F2F2F2] mt-0.5">{activeDevotional.title}</h3>
                </div>
                {activeDevotional.passage_reference && (
                  <span className="text-[11px] font-light text-[#BFB8AE] bg-[#590A1F]/40 border border-[#BFB8AE]/20 px-2.5 py-1 rounded-full">
                    📖 {activeDevotional.passage_reference}
                  </span>
                )}
              </div>
              <p className="text-xs font-light text-[#F2F2F2] leading-relaxed whitespace-pre-line pt-1">
                {activeDevotional.content}
              </p>
            </div>
          ) : (
            <div className="card p-6 text-center text-xs font-light text-[#8C6969]">
              No hay contenido disponible para este día todavía.
            </div>
          )}
        </div>
      )}

      {/* 2. SECCIÓN RECURSOS */}
      {activeTab === "resources" && (
        <div className="space-y-3">
          <p className="text-xs font-light text-[#8C6969] text-center">Materiales, canciones de alabanza y recomendaciones.</p>
          
          <div className="grid gap-3">
            {resources.map(res => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex items-center justify-between transition-all hover:border-[#BFB8AE]/40 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-[#BFB8AE]/20 bg-[#590A1F]/30 group-hover:border-[#BFB8AE]/40">
                    {getResourceIcon(res.type)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#F2F2F2] group-hover:text-[#BFB8AE] transition-colors">{res.title}</p>
                    {res.description && <p className="text-[11px] font-light text-[#8C6969] line-clamp-1 mt-0.5">{res.description}</p>}
                  </div>
                </div>
                <ExternalLink size={15} className="text-[#8C6969] group-hover:text-[#BFB8AE] transition-colors shrink-0 ml-2" />
              </a>
            ))}

            {resources.length === 0 && (
              <div className="card p-6 text-center text-xs font-light text-[#8C6969]">
                Aún no se han añadido recursos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECCIÓN MURO DE ORACIÓN */}
      {activeTab === "prayer" && (
        <div className="space-y-4">
          <form onSubmit={handleCreatePrayer} className="card p-4 space-y-3">
            <p className="text-xs font-medium text-[#F2F2F2]">Compartir motivo de oración</p>
            <input
              className="input text-xs"
              placeholder="Título o motivo breve..."
              value={newPrayerTitle}
              onChange={e => setNewPrayerTitle(e.target.value)}
            />
            <textarea
              className="input text-xs min-h-16 resize-none"
              placeholder="Detalles sobre tu petición (puedes omitir nombres reales)..."
              value={newPrayerBody}
              onChange={e => setNewPrayerBody(e.target.value)}
            />
            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full text-xs">
              <Send size={13} /> {isSubmitting ? "Publicando..." : "Publicar motivo"}
            </button>
          </form>

          <div className="space-y-3">
            {prayers.map(p => {
              const hasPrayed = prayedIds.includes(p.id);
              return (
                <div key={p.id} className="card p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-medium text-[#F2F2F2]">{p.title}</h4>
                    <button
                      onClick={() => handlePray(p.id)}
                      disabled={hasPrayed}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all border ${
                        hasPrayed
                          ? "border-green-500/30 bg-green-950/30 text-green-300"
                          : "border-[#BFB8AE]/20 bg-[#590A1F]/30 text-[#BFB8AE] hover:border-[#BFB8AE]/40 active:scale-95"
                      }`}
                    >
                      {hasPrayed ? <Check size={12} /> : <Heart size={12} className="text-[#8C6969]" />}
                      <span>{hasPrayed ? "Orando" : "Unirme en oración"} ({p.prayer_count})</span>
                    </button>
                  </div>
                  <p className="text-xs font-light text-[#8C6969] leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}