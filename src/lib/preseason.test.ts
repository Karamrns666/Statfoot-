// Pré-saison (système suisse) — rejeu du fichier « Pré-saison – Système suisse – Simulation.xlsx »
// (scores INVENTÉS, uniquement ici) + robustesse de l'appariement. Le départage du championnat (Art. 17.3)
// a ses propres tests dans reglement.test.ts.
import { describe, expect, it } from 'vitest'
import { XLSX } from './__fixtures__/preseasonXlsx'
import {
  PRESEASON_DEFAULTS, divisionSplit, drawRound1, generateNextRound, pairKey, pairRound, preseasonFormat, preseasonRanking, preseasonState,
  round1FromOrder, teamPath, validateRound, type PMatch,
} from './preseason'
import { seededRng } from './draw'

const R = XLSX.rounds as unknown as Record<string, [string, number, number, number, string, number, string][]>
const TEAMS = [...new Set(Object.values(R).flatMap((ms) => ms.flatMap((m) => [m[0], m[4]])))]
// critère 5 « tirage au sort » : dans le fichier de référence, l'ordre alphabétique
const ALPHA = [...TEAMS].sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))
const cfg = PRESEASON_DEFAULTS
const asPlayed = (j: number): PMatch[] => R[j].map(([a, , x, y, b]) => ({ round: j, home: a, away: b, hs: x, as: y, played: true }))

function replay() {
  const j1 = R[1].flatMap((m) => [m[0], m[4]])
  const order = [...j1, ...TEAMS.filter((t) => !j1.includes(t))]
  const r1 = round1FromOrder(order)
  const rests: Record<number, string | undefined> = { 1: r1.rest }
  let played: PMatch[] = asPlayed(1)
  const plans: Record<number, ReturnType<typeof generateNextRound>> = {}
  for (const j of [2, 3, 4, 5]) {
    const plan = generateNextRound(TEAMS, played, rests, cfg, ALPHA)
    plans[j] = plan
    if (j <= 4) rests[j] = plan.rest
    played = [...played, ...asPlayed(j)]
  }
  return { r1, rests, played, plans }
}

describe('pré-saison — format', () => {
  it('23 équipes, 4 journées : 4 × 11 matchs + rattrapage de 2 = 46 matchs, 4 matchs chacune', () => {
    expect(preseasonFormat(23, 4)).toMatchObject({ perRound: 11, catchup: 2, total: 46, matchesPerTeam: 4, equal: true, warnings: [] })
  })
  it('générique : nombre pair → ni repos ni rattrapage ; format inégal signalé', () => {
    expect(preseasonFormat(22, 4)).toMatchObject({ resting: false, catchup: 0, total: 44, equal: true })
    const odd = preseasonFormat(23, 5)
    expect(odd.equal).toBe(false)
    expect(odd.warnings.join(' ')).toMatch(/match de moins/)
    expect(preseasonFormat(6, 6).warnings.join(' ')).toMatch(/impossibles/)
  })
})

describe('pré-saison — tirage de la journée 1', () => {
  it('rejouable à l’identique avec la même graine, 22 tirées jouent, la 23e au repos', () => {
    const a = drawRound1(TEAMS, 20261111), b = drawRound1(TEAMS, 20261111), c = drawRound1(TEAMS, 7)
    expect(a).toEqual(b)
    expect(a.order).not.toEqual(c.order)
    expect(a.pairs).toHaveLength(11)
    expect(a.rest).toBe(a.order[22])
    expect(a.pairs.every((m) => m.reason === 'Tirage au sort')).toBe(true)
  })
})

