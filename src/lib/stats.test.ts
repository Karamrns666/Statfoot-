import { describe, expect, it } from 'vitest'
import { makeLeague, matches } from './__fixtures__/league'
import {
  bestAttack, bestDefense, bestTeam, collectAssists, competitionStandings, computeAwards, computePlayerStats,
  computeStandings, computeTeamStats, keeperStats, kpis, race, raceWithEvolution, scoreFromEvents, teamOfRound, headToHead,
} from './stats'
import type { Match } from '@/types/entities'

const data = makeLeague()
const stats = computePlayerStats(data, { seasonId: 's1' })
const S = (id: string) => stats.get(id)!

describe('classement', () => {
  it('calcule MJ V N D BP BC DIFF PTS et l’ordre', () => {
    const t = competitionStandings(data, 'c1')
    expect(t.map((r) => r.team_id)).toEqual(['A', 'B', 'D', 'C'])
    expect(t[0]).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 2, gd: 1, points: 4, rank: 1 })
    expect(t[3]).toMatchObject({ team_id: 'C', played: 3, drawn: 3, points: 3, gf: 4, ga: 4 })
  })
  it('forme = 5 derniers, du plus ancien au plus récent', () => {
    const t = competitionStandings(data, 'c1')
    expect(t.find((r) => r.team_id === 'A')!.form).toEqual(['W', 'D', 'L'])
    expect(t.find((r) => r.team_id === 'D')!.form).toEqual(['D', 'L', 'W'])
  })
  it('compte les cartons pour le fair-play', () => {
    const t = competitionStandings(data, 'c1')
    expect(t.find((r) => r.team_id === 'B')!.yellow).toBe(1)
    expect(t.find((r) => r.team_id === 'D')!.red).toBe(1)
  })
  it('points victoire/nul/défaite configurables', () => {
    const t = computeStandings(matches, ['A', 'B', 'C', 'D'], { points_win: 2, points_draw: 1, points_loss: 0 })
    expect(t.find((r) => r.team_id === 'C')!.points).toBe(3)
    expect(t.find((r) => r.team_id === 'A')!.points).toBe(3)
  })
  it('départage par confrontation directe', () => {
    const ms: Match[] = [
      { id: 'x1', season_id: 's', competition_id: 'c', home_team_id: 'X', away_team_id: 'Y', home_score: 1, away_score: 0, status: 'finished' },
      { id: 'x2', season_id: 's', competition_id: 'c', home_team_id: 'Y', away_team_id: 'Z', home_score: 5, away_score: 0, status: 'finished' },
      { id: 'x3', season_id: 's', competition_id: 'c', home_team_id: 'X', away_team_id: 'Z', home_score: 0, away_score: 1, status: 'finished' },
    ]
    // X, Y, Z ont 3 pts. Différence : Y +4, X 0, Z -4.
    expect(computeStandings(ms, ['X', 'Y', 'Z'], {}, [], ['points', 'goal_diff']).map((r) => r.team_id)).toEqual(['Y', 'X', 'Z'])
    // En confrontation directe pure (pts h2h égaux) on retombe sur le mini-classement : Y +4 aussi
    const two: Match[] = [ms[0], { ...ms[1], home_score: 1, away_score: 0 }, { ...ms[2] }, { id: 'x4', season_id: 's', competition_id: 'c', home_team_id: 'W', away_team_id: 'Y', home_score: 9, away_score: 0, status: 'finished' }]
    // X 3 pts, Y 3 pts, Z 3 pts, W 3 pts ; h2h entre X et ... : on vérifie juste que X devant Y (X a battu Y)
    const t = computeStandings(two.slice(0, 1), ['X', 'Y'], {}, [], ['head_to_head'])
    expect(t[0].team_id).toBe('X')
  })
  it('ignore les matchs non terminés', () => {
    const ms = [...matches, { ...matches[0], id: 'live', status: 'live' as const, home_score: 9, away_score: 0 }]
    expect(computeStandings(ms, ['A', 'B', 'C', 'D'], {}).find((r) => r.team_id === 'A')!.gf).toBe(3)
  })
})

