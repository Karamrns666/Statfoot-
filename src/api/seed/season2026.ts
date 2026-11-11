// Saison 2026-2027 — 20 entreprises inscrites, d'abord une phase de sélection (un seul groupe), puis Gold Cup / Silver Cup.
// La répartition cup ci-dessous ne sert qu'à l'ordre d'affichage initial : les divisions sont décidées après la sélection.
// Les matchs et les effectifs sont importés depuis le fichier de la ligue (scripts/import_excel_*.py) ou saisis dans l'admin.
// Les équipes déjà présentes en 2025-2026 réutilisent la même fiche (historique continu).
import type { Competition, Season, Team } from '@/types/entities'
import { CURRENT_RULEBOOK, REGLEMENT } from '@/lib/reglement'
import { teamLogoSvg } from '@/lib/logos'

export const SEASON_2026_ID = 'season_2026'

/** [nom, code, couleur principale, couleur sombre, cup] — `reuse` = code de la fiche 2025-2026 */
const NEW_TEAMS: { name: string; short: string; c1: string; c2: string; cup: 'gold' | 'silver'; reuse?: string }[] = [
  { name: 'Attijariwafa bank', short: 'ATW', c1: '#F39200', c2: '#2A1503', cup: 'gold' },
  { name: 'Pharmaprom', short: 'PHP', c1: '#1A9E5C', c2: '#06241A', cup: 'gold' },
  { name: 'Midea', short: 'MID', c1: '#0092D7', c2: '#04223A', cup: 'gold' },
  { name: 'JTI', short: 'JTI', c1: '#1F6FB2', c2: '#081B33', cup: 'gold' },
  { name: 'Simulation FC', short: 'SIM', c1: '#8A93A6', c2: '#161A22', cup: 'gold' },
  { name: 'Cobco', short: 'COB', c1: '#0057A8', c2: '#06183A', cup: 'gold' },
  { name: 'Atelier Vert Casa', short: 'AVC', c1: '#4A7729', c2: '#0E1A08', cup: 'gold', reuse: 'AVC' },
  { name: 'Canpack 1', short: 'CP1', c1: '#E30613', c2: '#2A0406', cup: 'gold' },
  { name: 'BMCI', short: 'BMC', c1: '#00915A', c2: '#05241A', cup: 'gold' },
  { name: 'Mega Post Tension', short: 'MPT', c1: '#1E90FF', c2: '#0A1E33', cup: 'gold', reuse: 'MPT' },
  { name: 'Crédit Agricole', short: 'CAM', c1: '#00936B', c2: '#04241B', cup: 'silver' },
  { name: 'Arrow', short: 'ARW', c1: '#D9DDE2', c2: '#1A1D21', cup: 'silver', reuse: 'ARW' },
  { name: 'CAC', short: 'CAC', c1: '#2E5072', c2: '#0A1724', cup: 'silver', reuse: 'CAC' },
  { name: 'Michoc', short: 'MIC', c1: '#F7B500', c2: '#2A1F03', cup: 'silver' },
  { name: 'L’Heure Joyeuse', short: 'LHJ', c1: '#E2007A', c2: '#2A0418', cup: 'silver' },
  { name: 'Canpack 2', short: 'CP2', c1: '#B0000C', c2: '#240305', cup: 'silver' },
  { name: 'Wafasalaf', short: 'WAF', c1: '#00A0B0', c2: '#04262A', cup: 'silver', reuse: 'WAF' },
  { name: 'Distra', short: 'DST', c1: '#8CC63F', c2: '#13240A', cup: 'silver', reuse: 'DST' },
  { name: 'Atelier Vert Rabat', short: 'AVR', c1: '#4A7729', c2: '#0E1A08', cup: 'silver', reuse: 'AVR' },
  { name: 'Marjane Market', short: 'MJM', c1: '#0067B1', c2: '#051B33', cup: 'silver' },
]

export const s26TeamId = (short: string) => `t26_${short.toLowerCase()}`

export function buildSeason2026() {
  const season: Season = {
    id: SEASON_2026_ID, name: 'Saison 2026-2027', start_date: '2026-08-22', status: 'active', is_active: true,
    league_phase_rounds: 0, cup_rounds: 10, gold_size: 10, rulebook_version: CURRENT_RULEBOOK,
  }
  const teams: Team[] = []
  // une équipe = une saison : les équipes qui reviennent de 2025-2026 ont leur propre fiche 2026-2027 (mêmes logos) ;
  // le lien avec leur fiche 2025-2026 est proposé dans l'admin et n'existe qu'après approbation
  const ids = (cup: 'gold' | 'silver') => NEW_TEAMS.filter((t) => t.cup === cup).map((t) => s26TeamId(t.short))
  NEW_TEAMS.forEach((t, i) => {
    const logo = t.reuse ? { logo_url: `/logos/${t.reuse.toLowerCase()}.png`, company_logo_url: `/logos/${t.reuse.toLowerCase()}-full.png` } : { logo_url: teamLogoSvg(t.short, t.c1, t.c2, i) }
    teams.push({ id: s26TeamId(t.short), name: t.name, short_name: t.short, company: t.name, ...logo, primary_color: t.c1, secondary_color: t.c2, status: 'active' })
  })
  // Phase de sélection : un seul groupe, un seul classement. Le tirage (Admin → Tirage & divisions) crée les matchs ;
  // Gold Cup et Silver Cup sont constituées ensuite à partir du classement.
  const competitions: Competition[] = [
    { id: 'comp_2026_selection', season_id: season.id, name: 'Phase de sélection', phase: 'league_phase', format: 'swiss', status: 'draft', team_ids: [...ids('gold'), ...ids('silver')].sort(), half_duration_min: REGLEMENT.duration.halfMin, foul_alert_threshold: 5, color: '#F85A00', order: 1, description: 'Un seul groupe · matchs tirés au sort' },
  ]
  return { season, teams, competitions }
}
