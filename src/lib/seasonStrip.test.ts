import { describe, expect, it } from 'vitest'
import { makeLeague } from './__fixtures__/league'
import { seasonStrip } from './seasonStrip'
import type { Competition, Match, Player } from '@/types/entities'

const comp = (id: string, phase: Competition['phase'], name: string, team_ids: string[] = ['A', 'B', 'C', 'D']): Competition => ({ id, season_id: 's1', name, phase, team_ids, format: phase === 'league_phase' ? 'swiss' : 'league' })
const m = (id: string, c: string, round: number, played: boolean, o: Partial<Match> = {}): Match => ({ id, season_id: 's1', competition_id: c, round, date: `2026-09-${10 + round}T19:00:00`, home_team_id: 'A', away_team_id: 'B', home_score: played ? 1 : null, away_score: played ? 0 : null, status: played ? 'finished' : 'scheduled', published: true, ...o })
const pl = (id: string, seasons: string[], status: Player['status'] = 'active'): Player => ({ id, first_name: 'x', last_name: id, team_id: 'A', status, season_ids: seasons })

describe('bandeau de chiffres de l’accueil', () => {
  const competitions = [comp('pre', 'league_phase', 'Phase de sélection')]
  it('joueurs de la saison, matchs joués / total, pré-saison en cours, MASTER et CHALLENGER à venir', () => {
    const matches = [m('1', 'pre', 1, true), m('2', 'pre', 1, true), m('3', 'pre', 2, true), m('4', 'pre', 2, false), m('5', 'pre', 3, false), m('6', 'pre', 3, false, { status: 'cancelled' }), m('7', 'pre', 3, false, { status: 'postponed' })]
    const s = seasonStrip(makeLeague({ competitions, matches, players: [pl('a', ['s1']), pl('b', ['s1', 's0']), pl('c', ['s0']), pl('d', ['s1'], 'inactive')] }), 's1')
    expect([s.teams, s.players]).toEqual([4, 2])
    expect(`${s.played}/${s.total}`).toBe('3/6') // l'annulé ne compte pas, le reporté reste à jouer
    expect(s.preseason).toMatchObject({ name: 'Pré-saison', status: 'running', round: 2, label: 'J2 · 3/6 matchs', href: '/classement/phase-de-selection' })
    expect(s.master).toMatchObject({ name: 'MASTER', status: 'upcoming', label: 'À venir', href: '/classement/master' })
    expect(s.challenger).toMatchObject({ name: 'CHALLENGER', label: 'À venir', href: '/classement/challenger' })
  })
  it('pré-saison terminée, MASTER et CHALLENGER en cours : le total additionne toutes les phases', () => {
    const cs = [...competitions, comp('g', 'gold', 'MASTER', ['A', 'B']), comp('s', 'silver', 'CHALLENGER', ['C', 'D'])]
    const matches = [m('1', 'pre', 1, true), m('2', 'pre', 2, true), m('3', 'g', 1, true), m('4', 'g', 2, false), m('5', 's', 1, false), m('6', 's', 2, false)]
    const s = seasonStrip(makeLeague({ competitions: cs, matches }), 's1')
    expect(`${s.played}/${s.total}`).toBe('3/6')
    expect(s.preseason.label).toBe('Terminée ✓')
    expect(s.master.label).toBe('J2 · 1/2 matchs')
    expect(s.challenger.label).toBe('J1 · 0/2 matchs')
  })
  it('compétitions constituées mais calendrier pas encore tiré : « À venir »', () => {
    const s = seasonStrip(makeLeague({ competitions: [...competitions, comp('g', 'gold', 'MASTER')], matches: [] }), 's1')
    expect([s.preseason.label, s.master.label, `${s.played}/${s.total}`]).toEqual(['À venir', 'À venir', '0/0'])
  })
})
