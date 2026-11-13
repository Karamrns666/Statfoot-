-- =====================================================================================================
--  Morocco Business League — base Supabase (à exécuter UNE fois dans Supabase → SQL Editor → New query → Run)
--  · comptes admin : Supabase Auth (mots de passe hachés bcrypt, e-mails de réinitialisation, limitation des
--    tentatives de connexion) + profils (rôle, changement de mot de passe obligatoire) ;
--  · données du site partagées entre tous les admins et visiteurs (lecture publique, écriture réservée aux admins) ;
--  · journal des actions de chaque admin (qui a modifié quoi et quand).
--  Le script est ré-exécutable sans risque.
-- =====================================================================================================

-- ---------- Profils des administrateurs ----------------------------------------------------------------
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'operator' check (role in ('super_admin', 'admin', 'operator')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  last_login timestamptz
);
alter table public.admin_profiles enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where id = auth.uid() and status = 'active')
$$;
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where id = auth.uid() and status = 'active' and role = 'super_admin')
$$;

drop policy if exists "profil : soi-même ou super-admin" on public.admin_profiles;
create policy "profil : soi-même ou super-admin" on public.admin_profiles for select using (id = auth.uid() or public.is_super_admin());
-- aucune écriture directe depuis le site : rôles et comptes passent par la fonction serveur /api/admin-users (clé service)

-- l'admin connecté signale qu'il a changé son mot de passe (fin du changement obligatoire) / sa connexion
create or replace function public.password_changed() returns void language sql security definer set search_path = public as $$
  update public.admin_profiles set must_change_password = false where id = auth.uid()
$$;
create or replace function public.touch_login() returns void language sql security definer set search_path = public as $$
  update public.admin_profiles set last_login = now() where id = auth.uid()
$$;
grant execute on function public.password_changed(), public.touch_login(), public.is_admin(), public.is_super_admin() to authenticated;

-- ---------- Données du site (une ligne JSON par enregistrement : Match, Team, Player…) --------------------
create table if not exists public.entity_rows (
  entity text not null,
  id text not null,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid default auth.uid(),
  primary key (entity, id)
);
create index if not exists entity_rows_updated_at on public.entity_rows (updated_at);
alter table public.entity_rows enable row level security;

create or replace function public.entity_rows_touch() returns trigger language plpgsql as $$
begin new.updated_at := clock_timestamp(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists entity_rows_touch on public.entity_rows;
create trigger entity_rows_touch before insert or update on public.entity_rows for each row execute function public.entity_rows_touch();

-- lecture publique, sauf les données internes (journal, conseil de discipline et ses votes, PV)
drop policy if exists "lecture" on public.entity_rows;
create policy "lecture" on public.entity_rows for select using (
  entity not in ('AdminUser', 'AuditLog', 'DisciplineCase', 'ProcesVerbal') or public.is_admin()
);
drop policy if exists "écriture admins" on public.entity_rows;
create policy "écriture admins" on public.entity_rows for insert with check (public.is_admin() and entity <> 'AdminUser');
drop policy if exists "modification admins" on public.entity_rows;
create policy "modification admins" on public.entity_rows for update using (public.is_admin()) with check (public.is_admin() and entity <> 'AdminUser');
-- pas de suppression physique : le site écrit deleted = true (pour que tous les écrans se mettent à jour)

-- ---------- Journal des actions ------------------------------------------------------------------------
-- Le journal (« qui a modifié quoi et quand ») est stocké dans entity_rows (entité AuditLog, lecture réservée aux admins) ;
-- chaque ligne garde aussi updated_by = identifiant Supabase de l'auteur, posé par le serveur (non falsifiable).
