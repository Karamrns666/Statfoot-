import { describe, expect, it } from 'vitest'
import type { Lineup, Match, MatchEvent, Suspension } from '@/types/entities'
import { REGLEMENT, coherenceWarnings, computeDiscipline, counterLabel, fmtInferiority, inferiorityAt, isThreatened, suspendedFor } from './reglement'
import { computeStandings } from './standings'
import V4 from '@/api/seed/reglement-v4.md?raw'
import V3 from '@/api/seed/reglement-v3.md?raw'

// ---------------------------------------------------------------------------
let n = 0
const mk = (home: string, away: string, hs: number | null, as: number | null, day: number, o: Partial<Match> = {}): Match => ({
  id: o.id ?? `m${++n}`, season_id: 's', competition_id: 'c', round: day, date: `2026-09-${String(day).padStart(2, '0')}T19:00:00`,
  home_team_id: home, away_team_id: away, home_score: hs, away_score: as, status: hs == null ? 'scheduled' : 'finished', published: true, ...o,
})
let k = 0
const card = (match_id: string, player_id: string, type: MatchEvent['type'], o: Partial<MatchEvent> = {}): MatchEvent => ({ id: `e${++k}`, match_id, team_id: player_id.split('_')[0], player_id, type, period: '1H', minute: 5, ...o })

describe('Art. 17.2 — points', () => {
  it('victoire 3, nul 1, défaite 0', () => {
    const t = computeStandings([mk('A', 'B', 2, 1, 1), mk('A', 'C', 0, 0, 2), mk('B', 'C', 0, 3, 3)], ['A', 'B', 'C'])
    const p = Object.fromEntries(t.map((r) => [r.team_id, r.points]))
    expect(p).toEqual({ A: 4, B: 0, C: 4 })
    expect(REGLEMENT.points).toMatchObject({ win: 3, draw: 1, loss: 0 })
  })
})

