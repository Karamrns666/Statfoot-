import { describe, expect, it } from 'vitest'
import { generateLeagueData } from './generate'
import { OFFICIAL_J1_2026, buildOfficialJ1 } from './preseasonJ1'
import { applyOfficialJ1, applyRemoveCanpack2026 } from './migrations'
import { PRESEASON_DEFAULTS, generateNextRound, preseasonFormat, validateRound, preseasonRanking } from '@/lib/preseason'
import { roundMatches } from '@/lib/preseasonRounds'
import { fmtWhen, isScheduled } from '@/lib/matchTime'
import { toPMatch } from '@/hooks/usePreseason'
import type { Match } from '@/types/entities'

const db = generateLeagueData(new Date('2026-11-13T12:00:00Z'))
const comp = db.Competition.find((c) => c.id === 'comp_2026_selection')!
const j1 = db.Match.filter((m) => m.competition_id === comp.id && m.round === 1)
const name = (id: string) => db.Team.find((t) => t.id === id)!.name

describe('pré-saison 2026-2027 — tirage officiel de la journée 1', () => {
  it('10 matchs PS-01…PS-11 sans PS-08, dates, heures et terrains du tableau officiel', () => {
    expect(j1).toHaveLength(10)
    const rows = Object.fromEntries(j1.map((m) => [m.number, `${name(m.home_team_id)} – ${name(m.away_team_id)} · ${fmtWhen(m)}`]))
    expect(rows).toEqual({
      'PS-01': 'Distra – BMCI · Lundi 16 novembre · 21h00 · Terrain 1',
      'PS-02': 'Crédit Agricole – Pharmaprom · Lundi 16 novembre · 21h00 · Terrain 2',
      'PS-03': 'CAC – Taqeef (Midea) · Lundi 16 novembre · 22h00 · Terrain 1',
      'PS-04': "L'Heure Joyeuse – ALD Automotive · Mardi 17 novembre · 20h00 · Terrain 1",
      'PS-05': 'G3C – Mega Post Tension · Mardi 17 novembre · 20h00 · Terrain 2',
      'PS-06': 'Michoc – Atelier Vert Casa · Mardi 17 novembre · 21h00 · Terrain 1',
      'PS-07': 'JTI – Cobco · Mardi 17 novembre · 21h00 · Terrain 2',
      'PS-09': 'Arrow ECS – Marjane Market · Jeudi 19 novembre · 21h00 · Terrain 1',
      'PS-10': 'Atelier Vert Rabat – Attijariwafa bank · Jeudi 19 novembre · 21h00 · Terrain 2',
      'PS-11': 'Parebrise Express – CTR · Jeudi 19 novembre · 22h00 · Terrain 1',
    })
    expect(j1.every((m) => m.published && m.pairing_reason === 'Tirage au sort' && m.status === 'scheduled')).toBe(true)
  })
  it('chacune des 20 équipes exactement une fois ; Wafasalaf au repos ; tirage « saisie manuelle »', () => {
    const playing = j1.flatMap((m) => [m.home_team_id, m.away_team_id])
    expect(comp.team_ids).toHaveLength(21)
    expect(new Set(playing).size).toBe(20)
    const rest = comp.team_ids!.filter((t) => !playing.includes(t))
    expect(rest.map(name)).toEqual(['Wafasalaf'])
    expect(comp.preseason!.draw_order!.at(-1)).toBe(rest[0])
    expect(comp.preseason).toMatchObject({ draw_source: 'manual', rests: { '1': rest[0] }, number_counter: 11 })
    expect(comp.preseason?.seed).toBeUndefined()
    expect(() => buildOfficialJ1(comp.id, comp.season_id, comp.team_ids!.slice(1))).toThrow(/incohérent/)
  })

  it('résultats simulés de la J1 → J2 générée automatiquement : valide, sans rematch, bonne équipe au repos, « Horaire à définir »', () => {
    let k = 0
    const played: Match[] = j1.map((m) => ({ ...m, status: 'finished', validated: true, home_score: (k++ % 3), away_score: (k % 2) }))
    const pm = played.map(toPMatch)
    const rests = { 1: comp.preseason!.rests!['1'] }
    const cfg = { ...PRESEASON_DEFAULTS }
    const plan = generateNextRound(comp.team_ids!, pm, rests, cfg, comp.preseason!.draw_order!)
    expect(plan.round).toBe(2)
    expect(plan.pairs).toHaveLength(10)
    expect(validateRound(plan, pm, comp.team_ids!)).toEqual([])
    // au repos : la moins bien classée qui n'a pas encore été au repos (jamais Wafasalaf, déjà au repos en J1)
    const ranking = preseasonRanking(comp.team_ids!, pm, { order: cfg.intermediateOrder, drawOrder: comp.preseason!.draw_order!, points: cfg.points })
    expect(plan.rest).not.toBe(rests[1])
    expect(plan.rest).toBe([...ranking].reverse().find((r) => r.team_id !== rests[1])!.team_id)
    for (const p of plan.pairs) expect(pm.some((x) => (x.home === p.home && x.away === p.away) || (x.home === p.away && x.away === p.home))).toBe(false)
    const rows = roundMatches({ round: plan.round, rest: plan.rest, pairs: plan.pairs.map((p) => ({ home: p.home, away: p.away, reason: p.reason ?? '' })) }, comp, played)
    expect(rows.map((r) => r.number)).toEqual(Array.from({ length: 10 }, (_, i) => `PS-${12 + i}`))
    expect(rows.every((r) => r.published === false && !isScheduled(r) && fmtWhen(r) === 'Horaire à définir')).toBe(true)
  })
})

