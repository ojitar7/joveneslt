"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Challenge, DinnerAssignment, DinnerTask, LinkItem, Meeting, Petition, Plan, Poll, PollOption, Question, Theme, ThinkGlaoSession } from "@/lib/types";
import { CalendarDays, ChevronDown, ChevronUp, CirclePlus, ClipboardList, Flame, LogOut, MessageCircleQuestion, Pencil, Plus, Save, ShieldCheck, Trash2, Users, X, BarChart3, Shuffle, LockKeyhole } from "lucide-react";

const isoLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) };
const toIso = (v: string) => new Date(v).toISOString();

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={close} className="rounded-lg p-1 text-[#aab5ae] hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState("dashboard");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [tasks, setTasks] = useState<DinnerTask[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [sessionThink, setSessionThink] = useState<ThinkGlaoSession | null>(null);
  const [banner, setBanner] = useState("Todos los jueves a las 21:00h");
  const [whatsapp, setWhatsapp] = useState(process.env.NEXT_PUBLIC_WHATSAPP_URL || "");
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session); setChecking(false);
      if (data.session) await checkAdmin(data.session.user.id);
    });
    const { data } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s); setChecking(false);
      if (s) await checkAdmin(s.user.id); else setIsAdmin(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function checkAdmin(uid: string) {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, role, active")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.error("Error al consultar admin_profiles:", error.message);
    setIsAdmin(false);
    return;
  }

  // Verifica que exista el registro, esté activo y el rol sea coordinator o super_admin
  const hasValidRole = data?.role === "super_admin" || data?.role === "coordinator";
  const isAuthorized = !!data?.active && hasValidRole;

  setIsAdmin(isAuthorized);
}

  async function loadAll() {
    const [{ data: t }, { data: m }, { data: p }, { data: c }, { data: q }, { data: pe }, { data: dt }, { data: l }, { data: po }, { data: op }, { data: ts }, { data: s }] = await Promise.all([
      supabase.from("themes").select("*").eq("active", true).maybeSingle(),
      supabase.from("meetings").select("*").order("meeting_date"),
      supabase.from("plans").select("*").order("starts_at"),
      supabase.from("challenges").select("*").order("starts_at", { ascending: false }),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
      supabase.from("petitions").select("*").order("created_at", { ascending: false }),
      supabase.from("dinner_tasks").select("*").order("sort_order"),
      supabase.from("links").select("*").order("sort_order"),
      supabase.from("polls").select("*"),
      supabase.from("poll_options").select("*").order("sort_order"),
      supabase.from("thinkglao_sessions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("site_settings").select("*")
    ]);
    setTheme(t); setMeetings(m ?? []); setPlans(p ?? []); setChallenges(c ?? []); setQuestions(q ?? []); setPetitions(pe ?? []); setTasks(dt ?? []); setLinks(l ?? []); setPolls(po ?? []); setPollOptions(op ?? []); setSessionThink(ts);
    const sm = Object.fromEntries((s ?? []).map((x: any) => [x.key, x.value])); setBanner(sm.weekly_banner || "Todos los jueves a las 21:00h"); setWhatsapp(sm.whatsapp_url || process.env.NEXT_PUBLIC_WHATSAPP_URL || "");
  }

  useEffect(() => { if (session && isAdmin) loadAll() }, [session, isAdmin]);

  async function save(table: string, row: any, fields?: string[]) {
    const payload = fields ? Object.fromEntries(fields.map(k => [k, row[k]])) : row;
    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    setToast(error ? error.message : "Guardado"); if (!error) loadAll();
  }
  async function insert(table: string, row: any) { const { error } = await supabase.from(table).insert(row); setToast(error ? error.message : "Creado"); if (!error) loadAll() }
  async function remove(table: string, id: string) { if (!confirm("¿Eliminar definitivamente?")) return; const { error } = await supabase.from(table).delete().eq("id", id); setToast(error ? error.message : "Eliminado"); if (!error) loadAll() }

  if (checking) return <div className="p-6 text-[#aab5ae]">Comprobando acceso…</div>;
  if (!session) return <Login email={email} password={password} setEmail={setEmail} setPassword={setPassword} error={error} loading={loading} onLogin={async () => {
    setLoading(true); setError(""); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); setLoading(false);
  }} />;
  if (!isAdmin) return <div className="px-4 pt-16"><div className="card p-6 text-center"><ShieldCheck className="mx-auto text-[#b6c76d]" size={42} /><h1 className="mt-3 text-2xl font-black">Acceso no autorizado</h1><p className="mt-2 text-sm text-[#aab5ae]">Esta cuenta no está registrada como coordinador.</p><button className="btn btn-secondary mt-5" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button></div></div>;

  const pending = questions.filter(q => q.status === "pending").length;
  const privatePetitions = petitions.length;

  return <div className="px-4 pb-8 pt-4">
    <header className="flex items-center justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#b6c76d]">Coordinación</p><h1 className="text-3xl font-black">Admin</h1></div><button className="btn btn-secondary px-3" onClick={() => supabase.auth.signOut()}><LogOut size={17} /></button></header>
    {toast && <button onClick={() => setToast("")} className="mt-3 w-full rounded-2xl bg-[#b6c76d]/10 p-3 text-sm font-bold text-[#b6c76d]">{toast}</button>}

    {section === "dashboard" && <Dashboard meetings={meetings} pending={pending} petitions={privatePetitions} plans={plans} on={setSection} />}
    {section === "calendar" && <Calendar meetings={meetings} setMeetings={setMeetings} save={save} insert={insert} remove={remove} />}
    {section === "theme" && theme && <ThemeEditor theme={theme} setTheme={setTheme} save={save} />}
    {section === "plans" && <PlansAdmin plans={plans} setPlans={setPlans} save={save} insert={insert} remove={remove} />}
    {section === "content" && <ContentAdmin meetings={meetings} blocksReload={loadAll} save={save} />}
    {section === "challenges" && <ChallengesAdmin meetings={meetings} challenges={challenges} setChallenges={setChallenges} save={save} insert={insert} remove={remove} />}
    {section === "thinkglao" && <ThinkAdmin meetings={meetings} session={sessionThink} setSession={setSessionThink} save={save} insert={insert} questions={questions} reload={loadAll} />}
    {section === "thermometer" && <ThermometerAdmin meetings={meetings} polls={polls} options={pollOptions} reload={loadAll} />}
    {section === "dinner" && <DinnerAdmin meetings={meetings} tasks={tasks} setTasks={setTasks} save={save} insert={insert} remove={remove} />}
    {section === "links" && <LinksAdmin links={links} setLinks={setLinks} save={save} insert={insert} remove={remove} />}
    {section === "privacy" && <PrivacyAdmin petitions={petitions} reload={loadAll} />}
    {section === "settings" && <SettingsAdmin banner={banner} whatsapp={whatsapp} setBanner={setBanner} setWhatsapp={setWhatsapp} save={save} />}
    {section !== "dashboard" && <button className="btn btn-secondary mt-5 w-full" onClick={() => setSection("dashboard")}>← Volver al dashboard</button>}
  </div>
}

