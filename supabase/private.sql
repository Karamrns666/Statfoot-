-- Données privées : lignes jamais lisibles par le public (seulement par un admin connecté).
--  · __private          : champs privés des joueurs et des équipes (CIN, date de naissance, contacts…)
--  · RefereeEvaluation  : évaluations des arbitres
--  · Referee            : fiches des arbitres (téléphone)
--  · ClientError        : erreurs remontées par le site (suivi en production)
-- À exécuter une fois dans Supabase → SQL Editor (sans effet sur les données).
drop policy if exists "lecture" on public.entity_rows;
create policy "lecture" on public.entity_rows for select using (
  entity not in ('AdminUser', 'AuditLog', 'DisciplineCase', 'ProcesVerbal', '__private', 'RefereeEvaluation', 'Referee', 'ClientError') or public.is_admin()
);
