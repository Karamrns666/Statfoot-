import { describe, expect, it } from 'vitest'
import { makeLeague, matches } from './__fixtures__/league'
import {
  bestAttack, bestDefense, bestTeam, competitionStandings, computeAwards, computePlayerXP, computeTeamStats, generalStandings,
  headToHead, kpis, race, raceWithEvolution, teamRankBefore, xpConfig, opponentMultiplier, matchXPLines, XP_DEFAULTS, teamOfRound,
} from './stats'
import type { Match } from '@/types/entities'

const data = makeLeague()
const X = computePlayerXP(data, { seasonId: 's1' })
const P = (id: string) => X.get(id)!

describe('classement', () => {
  it('MJ V N D BP BC DIFF PTS et ordre', () => {
    const t = competitionStandings(data, 'lp')
    expect(t.map((r) => r.team_id)).toEqual(['A', 'B', 'D', 'C'])
    expect(t[0]).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 2, gd: 1, points: 4 })
    expect(t.find((r) => r.team_id === 'A')!.form).toEqual(['W', 'D', 'L'])
  })
  it('classement avant une journée', () => {
    expect(competitionStandings(data, 'lp', { beforeRound: 2 }).map((r) => r.team_id)).toEqual(['A', 'C', 'D', 'B'])
    expect(competitionStandings(data, 'lp', { beforeRound: 3 }).map((r) => r.team_id)).toEqual(['A', 'B', 'C', 'D'])
  })
  it('ignore les matchs non terminés', () => {
    const d = makeLeague({ matches: [...matches, { ...matches[0], id: 'L', status: 'live', home_score: 9, away_score: 0 }] })
    expect(competitionStandings(d, 'lp')[0].gf).toBe(3)
  })
  it('H2H', () => expect(headToHead(matches, 'A', 'B')).toMatchObject({ aWins: 1, aGoals: 2, bGoals: 0 }))
})

describe('multiplicateur adversaire', () => {
  it('J1 : pas de classement → ×1', () => {
    expect(teamRankBefore(data, matches[0], 'B')).toBeNull()
    expect(opponentMultiplier(null, XP_DEFAULTS)).toBe(1)
  })
  it('rang avant la journée → 1-3 ×2, 4-6 ×1.5, 7+ ×1', () => {
    expect(teamRankBefore(data, matches[2], 'C')).toBe(2)
    expect(teamRankBefore(data, matches[3], 'B')).toBe(4)
    expect(opponentMultiplier(2, XP_DEFAULTS)).toBe(2)
    expect(opponentMultiplier(5, XP_DEFAULTS)).toBe(1.5)
    expect(opponentMultiplier(9, XP_DEFAULTS)).toBe(1)
  })
  it('un rang figé à la clôture fait foi', () => {
    const m: Match = { ...matches[2], validated: true, opponent_rank_snapshot: { home_rank: 1, away_rank: 7 } }
    expect(teamRankBefore(data, m, 'C')).toBe(7)
  })
  it('cup sans match joué → ordre d’entrée dans la cup', () => {
    const d = makeLeague({ competitions: [...makeLeague().competitions, { id: 'gold', season_id: 's1', name: 'Gold', phase: 'gold', team_ids: ['D', 'C', 'B', 'A'] }] })
    const m: Match = { id: 'G1', season_id: 's1', competition_id: 'gold', round: 6, stage: 'cup', home_team_id: 'A', away_team_id: 'D', status: 'scheduled' }
    expect(teamRankBefore(d, m, 'D')).toBe(1)
  })
})