function Dashboard({ meetings, pending, petitions, plans, on }: { meetings: Meeting[], pending: number, petitions: number, plans: Plan[], on: (s: string) => void }) {
  const next = meetings.find(m => new Date(m.starts_at) >= new Date());
  const items = [
    ["calendar", "📅", "Calendario", "Reuniones y fechas"],
    ["content", "🧩", "Reuniones", "Qué se hace cada día"],
    ["theme", "✨", "Tema del mes", "Contenido principal"],
    ["plans", "🏕️", "Planes", `${plans.length} programados`],
    ["challenges", "🎯", "Retos", "Publicar y programar"],
    ["thinkglao", "🎤", "ThinkGlao", "Directo y preguntas"],
    ["thermometer", "🌡️", "Termómetro", "Encuesta en directo"],
    ["dinner", "🍽️", "Tareas cena", "Sorteo y tareas"],
    ["links", "🔗", "Enlaces", "Accesos rápidos"],
    ["privacy", "🔒", "Peticiones", `${petitions} privadas`],
    ["settings", "⚙️", "Configuración", "Banner y WhatsApp"]
  ];
  return <><section className="card glow-card mt-5 p-5"><p className="text-xs font-black uppercase tracking-widest text-[#b6c76d]">Próxima reunión</p><h2 className="mt-2 text-2xl font-black">{next?.title || "Sin reunión programada"}</h2>{next && <p className="mt-1 text-sm text-[#aab5ae]">{new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short" }).format(new Date(next.starts_at))}</p>}</section>
    <div className="admin-grid mt-4">{items.map(([key, icon, title, sub]) => <button key={key} onClick={() => on(key)} className="card min-h-28 p-4 text-left active:scale-[.98]"><span className="text-2xl">{icon}</span><p className="mt-2 text-sm font-black">{title}</p><p className="mt-1 text-[11px] text-[#7f8b84]">{sub}</p></button>)}</div>
    <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4 text-xs text-[#7f8b84]">💬 {pending} preguntas pendientes de moderación · 🔒 {petitions} peticiones privadas</div></>
}

function Login({ email, password, setEmail, setPassword, error, loading, onLogin }: any) {
  return <div className="px-4 pt-16"><div className="card glow-card p-6"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#b6c76d] text-2xl">✦</div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-[#b6c76d]">Jóvenes LT</p><h1 className="mt-1 text-3xl font-black">Acceso coordinadores</h1><p className="mt-2 text-sm text-[#aab5ae]">Zona privada de coordinación.</p><input className="input mt-5" type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input className="input mt-2" type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} /><button className="btn btn-primary mt-4 w-full" disabled={loading} onClick={onLogin}>{loading ? "Entrando…" : "Entrar"}</button>{error && <p className="mt-3 rounded-xl bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}</div></div>
}

function ThemeEditor({ theme, setTheme, save }: any) { return <section className="card mt-5 p-5"><h2 className="text-xl font-black">Tema del mes</h2>{["month_label", "title", "subtitle"].map(k => <input key={k} className="input mt-3" value={theme[k] || ""} placeholder={k} onChange={e => setTheme({ ...theme, [k]: e.target.value })} />)}<button className="btn btn-primary mt-4 w-full" onClick={() => save("themes", theme, ["month_label", "title", "subtitle"])}><Save size={16} /> Guardar</button></section> }

function Calendar({ meetings, setMeetings, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Meeting | null>(null);
  return <section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Calendario</h2><button className="btn btn-primary px-3" onClick={() => setEditing({ id: "", meeting_date: new Date().toISOString().slice(0, 10), title: "Nueva reunión", subtitle: "", starts_at: new Date().toISOString(), ends_at: null, location: "", description: "", published: false, created_at: "" })}><Plus size={17} /></button></div>
    <div className="mt-4 space-y-2">{meetings.map((m: Meeting) => <button key={m.id} onClick={() => setEditing({ ...m })} className="card w-full p-4 text-left"><div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-[#b6c76d]">{new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "long" }).format(new Date(m.meeting_date + "T12:00:00"))}</p><p className="mt-1 font-black">{m.title}</p></div><span className={`text-xs ${m.published ? "text-green-300" : "text-[#7f8b84]"}`}>{m.published ? "Publicado" : "Borrador"}</span></div></button>)}</div>
    {editing && <Modal title={editing.id ? "Editar reunión" : "Nueva reunión"} close={() => setEditing(null)}>
      {(["title", "subtitle", "location", "description"] as const).map(k => <input key={k} className="input mt-3" value={(editing as any)[k] || ""} placeholder={k} onChange={e => setEditing({ ...editing, [k]: e.target.value })} />)}
      <input className="input mt-3" type="date" value={editing.meeting_date} onChange={e => setEditing({ ...editing, meeting_date: e.target.value })} />
      <input className="input mt-3" type="datetime-local" value={isoLocal(editing.starts_at)} onChange={e => setEditing({ ...editing, starts_at: toIso(e.target.value) })} />
      <input className="input mt-3" type="datetime-local" value={editing.ends_at ? isoLocal(editing.ends_at) : ""} onChange={e => setEditing({ ...editing, ends_at: e.target.value ? toIso(e.target.value) : null })} />
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> Publicada</label>
      <button className="btn btn-primary mt-4 w-full" onClick={async () => { if (editing.id) await save("meetings", editing, ["meeting_date", "title", "subtitle", "starts_at", "ends_at", "location", "description", "published"]); else await insert("meetings", { meeting_date: editing.meeting_date, title: editing.title, subtitle: editing.subtitle, starts_at: editing.starts_at, ends_at: editing.ends_at, location: editing.location, description: editing.description, published: editing.published }); setEditing(null) }}><Save size={16} /> Guardar</button>
      {editing.id && <button className="btn btn-secondary mt-2 w-full" onClick={() => { remove("meetings", editing.id); setEditing(null) }}><Trash2 size={16} /> Eliminar</button>}
    </Modal>}</section>
}

function PlansAdmin({ plans, setPlans, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Plan | null>(null);
  return <section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Planes</h2><button className="btn btn-primary px-3" onClick={() => setEditing({ id: "", title: "Nuevo plan", starts_at: new Date().toISOString(), ends_at: null, location: "", description: "", price_cents: 0, signup_url: "", image_url: "", published: true })}><Plus size={17} /></button></div><div className="mt-4 space-y-2">{plans.map((p: Plan) => <button key={p.id} onClick={() => setEditing({ ...p })} className="card w-full p-4 text-left"><p className="font-black">{p.title}</p><p className="mt-1 text-xs text-[#8f9a93]">{new Date(p.starts_at).toLocaleString("es-ES")}</p></button>)}</div>
    {editing && <Modal title={editing.id ? "Editar plan" : "Nuevo plan"} close={() => setEditing(null)}>{["title", "location", "description", "signup_url", "image_url"].map(k => <input key={k} className="input mt-3" value={(editing as any)[k] || ""} placeholder={k} onChange={e => setEditing({ ...editing, [k]: e.target.value })} />)}<input className="input mt-3" type="datetime-local" value={isoLocal(editing.starts_at)} onChange={e => setEditing({ ...editing, starts_at: toIso(e.target.value) })} /><input className="input mt-3" type="number" value={editing.price_cents} onChange={e => setEditing({ ...editing, price_cents: Number(e.target.value) })} /><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> Publicado</label><button className="btn btn-primary mt-4 w-full" onClick={async () => { if (editing.id) await save("plans", editing, ["title", "starts_at", "ends_at", "location", "description", "price_cents", "signup_url", "image_url", "published"]); else await insert("plans", editing); setEditing(null) }}><Save size={16} /> Guardar</button>{editing.id && <button className="btn btn-secondary mt-2 w-full" onClick={() => { remove("plans", editing.id); setEditing(null) }}><Trash2 size={16} /> Eliminar</button>}</Modal>}</section>
}

function ContentAdmin({ meetings, blocksReload, save }: any) {
  const [meeting, setMeeting] = useState<Meeting | null>(null); const [blocks, setBlocks] = useState<any[]>([]);
  async function open(m: Meeting) { setMeeting(m); const { data } = await supabase.from("meeting_blocks").select("*").eq("meeting_id", m.id).order("sort_order"); setBlocks(data ?? []) }
  return <section className="mt-5"><h2 className="text-2xl font-black">Qué hacemos</h2><p className="mt-1 text-sm text-[#aab5ae]">Configura los bloques de cada jueves.</p><div className="mt-4 space-y-2">{meetings.map((m: Meeting) => <button className="card w-full p-4 text-left" key={m.id} onClick={() => open(m)}><p className="text-xs text-[#b6c76d]">{new Date(m.meeting_date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</p><p className="mt-1 font-black">{m.title}</p></button>)}</div>
    {meeting && <Modal title={meeting.title} close={() => setMeeting(null)}><div className="space-y-3">{blocks.map(b => <div key={b.id} className="rounded-2xl border border-white/8 bg-white/3 p-3"><div className="flex justify-between gap-2"><input className="input" value={b.title} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, title: e.target.value } : x))} /><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={b.enabled} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, enabled: e.target.checked } : x))} /> activo</label></div><select className="input mt-2" value={b.type} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, type: e.target.value } : x))}><option value="catequesis">Catequesis</option><option value="dynamic">Dinámica</option><option value="bible">Biblia</option><option value="thinkglao">ThinkGlao</option><option value="thermometer">Termómetro</option><option value="alabanza">Alabanza</option><option value="petition">Petición</option><option value="dinner">Cena</option><option value="custom">Personalizado</option></select><textarea className="input mt-2 min-h-20" value={b.content || ""} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, content: e.target.value } : x))} /><button className="btn btn-secondary mt-2 w-full text-xs" onClick={() => setBlocks(blocks.filter(x => x.id !== b.id))}>Quitar bloque</button></div>)}</div><button className="btn btn-secondary mt-3 w-full" onClick={() => setBlocks([...blocks, { id: `new-${Date.now()}`, meeting_id: meeting.id, type: "custom", title: "Nuevo bloque", content: "", sort_order: blocks.length, enabled: true, metadata: {}, _new: true }])}><Plus size={16} /> Añadir bloque</button><button className="btn btn-primary mt-3 w-full" onClick={async () => { const original = (await supabase.from("meeting_blocks").select("id").eq("meeting_id", meeting.id)).data ?? []; const currentIds = blocks.filter(b => !String(b.id).startsWith("new-")).map(b => b.id); for (const b of original.filter((x: any) => !currentIds.includes(x.id))) await supabase.from("meeting_blocks").delete().eq("id", b.id); for (const b of blocks) { if (String(b.id).startsWith("new-")) await supabase.from("meeting_blocks").insert({ meeting_id: meeting.id, type: b.type, title: b.title, content: b.content, sort_order: b.sort_order, enabled: b.enabled, metadata: b.metadata }); else await supabase.from("meeting_blocks").update({ type: b.type, title: b.title, content: b.content, sort_order: b.sort_order, enabled: b.enabled, metadata: b.metadata }).eq("id", b.id) } blocksReload(); setMeeting(null) }}><Save size={16} /> Guardar reunión</button></Modal>}</section>
}

