"use client";

import { useState, useEffect } from "react";
import { getTodayReading, type DailyReading } from "@/lib/daily-readings";
import { BookOpen, Sparkles, Heart, Compass, Shield, Sun, Clock, CheckCircle2, Volume2 } from "lucide-react";

const TEMATIC_DEVOTIONALS = [
  {
    id: "paz-ansiedad",
    category: "Paz y Calma",
    icon: Shield,
    color: "from-amber-500/20 to-orange-600/10 border-amber-500/30",
    title: "Venciendo la Ansiedad y el Estrés",
    verse: "1 Pedro 5:7 — «Descargad en él toda vuestra inquietud, con la certeza de que él cuida de vosotros».",
    content: "Cuando los pensamientos abruman tu mente, recuerda que no tienes que llevar el peso del mundo sobre tus hombros. La oración es el espacio donde intercambias tu cansancio por la fuerza de Dios.",
    prayer: "Señor, entrego en tus manos todo pensamiento de duda, prisa y temor. Respiro tu paz y me entrego a tu cuidado."
  },
  {
    id: "identidad",
    category: "Identidad",
    icon: Sparkles,
    color: "from-rose-500/20 to-pink-600/10 border-rose-500/30",
    title: "Quién Eres en Cristo",
    verse: "1 Juan 3:1 — «Mirad qué amor nos ha tenido el Padre para llamarnos hijos de Dios, ¡y lo somos!».",
    content: "Tu valor no lo definen tus logros, tus errores ni las opiniones de las personas. Eres un hijo/a amado/a por Dios, rescatado/a y llamado/a con un propósito eterno.",
    prayer: "Gracias Padre por recordarme hoy mi verdadera identidad. Ayúdame a caminar con la seguridad de ser tu hijo/a."
  },
  {
    id: "proposito",
    category: "Propósito y Futuro",
    icon: Compass,
    color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30",
    title: "Confianza en las Decisiones",
    verse: "Proverbios 3:5-6 — «Confía en el Señor de todo corazón y no te apoyes en tu propia prudencia».",
    content: "Tomar decisiones importantes sobre los estudios, el trabajo o las relaciones puede causar incertidumbre. Cuando pones a Dios en el centro, Él endereza tus sendas.",
    prayer: "Señor, guía mis elecciones de hoy. Dame la sabiduría para discernir tu voluntad y la valentía para seguirla."
  },
  {
    id: "fortaleza",
    category: "Pruebas",
    icon: Sun,
    color: "from-blue-500/20 to-indigo-600/10 border-blue-500/30",
    title: "Luz en la Oscuridad",
    verse: "Salmo 46:1 — «Dios es nuestro refugio y nuestra fuerza, un socorro siempre listo en las tribulaciones».",
    content: "Las dificultades son temporales, pero la fidelidad de Dios es eterna. Aún en el valle más oscuro, Jesús camina al lado tuyo sostenida tu mano.",
    prayer: "Dios mío, sé mi refugio hoy. Fortalece mi fe cuando sienta debilidad y renueva mi esperanza."
  }
];

const PRAYER_GUIDES = [
  { time: "5 min", title: "Pausa con Dios", desc: "Agradecimiento rápido, respiración y entregar la jornada." },
  { time: "10 min", title: "Oración de la Mañana", desc: "Lectura del Evangelio del día + meditación en silencio." },
  { time: "15 min", title: "Intercesión Profunda", desc: "Oración por los jóvenes, peticiones de la comunidad y dirección." },
];

