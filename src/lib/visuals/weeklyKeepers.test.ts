import { describe, expect, it } from 'vitest'
import { events, makeLeague } from '../__fixtures__/league'
import { keeperChanges, topCaptionLines, weeklyCaption, weeklyTop } from './weekly'
import { XP_DEFAULTS } from '@/lib/xp'
import type { MatchEvent } from '@/types/entities'

const ids = (t: ReturnType<typeof weeklyTop>) => t.map((e) => e.player.id)
// barème réduit pour les tests : tout à 0 sauf les buts encaissés par le gardien (−10)
const rules = (over: Record<string, number> = {}) => Object.keys(XP_DEFAULTS).map((key) => ({ id: key, key, season_id: 's1', value: key.startsWith('mult') ? 1 : (over[key] ?? 0) })) as never
const ev = (o: Partial<MatchEvent> & Pick<MatchEvent, 'match_id' | 'type' | 'player_id'>): MatchEvent => ({ id: `X${Math.random()}`, team_id: o.player_id![0], minute: 30, period: '2H', ...o }) as MatchEvent

describe('Top 10 gardiens par XP', () => {
  it('classés par XP (barème existant), gardiens uniquement, format « +X XP »', () => {
    const top = weeklyTop(makeLeague(), 'lp', 1, 'keepers')
    expect(ids(top).sort()).toEqual(['A_GK', 'B_GK', 'C_GK', 'D_GK'])
    for (let i = 1; i < top.length; i++) expect(top[i - 1].value).toBeGreaterThanOrEqual(top[i].value)
    for (const e of top) { expect(e.display).toMatch(/^[+−]?\d+ XP$/); expect(e.detail).toMatch(/^\d+ arrêts? · \d+ encaissés?$/) }
  })
  it('XP négatifs affichés « −20 XP » et classés après ; égalités : arrêts, puis moins encaissés, puis clean sheet, puis nom', () => {
    const lg = makeLeague({ xpRules: rules({ goal_conceded_gk: -10 }) })
    const top = weeklyTop(lg, 'lp', 1, 'keepers')
    // A_GK 0 (clean sheet) ; C_GK et D_GK −10 (1 encaissé, nom) ; B_GK −20
    expect(ids(top)).toEqual(['A_GK', 'C_GK', 'D_GK', 'B_GK'])
    expect(top.map((e) => e.display)).toEqual(['0 XP', '−10 XP', '−10 XP', '−20 XP'])
    expect(top[3].detail).toBe('0 arrêt · 2 encaissés')
    // un arrêt de plus départage D_GK devant C_GK
    const saves = makeLeague({ xpRules: rules({ goal_conceded_gk: -10 }), events: [...events, ev({ match_id: 'M2', type: 'save', player_id: 'D_GK', team_id: 'D' })] })
    expect(ids(weeklyTop(saves, 'lp', 1, 'keepers')).slice(1, 3)).toEqual(['D_GK', 'C_GK'])
  })
  it('changement de gardien : chaque gardien compte avec ses propres XP ; cas signalés', () => {
    const lg = makeLeague({ events: [...events, ev({ match_id: 'M1', type: 'gk_change', player_id: 'A_DEF', team_id: 'A', minute: 20, period: '1H' })] })
    const top = weeklyTop(lg, 'lp', 1, 'keepers')
    expect(ids(top)).toContain('A_DEF')
    expect(ids(top)).not.toContain('A_FWD')
    expect(keeperChanges(lg, 'lp', 1).map((m) => m.id)).toEqual(['M1'])
  })
  it('texte de publication', () => {
    const top = weeklyTop(makeLeague(), 'lp', 1, 'keepers')
    const txt = weeklyCaption('keepers', 'Pré-saison', 1, topCaptionLines(top))
    expect(txt.split('\n')[0]).toBe('🧤 TOP 10 GARDIENS | Pré-saison · J1')
    expect(txt).toMatch(/^1\. .+ \(.+\) – [+−]?\d+ XP \(\d+ arrêts?\)$/m)
  })
})