describe('mise à jour des navigateurs : le tirage J1 enregistré auparavant est remplacé', () => {
  const old = () => {
    const d = generateLeagueData(new Date('2026-11-13T12:00:00Z'))
    const c = d.Competition.find((x) => x.id === comp.id)!
    d.Match = d.Match.filter((m) => m.competition_id !== c.id)
    const ids = [...c.team_ids!]
    d.Match.push(...Array.from({ length: 10 }, (_, i) => ({ id: `old_${i}`, season_id: c.season_id, competition_id: c.id, round: 1, home_team_id: ids[2 * i], away_team_id: ids[2 * i + 1], status: 'scheduled' as const, published: true, date: '2026-11-14T18:00:00.000Z', pitch: 'Terrain 3' })))
    c.preseason = { seed: 123, draw_order: ids, rests: { '1': ids[20] }, published_rounds: [1] }
    d.Team = d.Team.map((t) => (t.short_name === 'MID' && t.season_id === 'season_2026' ? { ...t, name: 'TAQEEF (MIDEA)' } : t))
    return d
  }
  it('11 anciens matchs supprimés, tirage officiel enregistré, sauvegarde JSON dans le journal ; idempotent', () => {
    const d = old()
    const out = applyOfficialJ1(d as never)
    const ms = out.Match!.filter((m) => m.competition_id === comp.id && m.round === 1)
    expect(ms.map((m) => m.number).sort()).toEqual(OFFICIAL_J1_2026.map((r) => r.number).sort())
    expect(out.Match!.some((m) => m.id.startsWith('old_'))).toBe(false)
    expect(out.Competition!.find((c) => c.id === comp.id)!.preseason).toMatchObject({ draw_source: 'manual', number_counter: 11 })
    const log = (out.AuditLog as unknown as { action: string; details: Record<string, unknown> }[])[0]
    expect(log.action).toBe('preseason_official_draw')
    expect(log.details.message).toBe('Tirage J1 remplacé par le tirage officiel')
    expect(JSON.parse(log.details.sauvegarde_json as string).matches).toHaveLength(10)
    expect(out.Team!.find((t) => t.short_name === 'MID' && t.season_id === 'season_2026')!.name).toBe('Taqeef (Midea)')
    expect(applyOfficialJ1({ ...d, ...out } as never)).toEqual({})
  })
  it('si un match de la J1 a déjà été joué : rien n’est remplacé, alerte dans le journal', () => {
    const d = old(); d.Match.find((m) => m.id === 'old_0')!.status = 'finished'
    const out = applyOfficialJ1(d as never)
    expect(out.Match).toBeUndefined()
    expect((out.AuditLog as unknown as { action: string }[])[0].action).toBe('preseason_official_draw_blocked')
  })
})

