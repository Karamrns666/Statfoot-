import { describe, expect, it } from 'vitest'
import { captainMonths, captainPlayerStats, captainRecord, captainScore, emptyLine, nextCaptainMatch, sheetWarnings, shootoutWinner, topKeepers, topScorers } from './captains'
import type { CaptainMatch } from '@/types/entities'

const L = (side: 'orange' | 'bleue', id: string, o = {}) => ({ ...emptyLine(side, id), played: true, ...o })
const m1: CaptainMatch = { id: 'a', date: '2026-10-10T18:00', status: 'finished', motm_player_id: 'o1', lines: [L('orange', 'o1', { goals: 3, assists: 1 }), L('orange', 'o2', { gk: true, saves: 6 }), L('bleue', 'b1', { goals: 1, og: 1 }), L('bleue', 'b2', { gk: true, saves: 4 })] }
const m2: CaptainMatch = { id: 'b', date: '2026-11-07T18:00', status: 'finished', orange_pens: 3, bleue_pens: 4, lines: [L('orange', 'o1', { goals: 2 }), L('orange', 'o2', { gk: true, saves: 2 }), L('bleue', 'b1', { goals: 2 }), L('bleue', 'b2', { gk: true })] }
const m3: CaptainMatch = { id: 'c', date: '2026-12-05T18:00', status: 'scheduled', lines: [] }

describe('Match des capitaines', () => {
  it('score : buts + CSC adverses', () => { expect(captainScore(m1)).toEqual({ orange: 4, bleue: 1 }) })
  it('bilan V/N/D et buts pour / contre', () => {
    const r = captainRecord([m1, m2, m3])
    expect(r.orange).toEqual({ played: 2, won: 1, drawn: 1, lost: 0, gf: 6, ga: 3 })
    expect(r.bleue).toEqual({ played: 2, won: 0, drawn: 1, lost: 1, gf: 3, ga: 6 })
  })
  it('tirs au but : vainqueur du jour sans changer le nul', () => { expect(shootoutWinner(m2)).toBe('bleue'); expect(shootoutWinner(m1)).toBeNull() })
  it('stats individuelles (buteurs, gardiens, homme du match)', () => {
    const st = captainPlayerStats([m1, m2, m3])
    expect(topScorers(st)[0]).toMatchObject({ player_id: 'o1', goals: 5, assists: 1, motm: 1, played: 2 })
    expect(topKeepers(st).find((s) => s.player_id === 'o2')).toMatchObject({ saves: 8, conceded: 3, clean_sheets: 0 })
  })
  it('mois et prochain match', () => {
    expect(captainMonths([m1, m2, m3]).map((x) => x.month)).toEqual(['2026-12', '2026-11', '2026-10'])
    expect(nextCaptainMatch([m1, m2, m3], new Date('2026-11-11'))?.id).toBe('c')
  })
  it('contrôles de la feuille', () => {
    expect(sheetWarnings({ ...m1, lines: [L('orange', 'x', { assists: 2 })] }, 6)[0]).toMatch(/plus de passes/)
    expect(sheetWarnings({ ...m1, orange_pens: 3, bleue_pens: 2 })).toContain('Tirs au but saisis alors que le score n’est pas nul.')
  })
})