function ChallengesAdmin({ meetings, challenges, setChallenges, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Challenge | null>(null);
  return <section className="mt-5"><div className="flex justify-between"><h2 className="text-2xl font-black">Retos</h2><button className="btn btn-primary px-3" onClick={() => setEditing({ id: "", meeting_id: meetings[0]?.id || null, title: "Nuevo reto", body: "", starts_at: new Date().toISOString(), ends_at: null, published: true })}><Plus size={17} /></button></div><div className="mt-4 space-y-2">{challenges.map((c: Challenge) => <button key={c.id} onClick={() => setEditing({ ...c })} className="card w-full p-4 text-left"><p className="font-black">{c.title}</p><p className="mt-1 text-xs text-[#8f9a93]">{c.published ? "Publicado" : "Borrador"}</p></button>)}</div>{editing && <Modal title={editing.id ? "Editar reto" : "Nuevo reto"} close={() => setEditing(null)}><select className="input mt-3" value={editing.meeting_id || ""} onChange={e => setEditing({ ...editing, meeting_id: e.target.value || null })}><option value="">Sin reunión</option>{meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}</select><input className="input mt-3" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /><textarea className="input mt-3 min-h-28" value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} /><input className="input mt-3" type="datetime-local" value={isoLocal(editing.starts_at)} onChange={e => setEditing({ ...editing, starts_at: toIso(e.target.value) })} /><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> Publicado</label><button className="btn btn-primary mt-4 w-full" onClick={async () => { if (editing.id) await save("challenges", editing, ["meeting_id", "title", "body", "starts_at", "ends_at", "published"]); else await insert("challenges", editing); setEditing(null) }}><Save size={16} /> Guardar</button>{editing.id && <button className="btn btn-secondary mt-2 w-full" onClick={() => { remove("challenges", editing.id); setEditing(null) }}><Trash2 size={16} /> Eliminar</button>}</Modal>}</section>
}

