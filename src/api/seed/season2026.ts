// Saison 2026-2027 — 23 entreprises (liste officielle), d'abord la PRÉ-SAISON (système suisse), puis MASTER / CHALLENGER.
// Les divisions sont décidées à la clôture de la pré-saison (top 12 → MASTER, 13e à 23e → CHALLENGER).
// Les matchs et les effectifs sont importés depuis le fichier de la ligue (scripts/import_excel_*.py) ou saisis dans l'admin.
// Les équipes déjà présentes en 2025-2026 réutilisent la même fiche (historique continu).
import type { Competition, Season, Team } from '@/types/entities'
import { CURRENT_RULEBOOK, REGLEMENT } from '@/lib/reglement'
import { OFFICIAL_TEAMS_2026, officialLogo } from '@/lib/officialTeams'

export const SEASON_2026_ID = 'season_2026'

// Les 23 équipes officielles (src/lib/officialTeams.ts) ; logos HD officiels dans /public/logos/<code>.png
export const s26TeamId = (short: string) => `t26_${short.toLowerCase()}`

export function buildSeason2026() {
  const season: Season = {
    id: SEASON_2026_ID, name: 'Saison 2026-2027', start_date: '2026-08-22', status: 'active', is_active: true,
    league_phase_rounds: 0, cup_rounds: 10, gold_size: 12, rulebook_version: CURRENT_RULEBOOK,
  }
  const teams: Team[] = []
  // une équipe = une saison : les équipes qui reviennent de 2025-2026 ont leur propre fiche 2026-2027 (mêmes logos) ;
  // le lien avec leur fiche 2025-2026 est proposé dans l'admin et n'existe qu'après approbation
  for (const t of OFFICIAL_TEAMS_2026) {
    teams.push({ id: s26TeamId(t.short), name: t.name, short_name: t.short, company: t.name, ...officialLogo(t), primary_color: t.c1, secondary_color: t.c2, status: 'active' })
  }
  // Phase de sélection : un seul groupe, un seul classement. Le tirage (Admin → Tirage & divisions) crée les matchs ;
  // Gold Cup et Silver Cup sont constituées ensuite à partir du classement.
  const competitions: Competition[] = [
    { id: 'comp_2026_selection', season_id: season.id, name: 'Pré-saison', phase: 'league_phase', format: 'swiss', status: 'draft', team_ids: teams.map((t) => t.id).sort(), half_duration_min: REGLEMENT.duration.halfMin, foul_alert_threshold: 5, color: '#F85A00', order: 1, description: 'Un seul groupe · matchs tirés au sort' },
  ]
  return { season, teams, competitions }
}