describe('XP — barème MBL', () => {
  it('joueur de champ : buts/passes × multiplicateur, victoire/défaite', () => {
    // J1 : +50 victoire, 2 buts ×1 = 100 · J2 : passe 20×2 (C 2e) = 40 · J3 : défaite −50
    expect(P('A_FWD').xp).toBe(140)
    // J1 : 50 + passe 20 · J2 : but 50×2 = 100 · J3 : −50
    expect(P('A_MID').xp).toBe(120)
    // J1 passe 20 · J2 but ×1.5 (B 4e) = 75, défaite −50 · J3 but ×2 (A 1er) = 100, victoire 50
    expect(P('D_FWD').xp).toBe(195)
  })
  it('cartons : jaune −20, rouge direct −50', () => {
    // J1 jaune −20 défaite −50 · J2 victoire 50 · J3 but ×2 (C 3e) = 100
    expect(P('B_DEF').xp).toBe(80)
    // pas de compo D en M2 → n'a pas joué J1 · J2 défaite −50, rouge −50 · J3 victoire 50
    expect(P('D_DEF').xp).toBe(-50)
    expect(P('D_DEF').matches).toBe(2)
  })
  it('gardien : clean sheet × importance, arrêts, buts encaissés (CSC compris)', () => {
    // J1 victoire 50, CS 50, 2 arrêts 10 · J2 1 encaissé (CSC) −10 · J3 défaite −50, 1 encaissé −10
    expect(P('A_GK').xp).toBe(40)
    expect(P('A_GK')).toMatchObject({ clean_sheets: 1, saves: 2, conceded: 2, gk_matches: 3 })
    // J2 défaite −50, 3 encaissés −30 · J3 victoire 50, CS 50
    expect(P('D_GK').xp).toBe(20)
  })
  it('importance du match appliquée au clean sheet', () => {
    const d = makeLeague({ xpRules: [{ id: 'i', season_id: 's1', key: 'importance_league_phase', value: 1.5 }] })
    expect(computePlayerXP(d, { seasonId: 's1' }).get('D_GK')!.xp).toBe(45)
  })
  it('barème éditable', () => {
    const d = makeLeague({ xpRules: [{ id: 'g', season_id: 's1', key: 'goal', value: 10 }] })
    expect(computePlayerXP(d, { seasonId: 's1' }).get('A_FWD')!.xp).toBe(140 - 100 + 20)
  })
  it('2 jaunes même match = −40 au total (pas 2 × −20)', () => {
    const extra = [
      { id: 'y1', match_id: 'M1', team_id: 'B', type: 'yellow_card' as const, player_id: 'B_MID', minute: 3 },
      { id: 'y2', match_id: 'M1', team_id: 'B', type: 'second_yellow' as const, player_id: 'B_MID', minute: 9 },
    ]
    const d = makeLeague({ events: [...makeLeague().events, ...extra] })
    const base = P('B_MID').xp
    expect(computePlayerXP(d, { seasonId: 's1' }).get('B_MID')!.xp).toBe(base - 40)
  })
  it('suspension : −50 par match', () => {
    const d = makeLeague({ suspensions: [{ id: 's', season_id: 's1', player_id: 'D_DEF', origin_match_id: 'M4', matches: 2 }] })
    expect(computePlayerXP(d, { seasonId: 's1' }).get('D_DEF')!.xp).toBe(-150)
  })
  it('joueur / équipe / but du mois', () => {
    const d = makeLeague({ monthlyAwards: [
      { id: 'a', season_id: 's1', month: '2025-09', type: 'player', player_id: 'A_FWD' },
      { id: 'b', season_id: 's1', month: '2025-09', type: 'goal', event_id: 'E1' },
      { id: 'c', season_id: 's1', month: '2025-09', type: 'team', team_id: 'D' },
    ] })
    const x = computePlayerXP(d, { seasonId: 's1' })
    expect(x.get('A_FWD')!.xp).toBe(140 + 100 + 50)
    expect(x.get('D_GK')!.xp).toBe(20 + 50)
  })
  it('un match non clôturé ne compte pas ; la réouverture retire l’XP', () => {
    const d = makeLeague({ matches: matches.map((m) => (m.id === 'M1' ? { ...m, status: 'live' as const } : m)) })
    expect(computePlayerXP(d, { seasonId: 's1' }).get('A_FWD')!.xp).toBe(140 - 150)
  })
  it('XP en direct d’un match = même calcul', () => {
    const lines = matchXPLines(data, matches[0], xpConfig([], 's1'), { score: { home: 2, away: 0 } })
    expect(lines.filter((l) => l.player_id === 'A_FWD').reduce((a, l) => a + l.points, 0)).toBe(150)
  })
})

