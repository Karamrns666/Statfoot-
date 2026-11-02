import { describe, expect, it } from 'vitest'
import { generateDemoData } from './generate'
import { computePlayerXP, competitionStandings, kpis, raceWithEvolution, type LeagueData } from '@/lib/stats'
import { scoreFromEvents } from '@/lib/matchEngine'

describe('seed MBL', () => {
  const db = generateDemoData(new Date('2026-11-02T19:00:00'))
  const L: LeagueData = { seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings: db.Settings[0] }
  const cur = db.Season.find((s) => s.id === 'season_current')!
  const real = db.Season.find((s) => s.id === 'season_2025')!
  it('saison 2025-2026 réelle : 16 équipes, 120 matchs, classement identique au fichier Excel', () => {
    expect(real.is_active).toBe(true)
    const comp = db.Competition.find((c) => c.season_id === real.id)!
    expect(comp.team_ids).toHaveLength(16)
    expect(db.Match.filter((m) => m.season_id === real.id)).toHaveLength(120)
    const table = competitionStandings(L, comp.id)
    const name = (id: string) => db.Team.find((t) => t.id === id)!.name
    expect(table.slice(0, 3).map((r) => [name(r.team_id), r.played, r.points])).toEqual([['Mondial Services', 15, 41], ['Distra', 15, 34], ['Dell', 13, 29]])
    expect(table.at(-1)!.points).toBe(1)
    const goals = db.MatchEvent.filter((e) => e.type === 'goal' && e.player_id && db.Player.find((p) => p.id === e.player_id)?.last_name === 'Orch').length
    expect(goals).toBe(56)
  })
  it('saison de démo : 20 équipes, 240 joueurs, 5 chapeaux, 50 matchs de phase de ligue', () => {
    const lp0 = db.Competition.find((c) => c.season_id === cur.id && c.phase === 'league_phase')!
    expect(lp0.team_ids).toHaveLength(20)
    expect(db.Player.filter((p) => p.season_ids?.includes(cur.id))).toHaveLength(240)
    const lp = db.Competition.find((c) => c.season_id === cur.id && c.phase === 'league_phase')!
    expect(db.Match.filter((m) => m.competition_id === lp.id)).toHaveLength(50)
    expect(db.Draw.find((d) => d.competition_id === lp.id)!.pots).toHaveLength(5)
  })
  it('Gold = top 10, Silver = 10 suivants, J6–J10', () => {
    const gold = db.Competition.find((c) => c.season_id === cur.id && c.phase === 'gold')!
    expect(gold.team_ids).toHaveLength(10)
    expect(db.Match.filter((m) => m.competition_id === gold.id)).toHaveLength(25)
    expect(competitionStandings(L, gold.id)).toHaveLength(10)
  })
  it('scores = somme des buts saisis', () => {
    for (const m of db.Match.filter((x) => x.status === 'finished' || x.status === 'live')) {
      const s = scoreFromEvents(m, db.MatchEvent.filter((e) => e.match_id === m.id))
      expect([s.home, s.away]).toEqual([m.home_score, m.away_score])
    }
  })
  it('1 match en direct, XP calculé, passes > 0', () => {
    expect(db.Match.filter((m) => m.status === 'live')).toHaveLength(1)
    expect(kpis(L, { seasonId: cur.id }).assists).toBeGreaterThan(50)
    const x = [...computePlayerXP(L, { seasonId: cur.id }).values()]
    expect(x.some((p) => p.xp > 300)).toBe(true)
    expect(raceWithEvolution(L, { seasonId: cur.id }, 'ballon_or').some((r) => r.delta !== 0)).toBe(true)
    console.log('Taille JSON (Ko) :', Math.round(JSON.stringify(db).length / 1024))
  })
})
