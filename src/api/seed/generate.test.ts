import { describe, expect, it } from 'vitest'
import { generateDemoData } from './generate'
import { computePlayerStats, kpis, scoreFromEvents, competitionStandings, type LeagueData } from '@/lib/stats'

describe('seed de démonstration', () => {
  const db = generateDemoData(new Date('2026-11-02T12:00:00'))
  const L: LeagueData = { seasons: db.Season, competitions: db.Competition, divisions: db.Division, groups: db.Group, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, settings: db.Settings[0] }
  it('est cohérent : scores = événements', () => {
    for (const m of db.Match.filter((x) => x.status === 'finished' || x.status === 'live')) {
      const s = scoreFromEvents(m, db.MatchEvent.filter((e) => e.match_id === m.id))
      expect([s.home, s.away]).toEqual([m.home_score, m.away_score])
    }
  })
  it('contient 2 saisons, 4 compétitions, 12 équipes, 1 match en direct', () => {
    expect(db.Season).toHaveLength(2)
    expect(db.Competition).toHaveLength(4)
    expect(db.Team).toHaveLength(12)
    expect(db.Match.filter((m) => m.status === 'live')).toHaveLength(1)
    expect(db.Match.filter((m) => m.status === 'postponed')).toHaveLength(1)
  })
  it('passes décisives non nulles et classement complet', () => {
    const cur = db.Season.find((s) => s.is_active)!
    expect(kpis(L, { seasonId: cur.id }).assists).toBeGreaterThan(20)
    const st = [...computePlayerStats(L, { seasonId: cur.id }).values()]
    expect(st.some((s) => s.assists > 2)).toBe(true)
    const gold = db.Competition.find((c) => c.season_id === cur.id && c.name === 'Gold Cup')!
    expect(competitionStandings(L, gold.id)).toHaveLength(6)
  })
  it('palmarès passé publié', () => {
    expect(db.Award.filter((a) => a.status === 'published').length).toBeGreaterThan(10)
    console.log('taille JSON (Ko):', Math.round(JSON.stringify(db).length / 1024))
  })
})
