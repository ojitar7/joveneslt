"use client";

import { useState } from "react";
import { Shuffle, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DinnerGenerator() {
  const [rawList, setRawList] = useState("");
  const [tasks, setTasks] = useState("Cocinar, Poner Mesa, Fregar, Recoger");
  const [result, setResult] = useState<Record<string, string[]>>({});

  function generate() {
    const names = rawList.split("\n").map(n => n.trim()).filter(Boolean);
    const taskList = tasks.split(",").map(t => t.trim()).filter(Boolean);

    if (!names.length || !taskList.length) return;

    // Algoritmo de mezcla Fisher-Yates
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const assigned: Record<string, string[]> = {};
    taskList.forEach(t => assigned[t] = []);

    shuffled.forEach((name, idx) => {
      const taskKey = taskList[idx % taskList.length];
      assigned[taskKey].push(name);
    });

    setResult(assigned);
  }

  return (
    <div className="px-4 pb-12 pt-4">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-light text-[#8C6969]">
        <ArrowLeft size={15}/> Admin
      </Link>
      <h1 className="text-2xl font-light text-[#F2F2F2]">Sorteo de Tareas y Cenas</h1>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-xs text-[#BFB8AE] font-light">Nombres (uno por línea)</label>
          <textarea 
            className="input mt-1.5 min-h-32 text-xs" 
            placeholder="Juan&#10;Maria&#10;Carlos&#10;Lucía"
            value={rawList}
            onChange={e => setRawList(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-[#BFB8AE] font-light">Tareas (separadas por comas)</label>
          <input 
            className="input mt-1.5 text-xs" 
            value={tasks} 
            onChange={e => setTasks(e.target.value)}
          />
        </div>

        <button onClick={generate} className="btn btn-primary w-full text-xs">
          <Shuffle size={14}/> Sortear Equipos
        </button>

        {Object.keys(result).length > 0 && (
          <div className="mt-6 space-y-3">
            {Object.entries(result).map(([task, members]) => (
              <div key={task} className="card p-4">
                <p className="text-xs font-semibold text-[#BFB8AE] uppercase tracking-wider">{task}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {members.map(m => (
                    <span key={m} className="rounded-md border border-[#BFB8AE]/15 bg-black/30 px-2 py-0.5 text-xs font-light text-[#F2F2F2]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}