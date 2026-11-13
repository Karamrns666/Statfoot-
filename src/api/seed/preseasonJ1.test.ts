import { describe, expect, it } from 'vitest'
import { generateLeagueData } from './generate'
import { OFFICIAL_J1_2026, buildOfficialJ1 } from './preseasonJ1'
import { applyOfficialJ1 } from './migrations'
import { PRESEASON_DEFAULTS, generateNextRound, validateRound, preseasonRanking } from '@/lib/preseason'
import { roundMatches } from '@/lib/preseasonRounds'
import { fmtWhen, isScheduled } from '@/lib/matchTime'
import { toPMatch } from '@/hooks/usePreseason'
import type { Match } from '@/types/entities'

const db = generateLeagueData(new Date('2026-11-13T12:00:00Z'))
const comp = db.Competition.find((c) => c.id === 'comp_2026_selection')!
const j1 = db.Match.filter((m) => m.competition_id === comp.id && m.round === 1)
const name = (id: string) => db.Team.find((t) => t.id === id)!.name

describe('pré-saison 2026-2027 — tirage officiel de la journée 1', () => {
  it('11 matchs PS-01…PS-11, dates, heures et terrains du tableau officiel', () => {
    expect(j1).toHaveLength(11)
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
      'PS-08': 'Canpack 1 – Wafasalaf · Jeudi 19 novembre · 22h00 · Terrain 2',
    })
    expect(j1.every((m) => m.published && m.pairing_reason === 'Tirage au sort' && m.status === 'scheduled')).toBe(true)
  })
  it('chacune des 22 équipes exactement une fois ; Canpack 2 au repos ; tirage « saisie manuelle »', () => {
    const playing = j1.flatMap((m) => [m.home_team_id, m.away_team_id])
    expect(new Set(playing).size).toBe(22)
    const rest = comp.team_ids!.filter((t) => !playing.includes(t))
    expect(rest.map(name)).toEqual(['Canpack 2'])
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
    expect(plan.pairs).toHaveLength(11)
    expect(validateRound(plan, pm, comp.team_ids!)).toEqual([])
    // au repos : la moins bien classée qui n'a pas encore été au repos (jamais Canpack 2, déjà au repos en J1)
    const ranking = preseasonRanking(comp.team_ids!, pm, { order: cfg.intermediateOrder, drawOrder: comp.preseason!.draw_order!, points: cfg.points })
    expect(plan.rest).not.toBe(rests[1])
    expect(plan.rest).toBe([...ranking].reverse().find((r) => r.team_id !== rests[1])!.team_id)
    for (const p of plan.pairs) expect(pm.some((x) => (x.home === p.home && x.away === p.away) || (x.home === p.away && x.away === p.home))).toBe(false)
    const rows = roundMatches({ round: plan.round, rest: plan.rest, pairs: plan.pairs.map((p) => ({ home: p.home, away: p.away, reason: p.reason ?? '' })) }, comp, played)
    expect(rows.map((r) => r.number)).toEqual(Array.from({ length: 11 }, (_, i) => `PS-${12 + i}`))
    expect(rows.every((r) => r.published === false && !isScheduled(r) && fmtWhen(r) === 'Horaire à définir')).toBe(true)
  })
})

describe('mise à jour des navigateurs : le tirage J1 enregistré auparavant est remplacé', () => {
  const old = () => {
    const d = generateLeagueData(new Date('2026-11-13T12:00:00Z'))
    const c = d.Competition.find((x) => x.id === comp.id)!
    d.Match = d.Match.filter((m) => m.competition_id !== c.id)
    const ids = [...c.team_ids!]
    d.Match.push(...Array.from({ length: 11 }, (_, i) => ({ id: `old_${i}`, season_id: c.season_id, competition_id: c.id, round: 1, home_team_id: ids[2 * i], away_team_id: ids[2 * i + 1], status: 'scheduled' as const, published: true, date: '2026-11-14T18:00:00.000Z', pitch: 'Terrain 3' })))
    c.preseason = { seed: 123, draw_order: ids, rests: { '1': ids[22] }, published_rounds: [1] }
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
    const log = (out.AuditLog as { action: string; details: Record<string, unknown> }[])[0]
    expect(log.action).toBe('preseason_official_draw')
    expect(log.details.message).toBe('Tirage J1 remplacé par le tirage officiel')
    expect(JSON.parse(log.details.sauvegarde_json as string).matches).toHaveLength(11)
    expect(out.Team!.find((t) => t.short_name === 'MID' && t.season_id === 'season_2026')!.name).toBe('Taqeef (Midea)')
    expect(applyOfficialJ1({ ...d, ...out } as never)).toEqual({})
  })
  it('si un match de la J1 a déjà été joué : rien n’est remplacé, alerte dans le journal', () => {
    const d = old(); d.Match.find((m) => m.id === 'old_0')!.status = 'finished'
    const out = applyOfficialJ1(d as never)
    expect(out.Match).toBeUndefined()
    expect((out.AuditLog as { action: string }[])[0].action).toBe('preseason_official_draw_blocked')
  })
})