function ThinkAdmin({ meetings, session, setSession, save, insert, questions, reload }: any) {
  const [meetingId, setMeetingId] = useState(session?.meeting_id || meetings[0]?.id || ""); const [speaker, setSpeaker] = useState(session?.speaker_name || ""); const [duration, setDuration] = useState(session?.duration_seconds || 2400);
  async function moderate(id: string, status: string) { await supabase.from("questions").update({ status }).eq("id", id); reload() }
  async function create() { const row = { meeting_id: meetingId, speaker_name: speaker, duration_seconds: duration, starts_at: null, ends_at: null, status: "scheduled", question_count: questions.filter((q: Question) => q.meeting_id === meetingId).length }; if (session) await save("thinkglao_sessions", { ...session, ...row }, ["meeting_id", "speaker_name", "duration_seconds", "starts_at", "ends_at", "status", "question_count"]); else await insert("thinkglao_sessions", row) }
  return <section className="mt-5"><h2 className="text-2xl font-black">ThinkGlao</h2><div className="card mt-4 p-5"><select className="input" value={meetingId} onChange={e => setMeetingId(e.target.value)}>{meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}</select><input className="input mt-3" value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="Ponente" /><input className="input mt-3" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} /><button className="btn btn-primary mt-3 w-full" onClick={create}><Save size={16} /> Guardar sesión</button>{session && <div className="mt-3 grid grid-cols-2 gap-2"><button className="btn btn-secondary" onClick={async () => { const start = new Date(); const end = new Date(start.getTime() + duration * 1000); await supabase.from("thinkglao_sessions").update({ starts_at: start.toISOString(), ends_at: end.toISOString(), duration_seconds: duration, status: "live" }).eq("id", session.id); reload() }}>▶ Iniciar</button><button className="btn btn-secondary" onClick={async () => { await supabase.from("thinkglao_sessions").update({ status: "finished" }).eq("id", session.id); reload() }}>■ Terminar</button></div>}</div><div className="mt-4 card p-5"><div className="flex items-center justify-between"><h3 className="font-black">Muro</h3><span className="text-xs text-[#8f9a93]">{questions.length} preguntas</span></div><div className="mt-3 space-y-2">{questions.map((q: Question) => <div key={q.id} className="rounded-2xl bg-white/4 p-3"><p>{q.body}</p><div className="mt-2 flex flex-wrap gap-2">{["visible", "featured", "answered", "hidden"].map(s => <button key={s} onClick={() => moderate(q.id, s)} className="btn btn-secondary px-2 py-1 text-xs">{s === "featured" ? "⭐ Destacar" : s === "visible" ? "👁 Mostrar" : s === "answered" ? "✓ Respondida" : "🙈 Ocultar"}</button>)}</div></div>)}</div>{session && <a className="btn btn-secondary mt-3 w-full" href={`/thinkglao/${session.id}`} target="_blank">🖥️ Abrir modo presentación</a>}</div></section>
}

