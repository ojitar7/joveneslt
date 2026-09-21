"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Challenge, DinnerTask, LinkItem, Meeting, Petition, Plan, Poll, PollOption, Question, Theme, ThinkGlaoSession } from "@/lib/types";
import { 
  ArrowLeft, CalendarDays, Check, ChevronRight, Clock, Flame, 
  LogOut, MessageCircleQuestion, Plus, Save, ShieldCheck, Trash2, 
  Users, X, BarChart2, Link as LinkIcon, LockKeyhole, Settings, 
  Sparkles, ExternalLink, Play, Square, Star, Eye, EyeOff
} from "lucide-react";

const isoLocal = (iso: string) => { 
  const d = new Date(iso); 
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); 
};
const toIso = (v: string) => new Date(v).toISOString();

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="card glow-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-center justify-between border-b border-[#BFB8AE]/15 pb-4">
          <h3 className="text-lg font-normal text-[#F2F2F2]">{title}</h3>
          <button onClick={close} className="rounded-lg p-1 text-[#8C6969] hover:text-[#BFB8AE] transition-colors">
            <X size={18} />
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
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState(""); 
  const [loading, setLoading] = useState(false);
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
      setSession(data.session); 
      setChecking(false);
      if (data.session) await checkAdmin(data.session.user.id);
    });
    const { data } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s); 
      setChecking(false);
      if (s) await checkAdmin(s.user.id); 
      else setIsAdmin(false);
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

    const hasValidRole = data?.role === "super_admin" || data?.role === "coordinator";
    const isAuthorized = !!data?.active && hasValidRole;

    setIsAdmin(isAuthorized);
  }

  async function loadAll() {
    const [{ data: t }, { data: m }, { data: p }, { data: c }, { data: q }, { data: pe }, { data: dt }, { data: l }, { data: po }, { data: op }, { data: ts }, { data: s }] = await Promise.all([
      supabase.from("themes").select("*").eq("active", true).maybeSingle(),
      supabase.from("meetings").select("*").order("meeting_date", { ascending: false }),
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

    setTheme(t); 
    setMeetings(m ?? []); 
    setPlans(p ?? []); 
    setChallenges(c ?? []); 
    setQuestions(q ?? []); 
    setPetitions(pe ?? []); 
    setTasks(dt ?? []); 
    setLinks(l ?? []); 
    setPolls(po ?? []); 
    setPollOptions(op ?? []); 
    setSessionThink(ts);

    const sm = Object.fromEntries((s ?? []).map((x: any) => [x.key, x.value])); 
    setBanner(sm.weekly_banner || "Todos los jueves a las 21:00h"); 
    setWhatsapp(sm.whatsapp_url || process.env.NEXT_PUBLIC_WHATSAPP_URL || "");
  }

  useEffect(() => { 
    if (session && isAdmin) loadAll();
  }, [session, isAdmin]);

  async function save(table: string, row: any, fields?: string[]) {
    const payload = fields ? Object.fromEntries(fields.map(k => [k, row[k]])) : row;
    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    showToast(error ? error.message : "Cambios guardados correctamente"); 
    if (!error) loadAll();
  }

  async function insert(table: string, row: any) { 
    const { error } = await supabase.from(table).insert(row); 
    showToast(error ? error.message : "Registro creado correctamente"); 
    if (!error) loadAll();
  }

  async function remove(table: string, id: string) { 
    if (!confirm("¿Deseas eliminar este elemento?")) return; 
    const { error } = await supabase.from(table).delete().eq("id", id); 
    showToast(error ? error.message : "Eliminado"); 
    if (!error) loadAll();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-xs font-light text-[#8C6969]">
        Comprobando permisos de coordinador…
      </div>
    );
  }

  if (!session) {
    return (
      <Login 
        email={email} 
        password={password} 
        setEmail={setEmail} 
        setPassword={setPassword} 
        error={error} 
        loading={loading} 
        onLogin={async () => {
          setLoading(true); 
          setError(""); 
          const { error } = await supabase.auth.signInWithPassword({ email, password }); 
          if (error) setError(error.message); 
          setLoading(false);
        }} 
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="px-4 pt-16">
        <div className="card p-6 text-center">
          <ShieldCheck className="mx-auto text-[#BFB8AE]" size={42} />
          <h1 className="mt-3 text-xl font-normal text-[#F2F2F2]">Acceso no autorizado</h1>
          <p className="mt-2 text-xs font-light text-[#8C6969]">
            Esta cuenta no dispone de permisos de coordinador o está inactiva.
          </p>
          <button className="btn btn-secondary mt-5 w-full text-xs" onClick={() => supabase.auth.signOut()}>
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>
    );
  }

  const pendingQuestions = questions.filter(q => q.status === "pending").length;
  const privatePetitions = petitions.length;

  return (
    <div className="px-4 pb-16 pt-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between border-b border-[#BFB8AE]/15 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#8C6969]">Coordinación</p>
          <h1 className="text-2xl font-normal text-[#F2F2F2]">Panel Admin</h1>
        </div>
        <button className="btn btn-secondary px-3 py-1.5 text-xs text-[#8C6969] hover:text-[#F2F2F2]" onClick={() => supabase.auth.signOut()}>
          <LogOut size={15} />
        </button>
      </header>

      {toast && (
        <div className="mt-4 rounded-xl border border-[#BFB8AE]/20 bg-[#590A1F]/40 p-3 text-center text-xs font-light text-[#BFB8AE] backdrop-blur-md">
          {toast}
        </div>
      )}

      {section === "dashboard" && (
        <Dashboard 
          meetings={meetings} 
          pending={pendingQuestions} 
          petitions={privatePetitions} 
          plans={plans} 
          onSelect={setSection} 
        />
      )}

      {section !== "dashboard" && (
        <div className="mt-4">
          <button className="inline-flex items-center gap-1.5 text-xs font-light text-[#8C6969] hover:text-[#BFB8AE] transition-colors" onClick={() => setSection("dashboard")}>
            <ArrowLeft size={14} /> Volver al panel general
          </button>
        </div>
      )}

      {section === "calendar" && <Calendar meetings={meetings} save={save} insert={insert} remove={remove} />}
      {section === "theme" && theme && <ThemeEditor theme={theme} setTheme={setTheme} save={save} />}
      {section === "plans" && <PlansAdmin plans={plans} save={save} insert={insert} remove={remove} />}
      {section === "content" && <ContentAdmin meetings={meetings} blocksReload={loadAll} />}
      {section === "challenges" && <ChallengesAdmin meetings={meetings} challenges={challenges} save={save} insert={insert} remove={remove} />}
      {section === "thinkglao" && <ThinkAdmin meetings={meetings} session={sessionThink} save={save} insert={insert} questions={questions} reload={loadAll} />}
      {section === "thermometer" && <ThermometerAdmin meetings={meetings} polls={polls} options={pollOptions} reload={loadAll} />}
      {section === "dinner" && <DinnerAdmin meetings={meetings} tasks={tasks} save={save} insert={insert} remove={remove} />}
      {section === "links" && <LinksAdmin links={links} setLinks={setLinks} save={save} insert={insert} remove={remove} />}
      {section === "privacy" && <PrivacyAdmin petitions={petitions} reload={loadAll} />}
      {section === "settings" && <SettingsAdmin banner={banner} whatsapp={whatsapp} setBanner={setBanner} setWhatsapp={setWhatsapp} save={save} />}
    </div>
  );
}

function Dashboard({ meetings, pending, petitions, plans, onSelect }: { meetings: Meeting[], pending: number, petitions: number, plans: Plan[], onSelect: (s: string) => void }) {
  const next = meetings.find(m => new Date(m.starts_at) >= new Date());

  const items = [
    { key: "calendar", icon: CalendarDays, title: "Calendario", sub: "Reuniones y fechas" },
    { key: "content", icon: Sparkles, title: "Bloques Reunión", sub: "Estructura de cada jueves" },
    { key: "theme", icon: Star, title: "Tema del Mes", sub: "Contenido destacado" },
    { key: "plans", icon: Flame, title: "Planes", sub: `${plans.length} programados` },
    { key: "challenges", icon: Check, title: "Retos", sub: "Publicar y programar" },
    { key: "thinkglao", icon: MessageCircleQuestion, title: "ThinkGlao", sub: "Preguntas y directo" },
    { key: "thermometer", icon: BarChart2, title: "Votaciones / Encuestas", sub: "Gráficos en directo" },
    { key: "dinner", icon: Users, title: "Cena y Servicio", sub: "Equipos y menús" },
    { key: "links", icon: LinkIcon, title: "Enlaces Rápidos", sub: "Accesos directos" },
    { key: "privacy", icon: LockKeyhole, title: "Peticiones Anónimas", sub: `${petitions} recibidas` },
    { key: "settings", icon: Settings, title: "Ajustes Web", sub: "Banners y redes" }
  ];

  return (
    <div className="mt-6 space-y-5">
      <section className="card glow-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8C6969]">Próximo jueves</p>
        <h2 className="mt-2 text-xl font-normal text-[#F2F2F2]">{next?.title || "Sin reunión cercana"}</h2>
        {next && (
          <p className="mt-1 text-xs font-light text-[#BFB8AE]">
            {new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short" }).format(new Date(next.starts_at))}
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="card p-4 text-left transition-all hover:border-[#BFB8AE]/30 active:scale-[.98]"
            >
              <Icon size={20} className="text-[#BFB8AE]" />
              <p className="mt-2 text-xs font-medium text-[#F2F2F2]">{item.title}</p>
              <p className="mt-0.5 text-[10px] font-light text-[#8C6969]">{item.sub}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#BFB8AE]/10 bg-black/30 p-3 text-center text-xs font-light text-[#8C6969]">
        💬 <span className="text-[#BFB8AE]">{pending}</span> preguntas sin moderar · 🔒 <span className="text-[#BFB8AE]">{petitions}</span> peticiones privadas
      </div>
    </div>
  );
}

function Login({ email, password, setEmail, setPassword, error, loading, onLogin }: any) {
  return (
    <div className="px-4 pt-16 max-w-sm mx-auto">
      <div className="card glow-card p-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#BFB8AE]/20 bg-[#590A1F]/30 text-[#F2F2F2]">
          <ShieldCheck size={22} />
        </div>
        <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[.25em] text-[#8C6969]">Jóvenes LT</p>
        <h1 className="mt-1 text-center text-xl font-normal text-[#F2F2F2]">Acceso Coordinadores</h1>

        <div className="mt-6 space-y-3">
          <input 
            className="input text-xs" 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="input text-xs" 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button className="btn btn-primary w-full text-xs" disabled={loading} onClick={onLogin}>
            {loading ? "Verificando…" : "Acceder al panel"}
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 p-2.5 text-center text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}

function ThemeEditor({ theme, setTheme, save }: any) { 
  return (
    <section className="card mt-5 p-5 space-y-3">
      <h2 className="text-base font-medium text-[#F2F2F2]">Tema del Mes</h2>
      <div>
        <label className="text-[10px] text-[#8C6969]">Etiqueta de mes</label>
        <input className="input mt-1 text-xs" value={theme.month_label || ""} onChange={e => setTheme({ ...theme, month_label: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] text-[#8C6969]">Título principal</label>
        <input className="input mt-1 text-xs" value={theme.title || ""} onChange={e => setTheme({ ...theme, title: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] text-[#8C6969]">Subtítulo o descripción</label>
        <textarea className="input mt-1 text-xs min-h-20 resize-none" value={theme.subtitle || ""} onChange={e => setTheme({ ...theme, subtitle: e.target.value })} />
      </div>
      <button className="btn btn-primary w-full text-xs" onClick={() => save("themes", theme, ["month_label", "title", "subtitle"])}>
        <Save size={14} /> Guardar Tema
      </button>
    </section>
  ); 
}

function Calendar({ meetings, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Meeting | null>(null);

  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-[#F2F2F2]">Calendario de Reuniones</h2>
        <button className="btn btn-primary px-3 text-xs" onClick={() => setEditing({ id: "", meeting_date: new Date().toISOString().slice(0, 10), title: "Nueva reunión", subtitle: "", starts_at: new Date().toISOString(), ends_at: null, location: "C/ Mayor, Madrid", description: "", published: true, created_at: "" })}>
          <Plus size={15} /> Nueva
        </button>
      </div>

      <div className="space-y-2">
        {meetings.map((m: Meeting) => (
          <button key={m.id} onClick={() => setEditing({ ...m })} className="card w-full p-4 text-left transition-all hover:border-[#BFB8AE]/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8C6969]">
                  {new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "long" }).format(new Date(m.meeting_date + "T12:00:00"))}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#F2F2F2]">{m.title}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${m.published ? "border-green-500/20 bg-green-950/20 text-green-300" : "border-[#8C6969]/20 text-[#8C6969]"}`}>
                {m.published ? "Publicada" : "Borrador"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar Reunión" : "Crear Nueva Reunión"} close={() => setEditing(null)}>
          <div className="space-y-3">
            <input className="input text-xs" placeholder="Título" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <input className="input text-xs" placeholder="Subtítulo" value={editing.subtitle || ""} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} />
            <input className="input text-xs" placeholder="Ubicación" value={editing.location || ""} onChange={e => setEditing({ ...editing, location: e.target.value })} />
            
            <div>
              <label className="text-[10px] text-[#8C6969]">Fecha del día</label>
              <input className="input mt-1 text-xs" type="date" value={editing.meeting_date} onChange={e => setEditing({ ...editing, meeting_date: e.target.value })} />
            </div>

            <div>
              <label className="text-[10px] text-[#8C6969]">Hora de inicio</label>
              <input className="input mt-1 text-xs" type="datetime-local" value={isoLocal(editing.starts_at)} onChange={e => setEditing({ ...editing, starts_at: toIso(e.target.value) })} />
            </div>

            <label className="flex items-center gap-2 text-xs font-light text-[#BFB8AE] pt-1">
              <input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> Visibilidad activa
            </label>

            <button className="btn btn-primary w-full text-xs" onClick={async () => {
              if (editing.id) await save("meetings", editing, ["meeting_date", "title", "subtitle", "starts_at", "ends_at", "location", "description", "published"]);
              else await insert("meetings", { meeting_date: editing.meeting_date, title: editing.title, subtitle: editing.subtitle, starts_at: editing.starts_at, ends_at: editing.ends_at, location: editing.location, description: editing.description, published: editing.published });
              setEditing(null);
            }}>
              <Save size={14} /> Guardar
            </button>

            {editing.id && (
              <button className="btn btn-secondary w-full text-xs text-red-400 hover:text-red-300" onClick={() => { remove("meetings", editing.id); setEditing(null); }}>
                <Trash2 size={14} /> Eliminar reunión
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function PlansAdmin({ plans, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Plan | null>(null);

  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-[#F2F2F2]">Planes Extraordinarios</h2>
        <button className="btn btn-primary px-3 text-xs" onClick={() => setEditing({ id: "", title: "Nuevo Plan", starts_at: new Date().toISOString(), ends_at: null, location: "", description: "", price_cents: 0, signup_url: "", image_url: "", published: true })}>
          <Plus size={15} /> Añadir
        </button>
      </div>

      <div className="space-y-2">
        {plans.map((p: Plan) => (
          <button key={p.id} onClick={() => setEditing({ ...p })} className="card w-full p-4 text-left transition-all hover:border-[#BFB8AE]/30">
            <p className="text-sm font-medium text-[#F2F2F2]">{p.title}</p>
            <p className="mt-0.5 text-xs font-light text-[#8C6969]">{new Date(p.starts_at).toLocaleString("es-ES")}</p>
          </button>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar Plan" : "Nuevo Plan"} close={() => setEditing(null)}>
          <div className="space-y-3">
            <input className="input text-xs" placeholder="Título del plan" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <input className="input text-xs" placeholder="Lugar" value={editing.location || ""} onChange={e => setEditing({ ...editing, location: e.target.value })} />
            <textarea className="input text-xs min-h-20 resize-none" placeholder="Descripción" value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <input className="input text-xs" placeholder="Enlace de inscripción (Inscripciones, Formularios...)" value={editing.signup_url || ""} onChange={e => setEditing({ ...editing, signup_url: e.target.value })} />
            <input className="input text-xs" type="datetime-local" value={isoLocal(editing.starts_at)} onChange={e => setEditing({ ...editing, starts_at: toIso(e.target.value) })} />

            <button className="btn btn-primary w-full text-xs" onClick={async () => {
              if (editing.id) await save("plans", editing, ["title", "starts_at", "ends_at", "location", "description", "price_cents", "signup_url", "image_url", "published"]);
              else await insert("plans", editing);
              setEditing(null);
            }}>
              <Save size={14} /> Guardar
            </button>
            {editing.id && (
              <button className="btn btn-secondary w-full text-xs text-red-400" onClick={() => { remove("plans", editing.id); setEditing(null); }}>
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function ContentAdmin({ meetings, blocksReload }: any) {
  const [meeting, setMeeting] = useState<Meeting | null>(null); 
  const [blocks, setBlocks] = useState<any[]>([]);

  async function open(m: Meeting) { 
    setMeeting(m); 
    const { data } = await supabase.from("meeting_blocks").select("*").eq("meeting_id", m.id).order("sort_order"); 
    setBlocks(data ?? []);
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Estructura de Bloques</h2>
      <p className="text-xs font-light text-[#8C6969]">Elige la reunión a la que quieres añadir o modificar contenido.</p>

      <div className="space-y-2">
        {meetings.map((m: Meeting) => (
          <button className="card w-full p-4 text-left transition-all hover:border-[#BFB8AE]/30" key={m.id} onClick={() => open(m)}>
            <p className="text-[10px] font-semibold text-[#8C6969] uppercase">
              {new Date(m.meeting_date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-[#F2F2F2]">{m.title}</p>
          </button>
        ))}
      </div>

      {meeting && (
        <Modal title={`Bloques de: ${meeting.title}`} close={() => setMeeting(null)}>
          <div className="space-y-3">
            {blocks.map(b => (
              <div key={b.id} className="rounded-xl border border-[#BFB8AE]/15 bg-black/40 p-3 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <input className="input text-xs" value={b.title} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, title: e.target.value } : x))} />
                  <label className="flex items-center gap-1 text-[11px] text-[#BFB8AE]">
                    <input type="checkbox" checked={b.enabled} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, enabled: e.target.checked } : x))} /> Activo
                  </label>
                </div>
                <select className="input text-xs bg-black/60" value={b.type} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, type: e.target.value } : x))}>
                  <option value="bible">Biblia / Tema</option>
                  <option value="alabanza">Alabanza</option>
                  <option value="thinkglao">ThinkGlao (Preguntas)</option>
                  <option value="poll">Votación en directo</option>
                  <option value="dinner">Cena y Equipos</option>
                  <option value="dynamic">Dinámica</option>
                  <option value="custom">Personalizado</option>
                </select>
                <textarea className="input text-xs min-h-16 resize-none" value={b.content || ""} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, content: e.target.value } : x))} placeholder="Detalles o texto..." />
                <button className="text-[11px] text-red-400 hover:underline" onClick={() => setBlocks(blocks.filter(x => x.id !== b.id))}>Eliminar bloque</button>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary mt-3 w-full text-xs" onClick={() => setBlocks([...blocks, { id: `new-${Date.now()}`, meeting_id: meeting.id, type: "custom", title: "Nuevo bloque", content: "", sort_order: blocks.length, enabled: true, metadata: {}, _new: true }])}>
            <Plus size={14} /> Añadir bloque
          </button>

          <button className="btn btn-primary mt-3 w-full text-xs" onClick={async () => {
            const original = (await supabase.from("meeting_blocks").select("id").eq("meeting_id", meeting.id)).data ?? [];
            const currentIds = blocks.filter(b => !String(b.id).startsWith("new-")).map(b => b.id);
            for (const b of original.filter((x: any) => !currentIds.includes(x.id))) await supabase.from("meeting_blocks").delete().eq("id", b.id);
            for (const b of blocks) {
              if (String(b.id).startsWith("new-")) await supabase.from("meeting_blocks").insert({ meeting_id: meeting.id, type: b.type, title: b.title, content: b.content, sort_order: b.sort_order, enabled: b.enabled, metadata: b.metadata });
              else await supabase.from("meeting_blocks").update({ type: b.type, title: b.title, content: b.content, sort_order: b.sort_order, enabled: b.enabled, metadata: b.metadata }).eq("id", b.id);
            }
            blocksReload(); 
            setMeeting(null);
          }}>
            <Save size={14} /> Guardar Cambios
          </button>
        </Modal>
      )}
    </section>
  );
}

function ChallengesAdmin({ meetings, challenges, save, insert, remove }: any) {
  const [editing, setEditing] = useState<Challenge | null>(null);

  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-[#F2F2F2]">Retos Semanales</h2>
        <button className="btn btn-primary px-3 text-xs" onClick={() => setEditing({ id: "", meeting_id: meetings[0]?.id || null, title: "Nuevo Reto", body: "", starts_at: new Date().toISOString(), ends_at: null, published: true })}>
          <Plus size={15} /> Crear
        </button>
      </div>

      <div className="space-y-2">
        {challenges.map((c: Challenge) => (
          <button key={c.id} onClick={() => setEditing({ ...c })} className="card w-full p-4 text-left transition-all hover:border-[#BFB8AE]/30">
            <p className="text-sm font-medium text-[#F2F2F2]">{c.title}</p>
            <p className="mt-0.5 text-xs font-light text-[#8C6969]">{c.published ? "Publicado" : "Borrador"}</p>
          </button>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar Reto" : "Nuevo Reto"} close={() => setEditing(null)}>
          <div className="space-y-3">
            <input className="input text-xs" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Título del reto" />
            <textarea className="input text-xs min-h-24 resize-none" value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} placeholder="Descripción del reto..." />
            <button className="btn btn-primary w-full text-xs" onClick={async () => {
              if (editing.id) await save("challenges", editing, ["meeting_id", "title", "body", "starts_at", "ends_at", "published"]);
              else await insert("challenges", editing);
              setEditing(null);
            }}>
              <Save size={14} /> Guardar Reto
            </button>
            {editing.id && (
              <button className="btn btn-secondary w-full text-xs text-red-400" onClick={() => { remove("challenges", editing.id); setEditing(null); }}>
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function ThinkAdmin({ meetings, session, save, insert, questions, reload }: any) {
  const [meetingId, setMeetingId] = useState(session?.meeting_id || meetings[0]?.id || ""); 
  const [speaker, setSpeaker] = useState(session?.speaker_name || ""); 
  const [duration, setDuration] = useState(session?.duration_seconds || 2400);

  async function moderate(id: string, status: string) { 
    await supabase.from("questions").update({ status }).eq("id", id); 
    reload();
  }

  async function create() { 
    const row = { meeting_id: meetingId, speaker_name: speaker, duration_seconds: duration, starts_at: null, ends_at: null, status: "scheduled", question_count: questions.filter((q: Question) => q.meeting_id === meetingId).length }; 
    if (session) await save("thinkglao_sessions", { ...session, ...row }, ["meeting_id", "speaker_name", "duration_seconds", "starts_at", "ends_at", "status", "question_count"]); 
    else await insert("thinkglao_sessions", row);
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Control de ThinkGlao</h2>

      <div className="card p-5 space-y-3">
        <p className="text-xs font-medium text-[#F2F2F2]">Configuración de Ponente</p>
        <select className="input text-xs bg-black/50" value={meetingId} onChange={e => setMeetingId(e.target.value)}>
          {meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}
        </select>
        <input className="input text-xs" value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="Nombre del Ponente" />
        <button className="btn btn-primary w-full text-xs" onClick={create}>
          <Save size={14} /> Guardar Sesión
        </button>

        {session && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button className="btn btn-secondary text-xs text-green-400" onClick={async () => {
              const start = new Date(); 
              const end = new Date(start.getTime() + duration * 1000); 
              await supabase.from("thinkglao_sessions").update({ starts_at: start.toISOString(), ends_at: end.toISOString(), duration_seconds: duration, status: "live" }).eq("id", session.id); 
              reload();
            }}>
              <Play size={14} /> Iniciar
            </button>
            <button className="btn btn-secondary text-xs text-red-400" onClick={async () => {
              await supabase.from("thinkglao_sessions").update({ status: "finished" }).eq("id", session.id); 
              reload();
            }}>
              <Square size={14} /> Terminar
            </button>
          </div>
        )}
      </div>

      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#F2F2F2]">Muro de Preguntas</p>
          <span className="text-[10px] text-[#8C6969]">{questions.length} recibidas</span>
        </div>

        <div className="space-y-2">
          {questions.map((q: Question) => (
            <div key={q.id} className="rounded-xl border border-[#BFB8AE]/10 bg-black/30 p-3 space-y-2">
              <p className="text-xs font-light text-[#F2F2F2]">{q.body}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button onClick={() => moderate(q.id, "featured")} className="btn btn-secondary text-[10px] py-1 px-2 text-[#BFB8AE]">
                  <Star size={11} /> Destacar
                </button>
                <button onClick={() => moderate(q.id, "visible")} className="btn btn-secondary text-[10px] py-1 px-2 text-[#BFB8AE]">
                  <Eye size={11} /> Mostrar
                </button>
                <button onClick={() => moderate(q.id, "hidden")} className="btn btn-secondary text-[10px] py-1 px-2 text-[#8C6969]">
                  <EyeOff size={11} /> Ocultar
                </button>
              </div>
            </div>
          ))}
        </div>

        {session && (
          <a className="btn btn-secondary w-full text-xs mt-3 text-center flex items-center justify-center gap-2" href={`/thinkglao/${session.id}`} target="_blank">
            <ExternalLink size={14} /> Abrir Modo Presentación Proyector
          </a>
        )}
      </div>
    </section>
  );
}

function ThermometerAdmin({ meetings, polls, options, reload }: any) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id || ""); 
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsText, setPollOptionsText] = useState("");
  const [saved, setSaved] = useState(false);

  const activePoll = polls.find((p: Poll) => p.meeting_id === meetingId && p.active);

  async function createPoll() {
    if (!meetingId || !pollQuestion.trim()) return;

    await supabase.from("polls").update({ active: false }).eq("meeting_id", meetingId);

    const { data: poll, error } = await supabase.from("polls").insert([
      { meeting_id: meetingId, question: pollQuestion.trim(), active: true }
    ]).select().single();

    if (!error && poll) {
      const opts = pollOptionsText.split("\n").filter(o => o.trim() !== "");
      const rows = opts.map(o => ({ poll_id: poll.id, option_text: o.trim(), votes_count: 0 }));
      await supabase.from("poll_options").insert(rows);

      await supabase.from("meeting_blocks").insert([
        { meeting_id: meetingId, type: "poll", title: "Votación en directo", enabled: true, sort_order: 99 }
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      reload();
    }
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Votaciones en Directo</h2>

      <div className="card p-5 space-y-3">
        <div>
          <label className="text-[10px] text-[#8C6969]">Seleccionar Reunión</label>
          <select className="input mt-1 text-xs bg-black/50" value={meetingId} onChange={e => setMeetingId(e.target.value)}>
            {meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Pregunta de la votación</label>
          <input className="input mt-1 text-xs" placeholder="Ej: ¿Qué tema quieres tratar?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Opciones (Una por línea)</label>
          <textarea className="input mt-1 text-xs min-h-20 resize-none" placeholder={"Opción A\nOpción B\nOpción C"} value={pollOptionsText} onChange={e => setPollOptionsText(e.target.value)} />
        </div>

        <button className="btn btn-primary w-full text-xs" onClick={createPoll}>
          <Save size={14} /> Activar Votación
        </button>

        {saved && <p className="text-xs text-center text-[#BFB8AE]">¡Votación guardada y activada!</p>}
      </div>

      {activePoll && (
        <div className="card p-5 space-y-2">
          <p className="text-xs font-medium text-[#F2F2F2]">Encuesta activa en la reunión:</p>
          <p className="text-sm font-light text-[#BFB8AE]">{activePoll.question}</p>
        </div>
      )}
    </section>
  );
}

function DinnerAdmin({ meetings, save, insert, remove }: any) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id || ""); 
  const [teamName, setTeamName] = useState("");
  const [responsible, setResponsible] = useState("");
  const [menuInfo, setMenuInfo] = useState("");
  const [saved, setSaved] = useState(false);

  async function saveDinner() {
    if (!meetingId || !teamName.trim()) return;

    await supabase.from("dinner_teams").delete().eq("meeting_id", meetingId);

    await supabase.from("dinner_teams").insert([
      { meeting_id: meetingId, team_name: teamName.trim(), responsible_name: responsible.trim(), menu_info: menuInfo.trim() }
    ]);

    await supabase.from("meeting_blocks").insert([
      { meeting_id: meetingId, type: "dinner", title: "Cena y Servicio", enabled: true, sort_order: 98 }
    ]);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Cenas y Equipos de Servicio</h2>

      <div className="card p-5 space-y-3">
        <div>
          <label className="text-[10px] text-[#8C6969]">Seleccionar Reunión</label>
          <select className="input mt-1 text-xs bg-black/50" value={meetingId} onChange={e => setMeetingId(e.target.value)}>
            {meetings.map((m: Meeting) => <option key={m.id} value={m.id}>{m.meeting_date} · {m.title}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Nombre del Equipo Encargado</label>
          <input className="input mt-1 text-xs" placeholder="Ej: Equipo 1 - San Mateo" value={teamName} onChange={e => setTeamName(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Responsable del equipo</label>
          <input className="input mt-1 text-xs" placeholder="Ej: María / Pedro" value={responsible} onChange={e => setResponsible(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Menú previsto</label>
          <textarea className="input mt-1 text-xs min-h-20 resize-none" placeholder="Ej: Pizzas caseras y ensalada" value={menuInfo} onChange={e => setMenuInfo(e.target.value)} />
        </div>

        <button className="btn btn-primary w-full text-xs" onClick={saveDinner}>
          <Save size={14} /> Asignar Equipo y Menú
        </button>

        {saved && <p className="text-xs text-center text-[#BFB8AE]">¡Datos de la cena guardados correctamente!</p>}
      </div>
    </section>
  );
}

function LinksAdmin({ links, save, insert, remove }: any) {
  const [editing, setEditing] = useState<LinkItem | null>(null);

  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-[#F2F2F2]">Accesos Rápidos</h2>
        <button 
          className="btn btn-primary px-3 text-xs" 
          onClick={() => setEditing({ 
            id: "", 
            title: "Nuevo Enlace", 
            url: "https://", 
            icon: "", 
            published: true, 
            sort_order: links.length + 1 
          } as LinkItem)}
        >
          <Plus size={15} /> Crear
        </button>
      </div>

      <div className="space-y-2">
        {links.map((l: LinkItem) => (
          <button key={l.id} onClick={() => setEditing({ ...l })} className="card w-full p-4 text-left transition-all hover:border-[#BFB8AE]/30">
            <p className="text-sm font-medium text-[#F2F2F2]">{l.title}</p>
            <p className="mt-0.5 text-xs font-light text-[#8C6969]">{l.url}</p>
          </button>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar Enlace" : "Nuevo Enlace"} close={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#8C6969]">Título / Etiqueta</label>
              <input 
                className="input mt-1 text-xs" 
                value={editing.title || ""} 
                onChange={e => setEditing({ ...editing, title: e.target.value })} 
                placeholder="Ej: Canal de Spotify" 
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">URL Enlace</label>
              <input 
                className="input mt-1 text-xs" 
                value={editing.url || ""} 
                onChange={e => setEditing({ ...editing, url: e.target.value })} 
                placeholder="https://..." 
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C6969]">Icono (Opcional)</label>
              <input 
                className="input mt-1 text-xs" 
                value={editing.icon || ""} 
                onChange={e => setEditing({ ...editing, icon: e.target.value })} 
                placeholder="Ej: spotify, instagram..." 
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-light text-[#BFB8AE] pt-1">
              <input 
                type="checkbox" 
                checked={editing.published ?? true} 
                onChange={e => setEditing({ ...editing, published: e.target.checked })} 
              /> 
              Visibilidad activa
            </label>
            
            <button className="btn btn-primary w-full text-xs" onClick={async () => {
              if (editing.id) {
                await save("links", editing, ["title", "url", "icon", "published", "sort_order"]);
              } else {
                await insert("links", {
                  title: editing.title,
                  url: editing.url,
                  icon: editing.icon || "",
                  published: editing.published ?? true,
                  sort_order: editing.sort_order || 1
                });
              }
              setEditing(null);
            }}>
              <Save size={14} /> Guardar Enlace
            </button>

            {editing.id && (
              <button className="btn btn-secondary w-full text-xs text-red-400" onClick={() => { remove("links", editing.id); setEditing(null); }}>
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function PrivacyAdmin({ petitions, reload }: any) {
  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Peticiones Anónimas Privadas</h2>
      <p className="text-xs font-light text-[#8C6969]">Solo visible para el equipo de coordinación.</p>

      <div className="space-y-2">
        {petitions.map((p: Petition) => (
          <div key={p.id} className="card p-4 space-y-1">
            <p className="text-xs font-light text-[#F2F2F2] leading-relaxed">{p.body}</p>
            <p className="text-[10px] text-[#8C6969]">{new Date(p.created_at).toLocaleString("es-ES")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsAdmin({ banner, whatsapp, setBanner, setWhatsapp, save }: any) {
  return (
    <section className="mt-5 space-y-4">
      <h2 className="text-lg font-normal text-[#F2F2F2]">Configuración de la Web</h2>

      <div className="card p-5 space-y-3">
        <div>
          <label className="text-[10px] text-[#8C6969]">Banner Informativo Superior</label>
          <input className="input mt-1 text-xs" value={banner} onChange={e => setBanner(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] text-[#8C6969]">Enlace del Grupo de WhatsApp</label>
          <input className="input mt-1 text-xs" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
        </div>

        <button className="btn btn-primary w-full text-xs" onClick={async () => {
          await supabase.from("site_settings").upsert([
            { key: "weekly_banner", value: banner },
            { key: "whatsapp_url", value: whatsapp }
          ]);
        }}>
          <Save size={14} /> Guardar Configuración
        </button>
      </div>
    </section>
  );
}