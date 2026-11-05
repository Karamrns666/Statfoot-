import { describe, expect, it } from 'vitest'
import {
  buildAction, closureChecklist, correctEvent, footballMinute, fmtMinute, idsToRemove, keeperMatchStats, minutesPlayed, newLiveState,
  pause, possession, possessionAfter, resume, scoreFromEvents, setPossession, shootout, startPeriod, teamStats, eligibility, fmtScore,
} from './matchEngine'
import type { LiveState, Match, MatchEvent } from '@/types/entities'

const M: Match = { id: 'm', season_id: 's', competition_id: 'c', home_team_id: 'H', away_team_id: 'A', status: 'live' }
const D = { half: 15, et: 5 }
let k = 0
const id = () => `x${++k}`
const ev = (type: MatchEvent['type'], team_id: string, player_id?: string, extra: Partial<MatchEvent> = {}): MatchEvent => ({ id: id(), match_id: 'm', type, team_id, player_id, minute: 5, period: '1H', ...extra })

describe('chrono & minutes', () => {
  it('temps additionnel affiché 15+2', () => {
    expect(footballMinute('1H', 16.5 * 60000, D)).toEqual({ minute: 15, added: 2 })
    expect(fmtMinute(15, 2)).toBe("15+2'")
    expect(footballMinute('2H', 3 * 60000 + 1, D)).toEqual({ minute: 19, added: 0 })
    expect(footballMinute('1H', 0, D)).toEqual({ minute: 1, added: 0 })
  })
})

describe('possession au chrono', () => {
  it('ne compte pas pendant les pauses, ballon mort exclu du %', () => {
    let ls = { ...newLiveState('m'), id: 'l' } as LiveState
    ls = startPeriod(ls, '1H', 0)
    ls = setPossession(ls, 'home', 0)
    ls = setPossession(ls, 'away', 60_000)
    ls = setPossession(ls, 'dead', 80_000)
    ls = setPossession(ls, 'away', 90_000)
    ls = pause(ls, 100_000) // away +10s
    ls = setPossession(ls, 'home', 150_000) // pendant la pause : rien ne compte
    ls = resume(ls, 200_000)
    const p = possession(ls, 230_000) // home +30s
    expect(p.home_ms).toBe(90_000)
    expect(p.away_ms).toBe(30_000)
    expect(p.dead_ms).toBe(10_000)
    expect(p.home_pct).toBe(75)
  })
  it('corner/touche/coup franc → ballon à l’équipe, but → ballon mort', () => {
    expect(possessionAfter(M, { type: 'corner', team_id: 'A' })).toBe('away')
    expect(possessionAfter(M, { type: 'goal', team_id: 'H' })).toBe('dead')
    expect(possessionAfter(M, { type: 'foul', team_id: 'H' })).toBeNull()
  })
})

describe('actions', () => {
  it('but → +1 tir cadré auto ; arrêt → tir cadré pour l’adversaire ; CSC sans tir', () => {
    const g = buildAction(M, [], ev('goal', 'H', 'h9'), id)
    expect(g.map((e) => e.type)).toEqual(['goal', 'shot_on_target'])
    expect(g[1]).toMatchObject({ auto: true, team_id: 'H', parent_event_id: g[0].id })
    const s = buildAction(M, [], ev('save', 'A', 'a1'), id)
    expect(s[1]).toMatchObject({ type: 'shot_on_target', team_id: 'H' })
    const og = buildAction(M, [], ev('own_goal', 'A', 'a4'), id)
    expect(og).toHaveLength(1)
    const all = [...g, ...s, ...og] as MatchEvent[]
    expect(scoreFromEvents(M, all)).toEqual({ home: 2, away: 0 })
    const st = teamStats(M, all, undefined, 0)
    expect(st.home).toMatchObject({ goals: 2, shots_on_target: 2, shots: 2 })
    expect(st.away.saves).toBe(1)
  })
  it('penalty : pas de passeur', () => {
    expect(buildAction(M, [], ev('goal', 'H', 'h9', { goal_kind: 'penalty', related_player_id: 'h7' }), id)[0].related_player_id).toBeUndefined()
  })
  it('2e jaune du même joueur → second_yellow', () => {
    const first = ev('yellow_card', 'H', 'h5')
    expect(buildAction(M, [first], ev('yellow_card', 'H', 'h5'), id)[0].type).toBe('second_yellow')
    expect(buildAction(M, [first], ev('yellow_card', 'H', 'h6'), id)[0].type).toBe('yellow_card')
  })
  it('annulation : supprime aussi les événements automatiques', () => {
    const g = buildAction(M, [], ev('goal', 'H', 'h9'), id) as MatchEvent[]
    expect(idsToRemove(g, g[0].id).sort()).toEqual([g[0].id, g[1].id].sort())
  })
  it('correction avec historique', () => {
    const e = ev('goal', 'H', 'h9')
    const c = correctEvent(e, { minute: 12, player_id: 'h10' }, 'op', '2026-01-01')
    expect(c).toMatchObject({ minute: 12, player_id: 'h10' })
    expect(c.revisions![0].before).toEqual({ minute: 5, player_id: 'h9' })
  })
})

