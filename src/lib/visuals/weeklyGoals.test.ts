import { describe, expect, it } from 'vitest'
import { events, lineups, makeLeague, matches } from '../__fixtures__/league'
import { topCaptionLines, weeklyCaption, weeklyTop } from './weekly'
import type { MatchEvent } from '@/types/entities'

const ids = (t: ReturnType<typeof weeklyTop>) => t.map((e) => e.player.id)
const ev = (o: Partial<MatchEvent> & Pick<MatchEvent, 'match_id' | 'type' | 'player_id'>): MatchEvent => ({ id: `X${Math.random()}`, team_id: o.player_id![0], minute: 30, period: '2H', ...o }) as MatchEvent

describe('Top 10 buteurs', () => {
  it('buts de la journée et de la compétition choisies, valeur au singulier / pluriel', () => {
    const top = weeklyTop(makeLeague(), 'lp', 1, 'goals')
    expect(top[0]).toMatchObject({ value: 2, display: '2 BUTS', rank: 1 })
    expect(top[0].player.id).toBe('A_FWD')
    expect(top.find((e) => e.player.id === 'C_FWD')!.display).toBe('1 BUT')
    expect(top).toHaveLength(3) // moins de 10 buteurs : seulement ceux qui ont marqué
    expect(weeklyTop(makeLeague(), 'autre', 1, 'goals')).toEqual([])
  })
  it('exclus : CSC, tirs au but, tapis vert', () => {
    const extra = [ev({ match_id: 'M1', type: 'goal', player_id: 'B_FWD', period: 'PENS' }), ev({ match_id: 'M1', type: 'own_goal', player_id: 'B_DEF' })]
    const top = weeklyTop(makeLeague({ events: [...events, ...extra] }), 'lp', 1, 'goals')
    expect(ids(top)).not.toContain('B_FWD'); expect(ids(top)).not.toContain('B_DEF')
    // round 2 : le CSC de A_DEF (M3) n'est pas un but
    expect(ids(weeklyTop(makeLeague(), 'lp', 2, 'goals'))).not.toContain('A_DEF')
    // M2 perdu sur tapis vert : ses buts ne comptent pas
    const forfeit = makeLeague({ matches: matches.map((m) => (m.id === 'M2' ? { ...m, forfeit_team_id: 'D' } : m)) })
    expect(ids(weeklyTop(forfeit, 'lp', 1, 'goals'))).toEqual(['A_FWD'])
  })
  it('départage : moins de matchs, puis plus de tirs cadrés, puis plus de passes, puis nom', () => {
    // C_FWD et D_MID : 1 but, 1 match chacun → D_MID a un tir cadré de plus
    const shots = makeLeague({ events: [...events, ev({ match_id: 'M2', type: 'shot_on_target', player_id: 'D_MID' })] })
    const t1 = ids(weeklyTop(shots, 'lp', 1, 'goals'))
    expect(t1.indexOf('D_MID')).toBeLessThan(t1.indexOf('C_FWD'))
    // à tirs égaux, la passe décisive départage (C_FWD fait une passe en M2)
    const pass = makeLeague({ events: [...events, ev({ match_id: 'M2', type: 'goal', player_id: 'C_DEF', related_player_id: 'C_FWD', period: '2H' })] })
    const t2 = weeklyTop(pass, 'lp', 1, 'goals')
    const c = ids(t2).indexOf('C_FWD'), d = ids(t2).indexOf('D_MID'), cd = ids(t2).indexOf('C_DEF')
    expect(c).toBeLessThan(d); expect(cd).toBeGreaterThan(-1)
    // cumul J1-J2 : A_FWD (2 buts, 2 matchs) et B_FWD (2 buts) — B_FWD absent de M1 → 1 match → devant
    const lu = lineups.map((l) => (l.match_id === 'M1' && l.team_id === 'B' ? { ...l, starter_ids: l.starter_ids!.filter((p) => p !== 'B_FWD') } : l))
    const t3 = ids(weeklyTop(makeLeague({ lineups: lu }), 'lp', 2, 'goals', 10, 'cumul'))
    expect(t3.slice(0, 2)).toEqual(['B_FWD', 'A_FWD'])
  })
  it('journée ou cumul depuis le début de la compétition', () => {
    expect(weeklyTop(makeLeague(), 'lp', 3, 'goals').map((e) => e.value).reduce((a, b) => a + b, 0)).toBe(5)
    expect(weeklyTop(makeLeague(), 'lp', 3, 'goals', 10, 'cumul').map((e) => e.value).reduce((a, b) => a + b, 0)).toBe(14)
    expect(weeklyTop(makeLeague(), 'lp', 3, 'assists', 10, 'cumul').length).toBeGreaterThan(weeklyTop(makeLeague(), 'lp', 3, 'assists').length)
  })
  it('passeurs : « PASSES » (plus de « PASSES D. » tronqué)', () => {
    const top = weeklyTop(makeLeague(), 'lp', 2, 'assists', 10, 'cumul')
    expect(top.every((e) => /^\d+ PASSES?$/.test(e.display))).toBe(true)
  })
  it('texte de publication', () => {
    const top = weeklyTop(makeLeague(), 'lp', 1, 'goals')
    const txt = weeklyCaption('goals', 'Pré-saison', 1, topCaptionLines(top))
    expect(txt.split('\n')[0]).toBe('⚽ TOP 10 BUTEURS | Pré-saison · J1')
    expect(txt).toMatch(/^1\. .+ \(.+\) – 2 buts$/m)
    expect(txt).toContain('#MoroccoBusinessLeague #MBL #Ardentia #FootEntreprise')
  })
})
