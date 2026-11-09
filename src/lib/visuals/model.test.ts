import { describe, expect, it } from 'vitest'
import { events, makeLeague, matches, players, teams } from '../__fixtures__/league'
import type { Match, MatchEvent } from '@/types/entities'
import { buildMvpModel, buildResultModel, captionText, matchVisualHash, scorerLines, suggestMotm, type VisualData } from './model'
import { DEFAULT_VISUALS_CONFIG, layoutProblems, resolveVisualsConfig, VISUAL_SIZE } from './config'
import { crc32, makeZip } from './zip'

const T = new Map(teams.map((t) => [t.id, t]))
const P = new Map(players.map((p) => [p.id, p]))
const data = (m: Match, evs: MatchEvent[] = events): VisualData => ({ match: m, teams: T, players: P, competition: { id: 'lp', season_id: 's1', name: 'Gold Cup', phase: 'gold' }, events: evs.filter((e) => e.match_id === m.id) })

describe('visuel Résultat', () => {
  it('buteurs groupés par joueur avec les minutes, penalty et csc', () => {
    const m1 = matches[0]
    expect(scorerLines(m1, events, 'A', P)).toEqual(["A-FWD 10', 25' (s.p.)"])
    const m3 = matches[2] // A 1-1 C : but A_MID + csc de A_DEF (compte pour C)
    expect(scorerLines(m3, events, 'A', P)).toEqual(["A-MID 5'"])
    expect(scorerLines(m3, events, 'C', P)).toEqual(["A-DEF (csc) 28'"])
  })
  it('au-delà de 5 buteurs : 4 lignes + « +N autres »', () => {
    const m: Match = { ...matches[0], id: 'big' }
    const evs = ['A_GK', 'A_DEF', 'A_MID', 'A_FWD', 'B_GK', 'B_DEF', 'B_MID'].map((pid, i) => ({ id: `g${i}`, match_id: 'big', team_id: 'A', type: 'goal' as const, player_id: pid, minute: i + 1, period: '1H' as const }))
    const lines = scorerLines(m, evs, 'A', P)
    expect(lines).toHaveLength(5)
    expect(lines[4]).toBe('+3 autres')
  })
  it('modèle : compétition + journée, score, pied de page date · heure · terrain', () => {
    const r = buildResultModel(data({ ...matches[0], pitch: 'Terrain 1' }))
    expect(r.competition).toBe('GOLD CUP · J1')
    expect([r.homeScore, r.awayScore, r.sub]).toEqual([2, 0, undefined])
    expect(r.home.name).toBe('ÉQUIPE A')
    expect(r.footer).toMatch(/^[A-ZÉÛ]+\. \d+ [A-ZÉÛ]+\.? · 19:00 · TERRAIN 1$/)
  })
  it('tirs au but : ligne « T.A.B. 4-3 » ; forfait : 3-0 « TAPIS VERT » sans buteur', () => {
    const pens = buildResultModel(data({ ...matches[1], penalties: true, home_pens: 4, away_pens: 3 }))
    expect(pens.sub).toBe('T.A.B. 4-3')
    const ff = buildResultModel(data({ ...matches[0], forfeit_team_id: 'A', home_score: 0, away_score: 3 }))
    expect([ff.homeScore, ff.awayScore, ff.sub, ff.forfeit]).toEqual([0, 3, 'TAPIS VERT', true])
    expect(ff.homeScorers.concat(ff.awayScorers)).toEqual([])
    const knock = buildResultModel(data({ ...matches[0], stage: 'semi' }))
    expect(knock.competition).toBe('GOLD CUP · DEMI-FINALE')
  })
  it('texte de publication prêt à copier', () => {
    const txt = captionText(data(matches[0]), P.get('A_FWD'))
    expect(txt).toBe([
      '🔥 RÉSULTAT | Gold Cup · J1', 'Équipe A 2 - 0 Équipe B', '⚽ EQA : A-FWD ×2', '🏆 Homme du match : FWD A-FWD (EQA)', '',
      '#MoroccoBusinessLeague #MBL #Ardentia #FootEntreprise',
    ].join('\n'))
  })
  it('l’empreinte change avec le score ou les buteurs, pas sans changement', () => {
    const h = matchVisualHash(data(matches[0]), 1, 'mvp')
    expect(matchVisualHash(data(matches[0]), 1, 'mvp')).toBe(h)
    expect(matchVisualHash(data({ ...matches[0], home_score: 3 }), 1, 'mvp')).not.toBe(h)
    expect(matchVisualHash(data(matches[0], events.map((e) => (e.id === 'E1' ? { ...e, minute: 11 } : e))), 1, 'mvp')).not.toBe(h)
    expect(matchVisualHash(data(matches[0]), 1, 'mvp2')).not.toBe(h)
  })
})

