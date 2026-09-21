create extension if not exists pgcrypto;

-- =========================================================
-- JÓVENES LT V2
-- Run this file in a fresh Supabase project, or migrate after
-- backing up the previous schema.
-- =========================================================

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  month_label text not null,
  title text not null,
  subtitle text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists one_active_theme on public.themes(active) where active=true;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null unique,
  title text not null,
  subtitle text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  description text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_blocks (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  type text not null check (type in ('catequesis','dynamic','bible','thinkglao','thermometer','alabanza','petition','dinner','custom')),
  title text not null,
  content text,
  sort_order int not null default 0,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  description text,
  price_cents int not null default 0 check(price_cents>=0),
  signup_url text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete set null,
  title text not null,
  body text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  published boolean not null default true
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  icon text not null default '🔗',
  sort_order int not null default 0,
  published boolean not null default true
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  question text not null,
  active boolean not null default true,
  unique(meeting_id)
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  emoji text not null,
  label text not null,
  sort_order int not null default 0
);
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  anonymous_id uuid not null,
  created_at timestamptz not null default now(),
  unique(poll_id, anonymous_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete set null,
  anonymous_id uuid not null,
  body text not null check(char_length(body) between 1 and 1000),
  status text not null default 'pending' check(status in ('pending','visible','featured','answered','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.petitions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete set null,
  anonymous_id uuid not null,
  body text not null check(char_length(body) between 1 and 1000),
  status text not null default 'visible' check(status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.dinner_tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '🧹',
  active boolean not null default true,
  sort_order int not null default 0
);
create table if not exists public.dinner_assignments (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  participant_name text not null,
  task_id uuid not null references public.dinner_tasks(id) on delete restrict,
  assigned_at timestamptz not null default now()
);

create table if not exists public.thinkglao_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  speaker_name text not null default 'Ponente',
  duration_seconds int not null default 2400,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check(status in ('scheduled','live','paused','finished')),
  question_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default ''
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'coordinator' check(role in ('coordinator','super_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS
do $$ declare t text; begin
  foreach t in array array['themes','meetings','meeting_blocks','plans','challenges','links','polls','poll_options','poll_votes','questions','petitions','dinner_tasks','dinner_assignments','thinkglao_sessions','site_settings','admin_profiles']
  loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

create or replace function public.is_coordinator()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_profiles where id=auth.uid() and active=true); $$;

-- Drop v2 policies so the script can be safely re-run.
drop policy if exists "public themes" on public.themes;
drop policy if exists "public meetings" on public.meetings;
drop policy if exists "public meeting blocks" on public.meeting_blocks;
drop policy if exists "public plans" on public.plans;
drop policy if exists "public challenges" on public.challenges;
drop policy if exists "public links" on public.links;
drop policy if exists "public polls" on public.polls;
drop policy if exists "public poll options" on public.poll_options;
drop policy if exists "public question wall" on public.questions;
drop policy if exists "public settings" on public.site_settings;
drop policy if exists "submit questions" on public.questions;
drop policy if exists "submit petitions" on public.petitions;
drop policy if exists "vote poll" on public.poll_votes;
drop policy if exists "admin profiles own read" on public.admin_profiles;
drop policy if exists "super admins manage profiles" on public.admin_profiles;

-- Public content
drop policy if exists "public themes" on public.themes;
create policy "public themes" on public.themes for select to anon,authenticated using(active=true);
drop policy if exists "public meetings" on public.meetings;
create policy "public meetings" on public.meetings for select to anon,authenticated using(published=true);
drop policy if exists "public meeting blocks" on public.meeting_blocks;
create policy "public meeting blocks" on public.meeting_blocks for select to anon,authenticated using(enabled=true and exists(select 1 from public.meetings m where m.id=meeting_id and m.published=true));
drop policy if exists "public plans" on public.plans;
create policy "public plans" on public.plans for select to anon,authenticated using(published=true);
drop policy if exists "public challenges" on public.challenges;
create policy "public challenges" on public.challenges for select to anon,authenticated using(published=true);
drop policy if exists "public links" on public.links;
create policy "public links" on public.links for select to anon,authenticated using(published=true);
drop policy if exists "public polls" on public.polls;
create policy "public polls" on public.polls for select to anon,authenticated using(active=true);
drop policy if exists "public poll options" on public.poll_options;
create policy "public poll options" on public.poll_options for select to anon,authenticated using(true);
drop policy if exists "public question wall" on public.questions;
create policy "public question wall" on public.questions for select to anon,authenticated using(status in ('visible','featured','answered'));
drop policy if exists "public settings" on public.site_settings;
create policy "public settings" on public.site_settings for select to anon,authenticated using(key in ('weekly_banner','whatsapp_url'));

-- Anonymous writes. No public petition select.
create policy "submit questions" on public.questions for insert to anon,authenticated with check(true);
create policy "submit petitions" on public.petitions for insert to anon,authenticated with check(true);
create policy "vote poll" on public.poll_votes for insert to anon,authenticated with check(true);

-- Coordinator management
do $$ declare t text; begin
  foreach t in array array['themes','meetings','meeting_blocks','plans','challenges','links','polls','poll_options','questions','petitions','dinner_tasks','dinner_assignments','thinkglao_sessions','site_settings']
  loop
    execute format('drop policy if exists "coordinator manage %s" on public.%I',t,t);
    execute format('create policy "coordinator manage %s" on public.%I for all to authenticated using(public.is_coordinator()) with check(public.is_coordinator())',t,t);
  end loop;
end $$;
drop policy if exists "admin profiles own read" on public.admin_profiles;
create policy "admin profiles own read" on public.admin_profiles for select to authenticated using(id=auth.uid());
create policy "super admins manage profiles" on public.admin_profiles for all to authenticated using(exists(select 1 from public.admin_profiles p where p.id=auth.uid() and p.role='super_admin' and p.active=true)) with check(exists(select 1 from public.admin_profiles p where p.id=auth.uid() and p.role='super_admin' and p.active=true));

-- Realtime (safe on reruns)
do $$ begin
  begin alter publication supabase_realtime add table public.meetings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.meeting_blocks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.challenges; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.plans; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.questions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.poll_votes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.petitions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.thinkglao_sessions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.site_settings; exception when duplicate_object then null; end;
end $$;

insert into public.site_settings(key,value) values
('weekly_banner','Todos los jueves a las 21:00h'),
('whatsapp_url','')
on conflict(key) do nothing;

insert into public.themes(month_label,title,subtitle,active)
select 'Octubre','La Sexualidad','Un espacio para hablar, escuchar y crecer juntos.',true
where not exists(select 1 from public.themes where active=true);

insert into public.dinner_tasks(name,icon,sort_order)
select x.name,x.icon,x.sort_order
from (values
('Colocar mesas','🪑',1),('Recoger mesa','🧹',2),('Sacar basura','🗑️',3),
('Meter vajilla al lavaplatos','🍽️',4),('Preparar bebidas','🥤',5),('Preparar cubiertos','🍴',6),
('Limpiar mesas','🧽',7),('Barrer','🧹',8),('Ordenar sala','🪑',9),
('Guardar material','📦',10),('Revisar cocina','🧼',11),('Recoger bebidas','🧃',12),
('Preparar comida','🥘',13),('Cargar lavavajillas','🍽️',14),('Dejar salón preparado','✨',15)
) x(name,icon,sort_order)
where not exists(select 1 from public.dinner_tasks d where d.name=x.name);

-- Calendar 2026/27. Exceptions requested by the group are omitted.
insert into public.meetings(meeting_date,title,subtitle,starts_at,location,published)
select d::date,
       case when extract(month from d)=12 and extract(day from d)=3 then 'Adviento'
            when extract(month from d)=12 and extract(day from d)=10 then 'Preparando Navidad'
            else 'Grupo de Jóvenes LT' end,
       'Jueves de Jóvenes LT',
       d + time '21:00',
       'Salón parroquial', true
from generate_series(date '2026-10-01', date '2027-06-24', interval '1 day') d
where extract(isodow from d)=4
  and d not in (date '2026-12-17',date '2026-12-24',date '2026-12-31',date '2027-01-07',date '2027-03-25')
on conflict(meeting_date) do nothing;

-- Christmas dinner, Friday 18 December.
insert into public.meetings(meeting_date,title,subtitle,starts_at,location,published)
values('2026-12-18','Cena de Navidad','Una noche especial para celebrar juntos.','2026-12-18 21:00+01','Salón parroquial',true)
on conflict(meeting_date) do nothing;

insert into public.meeting_blocks(meeting_id,type,title,content,sort_order,enabled)
select m.id,'catequesis','Catequesis','Contenido por confirmar.',1,true from public.meetings m
where m.meeting_date=date '2026-10-01' and not exists(select 1 from public.meeting_blocks b where b.meeting_id=m.id);
insert into public.meeting_blocks(meeting_id,type,title,content,sort_order,enabled)
select m.id,'thermometer','El Termómetro','¿Cómo te sientes con este tema?',2,true from public.meetings m
where m.meeting_date=date '2026-10-01' and not exists(select 1 from public.meeting_blocks b where b.meeting_id=m.id and b.type='thermometer');

insert into public.polls(meeting_id,title,question,active)
select m.id,'El Termómetro','¿Cómo te sientes con este tema?',true from public.meetings m
where m.meeting_date=date '2026-10-01'
on conflict(meeting_id) do nothing;

insert into public.poll_options(poll_id,emoji,label,sort_order)
select p.id,x.emoji,x.label,x.n from public.polls p
cross join (values ('😶','No tengo ni idea',1),('😐','Tengo algunas dudas',2),('🙂','Me interesa',3),('🔥','Quiero hablar de ello',4)) x(emoji,label,n)
where not exists(select 1 from public.poll_options o where o.poll_id=p.id);