describe('pré-saison à 21 équipes', () => {
  it('4 journées de 10 matchs + rattrapage de 2 matchs = 42 matchs, 4 matchs par équipe', () => {
    const f = preseasonFormat(21, 4)
    expect(f).toMatchObject({ teams: 21, perRound: 10, resting: true, catchup: 2, total: 42, matchesPerTeam: 4, equal: true })
    // saison complète simulée avec le moteur : chaque équipe joue exactement 4 matchs
    const ids = comp.team_ids!
    const cfg = { ...PRESEASON_DEFAULTS }
    expect(cfg.masterSize).toBe(11)
    const pm = j1.map((m, i) => ({ ...toPMatch({ ...m, status: 'finished', validated: true, home_score: i % 3, away_score: (i + 1) % 2 } as Match) }))
    const rests: Record<number, string | undefined> = { 1: comp.preseason!.rests!['1'] }
    for (let r = 2; r <= 5; r++) {
      const plan = generateNextRound(ids, pm, rests, cfg, comp.preseason!.draw_order!)
      rests[plan.round] = plan.rest
      plan.pairs.forEach((p, i) => pm.push({ round: plan.round, home: p.home, away: p.away, hs: i % 4, as: (i + 2) % 3, played: true, reason: p.reason }))
    }
    expect(pm).toHaveLength(42)
    expect(pm.filter((m) => m.round === 5)).toHaveLength(2)
    for (const t of ids) expect(pm.filter((m) => m.home === t || m.away === t)).toHaveLength(4)
  })
})

describe('retrait de Canpack 1 et Canpack 2 (base existante à 23 équipes)', () => {
  // base « avant » : on remet Canpack 1 / 2, PS-08 et Canpack 2 au repos comme en production
  const before = () => {
    const d = generateLeagueData(new Date('2026-11-13T12:00:00Z'))
    const c = d.Competition.find((x) => x.id === comp.id)!
    const waf = d.Team.find((t) => t.name === 'Wafasalaf' && t.season_id === 'season_2026')!
    const cp1 = { ...waf, id: 't26_cp1', name: 'Canpack 1', short_name: 'CP1', club_id: 'club_t26_cp1' }
    const cp2 = { ...waf, id: 't26_cp2', name: 'Canpack 2', short_name: 'CP2', club_id: 'club_t26_cp2' }
    d.Team.push(cp1, cp2)
    d.Club = [...(d.Club ?? []), { id: 'club_t26_cp1', name: 'Canpack 1' }, { id: 'club_t26_cp2', name: 'Canpack 2' }] as never
    d.Player.push({ id: 'p_cp1', first_name: 'A', last_name: 'B', team_id: 't26_cp1', season_ids: ['season_2026'], status: 'active' } as never)
    const order = c.preseason!.draw_order!.filter((x) => x !== waf.id)
    c.team_ids = [...c.team_ids!, 't26_cp1', 't26_cp2']
    c.preseason = { ...c.preseason!, draw_order: [...order, 't26_cp1', waf.id, 't26_cp2'], rests: { '1': 't26_cp2' }, revealed: 23, number_counter: 11 }
    d.Match.push({ ...j1[0], id: 'm26_ps08', number: 'PS-08', home_team_id: 't26_cp1', away_team_id: waf.id, date: '2026-11-19T22:00:00.000Z', pitch: 'Terrain 2' })
    return { d, waf }
  }
  it('équipes, clubs, joueurs et PS-08 retirés ; Wafasalaf au repos ; autres matchs inchangés ; idempotent', () => {
    const { d, waf } = before()
    const otherMatches = JSON.stringify(d.Match.filter((m) => m.id !== 'm26_ps08'))
    const out = applyRemoveCanpack2026(d as never)
    expect(out.Team!.some((t) => /canpack/i.test(t.name))).toBe(false)
    expect((out.Club as { id: string }[]).some((c) => c.id.startsWith('club_t26_cp'))).toBe(false)
    expect(out.Player!.some((p) => p.id === 'p_cp1')).toBe(false)
    expect(out.Match!.some((m) => m.number === 'PS-08')).toBe(false)
    expect(JSON.stringify(out.Match)).toBe(otherMatches)
    const c = out.Competition!.find((x) => x.id === comp.id)!
    expect(c.team_ids).toHaveLength(21)
    expect(c.preseason).toMatchObject({ rests: { '1': waf.id }, number_counter: 11, revealed: 21, config: { masterSize: 11 } })
    expect(c.preseason!.draw_order!.at(-1)).toBe(waf.id)
    expect(applyRemoveCanpack2026({ ...d, ...out } as never)).toEqual({})
  })
  it('aucune autre saison n’est touchée', () => {
    const { d } = before()
    const out = applyRemoveCanpack2026(d as never)
    const other = (x: { season_id?: string; season_ids?: string[] }) => (x.season_id && x.season_id !== 'season_2026') || (x.season_ids && !x.season_ids.includes('season_2026'))
    expect(JSON.stringify(out.Team!.filter(other))).toBe(JSON.stringify(d.Team.filter(other)))
    expect(JSON.stringify(out.Match!.filter(other))).toBe(JSON.stringify(d.Match.filter(other)))
    expect(JSON.stringify(out.Player!.filter(other))).toBe(JSON.stringify(d.Player.filter(other)))
  })
})
