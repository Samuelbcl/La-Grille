-- =====================================================================
--  PRONOS CDM 2026 — Schéma de base de données (PostgreSQL / Supabase)
-- ---------------------------------------------------------------------
--  À exécuter dans : Supabase Dashboard > SQL Editor > New query
--  Ce script est idempotent (tu peux le relancer sans casser tes données).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILS (un par utilisateur authentifié)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Joueur',
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. POOLS (une "ligue" de pronos — réutilisable chaque année / compétition)
-- ---------------------------------------------------------------------
create table if not exists public.pools (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  season         text not null default 'Coupe du Monde 2026',
  buy_in_cents   integer not null default 1000,         -- 10 € de mise
  points_exact   integer not null default 5,            -- héritage : le barème réel est par phase (compute_points)
  points_outcome integer not null default 2,            -- héritage : le barème réel est par phase (compute_points)
  join_code      text unique not null default upper(substr(md5(random()::text), 1, 6)),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. MEMBRES D'UN POOL
-- ---------------------------------------------------------------------
create table if not exists public.pool_members (
  pool_id   uuid not null references public.pools (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  is_admin  boolean not null default false,             -- peut saisir les résultats réels
  has_paid  boolean not null default false,             -- a réglé sa mise de 10 €
  joined_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

-- ---------------------------------------------------------------------
-- 4. MATCHS
-- ---------------------------------------------------------------------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references public.pools (id) on delete cascade,
  match_no    integer not null,                         -- numéro officiel FIFA (1..104)
  stage       text not null default 'group',            -- group | r32 | r16 | qf | sf | final
  group_label text,                                     -- A..L (null si phase finale)
  kickoff     timestamptz not null,
  venue       text,
  team_a      text not null,
  team_a_code text,                                      -- code ISO pour le drapeau (ex: FR)
  team_b      text not null,
  team_b_code text,
  score_a     integer,                                   -- résultat réel (null tant que pas joué)
  score_b     integer,
  status      text not null default 'scheduled',         -- scheduled | live | finished
  created_at  timestamptz not null default now(),
  unique (pool_id, match_no)
);

-- ---------------------------------------------------------------------
-- 5. PRONOSTICS
-- ---------------------------------------------------------------------
create table if not exists public.predictions (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  pred_a     integer not null check (pred_a >= 0 and pred_a <= 30),
  pred_b     integer not null check (pred_b >= 0 and pred_b <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, user_id)
);

-- =====================================================================
--  CALCUL DES POINTS — barème « La Grille » (cf. docs/REGLEMENT.md)
-- =====================================================================
-- Barème identique à toutes les phases, CUMULATIF :
--   • Bon vainqueur (1/N/2)         : +2
--   • Score exact (en plus)         : +5   → un score exact rapporte donc 7
--   • Mauvais vainqueur / pas de prono : 0
-- (Le paramètre p_stage n'est plus utilisé, conservé pour compatibilité.)

-- Re-run propre : on retire d'abord les vues qui dépendent de la fonction.
drop view if exists public.v_leaderboard;
drop view if exists public.v_prediction_scores;
drop function if exists public.compute_points(integer, integer, integer, integer, integer, integer);

create or replace function public.compute_points(
  pred_a integer, pred_b integer,
  real_a integer, real_b integer,
  p_stage text
) returns integer
language sql immutable as $$
  select case
    when real_a is null or real_b is null then 0
    when pred_a = real_a and pred_b = real_b then 7   -- bon vainqueur (2) + score exact (5)
    when sign(pred_a - pred_b) = sign(real_a - real_b) then 2
    else 0
  end;
$$;

-- Vue : un score calculé par pronostic.
-- security_invoker=true : la vue applique la RLS de CELUI qui l'interroge
-- (sinon une vue contourne la RLS → fuite des pronos des autres avant le coup d'envoi).
create or replace view public.v_prediction_scores with (security_invoker = true) as
select
  p.id          as prediction_id,
  m.pool_id,
  p.user_id,
  p.match_id,
  m.match_no,
  p.pred_a, p.pred_b,
  m.score_a, m.score_b,
  m.status,
  -- Les points ne comptent QUE pour un match TERMINÉ (sinon un 0-0 au coup
  -- d'envoi donnerait des points provisoires aux pronos « match nul »).
  case when m.status = 'finished'
       then public.compute_points(p.pred_a, p.pred_b, m.score_a, m.score_b, m.stage)
       else 0 end as points,
  (m.status = 'finished' and p.pred_a = m.score_a and p.pred_b = m.score_b) as is_exact
from public.predictions p
join public.matches m on m.id = p.match_id;

-- Vue : classement agrégé par pool (le fameux "classement automatique")
-- correct_count = bons vainqueurs SEULS (points = 2), distinct des scores exacts.
create or replace view public.v_leaderboard with (security_invoker = true) as
select
  s.pool_id,
  s.user_id,
  pr.display_name,
  pr.avatar_url,
  coalesce(sum(s.points), 0)                            as total_points,
  count(*) filter (where s.is_exact)                    as exact_count,
  count(*) filter (where s.points = 2)                  as correct_count,
  count(*) filter (where s.status = 'finished')         as played_count
from public.v_prediction_scores s
join public.profiles pr on pr.id = s.user_id
group by s.pool_id, s.user_id, pr.display_name, pr.avatar_url;

-- =====================================================================
--  TRIGGERS
-- =====================================================================
-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Met à jour updated_at sur un prono modifié
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_predictions_touch on public.predictions;
create trigger trg_predictions_touch
  before update on public.predictions
  for each row execute function public.touch_updated_at();

-- =====================================================================
--  ROW LEVEL SECURITY (sécurité : chacun ne touche que ce qu'il doit)
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.pools        enable row level security;
alter table public.pool_members enable row level security;
alter table public.matches      enable row level security;
alter table public.predictions  enable row level security;

-- Helper : l'utilisateur est-il membre du pool ?
create or replace function public.is_pool_member(p_pool uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pool_members
    where pool_id = p_pool and user_id = auth.uid()
  );
$$;

-- Helper : l'utilisateur est-il admin du pool ?
create or replace function public.is_pool_admin(p_pool uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pool_members
    where pool_id = p_pool and user_id = auth.uid() and is_admin = true
  );
$$;

-- Rejoindre un groupe via son code d'invitation.
-- SECURITY DEFINER : permet de retrouver le groupe par code même sans en être
-- encore membre (la RLS de lecture sur "pools" l'empêcherait sinon).
create or replace function public.join_pool(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pool uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  select id into v_pool from public.pools where join_code = upper(trim(p_code));
  if v_pool is null then
    raise exception 'Code introuvable';
  end if;
  insert into public.pool_members (pool_id, user_id)
  values (v_pool, auth.uid())
  on conflict (pool_id, user_id) do nothing;
  return v_pool;
end;
$$;
grant execute on function public.join_pool(text) to anon, authenticated;

-- PROFILES
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update using (id = auth.uid());

-- POOLS
drop policy if exists "pools read member" on public.pools;
create policy "pools read member" on public.pools for select
  using (public.is_pool_member(id) or owner_id = auth.uid());
drop policy if exists "pools insert own" on public.pools;
create policy "pools insert own" on public.pools for insert
  with check (owner_id = auth.uid());
drop policy if exists "pools update owner" on public.pools;
create policy "pools update owner" on public.pools for update
  using (owner_id = auth.uid());
drop policy if exists "pools delete owner" on public.pools;
create policy "pools delete owner" on public.pools for delete
  using (owner_id = auth.uid());

-- POOL MEMBERS
drop policy if exists "members read same pool" on public.pool_members;
create policy "members read same pool" on public.pool_members for select
  using (public.is_pool_member(pool_id));
drop policy if exists "members join self" on public.pool_members;
create policy "members join self" on public.pool_members for insert
  with check (user_id = auth.uid());
drop policy if exists "members admin update" on public.pool_members;
create policy "members admin update" on public.pool_members for update
  using (public.is_pool_admin(pool_id) or user_id = auth.uid());

-- MATCHES
drop policy if exists "matches read member" on public.matches;
create policy "matches read member" on public.matches for select
  using (public.is_pool_member(pool_id));
drop policy if exists "matches admin write" on public.matches;
create policy "matches admin write" on public.matches for all
  using (public.is_pool_admin(pool_id))
  with check (public.is_pool_admin(pool_id));

-- PREDICTIONS
-- Lecture : ses propres pronos à tout moment ; ceux des autres seulement
-- une fois le match commencé (anti-triche).
drop policy if exists "predictions read" on public.predictions;
create policy "predictions read" on public.predictions for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_pool_member(m.pool_id)
        and m.kickoff <= now()
    )
  );
-- Écriture : seulement ses pronos, et seulement avant le coup d'envoi.
drop policy if exists "predictions insert" on public.predictions;
create policy "predictions insert" on public.predictions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_pool_member(m.pool_id)
        and m.kickoff > now()
    )
  );
drop policy if exists "predictions update" on public.predictions;
create policy "predictions update" on public.predictions for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_pool_member(m.pool_id)
        and m.kickoff > now()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_pool_member(m.pool_id)
        and m.kickoff > now()
    )
  );

-- =====================================================================
--  REALTIME — diffuser les changements de matchs (classement en direct)
-- =====================================================================
do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;

-- =====================================================================
--  FIN DU SCHÉMA
-- =====================================================================