function ThermometerAdmin({ meetings, polls, options, reload }: any) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id || ""); const [poll, setPoll] = useState<any>(polls.find((p: Poll) => p.meeting_id === meetingId) || null); const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => { setPoll(polls.find((p: Poll) => p.meeting_id === meetingId) || null) }, [meetingId, polls]);
  async function refresh() { if (!poll) return; const { data } = await supabase.from("poll_votes").select("option_id").eq("poll_id", poll.id); const c: Record<string, number> = {}; (data ?? []).forEach((v: any) => c[v.option_id] = (c[v.option_id] || 0) + 1); setCounts(c) }
  useEffect(() => { refresh(); if (!poll) return; const ch = supabase.channel(`poll-${poll.id}`).on("postgres_changes", { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${poll.id}` }, refresh).subscribe(); return () => { supabase.removeChannel(ch) } }, [poll?.id]);
  async function seed() { const { data: p } = await supabase.from("polls").insert({ meeting_id: meetingId, title: "El Termómetro", question: "¿Cómo te sientes con este tema?", active: true }).select().single(); if (p) { await supabase.from("poll_options").insert([{ poll_id: p.id, emoji: "😶", label: "No tengo ni idea", sort_order: 1 }, { poll_id: p.id, emoji: "😐", label: "Tengo algunas dudas", sort_order: 2 }, { poll_id: p.id, emoji: "🙂", label: "Me interesa", sort_order: 3 }, { poll_id: p.id, emoji: "🔥", label: "Quiero hablar de ello", sort_order: 4 }]); reload() } }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return <section className="mt-5"><h2 className="text-2xl font-black">El Termómetro</h2><select className="input mt-4" value={meetingId} onChange={e => setMeetingId(e.target.value)}>{meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}</select>{!poll ? <button className="btn btn-primary mt-3 w-full" onClick={seed}><Plus size={16} /> Crear encuesta</button> : <div className="card mt-4 p-5"><p className="text-sm font-black">{poll.question}</p><p className="mt-1 text-xs text-[#8f9a93]">{total} respuestas · actualización en directo</p><div className="mt-5 space-y-4">{options.filter((o: PollOption) => o.poll_id === poll.id).map((o: PollOption) => { const n = counts[o.id] || 0; const pct = total ? Math.round(n / total * 100) : 0; return <div key={o.id}><div className="flex justify-between text-sm font-bold"><span>{o.emoji} {o.label}</span><span>{pct}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-[#b6c76d] transition-all" style={{ width: `${pct}%` }} /></div></div> })}</div></div>}</section>
}

function DinnerAdmin({ meetings, tasks, setTasks, save, insert, remove }: any) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id || ""); const [names, setNames] = useState(""); const [assignments, setAssignments] = useState<DinnerAssignment[]>([]); const [drawing, setDrawing] = useState(false); const [spin, setSpin] = useState("🎰");
  async function load() { if (!meetingId) return; const { data } = await supabase.from("dinner_assignments").select("*").eq("meeting_id", meetingId); setAssignments(data ?? []) }
  useEffect(() => { load() }, [meetingId]);
  async function draw() { const participants = names.split(",").map(x => x.trim()).filter(Boolean); if (!participants.length) return; const active = tasks.filter((t: any) => t.active); if (!active.length) return; setDrawing(true); for (let i = 0; i < 10; i++) { setSpin(active[Math.floor(Math.random() * active.length)].icon); await new Promise(r => setTimeout(r, 90 + i * 18)) } const { data: history } = await supabase.from("dinner_assignments").select("participant_name,task_id"); const rows: any[] = []; for (const name of participants) { const own = (history ?? []).filter((h: any) => h.participant_name.toLowerCase() === name.toLowerCase()); const ranked = [...active].sort((a, b) => { const ca = own.filter((h: any) => h.task_id === a.id).length; const cb = own.filter((h: any) => h.task_id === b.id).length; return ca - cb || Math.random() - .5 }); const task = ranked[0]; rows.push({ meeting_id: meetingId, participant_name: name, task_id: task.id }) } await supabase.from("dinner_assignments").delete().eq("meeting_id", meetingId); await supabase.from("dinner_assignments").insert(rows); setDrawing(false); load() }
  return <section className="mt-5"><h2 className="text-2xl font-black">🍽️ Tareas de cena</h2><div className="card mt-4 p-5"><select className="input" value={meetingId} onChange={e => setMeetingId(e.target.value)}>{meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}</select><textarea className="input mt-3 min-h-24" value={names} onChange={e => setNames(e.target.value)} placeholder="Nombres separados por comas: Ana, Carlos, María…" /><div className="mt-4 rounded-3xl border border-[#b6c76d]/15 bg-[#b6c76d]/6 p-5 text-center"><div className={`text-6xl ${drawing ? "animate-bounce" : ""}`}>{drawing ? spin : "🎰"}</div><p className="mt-2 text-xs font-black uppercase tracking-widest text-[#aab5ae]">{drawing ? "Sorteando…" : "Listo para sortear"}</p></div><button className="btn btn-primary mt-3 w-full" disabled={drawing} onClick={draw}><Shuffle size={17} /> {drawing ? "Sorteando…" : "Sortear tareas"}</button></div><div className="mt-4 space-y-2">{assignments.map(a => <div key={a.id} className="card flex items-center justify-between p-4"><b>{a.participant_name}</b><span className="text-sm text-[#c5ccc7]">{tasks.find((t: any) => t.id === a.task_id)?.icon} {tasks.find((t: any) => t.id === a.task_id)?.name}</span></div>)}</div><div className="card mt-4 p-5"><h3 className="font-black">Tareas activas</h3>{tasks.map((t: any) => <div key={t.id} className="mt-2 flex items-center gap-2"><input className="input" value={`${t.icon} ${t.name}`} onChange={e => { const v = e.target.value.replace(/^\S+\s/, ""); setTasks(tasks.map((x: any) => x.id === t.id ? { ...x, name: v } : x)) }} /><button className="btn btn-secondary px-3" onClick={() => save("dinner_tasks", t, ["name", "icon", "active", "sort_order"])}><Save size={15} /></button></div>)}<button className="btn btn-secondary mt-3 w-full" onClick={() => insert("dinner_tasks", { name: "Nueva tarea", icon: "🧹", active: true, sort_order: tasks.length + 1 })}><Plus size={16} /> Añadir tarea</button></div></section>
}

function LinksAdmin({ links, setLinks, save, insert, remove }: any) {
  return <section className="mt-5"><div className="flex justify-between"><h2 className="text-2xl font-black">Enlaces</h2><button className="btn btn-primary px-3" onClick={() => insert("links", { title: "Nuevo enlace", url: "https://", icon: "🔗", sort_order: links.length + 1, published: true })}><Plus size={17} /></button></div><div className="mt-4 space-y-2">{links.map((l: LinkItem) => <div key={l.id} className="card p-4"><input className="input" value={l.title} onChange={e => setLinks(links.map((x: any) => x.id === l.id ? { ...x, title: e.target.value } : x))} /><input className="input mt-2" value={l.url} onChange={e => setLinks(links.map((x: any) => x.id === l.id ? { ...x, url: e.target.value } : x))} /><div className="mt-2 flex gap-2"><button className="btn btn-primary flex-1" onClick={() => save("links", l, ["title", "url", "icon", "sort_order", "published"])}><Save size={15} /> Guardar</button><button className="btn btn-secondary" onClick={() => remove("links", l.id)}><Trash2 size={15} /></button></div></div>)}</div></section>
}

function PrivacyAdmin({ petitions, reload }: any) {
  return <section className="mt-5"><h2 className="text-2xl font-black">Peticiones privadas</h2><div className="mt-4 space-y-2">{petitions.map((p: Petition) => <div key={p.id} className="card p-4"><p className="text-sm font-bold">{p.body}</p><p className="mt-2 text-xs text-[#8f9a93]">{new Date(p.created_at).toLocaleString("es-ES")}</p></div>)}</div></section>
}

function SettingsAdmin({ banner, whatsapp, setBanner, setWhatsapp, save }: any) {
  return <section className="mt-5 card p-5"><h2 className="text-2xl font-black">Configuración global</h2><label className="mt-4 block text-xs font-bold text-[#aab5ae]">Banner semanal</label><input className="input mt-1" value={banner} onChange={e => setBanner(e.target.value)} /><label className="mt-4 block text-xs font-bold text-[#aab5ae]">URL de WhatsApp</label><input className="input mt-1" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /><button className="btn btn-primary mt-5 w-full" onClick={async () => { await supabase.from("site_settings").upsert([{ key: "weekly_banner", value: banner }, { key: "whatsapp_url", value: whatsapp }]); alert("Ajustes guardados") }}><Save size={16} /> Guardar ajustes</button></section>
}