export function DevotionalsSection() {
  const [todayReading, setTodayReading] = useState<DailyReading | null>(null);
  const [activeTab, setActiveTab] = useState<"evangelio" | "temas" | "oracion">("evangelio");
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);

  useEffect(() => {
    setTodayReading(getTodayReading());
  }, []);

  const togglePrayer = (id: string) => {
    setCompletedPrayers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#590A1F]/30 border border-[#590A1F]/50 text-[#E295A8] text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" /> Devocionales y Lecturas
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Tiempo con Dios
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
          Lecturas diarias que se actualizan automáticamente, meditación bíblica y guía de oración para cada momento.
        </p>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex justify-center border-b border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("evangelio")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "evangelio"
                ? "border-[#8C1D40] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" /> Evangelio del Día
          </button>
          <button
            onClick={() => setActiveTab("temas")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "temas"
                ? "border-[#8C1D40] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" /> Devocionales por Tema
          </button>
          <button
            onClick={() => setActiveTab("oracion")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "oracion"
                ? "border-[#8C1D40] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" /> Guía de Oración
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: EVANGELIO Y LECTURAS DEL DÍA */}
      {activeTab === "evangelio" && todayReading && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-[#590A1F]/20 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {todayReading.formattedDate}
                </span>
                <h2 className="text-2xl font-bold text-white mt-0.5">
                  {todayReading.liturgicalTitle}
                </h2>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-full border border-amber-500/20 font-medium">
                Actualizado hoy
              </span>
            </div>

            {/* Evangelio Principal */}
            <div className="space-y-3 bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E295A8] uppercase tracking-wider">
                  Santo Evangelio
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {todayReading.gospel.reference}
                </span>
              </div>
              <p className="text-zinc-200 text-sm sm:text-base leading-relaxed italic">
                «{todayReading.gospel.text}»
              </p>
            </div>

            {/* Salmo e Primera Lectura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50 space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Primera Lectura</span>
                  <span>{todayReading.firstReading.reference}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {todayReading.firstReading.text}
                </p>
              </div>

              <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50 space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Salmo Responsorial</span>
                  <span>{todayReading.psalm.reference}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {todayReading.psalm.text}
                </p>
              </div>
            </div>

            {/* Reflexión */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Reflexión del Día
              </h3>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {todayReading.reflection}
              </p>
            </div>

            {/* Oración Final */}
            <div className="bg-[#590A1F]/20 border border-[#590A1F]/40 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#E295A8] uppercase tracking-wider">
                Oración de hoy
              </span>
              <p className="text-sm text-zinc-200 italic">
                {todayReading.prayer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DEVOCIONALES POR TEMA */}
      {activeTab === "temas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {TEMATIC_DEVOTIONALS.map((item) => {
            const Icon = item.icon;
            const isCompleted = completedPrayers.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-gradient-to-br ${item.color} bg-zinc-900 border rounded-2xl p-6 space-y-4 flex flex-col justify-between transition-all hover:scale-[1.01]`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-white" /> {item.category}
                    </span>
                    <button
                      onClick={() => togglePrayer(item.id)}
                      className="text-zinc-400 hover:text-amber-400 transition-colors"
                      title="Marcar como rezado"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          isCompleted ? "text-emerald-400 fill-emerald-400/20" : "text-zinc-600"
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-xs font-mono text-amber-300/90 bg-black/40 p-2 rounded-lg border border-white/5">
                    {item.verse}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-1">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">
                    Oración sugerida:
                  </span>
                  <p className="text-xs text-zinc-200 italic">{item.prayer}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PESTAÑA 3: GUÍA DE ORACIÓN POR TIEMPO */}
      {activeTab === "oracion" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRAYER_GUIDES.map((guide, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 text-center hover:border-zinc-700 transition-colors"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-[#590A1F]/30 border border-[#590A1F] flex items-center justify-center text-white font-bold text-sm">
                  {guide.time}
                </div>
                <h3 className="font-bold text-white text-base">{guide.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">¿Tienes un motivo de oración personal?</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Puedes compartir tu petición en nuestro Muro de Oración de la comunidad para que otros jóvenes se unan a rezar contigo.
            </p>
            <a
              href="/#oracion"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C1D40] hover:bg-[#6b1631] text-white font-medium text-sm rounded-xl transition-all shadow-lg"
            >
              <Heart className="w-4 h-4" /> Ir al Muro de Oración
            </a>
          </div>
        </div>
      )}
    </div>
  );
}