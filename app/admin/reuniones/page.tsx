"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, BarChart2, Users, Save, Check } from "lucide-react";
import Link from "next/link";

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

  // Votación
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsText, setPollOptionsText] = useState("");
  const [pollSaved, setPollSaved] = useState(false);

  // Cena
  const [teamName, setTeamName] = useState("");
  const [responsible, setResponsible] = useState("");
  const [menuInfo, setMenuInfo] = useState("");
  const [dinnerSaved, setDinnerSaved] = useState(false);

  useEffect(() => {
    supabase.from("meetings").select("*").order("starts_at", { ascending: false }).then(({ data }) => setMeetings(data ?? []));
  }, []);

  async function enableBlock(type: "poll" | "dinner", title: string) {
    if (!selectedMeeting) return;

    // Crear bloque si no existe
    await supabase.from("meeting_blocks").insert([
      {
        meeting_id: selectedMeeting,
        type: type,
        title: title,
        enabled: true,
        sort_order: 99
      }
    ]);
  }

  async function savePoll() {
    if (!selectedMeeting || !pollQuestion.trim()) return;

    // Desactivar encuestas previas
    await supabase.from("polls").update({ active: false }).eq("meeting_id", selectedMeeting);

    // Crear encuesta
    const { data: poll, error } = await supabase.from("polls").insert([
      { meeting_id: selectedMeeting, question: pollQuestion.trim(), active: true }
    ]).select().single();

    if (!error && poll) {
      const options = pollOptionsText.split("\n").filter(o => o.trim() !== "");
      const optionRows = options.map(o => ({ poll_id: poll.id, option_text: o.trim(), votes_count: 0 }));
      await supabase.from("poll_options").insert(optionRows);

      await enableBlock("poll", "Votación en directo");
      setPollSaved(true);
      setTimeout(() => setPollSaved(false), 3000);
    }
  }

  async function saveDinner() {
    if (!selectedMeeting || !teamName.trim()) return;

    await supabase.from("dinner_teams").delete().eq("meeting_id", selectedMeeting);

    await supabase.from("dinner_teams").insert([
      {
        meeting_id: selectedMeeting,
        team_name: teamName.trim(),
        responsible_name: responsible.trim(),
        menu_info: menuInfo.trim()
      }
    ]);

    await enableBlock("dinner", "Cena y Servicio");
    setDinnerSaved(true);
    setTimeout(() => setDinnerSaved(false), 3000);
  }

  return (
    <div className="px-4 pb-20 pt-4">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15} /> Admin
      </Link>

      <h1 className="text-2xl font-light text-[#F2F2F2]">Gestión de Bloques</h1>
      <p className="mt-1 text-xs font-light text-[#8C6969]">Añade votaciones con gráficos o equipos de cena a las reuniones.</p>

      {/* Seleccionar Reunión */}
      <div className="card mt-4 p-4 space-y-2">
        <label className="text-[10px] uppercase tracking-wider text-[#8C6969]">Seleccionar Reunión</label>
        <select
          className="input text-xs bg-black/50"
          value={selectedMeeting || ""}
          onChange={(e) => setSelectedMeeting(e.target.value)}
        >
          <option value="">-- Selecciona una reunión --</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({new Date(m.starts_at).toLocaleDateString("es-ES")})
            </option>
          ))}
        </select>
      </div>

      {selectedMeeting && (
        <div className="mt-6 space-y-6">
          {/* Añadir Votación */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#BFB8AE]">
              <BarChart2 size={18} />
              <p className="text-xs font-medium text-[#F2F2F2]">Crear Votación en Tiempo Real</p>
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Pregunta de la votación</label>
              <input
                className="input mt-1 text-xs"
                placeholder="Ej: ¿Qué tema preferís para la próxima convivencia?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Opciones (una por línea)</label>
              <textarea
                className="input mt-1 text-xs min-h-20 resize-none"
                placeholder={"Opción 1\nOpción 2\nOpción 3"}
                value={pollOptionsText}
                onChange={(e) => setPollOptionsText(e.target.value)}
              />
            </div>
            <button onClick={savePoll} className="btn btn-primary w-full text-xs">
              <Save size={14} /> Lanzar Votación en la Reunión
            </button>
            {pollSaved && <p className="text-xs text-[#BFB8AE] text-center flex items-center justify-center gap-1"><Check size={14} /> ¡Votación activada con éxito!</p>}
          </div>

          {/* Añadir Equipo y Menú de Cena */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#BFB8AE]">
              <Users size={18} />
              <p className="text-xs font-medium text-[#F2F2F2]">Asignar Equipo y Menú de Cena</p>
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Nombre del Equipo Encargado</label>
              <input
                className="input mt-1 text-xs"
                placeholder="Ej: Equipo 2 (Mateo y Sofía)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Responsable principal</label>
              <input
                className="input mt-1 text-xs"
                placeholder="Ej: Juan Pérez"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Menú previsto</label>
              <textarea
                className="input mt-1 text-xs min-h-16 resize-none"
                placeholder="Ej: Tortilla de patatas, hamburguesas y postre"
                value={menuInfo}
                onChange={(e) => setMenuInfo(e.target.value)}
              />
            </div>
            <button onClick={saveDinner} className="btn btn-secondary w-full text-xs">
              <Save size={14} /> Guardar Equipo y Menú
            </button>
            {dinnerSaved && <p className="text-xs text-[#BFB8AE] text-center flex items-center justify-center gap-1"><Check size={14} /> ¡Datos de cena guardados!</p>}
          </div>
        </div>
      )}
    </div>
  );
}