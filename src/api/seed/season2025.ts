// Saison 2025-2026 — données RÉELLES importées du tracker Excel de la ligue
// (MBL_26_Game_stats_tracker_27_03_26.xlsx) : 16 équipes, championnat en matchs aller simples, 120 matchs.
// Le fichier Excel ne contient ni dates, ni minutes, ni postes : les dates sont estimées (une journée par semaine),
// les postes sont déduits des statistiques (gardien = joueur avec des arrêts) et modifiables dans l'admin.
import type { Competition, Lineup, Match, MatchEvent, Player, Season, Team } from '@/types/entities'
import { companyLogoSvg, teamLogoSvg } from '@/lib/logos'
import { addDays } from '@/lib/schedule'
import { S25_MATCHES, S25_PLAYERS, S25_TEAMS } from './season2025.data'

export const SEASON_2025_ID = 'season_2025'
export const S25_FIRST_ROUND = '2025-10-04'
const SLOTS = ['18:00', '18:45', '19:30', '20:15']

export const s25TeamId = (i: number) => `t25_${S25_TEAMS[i][1].toLowerCase()}`
export const s25PlayerId = (i: number) => `p25_${i}`

export interface Season2025 {
  season: Season
  competition: Competition
  teams: Team[]
  players: Player[]
  matches: Match[]
  events: MatchEvent[]
  lineups: Lineup[]
}

export function buildSeason2025(): Season2025 {
  const season: Season = {
    id: SEASON_2025_ID, name: 'Saison 2025-2026', start_date: '2025-09-27', end_date: '2026-03-27',
    status: 'closed', is_active: true, league_phase_rounds: 15, cup_rounds: 0, gold_size: 16, closed_at: '2026-03-27T20:00:00',
  }
  const teams: Team[] = S25_TEAMS.map(([name, short, c1, c2], i) => ({
    id: s25TeamId(i), name, short_name: short, company: name, logo_url: teamLogoSvg(short, c1, c2, i), company_logo_url: companyLogoSvg(name, c1),
    primary_color: c1, secondary_color: c2, status: 'active',
  }))
  const competition: Competition = {
    id: 'comp_2025_league', season_id: season.id, name: 'Championnat', phase: 'league_phase', format: 'league', status: 'finished',
    team_ids: teams.map((t) => t.id), rounds: Array.from({ length: 15 }, (_, i) => i + 1), half_duration_min: 15, foul_alert_threshold: 5,
    color: '#F85A00', order: 1, description: '16 équipes · matchs aller · 15 journées',
  }
  const players: Player[] = S25_PLAYERS.map(([team, first, last, position], i) => ({
    id: s25PlayerId(i), first_name: first, last_name: last, position, team_id: s25TeamId(team), status: 'active', season_ids: [season.id], rookie: false,
  }))

  const matches: Match[] = [], events: MatchEvent[] = [], lineups: Lineup[] = []
  let ev = 0
  const perRound = new Map<number, number>()
  for (const [n, round, h, a, hs, as, evs] of S25_MATCHES) {
    const slot = perRound.get(round) ?? 0
    perRound.set(round, slot + 1)
    const played = hs != null && as != null
    const m: Match = {
      id: `m25_${n}`, season_id: season.id, competition_id: competition.id, round, stage: 'league_phase',
      date: `${addDays(S25_FIRST_ROUND, (round - 1) * 7)}T${SLOTS[Math.floor(slot / 2) % SLOTS.length]}:00`,
      pitch: slot % 2 === 0 ? 'Terrain 1' : 'Terrain 2', venue_id: 'venue_main',
      home_team_id: s25TeamId(h), away_team_id: s25TeamId(a),
      home_score: played ? hs : null, away_score: played ? as : null,
      status: played ? 'finished' : 'cancelled', published: true, validated: played, source: 'manual', half_duration_min: 15,
    }
    matches.push(m)
    if (!played) continue
    const mk = (e: Omit<MatchEvent, 'id' | 'match_id'>): MatchEvent => ({ id: `ev25_${(++ev).toString(36)}`, match_id: m.id, ...e })
    for (const side of [0, 1] as const) {
      const teamId = side === 0 ? m.home_team_id : m.away_team_id
      const oppId = side === 0 ? m.away_team_id : m.home_team_id
      const mine = evs.filter((e) => e[0] === side)
      const expand = (type: string) => mine.filter((e) => e[1] === type).flatMap(([, , p, c]) => Array.from({ length: c }, () => p))
      // buts : les passeurs du fichier sont rattachés à des buts d'un autre joueur de la même équipe
      const goals = expand('g').map((p) => ({ scorer: p, assist: -1 }))
      for (const p of expand('a')) {
        const g = goals.find((x) => x.assist < 0 && x.scorer !== p) ?? goals.find((x) => x.assist < 0)
        if (g) g.assist = p
      }
      for (const g of goals) events.push(mk({ team_id: teamId, type: 'goal', goal_kind: 'normal', player_id: s25PlayerId(g.scorer), related_player_id: g.assist >= 0 && g.assist !== g.scorer ? s25PlayerId(g.assist) : undefined }))
      for (const [, , , c] of mine.filter((e) => e[1] === 'og')) for (let k = 0; k < c; k++) events.push(mk({ team_id: oppId, type: 'own_goal' }))
      const savesBy = new Map<number, number>()
      for (const p of expand('s')) { savesBy.set(p, (savesBy.get(p) ?? 0) + 1); events.push(mk({ team_id: teamId, type: 'save', player_id: s25PlayerId(p) })) }
      for (const p of expand('y')) events.push(mk({ team_id: teamId, type: 'yellow_card', player_id: s25PlayerId(p) }))
      for (const p of expand('r')) events.push(mk({ team_id: teamId, type: 'red_card', player_id: s25PlayerId(p) }))
      // composition : joueurs ayant une action sur le match (le fichier ne liste pas les présents)
      const gk = [...savesBy.entries()].sort((x, y) => y[1] - x[1])[0]?.[0]
      const involved = [...new Set(mine.filter((e) => e[2] >= 0).map((e) => e[2]))]
      lineups.push({
        id: `lu25_${n}_${side}`, match_id: m.id, team_id: teamId, present_ids: involved.map(s25PlayerId), starter_ids: involved.map(s25PlayerId),
        substitute_ids: [], goalkeeper_id: gk != null ? s25PlayerId(gk) : undefined, validated: true, validated_by: 'Import Excel',
      })
    }
  }
  return { season, competition, teams, players, matches, events, lineups }
}
