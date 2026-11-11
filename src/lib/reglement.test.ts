import { describe, expect, it } from 'vitest'
import type { Lineup, Match, MatchEvent, Suspension } from '@/types/entities'
import { REGLEMENT, captainsVoice, coherenceWarnings, computeDiscipline, councilDecision, fmtInferiority, inferiorityAt, rulesForSeason, suspendedFor, voteClosesAt, votingTeams } from './reglement'
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
describe('Art. 11.5 / 11.6 / 19 — discipline v8 : pas de cumul, pas de suspension automatique', () => {
  const P = [{ id: 'A_1', team_id: 'A' }, { id: 'A_2', team_id: 'A' }, { id: 'B_1', team_id: 'B' }]
  const played = (rounds: number) => Array.from({ length: rounds }, (_, i) => mk('A', 'B', 1, 0, i + 1, { id: `r${i + 1}` }))
  const council = (o: Partial<Suspension>): Suspension => ({ id: o.id ?? 'sc', season_id: 's', player_id: 'A_1', team_id: 'A', kind: 'council', matches: 1, ...o })

  it('3 jaunes sur 3 matchs → aucune suspension (les jaunes ne se cumulent pas)', () => {
    const ms = [...played(3), mk('A', 'B', null, null, 4, { id: 'r4' })]
    const evs = [card('r1', 'A_1', 'yellow_card'), card('r2', 'A_1', 'yellow_card'), card('r3', 'A_1', 'yellow_card')]
    const d = computeDiscipline('s', { matches: ms, events: evs, players: P }).players.get('A_1')!
    expect(d).toMatchObject({ yellowsTotal: 3, redsTotal: 0, remaining: 0, suspensions: [] })
    expect(suspendedFor(ms[3], { matches: ms, events: evs, players: P }).has('A_1')).toBe(false)
  })
  it('rouge direct ou 2e avertissement → aucune suspension automatique : le joueur peut jouer le match suivant', () => {
    const ms = [...played(1), mk('A', 'B', null, null, 2, { id: 'r2' })]
    const evs = [card('r1', 'A_1', 'red_card'), card('r1', 'B_1', 'yellow_card'), card('r1', 'B_1', 'second_yellow')]
    const data = { matches: ms, events: evs, players: P }
    expect(computeDiscipline('s', data).players.get('A_1')).toMatchObject({ redsTotal: 1, remaining: 0 })
    expect(computeDiscipline('s', data).players.get('B_1')).toMatchObject({ yellowsTotal: 2, redsTotal: 1, remaining: 0 })
    expect(suspendedFor(ms[1], data).size).toBe(0)
  })
  it('suspension décidée par le conseil : bloque le joueur, purgée par les matchs disputés APRÈS la décision', () => {
    const ms = [mk('A', 'B', 1, 0, 1, { id: 'r1' }), mk('A', 'B', 1, 0, 3, { id: 'r2' }), mk('A', 'B', null, null, 5, { id: 'r3' }), mk('A', 'B', null, null, 7, { id: 'r4' })]
    // rouge en J1 (1er sept.), décision le 4 : le match du 3 a été joué AVANT la décision → ne purge rien
    const s = council({ origin_match_id: 'r1', date: '2026-09-04T12:00', matches: 2 })
    const data = { matches: ms, events: [card('r1', 'A_1', 'red_card')], players: P, suspensions: [s] }
    expect(computeDiscipline('s', data).players.get('A_1')).toMatchObject({ remaining: 2 })
    expect(suspendedFor(ms[2], data).get('A_1')?.remaining).toBe(2)
    ms[2] = { ...ms[2], home_score: 0, away_score: 0, status: 'finished' }
    expect(suspendedFor(ms[3], data).get('A_1')?.remaining).toBe(1)
    ms[3] = { ...ms[3], home_score: 2, away_score: 2, status: 'finished' }
    const d = computeDiscipline('s', data).players.get('A_1')!
    expect(d.suspensions[0]).toMatchObject({ kind: 'council', served: ['r3', 'r4'] })
    expect(d.remaining).toBe(0)
  })
  it('match reporté ou annulé : ne purge pas ; la suspension passe au match réellement disputé suivant', () => {
    const ms = [mk('A', 'B', 2, 0, 2, { id: 'r2', status: 'postponed' }), mk('A', 'B', 2, 2, 3, { id: 'r3' }), mk('A', 'B', 3, 1, 4, { id: 'r4', status: 'cancelled' })]
    const d = computeDiscipline('s', { matches: ms, events: [], players: P, suspensions: [council({ date: '2026-09-01T20:00' })] }).players.get('A_1')!
    expect(d.suspensions[0].served).toEqual(['r3'])
  })
  it('la suspension vaut pour la saison : un match de pré-saison puis de MASTER la purgent', () => {
    const ms = [mk('A', 'B', 1, 0, 2, { id: 'p1', competition_id: 'pre' }), mk('A', 'B', 1, 0, 9, { id: 'm1', competition_id: 'master' })]
    const d = computeDiscipline('s', { matches: ms, events: [], players: P, suspensions: [council({ date: '2026-09-01', matches: 2 })] }).players.get('A_1')!
    expect(d.suspensions[0].served).toEqual(['p1', 'm1'])
  })
  it('deux décisions : purgées l’une après l’autre ; joueur suspendu aligné quand même → signalé', () => {
    const ms = played(3).map((m, i) => ({ ...m, date: `2026-09-1${i}T19:00:00` }))
    const lineups: Lineup[] = [{ id: 'l', match_id: 'r2', team_id: 'A', starter_ids: ['A_1'] }]
    const d = computeDiscipline('s', { matches: ms, events: [], players: P, lineups, suspensions: [council({ id: 'a', date: '2026-09-01' }), council({ id: 'b', date: '2026-09-02', matches: 2 })] }).players.get('A_1')!
    expect(d.suspensions.map((x) => x.served)).toEqual([['r1'], ['r2', 'r3']])
    expect(d.violations).toEqual(['r2'])
  })
  it('ancienne saison : suspension saisie à la main, purgée après le match d’origine', () => {
    const ms = played(3)
    const d = computeDiscipline('s', { matches: ms, events: [], players: P, suspensions: [{ id: 'm', season_id: 's', player_id: 'A_1', origin_match_id: 'r1', matches: 1 }] }).players.get('A_1')!
    expect(d.suspensions[0]).toMatchObject({ kind: 'manual', served: ['r2'] })
  })
})

