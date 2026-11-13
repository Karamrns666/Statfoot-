-- =====================================================================================================
--  Morocco Business League — SIMULATION de saison (temporaire, isolée, supprimable)
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable sans risque).
--
--  · Table À PART (sim_rows) : les vraies données (entity_rows) ne sont jamais lues ni écrites par la simulation.
--  · Lecture et écriture réservées aux admins connectés (RLS) : un visiteur ne peut rien lire, même via l'API.
--  · Chaque ligne porte is_simulation = true (contrainte) et l'identifiant de la simulation (sim_id),
--    aussi présents dans le JSON (data.is_simulation, data.simulation_id).
--  · Suppression : uniquement par un super-admin, via delete_simulation(sim_id) qui filtre sur
--    sim_id ET is_simulation = true ET les drapeaux du JSON — et n'agit QUE sur sim_rows.
-- =====================================================================================================
create table if not exists public.sim_rows (
  sim_id text not null,
  entity text not null,
  id text not null,
  data jsonb not null,
  is_simulation boolean not null default true check (is_simulation),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  primary key (sim_id, entity, id),
  constraint sim_rows_flags check ((data->>'is_simulation')::boolean is true and data->>'simulation_id' = sim_id)
);
alter table public.sim_rows enable row level security;

drop policy if exists "simulation : lecture admins" on public.sim_rows;
create policy "simulation : lecture admins" on public.sim_rows for select using (public.is_admin());
drop policy if exists "simulation : écriture super-admins" on public.sim_rows;
create policy "simulation : écriture super-admins" on public.sim_rows for insert with check (public.is_super_admin() and is_simulation);
drop policy if exists "simulation : modification super-admins" on public.sim_rows;
create policy "simulation : modification super-admins" on public.sim_rows for update using (public.is_super_admin() and is_simulation) with check (public.is_super_admin() and is_simulation);
-- pas de politique DELETE : la suppression passe uniquement par la fonction ci-dessous

-- Suppression DÉFINITIVE d'une simulation (super-admin) : renvoie le nombre de lignes supprimées par type.
create or replace function public.delete_simulation(p_sim_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare res jsonb;
begin
  if not public.is_super_admin() then raise exception 'Réservé aux super-admins'; end if;
  if p_sim_id is null or p_sim_id = '' then raise exception 'Identifiant de simulation manquant'; end if;
  with del as (
    delete from public.sim_rows
    where sim_id = p_sim_id and is_simulation = true
      and (data->>'is_simulation')::boolean is true and data->>'simulation_id' = p_sim_id
    returning entity
  )
  select coalesce(jsonb_object_agg(entity, n), '{}'::jsonb) into res from (select entity, count(*) n from del group by entity) t;
  return res;
end $$;

-- Comptage des VRAIES données par type (preuve avant / après) et des lignes de simulation.
create or replace function public.real_row_counts() returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce((select jsonb_object_agg(entity, n) from (select entity, count(*) n from public.entity_rows where not deleted group by entity) t), '{}'::jsonb) else null end
$$;
create or replace function public.sim_row_counts(p_sim_id text) returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce((select jsonb_object_agg(entity, n) from (select entity, count(*) n from public.sim_rows where sim_id = p_sim_id group by entity) t), '{}'::jsonb) else null end
$$;
grant execute on function public.delete_simulation(text), public.real_row_counts(), public.sim_row_counts(text) to authenticated;