describe('événements & passes décisives (correctif assists = 0)', () => {
  it('score recalculé depuis les événements, CSC pour l’adversaire', () => {
    expect(scoreFromEvents(matches[2], data.events.filter((e) => e.match_id === 'M3'))).toEqual({ home: 1, away: 1 })
  })
  it('compte les passes via related_player_id ET via événements assist autonomes, sans doublon', () => {
    const a = collectAssists(data.events)
    expect(a).toHaveLength(9)
    expect(S('A_FWD').assists).toBe(1) // M3 : but avec passeur + événement assist rattaché → 1 seule
    expect(S('D_FWD').assists).toBe(1) // M2 : passe legacy autonome
    expect(S('C_DEF').assists).toBe(2)
    expect(S('D_MID').assists).toBe(2)
  })
  it('les passes apparaissent dans les KPIs', () => {
    expect(kpis(data, { seasonId: 's1'}).assists).toBe(9)
    expect(kpis(data, { seasonId: 's1'}).goals).toBe(15)
  })
})

describe('stats joueurs', () => {
  it('buts (penalty inclus, CSC exclus)', () => {
    expect(S('A_FWD').goals).toBe(2)
    expect(S('A_FWD').penalty_goals).toBe(1)
    expect(S('A_DEF').goals).toBe(0)
    expect(S('A_DEF').own_goals).toBe(1)
    expect(S('B_FWD').goals).toBe(3)
  })
  it('MJ depuis la compo, ou depuis les événements si pas de compo', () => {
    expect(S('A_FWD').played).toBe(3)
    expect(S('D_GK').played).toBe(2) // absent des événements de M2 (pas de compo D)
    expect(S('D_FWD').played).toBe(3)
  })
  it('stats gardiens : clean sheets, arrêts, buts encaissés', () => {
    expect(S('A_GK')).toMatchObject({ gk_matches: 3, clean_sheets: 1, goals_conceded: 2, saves: 2 })
    expect(S('B_GK')).toMatchObject({ gk_matches: 3, clean_sheets: 0, goals_conceded: 5, saves: 3 })
    expect(S('D_GK')).toMatchObject({ gk_matches: 2, clean_sheets: 1, goals_conceded: 3 })
    const k = keeperStats(data, { seasonId: 's1' })
    expect(k).toHaveLength(4)
  })
  it('XP selon les règles par défaut', () => {
    // 3 MJ ×2 + 1 V ×3 + 1 N ×1 + 1 but ×10 + 1 pen ×8 + 1 passe ×6
    expect(S('A_FWD').xp).toBe(34)
    // 3 MJ ×2 + V 3 + N 1 + CS gardien 8 + 2 arrêts − 2 encaissés
    expect(S('A_GK').xp).toBe(18)
    // 3 MJ ×2 + V 3 + N 1 − CSC 3 + CS défenseur 4
    expect(S('A_DEF').xp).toBe(11)
  })
  it('règles XP éditables', () => {
    const d = makeLeague({ xpRules: [{ id: 'g', action: 'goal', points: 1 }] })
    expect(computePlayerStats(d).get('B_FWD')!.xp).toBe(3)
  })
})

describe('courses aux trophées', () => {
  it("Soulier d'or : buts, puis passes, puis moins de matchs, ex-aequo partagés", () => {
    const r = race(data, [...stats.values()], 'top_scorer')
    expect(r[0].item.player_id).toBe('B_FWD')
    expect(r.slice(1, 4).map((x) => x.rank)).toEqual([2, 2, 4])
    expect(r[3].item.player_id).toBe('C_FWD')
  })
  it('Meilleur passeur : passes puis buts', () => {
    const r = race(data, [...stats.values()], 'top_assist')
    expect(r[0].item.player_id).toBe('D_MID') // 2 passes + 1 but devant C_DEF (2 passes, 0 but)
    expect(r[1].item.player_id).toBe('C_DEF')
  })
  it("Ballon d'or exclut les gardiens ; Gant d'or uniquement les gardiens", () => {
    expect(race(data, [...stats.values()], 'ballon_or').every((r) => r.item.position !== 'GK')).toBe(true)
    expect(race(data, [...stats.values()], 'golden_glove').every((r) => r.item.position === 'GK')).toBe(true)
  })
  it('évolution du rang ▲▼ vs journée précédente', () => {
    const r = raceWithEvolution(data, { seasonId: 's1' }, 'top_scorer')
    const b = r.find((x) => x.item.player_id === 'B_FWD')!
    expect(b.rank).toBe(1)
    expect(b.previousRank).toBe(2)
    expect(b.delta).toBe(1)
  })
})