describe('homme du match', () => {
  it('pré-rempli : le plus d’XP dans le match (ici le doublé A_FWD)', () => {
    const league = makeLeague()
    expect(suggestMotm(league, matches[0])?.player_id).toBe('A_FWD')
  })
  it('à égalité d’XP : plus de buts, puis plus de passes, puis équipe gagnante', () => {
    // match nul 1-1, un buteur de chaque côté avec la même XP → départage par l'équipe gagnante impossible → passes
    const m: Match = { ...matches[1], id: 'T1', home_score: 1, away_score: 1 }
    const evs: MatchEvent[] = [
      { id: 't1', match_id: 'T1', team_id: 'C', type: 'goal', player_id: 'C_FWD', minute: 3, period: '1H' },
      { id: 't2', match_id: 'T1', team_id: 'D', type: 'goal', player_id: 'D_FWD', related_player_id: 'D_MID', minute: 9, period: '1H' },
    ]
    const league = makeLeague({ matches: [m], events: evs, lineups: [] })
    const s = suggestMotm(league, m)
    expect(['C_FWD', 'D_FWD']).toContain(s?.player_id)
    // victoire de C 2-1 : à XP de but égale, l'équipe gagnante l'emporte sur l'équipe perdante
    const m2: Match = { ...m, id: 'T2', home_score: 1, away_score: 0 }
    const evs2: MatchEvent[] = [{ id: 'u1', match_id: 'T2', team_id: 'C', type: 'goal', player_id: 'C_FWD', minute: 3, period: '1H' }]
    expect(suggestMotm(makeLeague({ matches: [m2], events: evs2, lineups: [] }), m2)?.player_id).toBe('C_FWD')
  })
  it('modèle MVP : stats joueur de champ (buts, passes, XP) et gardien (arrêts, buts encaissés, XP)', () => {
    const league = makeLeague()
    const d = { ...data({ ...matches[0], motm_player_id: 'A_FWD' }), xp: league }
    const field = buildMvpModel(d, 'A_FWD')!
    expect(field.stats.map((s) => s.label)).toEqual(['Buts', 'Passe déc.', 'XP gagnés'])
    expect(field.stats[0].value).toBe('2')
    expect(field.scoreLine.score).toBe('2 - 0')
    const gk = buildMvpModel(d, 'A_GK')!
    expect(gk.keeper).toBe(true)
    expect(gk.stats.map((s) => [s.label, s.value])).toEqual([['Arrêts', '2'], ['Buts encaissés', '0'], ['XP gagnés', expect.stringMatching(/^[+-]?\d+$/)]])
  })
})

describe('mise en page et ZIP', () => {
  it('zones dans l’image, aucune zone sur le décor (triangles, logo Ardentia)', () => {
    expect(layoutProblems(DEFAULT_VISUALS_CONFIG)).toEqual([])
    const bad = resolveVisualsConfig({ mvp: { zones: { stats: { y: 1000 } } } })
    expect(layoutProblems(bad).join(' ')).toMatch(/mvp\.stats/)
    for (const L of [DEFAULT_VISUALS_CONFIG.resultat, DEFAULT_VISUALS_CONFIG.mvp]) for (const [k, z] of Object.entries(L.zones)) if (k !== 'scoreWithSub') expect(z.x + z.w).toBeLessThanOrEqual(VISUAL_SIZE)
  })
  it('surcharge partielle fusionnée zone par zone', () => {
    const c = resolveVisualsConfig({ resultat: { zones: { footer: { y: 960 } } } })
    expect(c.resultat.zones.footer).toMatchObject({ y: 960, x: 150, size: 30 })
  })
  it('ZIP valide (CRC32 de référence)', async () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
    const z = makeZip([{ name: 'a.txt', data: new TextEncoder().encode('bonjour') }])
    const b = new Uint8Array(await z.arrayBuffer())
    expect([b[0], b[1], b[2], b[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect(b.length).toBe(30 + 5 + 7 + 46 + 5 + 22)
  })
})
