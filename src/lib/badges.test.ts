import { describe, expect, it } from 'vitest'
import { generateDemoData } from '@/api/seed/generate'
import type { LeagueData } from './stats'
import { BADGES, challengeResult, decisiveStreak, playerBadges, playerMatchLog } from './badges'

describe('badges et défis', () => {
  const db = generateDemoData(new Date('2026-11-02T19:00:00'))
  const L: LeagueData = { seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings: db.Settings[0] }
  const orch = db.Player.find((p) => p.last_name === 'Orch')!
  const log = playerMatchLog(L, orch.id, 'season_2025')
  it('journal : 56 buts répartis sur ses matchs, notes entre 3 et 10', () => {
    expect(log.reduce((a, l) => a + l.goals, 0)).toBe(56)
    expect(log.every((l) => l.rating >= 3 && l.rating <= 10)).toBe(true)
  })
  it('badges débloqués avec la journée de déblocage', () => {
    const bs = playerBadges(log)
    expect(bs).toHaveLength(BADGES.filter((b) => !b.keeperOnly).length)
    const machine = bs.find((b) => b.def.id === 'goal_machine')!
    expect(machine.unlocked).toBe(true)
    expect(machine.unlocked_round).toBeGreaterThan(0)
    expect(bs.find((b) => b.def.id === 'first_goal')!.unlocked_round).toBe(log.find((l) => l.goals > 0)!.round)
  })
  it('défis et série', () => {
    const r = challengeResult(log, log.length - 1)!
    expect(r.items).toHaveLength(3)
    expect(r.done).toBeGreaterThanOrEqual(0)
    const s = decisiveStreak(log)
    expect(s.record).toBeGreaterThanOrEqual(s.current)
  })
})
