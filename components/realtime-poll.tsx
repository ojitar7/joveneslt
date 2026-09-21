"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function RealtimePoll({ pollId }: { pollId: string }) {
  const [options, setOptions] = useState<any[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  async function loadData() {
    const [{ data: opts }, { data: votes }] = await Promise.all([
      supabase.from("poll_options").select("*").eq("poll_id", pollId).order("sort_order"),
      supabase.from("poll_votes").select("option_id").eq("poll_id", pollId)
    ]);

    if (!opts || !votes) return;

    const counts: Record<string, number> = {};
    votes.forEach((v) => counts[v.option_id] = (counts[v.option_id] || 0) + 1);

    const computed = opts.map((o) => ({
      ...o,
      count: counts[o.id] || 0
    }));

    setOptions(computed);
    setTotalVotes(votes.length);
  }

  useEffect(() => {
    loadData();
    const ch = supabase.channel(`poll-rt-${pollId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${pollId}` }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [pollId]);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#BFB8AE]">Resultados en directo</p>
        <span className="text-xs text-[#8C6969] font-light">{totalVotes} votos</span>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
          return (
            <div key={opt.id} className="space-y-1">
              <div className="flex justify-between text-xs font-light text-[#F2F2F2]">
                <span>{opt.emoji} {opt.label}</span>
                <span className="font-mono text-[#BFB8AE]">{pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40 border border-[#BFB8AE]/10">
                <div 
                  className="h-full bg-gradient-to-r from-[#590A1F] to-[#BFB8AE] transition-all duration-500 ease-out" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}