describe('pré-saison — rejeu du fichier de référence', () => {
  const { rests, played, plans } = replay()
  it('équipes au repos : CAC (J1), L’Heure Joyeuse (J2), Mega Post Tension (J3), Cobco (J4)', () => {
    expect([rests[1], rests[2], rests[3], rests[4]]).toEqual(['CAC', 'HEURE JOYEUSE', 'MEGA PT', 'COBCO'])
  })
  it.each([2, 3, 4])('journée %i : mêmes matchs, mêmes « Pts avant » et même « Pourquoi ce match ? » que le fichier', (j) => {
    const got = plans[j].pairs.map((m) => [m.home, m.away, m.reason])
    expect(got).toEqual(R[j].map(([a, , , , b, , why]) => [a, b, why]))
    const before = preseasonRanking(TEAMS, played.filter((m) => m.round < j), { order: cfg.intermediateOrder, drawOrder: ALPHA })
    const pts = new Map(before.map((r) => [r.team_id, r.points]))
    expect(R[j].map(([a, pa, , , b, pb]) => [pts.get(a), pts.get(b)])).toEqual(R[j].map(([, pa, , , , pb]) => [pa, pb]))
  })
  it('rattrapage : CAC – L’Heure Joyeuse et Mega Post Tension – Cobco, avec l’explication', () => {
    expect(plans[5].pairs.map((m) => [m.home, m.away, m.reason])).toEqual(R[5].map(([a, , , , b, , why]) => [a, b, why]))
  })
  it.each([1, 2, 3, 4])('classement après la journée %i identique au fichier', (j) => {
    const ranking = preseasonRanking(TEAMS, played.filter((m) => m.round <= j), { order: cfg.intermediateOrder, drawOrder: ALPHA })
    expect(ranking.map((r) => r.team_id)).toEqual(XLSX.rankings[j as 1])
  })
  it('46 matchs, 4 matchs par équipe, aucun rematch', () => {
    expect(played).toHaveLength(46)
    const n = new Map<string, number>(); for (const m of played) for (const t of [m.home, m.away]) n.set(t, (n.get(t) ?? 0) + 1)
    expect([...n.values()].every((v) => v === 4)).toBe(true)
    expect(new Set(played.map((m) => pairKey(m.home, m.away))).size).toBe(46)
  })
  it('classement final : seule différence Distra (5 buts) devant Canpack 1 (3 buts), 15e / 16e', () => {
    const st = preseasonState(TEAMS, played, rests, cfg, ALPHA)
    expect(st.finished).toBe(true)
    const got = st.ranking.map((r) => r.team_id)
    const xl = XLSX.final.map((r) => r[0] as string)
    const diffs = got.map((t, i) => (t !== xl[i] ? `${i + 1}:${xl[i]}→${t}` : null)).filter(Boolean)
    expect(diffs).toEqual(['15:CANPACK 1→DISTRA', '16:DISTRA→CANPACK 1'])
    // points et force des adversaires identiques au fichier
    const byTeam = new Map(st.ranking.map((r) => [r.team_id, r]))
    for (const [t, p, f] of XLSX.final) expect([byTeam.get(t as string)!.points, byTeam.get(t as string)!.force]).toEqual([p, f])
  })
  it('répartition : 12 MASTER (BMCI → ALD Automotive), 11 CHALLENGER (Parebrise Express → Cobco)', () => {
    const st = preseasonState(TEAMS, played, rests, cfg, ALPHA)
    const { master, challenger } = divisionSplit(st.ranking, 12)
    expect(master).toHaveLength(12); expect(challenger).toHaveLength(11)
    expect([master[0], master[11], challenger[0], challenger[10]]).toEqual(['BMCI', 'ALD AUTOMOTIVE', 'Parebrise Express', 'COBCO'])
  })
  it('parcours par équipe', () => {
    const p = teamPath('BMCI', played, rests, 4, (id) => id)
    expect(p.lines.map((l) => l.text)).toEqual(['J1 · Victoire 2 - 0 contre CANPACK 1', 'J2 · Victoire 2 - 0 contre CTR', 'J3 · Victoire 3 - 2 contre PHARMAPROM', 'J4 · Victoire 2 - 0 contre ATELIER VERT-C'])
    const cac = teamPath('CAC', played, rests, 4, (id) => id)
    expect(cac.rest).toBe(1)
    expect(cac.lines.at(-1)!.text).toBe('Rattrapage · Victoire 2 - 1 contre HEURE JOYEUSE')
  })
  it('la journée suivante n’est générée que si tous les résultats sont validés', () => {
    const partial = [...asPlayed(1).slice(0, 10), { ...asPlayed(1)[10], played: false }]
    expect(() => generateNextRound(TEAMS, partial, { 1: 'CAC' }, cfg, ALPHA)).toThrow(/validés/)
  })
})

describe('pré-saison — appariement robuste (retour arrière)', () => {
  it('500 pré-saisons aléatoires : jamais de rematch, jamais de blocage, 4 matchs chacune', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = seededRng(seed)
      const teams = Array.from({ length: 23 }, (_, i) => `T${String(i).padStart(2, '0')}`)
      const r1 = drawRound1(teams, seed)
      const rests: Record<number, string | undefined> = { 1: r1.rest }
      let played: PMatch[] = r1.pairs.map((m) => ({ ...m, hs: Math.floor(rng() * 5), as: Math.floor(rng() * 5), played: true }))
      for (let j = 2; j <= 5; j++) {
        const plan = generateNextRound(teams, played, rests, cfg, r1.order)
        if (j <= 4) rests[j] = plan.rest
        expect(validateRound(plan, played, teams.filter((t) => j <= 4 || Object.values(rests).includes(t)))).toEqual([])
        played = [...played, ...plan.pairs.map((m) => ({ ...m, hs: Math.floor(rng() * 4), as: Math.floor(rng() * 4), played: true }))]
      }
      expect(new Set(played.map((m) => pairKey(m.home, m.away))).size).toBe(played.length)
      const n = new Map<string, number>(); for (const m of played) for (const t of [m.home, m.away]) n.set(t, (n.get(t) ?? 0) + 1)
      expect([...n.values()].every((v) => v === 4)).toBe(true)
    }
  })
  it('impasse d’un algorithme glouton évitée : le retour arrière trouve l’appariement valide', () => {
    // 6 équipes au même total. Glouton : A-B, puis C-D, puis E-F… déjà joué → bloqué.
    // Retour arrière : A-B, C-E, D-F.
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'].map((t, i) => ({ team_id: t, rank: i + 1, played: 2, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, diff: 0, points: 3, force: 0, opponents: [] }))
    const played: PMatch[] = [['E', 'F'], ['C', 'F'], ['D', 'E']].map(([h, a], i) => ({ round: 1 + (i % 2), home: h, away: a, played: true, hs: 1, as: 1 }))
    const plan = pairRound(3, rows, [], played)
    expect(plan.pairs.map((m) => `${m.home}-${m.away}`)).toEqual(['A-B', 'C-E', 'D-F'])
    expect(plan.pairs.every((m) => m.reason === 'Même total de points (3 pts)')).toBe(true)
  })
  it('un rematch saisi à la main est refusé', () => {
    const plan = { round: 2, rest: 'E', pairs: [{ round: 2, home: 'A', away: 'B', played: false }, { round: 2, home: 'C', away: 'D', played: false }] }
    expect(validateRound(plan, [{ round: 1, home: 'B', away: 'A', played: true, hs: 1, as: 0 }], ['A', 'B', 'C', 'D', 'E']).join(' ')).toMatch(/Rematch interdit/)
  })
})