describe('joueurs & gardien', () => {
  it('minutes jouées avec remplacement et rouge', () => {
    const evs = [ev('substitution', 'H', 'h12', { related_player_id: 'h2', minute: 20 }), ev('red_card', 'H', 'h3', { minute: 25 })]
    const mp = minutesPlayed({ starter_ids: ['h1', 'h2', 'h3'] }, evs, 'H', 30)
    expect(mp.get('h1')).toBe(30); expect(mp.get('h2')).toBe(20); expect(mp.get('h12')).toBe(10); expect(mp.get('h3')).toBe(25)
  })
  it('changement de gardien : buts attribués au gardien en jeu, pas de clean sheet', () => {
    const evs = [ev('goal', 'A', 'a9', { minute: 5, period: '1H' }), ev('gk_change', 'H', 'h16', { minute: 15, period: '1H' }), ev('goal', 'A', 'a9', { minute: 3, period: '2H' })]
    const k = keeperMatchStats(M, { id: 'l', match_id: 'm', team_id: 'H', goalkeeper_id: 'h1' }, evs, 'H')
    expect(k.find((x) => x.player_id === 'h1')!.conceded).toBe(1)
    expect(k.find((x) => x.player_id === 'h16')!.conceded).toBe(1)
    const cs = keeperMatchStats(M, { id: 'l', match_id: 'm', team_id: 'A', goalkeeper_id: 'a1' }, [], 'A')
    expect(cs[0].clean_sheet).toBe(true)
  })
  it('joueur suspendu ou documents non validés → bloqué', () => {
    const p = { id: 'p', first_name: 'a', last_name: 'b', position: 'FIELD' as const, team_id: 'H', documents: { id_card: { status: 'valid' as const }, medical: { status: 'valid' as const }, license: { status: 'valid' as const } } }
    expect(eligibility(p, { suspendedMatchesLeft: 0 }).blocked).toBe(false)
    expect(eligibility(p, { suspendedMatchesLeft: 1 }).reasons[0].reason).toBe('suspended')
    expect(eligibility({ ...p, documents: {} }, { suspendedMatchesLeft: 0 }).reasons[0].reason).toBe('documents')
  })
})

describe('tirs au but', () => {
  it('décidé avant la fin des 5 tirs ; score "3-3 (4-1 tab)"', () => {
    const kicks: MatchEvent[] = []
    const add = (team: string, r: 'scored' | 'saved' | 'missed') => kicks.push(ev(`shootout_${r}`, team, team + kicks.length, { period: 'PENS', shootout_order: kicks.length + 1 }))
    add('H', 'scored'); add('A', 'saved'); add('H', 'scored'); add('A', 'scored'); add('H', 'scored'); add('A', 'missed')
    expect(shootout(M, kicks).decided).toBe(false)
    add('H', 'scored')
    const s = shootout(M, kicks)
    expect(s).toMatchObject({ decided: true, winner: 'H', home_score: 4, away_score: 1 })
    expect(fmtScore({ home_score: 3, away_score: 3, penalties: true, home_pens: 4, away_pens: 1 })).toBe('3-3 (4-1 tab)')
  })
  it('mort subite', () => {
    const kicks: MatchEvent[] = []
    for (let i = 0; i < 5; i++) { kicks.push(ev('shootout_scored', 'H', 'h', { shootout_order: kicks.length })); kicks.push(ev('shootout_scored', 'A', 'a', { shootout_order: kicks.length })) }
    kicks.push(ev('shootout_saved', 'H', 'h', { shootout_order: 11 }))
    expect(shootout(M, kicks).decided).toBe(false)
    kicks.push(ev('shootout_scored', 'A', 'a', { shootout_order: 12 }))
    expect(shootout(M, kicks)).toMatchObject({ decided: true, winner: 'A', suddenDeath: true })
  })
})

describe('clôture', () => {
  it('checklist : score incohérent bloquant', () => {
    const evs = [ev('goal', 'H', 'h9')]
    const items = closureChecklist({ ...M, home_score: 2, away_score: 0 }, evs, [], { knockout: false })
    expect(items.find((i) => i.key === 'score')!.ok).toBe(false)
    expect(closureChecklist({ ...M, home_score: 1, away_score: 0 }, evs, [], { knockout: false }).find((i) => i.key === 'score')!.ok).toBe(true)
  })
})