describe('meilleure équipe / défense / attaque', () => {
  it('meilleure équipe = 1er du classement si pas de finale', () => {
    expect(bestTeam(data, { seasonId: 's1' })).toMatchObject({ team_id: 'A', reason: 'leader' })
  })
  it('meilleure équipe = vainqueur de la finale (tirs au but) si jouée', () => {
    const final: Match = { id: 'F', season_id: 's1', competition_id: 'c1', stage: 'final', home_team_id: 'A', away_team_id: 'B', home_score: 1, away_score: 1, penalties: true, home_pens: 3, away_pens: 4, status: 'finished', date: '2025-12-01T19:00:00' }
    expect(bestTeam(makeLeague({ matches: [...matches, final] }), { seasonId: 's1' })).toMatchObject({ team_id: 'B', reason: 'champion' })
  })
  it('jamais une équipe à 0 point', () => {
    const none = makeLeague({ matches: matches.map((m) => ({ ...m, status: 'scheduled' as const })) })
    expect(bestTeam(none, { seasonId: 's1' })).toBeNull()
    const awards = computeAwards(none, { seasonId: 's1' })
    expect(awards.find((a) => a.category === 'best_team')!.not_awarded).toBe(true)
  })
  it('meilleure défense = moins de buts encaissés, attaque = plus de buts marqués', () => {
    const ts = [...computeTeamStats(data, { seasonId: 's1' }).values()]
    expect(bestDefense(ts)[0].team_id).toBe('A')
    expect(bestAttack(ts)[0].team_id).toBe('B')
  })
})

describe('prix par poste et jeune', () => {
  it('meilleur jeune = âge réel < 23 ans au début de saison', () => {
    const a = computeAwards(data, { seasonId: 's1' })
    expect(a.find((x) => x.category === 'best_young')).toMatchObject({ player_id: 'C_MID', not_awarded: false })
  })
  it('« Non attribué » si aucun candidat', () => {
    const a = computeAwards(makeLeague({ settings: { young_max_age: 18 } }), { seasonId: 's1' })
    expect(a.find((x) => x.category === 'best_young')!.not_awarded).toBe(true)
  })
  it('minimum de matchs joués appliqué aux prix par poste', () => {
    const a = computeAwards(makeLeague({ settings: { awards_min_matches: 4 } }), { seasonId: 's1' })
    for (const c of ['best_forward', 'best_midfielder', 'best_defender', 'player_of_tournament'] as const) {
      expect(a.find((x) => x.category === c)!.not_awarded).toBe(true)
    }
    expect(a.find((x) => x.category === 'best_team')!.not_awarded).toBe(false)
  })
  it('meilleur attaquant filtre bien le poste', () => {
    const a = computeAwards(data, { seasonId: 's1' })
    const fw = a.find((x) => x.category === 'best_forward')!
    expect(data.players.find((p) => p.id === fw.player_id)!.position).toBe('FWD')
  })
})

describe('équipe type & confrontations', () => {
  it('équipe type de la journée : 1 GB + 5 joueurs de champ', () => {
    const t = teamOfRound(data, 's1', 1)
    expect(t).toHaveLength(6)
    expect(t[0].position).toBe('GK')
    expect(t.filter((s) => s.position !== 'GK').every((s) => data.players.find((p) => p.id === s.player_id)!.position !== 'GK')).toBe(true)
  })
  it('H2H', () => {
    expect(headToHead(matches, 'A', 'B')).toMatchObject({ aWins: 1, bWins: 0, aGoals: 2, bGoals: 0 })
  })
})
