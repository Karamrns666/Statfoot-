import { describe, expect, it } from 'vitest'
import { generateLeagueData } from './generate'
import { competitionStandings, computePlayerXP, generalStandings, type LeagueData } from '@/lib/stats'
import { scoreFromEvents } from '@/lib/matchEngine'

describe('données de la ligue', () => {
  const db = generateLeagueData(new Date('2026-11-04T19:00:00'))
  const L: LeagueData = { seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings: db.Settings[0] }
  const s25 = db.Season.find((s) => s.id === 'season_2025')!
  const s26 = db.Season.find((s) => s.id === 'season_2026')!

  it('aucune donnée fictive : 2 saisons, pas de mention « démo », contacts officiels', () => {
    expect(db.Season.map((s) => s.name).sort()).toEqual(['Saison 2025-2026', 'Saison 2026-2027'])
    expect(JSON.stringify(db)).not.toMatch(/démo|exemple\.ma|contact@mbl\.ma/i)
    expect(db.Settings[0].contact_email).toBe('contact@ardentia.ma')
  })
  it('2026-2027 en cours : Gold Cup et Silver Cup, 10 équipes chacune, 20 équipes distinctes', () => {
    expect(s26.is_active).toBe(true)
    const comps = db.Competition.filter((c) => c.season_id === s26.id)
    expect(comps.map((c) => [c.name, c.team_ids?.length, c.default_pitch])).toEqual([['Gold Cup', 10, 'Terrain 1'], ['Silver Cup', 10, 'Terrain 2']])
    expect(new Set(comps.flatMap((c) => c.team_ids)).size).toBe(20)
    for (const tid of comps.flatMap((c) => c.team_ids ?? [])) expect(db.Team.some((t) => t.id === tid)).toBe(true)
    expect(generalStandings(L, s26.id)).toHaveLength(20)
  })
  it('2025-2026 en archive : classement identique au fichier Excel', () => {
    expect(s25.is_active).toBe(false)
    const comp = db.Competition.find((c) => c.season_id === s25.id)!
    expect(comp.team_ids).toHaveLength(16)
    expect(db.Match.filter((m) => m.season_id === s25.id)).toHaveLength(120)
    const table = competitionStandings(L, comp.id)
    const name = (id: string) => db.Team.find((t) => t.id === id)!.name
    expect(table.slice(0, 3).map((r) => [name(r.team_id), r.played, r.points])).toEqual([['Mondial Services', 15, 41], ['Distra', 15, 34], ['Dell', 13, 29]])
    expect(table.at(-1)!.points).toBe(1)
    const goals = db.MatchEvent.filter((e) => e.type === 'goal' && e.player_id && db.Player.find((p) => p.id === e.player_id)?.last_name === 'Orch').length
    expect(goals).toBe(56)
  })
  it('scores = somme des buts saisis, XP calculé', () => {
    for (const m of db.Match.filter((x) => x.status === 'finished')) {
      const s = scoreFromEvents(m, db.MatchEvent.filter((e) => e.match_id === m.id))
      expect([s.home, s.away]).toEqual([m.home_score, m.away_score])
    }
    expect([...computePlayerXP(L, { seasonId: s25.id }).values()].some((p) => p.xp > 3000)).toBe(true)
  })
})