describe('Art. 17.3 — départage', () => {
  it('confrontation directe sans vainqueur → différence de buts générale', () => {
    const ms = [mk('A', 'B', 1, 0, 1), mk('B', 'C', 8, 0, 2), mk('C', 'A', 1, 0, 3)]
    // A 3 pts (DB 0), B 3 pts (DB +7), C 3 pts (DB -7) → 3 équipes à égalité, mini-classement : 3 pts chacune → différence de buts
    const t = computeStandings(ms, ['A', 'B', 'C'])
    expect(t.map((r) => r.team_id)).toEqual(['B', 'A', 'C'])
    expect(t[1].tiebreak?.key).toBe('gd')
    const tie = computeStandings([mk('A', 'B', 1, 0, 1), mk('B', 'C', 9, 0, 2), mk('A', 'C', 0, 1, 3)], ['A', 'B', 'C'])
    // A 3 (DB 0), B 3 (DB +8), C 3 (DB -8) → 3 à égalité, toutes à 3 pts entre elles → DB
    expect(tie.map((r) => r.team_id)).toEqual(['B', 'A', 'C'])
    const pair = computeStandings([mk('A', 'B', 1, 0, 1), mk('B', 'C', 9, 0, 2), mk('C', 'A', 0, 0, 3), mk('C', 'D', 0, 5, 4), mk('A', 'D', 0, 3, 5)], ['A', 'B', 'C', 'D'])
    // A 4 pts, B 3, C 1, D 6 … égalité A/B absente → contrôle de l'ordre aux points
    expect(pair.map((r) => r.team_id)).toEqual(['D', 'A', 'B', 'C'])
  })
  it('2 équipes à égalité : celle qui a gagné le match entre elles passe devant malgré une moins bonne différence de buts', () => {
    // A bat B 1-0 ; B écrase C 6-0 ; C bat A 1-0 ; D perd tout → A, B, C à 3 pts… on retire C de l'égalité avec un nul
    const ms = [mk('A', 'B', 1, 0, 1), mk('B', 'C', 6, 0, 2), mk('A', 'C', 1, 1, 3), mk('B', 'D', 0, 0, 4), mk('A', 'D', 0, 2, 5), mk('C', 'D', 3, 0, 6)]
    // A : V N D = 4 ; B : D V N = 4 ; C : D N V = 4 ; D : N V D = 4 → 4 équipes à égalité ! mini = tout le classement
    const t = computeStandings(ms, ['A', 'B', 'C', 'D'])
    expect(new Set(t.map((r) => r.points))).toEqual(new Set([4]))
    const ms2 = [mk('A', 'B', 1, 0, 1), mk('B', 'C', 6, 0, 2), mk('C', 'A', 0, 0, 3), mk('C', 'B', 0, 0, 4)]
    // A : V N = 4 (DB +1) ; B : D V N = 4 (DB +5) ; C : D N N = 2 → A devant B à la confrontation directe
    const t2 = computeStandings(ms2, ['A', 'B', 'C'])
    expect(t2.map((r) => r.team_id)).toEqual(['A', 'B', 'C'])
    expect(t2[1].tiebreak).toMatchObject({ key: 'h2h', above: 'A' })
    expect(t2[1].gd).toBeGreaterThan(t2[0].gd)
  })
  it('3 équipes à égalité : mini-classement sur les seuls matchs entre elles', () => {
    // A, B, C à 6 pts. Entre elles : A bat B, B bat C, A bat C → A 6, B 3, C 0. Contre D : B et C gagnent, A perd.
    const ms = [mk('A', 'B', 1, 0, 1), mk('B', 'C', 1, 0, 2), mk('A', 'C', 1, 0, 3), mk('D', 'A', 5, 0, 4), mk('B', 'D', 8, 0, 5), mk('C', 'D', 9, 0, 6), mk('C', 'B', 1, 0, 7)]
    // A : V V D = 6 (DB -4) ; B : D V V D = 6 (DB +7) ; C : D D V V = 6 (DB +8) ; D : 3
    const t = computeStandings(ms, ['A', 'B', 'C', 'D'])
    expect(t.slice(0, 3).every((r) => r.points === 6)).toBe(true)
    // mini-classement A-B-C : A 6 pts, B 3, C 3 → A 1er ; B et C encore à égalité → différence de buts générale (C +8, B +7)
    expect(t[0].team_id).toBe('A')
    expect(t[0].gd).toBeLessThan(t[1].gd) // A devant malgré la pire différence de buts
    expect(t[1].tiebreak?.key).toBe('h2h')
    expect(t.map((r) => r.team_id)).toEqual(['A', 'C', 'B', 'D'])
    expect(t[2].tiebreak?.key).toBe('gd')
  })
  it('critères 5 et 6 : moins de jaunes, puis moins de rouges ; puis tirage au sort', () => {
    const ms = [mk('A', 'B', 1, 1, 1, { id: 'x1' })]
    const evs = [card('x1', 'A_1', 'yellow_card'), card('x1', 'B_1', 'yellow_card'), card('x1', 'B_2', 'red_card')]
    let t = computeStandings(ms, ['A', 'B'], null, evs)
    expect(t.map((r) => r.team_id)).toEqual(['A', 'B'])
    expect(t[1].tiebreak?.key).toBe('red')
    t = computeStandings(ms, ['A', 'B'], null, [card('x1', 'B_1', 'yellow_card')])
    expect(t.map((r) => r.team_id)).toEqual(['A', 'B'])
    expect(t[1].tiebreak?.key).toBe('yellow')
    // égalité parfaite : tirage au sort saisi par Ardentia, sinon provisoire signalé
    t = computeStandings(ms, ['A', 'B'], null, [])
    expect(t[1].tiebreak).toMatchObject({ key: 'draw', pending: true })
    t = computeStandings(ms, ['A', 'B'], null, [], undefined, ['B', 'A'])
    expect(t.map((r) => r.team_id)).toEqual(['B', 'A'])
    expect(t[1].tiebreak).toMatchObject({ key: 'draw' })
    expect(t[1].tiebreak?.pending).toBeUndefined()
  })
  it('un 2e avertissement compte 2 jaunes et 1 rouge pour l’équipe', () => {
    const ms = [mk('A', 'B', 0, 0, 1, { id: 'y1' })]
    const t = computeStandings(ms, ['A', 'B'], null, [card('y1', 'A_1', 'yellow_card'), card('y1', 'A_1', 'second_yellow')])
    expect(t.find((r) => r.team_id === 'A')).toMatchObject({ yellow: 2, red: 1 })
  })
  it('un match reporté ne compte pas au classement', () => {
    const t = computeStandings([mk('A', 'B', 3, 0, 1, { status: 'postponed' })], ['A', 'B'])
    expect(t.every((r) => r.played === 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('Art. 11.5 / 11.6 — cumul des jaunes et suspensions', () => {
  const P = [{ id: 'A_1', team_id: 'A' }, { id: 'A_2', team_id: 'A' }, { id: 'B_1', team_id: 'B' }]
  const season = (rounds: number, o: Record<number, Partial<Match>> = {}) =>
    Array.from({ length: rounds }, (_, i) => mk('A', 'B', i + 1 <= rounds ? 1 : null, 0, i + 1, { id: `r${i + 1}`, ...o[i + 1] }))

  it('3 jaunes sur 3 matchs → suspendu au 4e, compteur remis à 0 après la purge', () => {
    const ms = [...season(3), mk('A', 'B', null, null, 4, { id: 'r4' }), mk('A', 'B', null, null, 5, { id: 'r5' })]
    const evs = [card('r1', 'A_1', 'yellow_card'), card('r2', 'A_1', 'yellow_card'), card('r3', 'A_1', 'yellow_card')]
    const d3 = computeDiscipline('c', { matches: ms, events: evs, players: P }).players.get('A_1')!
    expect(d3).toMatchObject({ counter: 3, remaining: 1, yellowsTotal: 3 })
    expect(d3.suspensions[0]).toMatchObject({ kind: 'accumulation', matches: 1, origin_match_id: 'r3' })
    expect(suspendedFor(ms[3], { matches: ms, events: evs, players: P }).has('A_1')).toBe(true)
    // J4 disputé : suspension purgée, compteur à 0, plus suspendu en J5
    ms[3] = { ...ms[3], home_score: 2, away_score: 0, status: 'finished' }
    const d4 = computeDiscipline('c', { matches: ms, events: evs, players: P }).players.get('A_1')!
    expect(d4).toMatchObject({ counter: 0, remaining: 0 })
    expect(d4.suspensions[0].served).toEqual(['r4'])
    expect(suspendedFor(ms[4], { matches: ms, events: evs, players: P }).has('A_1')).toBe(false)
    expect(counterLabel(d4)).toBe('0/3')
  })
  it('2 jaunes dans un même match → rouge, pas comptés dans le cumul, 1 match de suspension', () => {
    const ms = season(3)
    const evs = [card('r1', 'A_1', 'yellow_card'), card('r2', 'A_1', 'yellow_card'), card('r3', 'A_1', 'yellow_card'), card('r3', 'A_1', 'second_yellow')]
    const d = computeDiscipline('c', { matches: ms, events: evs, players: P }).players.get('A_1')!
    // exemple du règlement : 2 jaunes au compteur, double jaune en J3 → reste à 2, suspendu au titre du rouge
    expect(d.counter).toBe(2)
    expect(d.suspensions.map((s) => s.kind)).toEqual(['second_yellow'])
    expect(d.remaining).toBe(1)
    expect(isThreatened(d)).toBe(false) // suspendu, pas « menacé »
    expect(d).toMatchObject({ yellowsTotal: 4, redsTotal: 1 })
  })
  it('rouge direct + suspension supplémentaire de 2 matchs → 3 matchs au total', () => {
    const ms = season(1)
    const red = card('r1', 'B_1', 'red_card')
    const extra: Suspension = { id: 'sx', season_id: 's', player_id: 'B_1', origin_match_id: 'r1', origin_event_id: red.id, matches: 2, kind: 'extra', reason: 'Insultes envers l’arbitre', referee_report: 'Rapport n°12', notified_at: '2026-09-03' }
    const d = computeDiscipline('c', { matches: ms, events: [red], players: P, extras: [extra] }).players.get('B_1')!
    expect(d.remaining).toBe(3)
    expect(d.suspensions.map((s) => [s.kind, s.matches])).toEqual([['red', 1], ['extra', 2]])
    expect(d.suspensions[1]).toMatchObject({ reason: 'Insultes envers l’arbitre', notified_at: '2026-09-03' })
  })
  it('3e jaune et rouge : les suspensions s’additionnent (2 matchs)', () => {
    const ms = season(3)
    const evs = [card('r1', 'A_1', 'yellow_card'), card('r2', 'A_1', 'yellow_card'), card('r3', 'A_1', 'yellow_card'), card('r3', 'A_1', 'red_card', { minute: 30 })]
    expect(computeDiscipline('c', { matches: ms, events: evs, players: P }).players.get('A_1')!.remaining).toBe(2)
  })
  it('match suivant reporté → la suspension passe au match réellement disputé suivant', () => {
    const ms = [mk('A', 'B', 1, 0, 1, { id: 'r1' }), mk('A', 'B', 2, 0, 2, { id: 'r2', status: 'postponed' }), mk('A', 'B', 2, 2, 3, { id: 'r3' }), mk('A', 'B', 3, 1, 4, { id: 'r4', status: 'cancelled' })]
    const d = computeDiscipline('c', { matches: ms, events: [card('r1', 'A_1', 'red_card')], players: P }).players.get('A_1')!
    expect(d.suspensions[0].served).toEqual(['r3'])
    expect(d.remaining).toBe(0)
  })
  it('les cartons ne servent que dans la même compétition', () => {
    const ms = [mk('A', 'B', 1, 0, 1, { id: 'r1' }), mk('A', 'B', 1, 0, 2, { id: 'o2', competition_id: 'autre' })]
    const d = computeDiscipline('c', { matches: ms, events: [card('r1', 'A_1', 'red_card')], players: P }).players.get('A_1')!
    expect(d.remaining).toBe(1)
  })
  it('un joueur suspendu aligné quand même est signalé', () => {
    const ms = [mk('A', 'B', 1, 0, 1, { id: 'r1' }), mk('A', 'B', 1, 0, 2, { id: 'r2' })]
    const lineups: Lineup[] = [{ id: 'l', match_id: 'r2', team_id: 'A', starter_ids: ['A_1'] }]
    const d = computeDiscipline('c', { matches: ms, events: [card('r1', 'A_1', 'red_card')], players: P, lineups }).players.get('A_1')!
    expect(d.violations).toEqual(['r2'])
  })
  it('réattribution d’un carton (Art. 11.7) → compteurs recalculés pour les deux joueurs', () => {
    const ms = season(3)
    const evs = [card('r1', 'A_1', 'yellow_card'), card('r2', 'A_1', 'yellow_card'), card('r3', 'A_1', 'yellow_card')]
    const before = computeDiscipline('c', { matches: ms, events: evs, players: P }).players
    expect(before.get('A_1')!.remaining).toBe(1)
    const fixed = evs.map((e, i) => (i === 2 ? { ...e, player_id: 'A_2' } : e))
    const after = computeDiscipline('c', { matches: ms, events: fixed, players: P }).players
    expect(after.get('A_1')).toMatchObject({ counter: 2, remaining: 0 })
    expect(after.get('A_2')).toMatchObject({ counter: 1, remaining: 0 })
    expect(isThreatened(after.get('A_1'))).toBe(true)
  })
  it('jaune reçu sur le banc : compte dans le cumul ; rouge d’un officiel : suspension de l’officiel', () => {
    const ms = [mk('A', 'B', 1, 0, 1, { id: 'r1' }), mk('A', 'B', 1, 0, 2, { id: 'r2' })]
    const evs = [card('r1', 'A_1', 'yellow_card', { card_target: 'substitute' }), card('r1', 'A_x', 'red_card', { card_target: 'official', player_id: undefined, team_id: 'A', player_name_free: 'Coach Karim' })]
    const r = computeDiscipline('c', { matches: ms, events: evs, players: P })
    expect(r.players.get('A_1')!.counter).toBe(1)
    expect(r.officials).toHaveLength(1)
    expect(r.officials[0]).toMatchObject({ name: 'Coach Karim', team_id: 'A' })
    expect(r.officials[0].record.served).toEqual(['r2'])
  })
})

describe('Art. 2.7 — infériorité numérique de 2 minutes', () => {
  const m = { home_team_id: 'A', away_team_id: 'B' }
  const at = (min: number, sec = 0) => (min * 60 + sec) * 1000
  it('rouge à 5:00 → 5 c. 6 jusqu’à 7:00', () => {
    const evs = [card('z', 'A_1', 'red_card', { clock_ms: at(5) })]
    const inf = inferiorityAt(m, evs, at(5, 17))
    expect(inf).toEqual([{ side: 'home', players: 5, remainingMs: at(1, 43) }])
    expect(fmtInferiority(inf[0], inf)).toBe('5 c. 6 — 1:43')
    expect(inferiorityAt(m, evs, at(7))).toEqual([])
  })
  it('but de l’équipe la plus nombreuse → l’équipe réduite récupère un joueur', () => {
    const evs = [card('z', 'A_1', 'red_card', { clock_ms: at(5) }), card('z', 'B_1', 'goal', { clock_ms: at(6) })]
    expect(inferiorityAt(m, evs, at(6, 1))).toEqual([])
  })
  it('but de l’équipe en infériorité → pas de changement', () => {
    const evs = [card('z', 'A_1', 'red_card', { clock_ms: at(5) }), card('z', 'A_2', 'goal', { clock_ms: at(6) })]
    expect(inferiorityAt(m, evs, at(6, 1))[0]).toMatchObject({ side: 'home', players: 5 })
  })
  it('effectifs réduits égaux : un but ne rend de joueur à personne', () => {
    const evs = [card('z', 'A_1', 'red_card', { clock_ms: at(5) }), card('z', 'B_1', 'red_card', { clock_ms: at(5, 30) }), card('z', 'B_2', 'goal', { clock_ms: at(6) })]
    expect(inferiorityAt(m, evs, at(6, 1)).map((x) => x.players)).toEqual([5, 5])
  })
  it('le temps compte en temps de jeu effectif, 2e période comprise', () => {
    const evs = [card('z', 'A_1', 'red_card', { period: '1H', clock_ms: at(19) })]
    expect(inferiorityAt(m, evs, at(20) + at(0, 30))[0].remainingMs).toBe(at(0, 30))
  })
})

describe('texte du règlement', () => {
  it('v4 cohérente avec les constantes ; v3 signalée (pas de cumul de jaunes)', () => {
    expect(coherenceWarnings(V4)).toEqual([])
    expect(coherenceWarnings(V3).join(' ')).toMatch(/Trois \(3\) cartons jaunes cumulés/)
    expect(V4).toMatch(/## 17\.3 Critères de classement des équipes/)
    expect(V4).toMatch(/Trois \(3\) cartons jaunes cumulés entraînent automatiquement un \(1\) match de suspension/)
  })
})
