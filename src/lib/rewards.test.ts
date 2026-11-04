import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import type { LeagueData } from './stats'
import { FORMATIONS, formationXY, periodRewards, seasonMonths, seasonRounds, teamOfWeek } from './rewards'
import { matchesToIcs } from './ics'

describe('équipe type et récompenses', () => {
  const db = generateLeagueData(new Date('2026-11-04T19:00:00'))
  const L: LeagueData = { seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings: db.Settings[0] }
  const sid = 'season_2025'
  it('formations : un emplacement par joueur, gardien en bas', () => {
    for (const [n, f] of Object.entries(FORMATIONS)) {
      const xy = formationXY(f)
      expect(xy).toHaveLength(Number(n))
      expect(xy[0].position).toBe('GK')
      expect(xy[0].y).toBeGreaterThan(xy.at(-1)!.y)
    }
  })
  it('équipe type : 6 joueurs distincts ayant joué la journée, 1 gardien, joueur de la journée = meilleure note', () => {
    expect(seasonRounds(L, sid)).toHaveLength(15)
    const r = teamOfWeek(L, sid, 4, { players: 6 })
    expect(r.slots).toHaveLength(6)
    expect(new Set(r.slots.map((s) => s.player_id)).size).toBe(6)
    expect(r.slots.filter((s) => s.position === 'GK')).toHaveLength(1)
    const roundTeams = new Set(db.Match.filter((m) => m.season_id === sid && m.round === 4).flatMap((m) => [m.home_team_id, m.away_team_id]))
    for (const s of r.slots) expect(roundTeams.has(s.team_id)).toBe(true)
    expect(r.player_of_round!.rating).toBe(Math.max(...r.slots.map((s) => s.rating)))
  })
  it('sélection manuelle prioritaire', () => {
    const auto = teamOfWeek(L, sid, 4, { players: 6 })
    const manual = teamOfWeek(L, sid, 4, { players: 6, override: { id: 'x', season_id: sid, round: 4, slots: [...auto.slots].reverse().map((s) => ({ position: s.position, player_id: s.player_id })) } })
    expect(manual.manual).toBe(true)
    expect(manual.slots[0].player_id).toBe(auto.slots.at(-1)!.player_id)
  })
  it('récompenses : journée, mois, saison', () => {
    const season = periodRewards(L, sid, { type: 'season' })
    expect(season.map((r) => r.key)).toEqual(['best_player', 'top_scorer', 'top_assist', 'best_keeper', 'best_team'])
    expect(season.find((r) => r.key === 'top_scorer')!.value).toBe(56)
    expect(db.Team.find((t) => t.id === season.find((r) => r.key === 'best_team')!.team_id)!.name).toBe('Mondial Services')
    const months = seasonMonths(L, sid)
    expect(months.length).toBeGreaterThan(2)
    expect(periodRewards(L, sid, { type: 'month', month: months[0] }).length).toBeGreaterThan(3)
    expect(periodRewards(L, sid, { type: 'round', round: 1 }).length).toBeGreaterThan(3)
    expect(periodRewards(L, 'season_2026', { type: 'season' })).toEqual([])
  })
  it('export agenda .ics', () => {
    const ms = db.Match.filter((m) => m.season_id === sid).slice(0, 2)
    const ics = matchesToIcs(ms, { team: (id) => db.Team.find((t) => t.id === id), leagueName: 'Morocco Business League' })
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain('DTSTART:2025')
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })
})
