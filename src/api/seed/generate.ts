// Données de la plateforme (aucune donnée fictive) :
//  • Saison 2025-2026 — archive RÉELLE importée du tracker Excel de la ligue (./season2025.ts) ;
//  • Saison 2026-2027 — saison en cours : 20 entreprises, Gold Cup et Silver Cup (./season2026.ts).
//    Matchs et effectifs : import du fichier de la ligue ou saisie dans l'admin.
// Pur : renvoie { Entité: lignes[] }.
import type { AdminUser, Award, EntityMap, EntityName, Settings, Venue, XPRule } from '@/types/entities'
import { DEFAULT_COMPETITION_NAMES } from '@/lib/competitionNames'
import { computeAwards, computePlayerXP, teamRankBefore, XP_DEFAULTS, XP_KEYS, type LeagueData } from '@/lib/stats'
import { buildRulebooks } from './rulebook'
import { LEAGUE } from '@/config/league'
import { buildSeason2025 } from './season2025'
import { buildSeason2026 } from './season2026'

type DB = { [N in EntityName]: EntityMap[N][] }

let c = 0
const id = (p: string) => `${p}_${(++c).toString(36)}`

export function generateLeagueData(now = new Date()): DB {
  c = 0
  const db = Object.fromEntries((['Season', 'Competition', 'Division', 'Group', 'Venue', 'Team', 'Player', 'Match', 'MatchEvent', 'Lineup', 'LiveState', 'MatchTeamStats', 'XPRule', 'Suspension', 'MonthlyAward', 'Award', 'Draw', 'Media', 'MotmVote', 'TeamOfWeek', 'Settings', 'Page', 'AuditLog', 'AdminUser', 'Rulebook', 'Club'] as EntityName[]).map((n) => [n, []])) as unknown as DB

  const settings: Settings = {
    id: 'settings', league_name: LEAGUE.name, short_name: LEAGUE.shortName, tagline: LEAGUE.tagline,
    organizer: LEAGUE.organizer.name, logo_url: LEAGUE.logo, contact_email: LEAGUE.organizer.email, contact_phone: LEAGUE.organizer.phone, address: LEAGUE.organizer.address,
    website: LEAGUE.organizer.website, socials: { instagram: LEAGUE.instagram, organizer_instagram: LEAGUE.organizer.instagram, linkedin: LEAGUE.organizer.linkedin },
    motm_vote_minutes_after: 15,
  }
  db.Settings.push(settings)
  db.Rulebook.push(...buildRulebooks())
  db.Venue.push({ id: 'venue_main', name: 'Complexe sportif MBL', address: 'Casablanca', pitches: ['Terrain 1', 'Terrain 2'] } as Venue)
  db.Division.push({ id: 'div_gold', name: DEFAULT_COMPETITION_NAMES.gold, level: 1, color: '#E8B931' }, { id: 'div_silver', name: DEFAULT_COMPETITION_NAMES.silver, level: 2, color: '#C9D3DD' })

  const league = (): LeagueData => ({ seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings, divisions: db.Division, groups: db.Group })

  // ---- saisons ------------------------------------------------------------------
  const s25 = buildSeason2025()
  const s26 = buildSeason2026()
  s25.season.is_active = false
  db.Season.push(s26.season, s25.season)
  for (const s of [s25.season, s26.season]) for (const key of XP_KEYS) db.XPRule.push({ id: id('xp'), season_id: s.id, key, value: XP_DEFAULTS[key] } as XPRule)

  // 2025-2026 : rang adverse figé journée par journée, homme du match, palmarès publié
  db.Team.push(...s25.teams.map((t) => ({ ...t, season_id: s25.season.id, club_id: `club_${t.id}` }))); db.Player.push(...s25.players); db.Competition.push(s25.competition)
  db.Match.push(...s25.matches); db.MatchEvent.push(...s25.events); db.Lineup.push(...s25.lineups)
  for (const m of [...s25.matches].filter((x) => x.status === 'finished').sort((a, b) => (a.round ?? 0) - (b.round ?? 0))) {
    m.opponent_rank_snapshot = { home_rank: teamRankBefore(league(), m, m.home_team_id), away_rank: teamRankBefore(league(), m, m.away_team_id) }
    const evs = s25.events.filter((e) => e.match_id === m.id)
    const x = computePlayerXP({ ...league(), matches: [m], events: evs, suspensions: [], monthlyAwards: [] }, { seasonId: s25.season.id })
    m.motm_player_id = [...x.values()].filter((p) => p.matches > 0).sort((a, b) => b.xp - a.xp)[0]?.player_id
    m.validated_at = `${m.date!.slice(0, 10)}T21:00:00`; m.validated_by = 'Import Excel'
  }
  for (const a of computeAwards(league(), { seasonId: s25.season.id, phase: 'all' })) {
    db.Award.push({ id: id('aw'), season_id: s25.season.id, scope: 'season', category: a.category, player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded, status: 'published', locked: true } as Award)
  }

  // 2026-2027 : équipes inscrites et phase de sélection (un seul groupe)
  db.Team.push(...s26.teams.map((t) => ({ ...t, season_id: s26.season.id, club_id: `club_${t.id}` }))); db.Competition.push(...s26.competitions)
  // un club permanent par équipe ; les liens entre saisons sont approuvés par l'admin (aucun lien automatique)
  db.Club.push(...db.Team.map((t) => ({ id: t.club_id!, name: t.name, logo_url: t.logo_url })))

  // ---- administrateurs (à remplacer par les vrais comptes au lancement) -----------
  const ts = new Date(now.getTime() - 30 * 86400000).toISOString()
  db.AdminUser.push(
    { id: 'user_super', email: 'superadmin@mbl.ma', full_name: 'Super Admin', role: 'super_admin', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
    { id: 'user_admin', email: 'admin@mbl.ma', full_name: 'Admin Ligue', role: 'admin', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
    { id: 'user_operator', email: 'operateur@mbl.ma', full_name: 'Opérateur de saisie', role: 'operator', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
  )

  const stamp = new Date(now.getTime() - 60 * 86400000).toISOString()
  for (const rows of Object.values(db) as { created_date?: string; updated_date?: string }[][]) for (const r of rows) { r.created_date ??= stamp; r.updated_date ??= stamp }
  return db
}

/** @deprecated nom historique */
export const generateDemoData = generateLeagueData