describe('Art. 19 — conseil de discipline', () => {
  it('voix des capitaines : la sanction la plus votée ; égalité ou aucun vote → avertissement (19.7)', () => {
    expect(captainsVoice({ captains_warning: 2, captains_suspension: 5 })).toBe('suspension')
    expect(captainsVoice({ captains_warning: 3, captains_suspension: 3 })).toBe('warning')
    expect(captainsVoice({})).toBe('warning')
  })
  it('décision finale : la sanction qui obtient le plus de voix sur 3 ; égalité entre voix exprimées → avertissement (19.8)', () => {
    expect(councilDecision({ ardentia: 'suspension', siffle_or: 'suspension', captains_warning: 4, captains_suspension: 1 }).decision).toBe('suspension')
    expect(councilDecision({ ardentia: 'suspension', siffle_or: 'warning', captains_warning: 1, captains_suspension: 1 }).decision).toBe('warning')
    expect(councilDecision({ ardentia: 'suspension', captains_warning: 0, captains_suspension: 0 })).toEqual({ decision: 'warning', voices: { warning: 1, suspension: 1 } })
  })
  it('le vote dure 8 heures à partir de la publication du lien (19.5)', () => {
    expect(voteClosesAt('2026-09-04T10:00:00.000Z')).toBe('2026-09-04T18:00:00.000Z')
  })
  it('votent les capitaines de l’autre division (19.3) ; avant la scission, tous les autres capitaines', () => {
    const div = { master: ['a', 'b'], challenger: ['c', 'd'] }
    expect(votingTeams('a', ['a', 'b', 'c', 'd'], div)).toEqual({ teams: ['c', 'd'], division: 'master', voters: 'challenger' })
    expect(votingTeams('d', ['a', 'b', 'c', 'd'], div)).toEqual({ teams: ['a', 'b'], division: 'challenger', voters: 'master' })
    expect(votingTeams('a', ['a', 'b', 'c'], {})).toEqual({ teams: ['b', 'c'] })
  })
  it('saison 2026-2027 au règlement v8 : régime « conseil » ; anciennes versions : saisie manuelle', () => {
    expect(rulesForSeason({ rulebook_version: 'v8' }).council).toBe(true)
    expect(rulesForSeason({ rulebook_version: 'v4' }).council).toBe(false)
    expect(REGLEMENT.cards.autoSuspension).toBe(false)
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
  it('v3 et v4 signalées : elles ne disent pas que les jaunes ne se cumulent pas ni qui vote au conseil (v8)', () => {
    for (const t of [V3, V4]) {
      const w = coherenceWarnings(t).join(' ')
      expect(w).toMatch(/ne se cumulent pas/)
      expect(w).toMatch(/Art\. 19\.3/)
    }
    expect(V4).toMatch(/## 17\.3 Critères de classement des équipes/)
  })
})

describe('saison 2025-2026 recalculée avec l’Art. 17.3', () => {
  it('seul changement d’ordre : Chaabi LLD 10e (bat Cooper Pharma 3-0), Cooper Pharma 11e', async () => {
    const { buildSeason2025 } = await import('@/api/seed/season2025')
    const s = buildSeason2025()
    const name = new Map(s.teams.map((t) => [t.id, t.short_name]))
    const t = computeStandings(s.matches, s.competition.team_ids!, null, s.events, (a, b) => name.get(a)!.localeCompare(name.get(b)!))
    expect(t.map((r) => name.get(r.team_id))).toEqual(['MDS', 'DST', 'DEL', 'WAF', 'AVR', 'ARW', 'CAC', 'CVG', 'ALM', 'CHL', 'COP', 'VIV', 'DSW', 'CTR', 'MPT', 'AVC'])
    expect(t[9].tiebreak).toBeUndefined()
    expect(t[10].tiebreak).toMatchObject({ key: 'h2h' })
    expect(t[3].tiebreak).toMatchObject({ key: 'h2h' }) // DEL devant WAF : DEL 8-4 WAF
  })
})
