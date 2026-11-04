// Saison 2026-2027 — structure officielle : 20 entreprises, Gold Cup (Terrain 1) et Silver Cup (Terrain 2), 10 équipes chacune.
// Les matchs et les effectifs sont importés depuis le fichier de la ligue (scripts/import_excel_*.py) ou saisis dans l'admin.
// Les équipes déjà présentes en 2025-2026 réutilisent la même fiche (historique continu).
import type { Competition, Season, Team } from '@/types/entities'
import { teamLogoSvg } from '@/lib/logos'
import { s25TeamId } from './season2025'

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
    league_phase_rounds: 0, cup_rounds: 10, gold_size: 10,
  }
  const teams: Team[] = []
  const ids = (cup: 'gold' | 'silver') => NEW_TEAMS.filter((t) => t.cup === cup).map((t) => (t.reuse ? s25TeamId(t.reuse) : s26TeamId(t.short)))
  NEW_TEAMS.forEach((t, i) => {
    if (t.reuse) return // fiche existante (2025-2026)
    teams.push({ id: s26TeamId(t.short), name: t.name, short_name: t.short, company: t.name, logo_url: teamLogoSvg(t.short, t.c1, t.c2, i), primary_color: t.c1, secondary_color: t.c2, status: 'active' })
  })
  const competitions: Competition[] = [
    { id: 'comp_2026_gold', season_id: season.id, name: 'Gold Cup', phase: 'gold', format: 'league', status: 'active', team_ids: ids('gold'), default_pitch: 'Terrain 1', half_duration_min: 15, foul_alert_threshold: 5, color: '#E8B931', order: 1, description: '10 équipes · Terrain 1' },
    { id: 'comp_2026_silver', season_id: season.id, name: 'Silver Cup', phase: 'silver', format: 'league', status: 'active', team_ids: ids('silver'), default_pitch: 'Terrain 2', half_duration_min: 15, foul_alert_threshold: 5, color: '#C9D3DD', order: 2, description: '10 équipes · Terrain 2' },
  ]
  return { season, teams, competitions }
}
