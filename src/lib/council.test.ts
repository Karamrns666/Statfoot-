import { describe, expect, it } from 'vitest'
import { captainOf, councilPvText, councilVoters, plainPv, pvNumber, seasonDivisions } from './council'
import type { DisciplineCase } from '@/types/entities'

const comps = [
  { season_id: 's', phase: 'league_phase' as const, team_ids: ['a', 'b', 'c', 'd'] },
  { season_id: 's', phase: 'gold' as const, team_ids: ['a', 'b'] },
  { season_id: 's', phase: 'silver' as const, team_ids: ['c', 'd'] },
]

describe('conseil de discipline — capitaines votants (Art. 19.3)', () => {
  it('une équipe MASTER est jugée par les capitaines CHALLENGER, et inversement', () => {
    expect(councilVoters('a', ['a', 'b', 'c', 'd'], comps, 's').teams).toEqual(['c', 'd'])
    expect(councilVoters('c', ['a', 'b', 'c', 'd'], comps, 's').teams).toEqual(['a', 'b'])
  })
  it('pré-saison (pas encore de divisions) : tous les autres capitaines', () => {
    expect(seasonDivisions(comps.slice(0, 1), 's')).toEqual({})
    expect(councilVoters('a', ['a', 'b', 'c'], comps.slice(0, 1), 's').teams).toEqual(['b', 'c'])
  })
  it('capitaine : désigné sur la fiche équipe, sinon le joueur marqué capitaine', () => {
    const players = [{ id: 'p1', team_id: 'a', is_captain: true }, { id: 'p2', team_id: 'a' }]
    expect(captainOf({ id: 'a', captain_player_id: 'p2' }, players)?.id).toBe('p2')
    expect(captainOf({ id: 'a' }, players)?.id).toBe('p1')
  })
})

describe('procès-verbal (Art. 17.7, 19.9)', () => {
  const c: DisciplineCase = {
    id: 'k', season_id: 's', player_id: 'p', team_id: 't', incident: 'Coup porté à un adversaire après le coup de sifflet.', proposed_matches: 2, status: 'decided',
    decision: 'suspension', decision_matches: 2, decided_at: '2026-09-05T10:00', vote_opened_at: '2026-09-04T20:00:00.000Z',
    voices: { ardentia: 'suspension', siffle_or: 'warning', captains_warning: 3, captains_suspension: 7 },
  }
  const text = councilPvText(c, { season: 'Saison 2026-2027', player: { first_name: 'Ali', last_name: 'Mazrhi' }, team: { name: 'BMCI' }, match: { label: 'BMCI – CTR', date: '2026-09-04T19:00' } })
  it('contient la sanction retenue et les sanctions soumises au vote, jamais les voix', () => {
    expect(text).toMatch(/DÉCISION RETENUE : SUSPENSION DE 2 MATCHS/)
    expect(text).toMatch(/avertissement ou suspension de 2 matchs/)
    expect(text).toMatch(/Ali Mazrhi \(BMCI\)/)
    expect(text).not.toMatch(/Sifflé|voix|capitaines ont|7 votes/)
    expect(text).toMatch(/sans le détail des votes/)
  })
  it('version texte simple sans astérisques ; numérotation chronologique', () => {
    expect(plainPv(text)).not.toMatch(/\*/)
    const all = [{ id: 'b', date: '2026-09-10' }, { id: 'a', date: '2026-09-01' }]
    expect(pvNumber(all[0], all, '2026')).toBe('PV 2026-02')
  })
})