describe('trophées', () => {
  it("Soulier d'or : buts, puis passes, puis moins de matchs (ex-aequo partagés)", () => {
    const r = race(data, [...X.values()], 'top_scorer', 's1')
    expect(r[0].item.player_id).toBe('B_FWD')
    expect(r.slice(1, 4).map((x) => x.rank)).toEqual([2, 2, 4])
    expect(r[3].item.player_id).toBe('C_FWD')
  })
  it('Meilleur passeur : passes puis buts', () => {
    const r = race(data, [...X.values()], 'top_assist', 's1')
    expect(r[0].item.player_id).toBe('D_MID')
    expect(r[1].item.player_id).toBe('C_DEF')
  })
  it("Ballon d'or = joueurs de champ ; Gant d'or = gardiens", () => {
    const b = race(data, [...X.values()], 'ballon_or', 's1')
    expect(b.every((r) => r.item.position !== 'GK')).toBe(true)
    // B_FWD : J1 défaite −50 · J2 2 buts ×2 (D 3e) = 200 + victoire 50 · J3 but ×2 + passe ×2 (C 3e) = 140
    expect(b[0].item).toMatchObject({ player_id: 'B_FWD', xp: 340 })
    expect(race(data, [...X.values()], 'golden_glove', 's1')[0].item.player_id).toBe('A_GK')
  })
  it('minimum de matchs (barème)', () => {
    const d = makeLeague({ xpRules: [{ id: 'm', season_id: 's1', key: 'min_matches_awards', value: 3 }] })
    const b = race(d, [...computePlayerXP(d, { seasonId: 's1' }).values()], 'ballon_or', 's1')
    expect(b.find((r) => r.item.player_id === 'D_FWD')).toBeDefined()
    expect(b.find((r) => r.item.player_id === 'D_DEF')).toBeUndefined()
  })
  it('évolution du rang ▲▼', () => {
    const b = raceWithEvolution(data, { seasonId: 's1' }, 'top_scorer').find((x) => x.item.player_id === 'B_FWD')!
    expect(b).toMatchObject({ rank: 1, previousRank: 2, delta: 1 })
  })
  it('meilleure équipe = 1er du classement général, jamais à 0 pt', () => {
    expect(bestTeam(data, { seasonId: 's1' })).toMatchObject({ team_id: 'A' })
    const none = makeLeague({ matches: matches.map((m) => ({ ...m, status: 'scheduled' as const })) })
    expect(bestTeam(none, { seasonId: 's1' })).toBeNull()
    expect(computeAwards(none, { seasonId: 's1' }).find((a) => a.category === 'best_team')!.not_awarded).toBe(true)
  })
  it('classement général : Gold puis Silver', () => {
    const d = makeLeague({ competitions: [...makeLeague().competitions,
      { id: 'g', season_id: 's1', name: 'Gold', phase: 'gold', team_ids: ['A', 'B'] }, { id: 's', season_id: 's1', name: 'Silver', phase: 'silver', team_ids: ['C', 'D'] }],
    matches: [...matches, { id: 'S1', season_id: 's1', competition_id: 's', round: 6, stage: 'cup', home_team_id: 'C', away_team_id: 'D', home_score: 5, away_score: 0, status: 'finished' }] })
    expect(generalStandings(d, 's1').map((r) => r.team_id)).toEqual(['A', 'B', 'C', 'D'])
  })
  it('meilleure défense / attaque', () => {
    const ts = [...computeTeamStats(data, { seasonId: 's1' }).values()]
    expect(bestDefense(ts)[0].team_id).toBe('A')
    expect(bestAttack(ts)[0].team_id).toBe('B')
  })
  it('pas de trophée « Meilleur jeune »', () => {
    expect(computeAwards(data, { seasonId: 's1' }).map((a) => a.category as string)).not.toContain('best_young')
  })
  it('KPIs : passes comptées', () => {
    expect(kpis(data, { seasonId: 's1' })).toMatchObject({ goals: 15, assists: 9, matches: 6 })
  })
  it('équipe type de la journée', () => {
    const t = teamOfRound(data, 's1', 1)
    expect(t).toHaveLength(6)
    expect(t[0].position).toBe('GK')
  })
})
