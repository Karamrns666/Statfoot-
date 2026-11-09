import { describe, expect, it } from 'vitest'
import { applyLot1, applyReglementV4, applyRules6v6, migrate } from './migrations'
import { captainUpdates } from '@/lib/captain'
import { generateLeagueData } from './generate'
import type { Player, Team } from '@/types/entities'

describe('règles 6 contre 6', () => {
  it('données de la ligue : rôles GK / FIELD uniquement, aucun hors-jeu, aucun trophée par poste', () => {
    const db = generateLeagueData(new Date('2026-11-04T19:00:00'))
    expect(new Set(db.Player.map((p) => p.position))).toEqual(new Set(['GK', 'FIELD']))
    expect(JSON.stringify({ ...db, Page: [], Rulebook: [] })).not.toMatch(/offside|hors-jeu|best_defender|best_midfielder|best_forward|best_young|young_max_age/i)
    expect(db.Rulebook.find((r) => r.status === 'current')!.content).toMatch(/La règle du hors-jeu ne s'applique pas/)
  })
  it('migration des données déjà enregistrées', () => {
    const legacy = (position: string) => ({ id: position, first_name: 'a', last_name: 'b', team_id: 't', position }) as unknown as Player
    const out = applyRules6v6({
      Player: ['GK', 'DEF', 'MID', 'FWD', 'FIELD'].map(legacy),
      MatchEvent: [{ id: 'e1', match_id: 'm', team_id: 't', type: 'offside' as never }, { id: 'e2', match_id: 'm', team_id: 't', type: 'goal' }],
      MatchTeamStats: [{ id: 's', match_id: 'm', team_id: 't', offsides: 3, fouls: 2 } as never],
      Award: [{ id: 'a1', season_id: 's', category: 'best_defender' as never }, { id: 'a2', season_id: 's', category: 'ballon_or' }],
      TeamOfWeek: [{ id: 'w', season_id: 's', round: 1, formation: '2-2-1', slots: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD'].map((p, i) => ({ position: p as never, player_id: `p${i}` })) } as never],
    })
    expect(out.Player!.map((p) => p.position)).toEqual(['GK', 'FIELD', 'FIELD', 'FIELD', 'FIELD'])
    expect(out.MatchEvent!.map((e) => e.id)).toEqual(['e2'])
    expect(out.MatchTeamStats![0]).toEqual({ id: 's', match_id: 'm', team_id: 't', fouls: 2 })
    expect(out.Award!.map((a) => a.id)).toEqual(['a2'])
    expect(out.TeamOfWeek![0]).not.toHaveProperty('formation')
    expect(out.TeamOfWeek![0].slots.map((s) => s.position)).toEqual(['GK', 'FIELD', 'FIELD', 'FIELD', 'FIELD', 'FIELD'])
    expect(applyRules6v6({ Player: out.Player })).toEqual({})
    const page = applyRules6v6({ Page: [{ id: 'r', slug: 'reglement', title: 'R', content: '# R\n\n## 1. Format\n- Football à 6.\n' }] }).Page![0]
    expect(page.content).toBe('# R\n\n## 1. Format\n- **Pas de postes** : les seuls rôles sont **Gardien** et **Capitaine**.\n- **Pas de hors-jeu.**\n- Football à 6.\n')
  })
  it('lot 1 : « Meilleur jeune » retiré, un seul capitaine par équipe', () => {
    const P = (id: string, team_id: string, is_captain = false) => ({ id, first_name: id, last_name: id, team_id, position: 'FIELD', is_captain }) as Player
    const out = applyLot1({
      Award: [{ id: 'a', season_id: 's', category: 'best_young' as never }, { id: 'b', season_id: 's', category: 'ballon_or' }],
      Settings: [{ id: 'x', young_max_age: 23 } as never],
      Player: [P('a1', 'A', true), P('a2', 'A', true), P('b1', 'B'), P('b2', 'B')],
      Team: [{ id: 'A', name: 'A', short_name: 'A' }, { id: 'B', name: 'B', short_name: 'B', captain_player_id: 'b2' }],
      Page: [{ id: 'r', slug: 'reglement', title: 'R', content: 'Ballon d’or, Meilleur jeune, Meilleure défense.' }],
    })
    expect(out.Award!.map((a) => a.id)).toEqual(['b'])
    expect(out.Settings![0]).toEqual({ id: 'x' })
    expect(out.Player!.filter((p) => p.is_captain).map((p) => p.id)).toEqual(['a1', 'b2'])
    expect(out.Team!.map((t) => t.captain_player_id)).toEqual(['a1', 'b2'])
    expect(out.Page![0].content).toBe('Ballon d’or, Meilleure défense.')
    expect(migrate({ Award: out.Award, Settings: out.Settings, Player: out.Player, Team: out.Team }, 1)).toEqual({})
  })
  it('capitaine : désigner un joueur retire le brassard aux autres de son équipe', () => {
    const P = (id: string, team_id: string, is_captain = false) => ({ id, first_name: id, last_name: id, team_id, position: 'FIELD', is_captain }) as Player
    const teams: Team[] = [{ id: 'A', name: 'A', short_name: 'A', captain_player_id: 'a1' }, { id: 'B', name: 'B', short_name: 'B' }]
    const players = [P('a1', 'A', true), P('a2', 'A'), P('b1', 'B', true)]
    expect(captainUpdates(players, teams, 'a2', 'A', true)).toEqual({ players: [{ id: 'a1', is_captain: false }, { id: 'a2', is_captain: true }], teams: [{ id: 'A', captain_player_id: 'a2' }] })
    expect(captainUpdates(players, teams, 'a1', 'A', false)).toEqual({ players: [{ id: 'a1', is_captain: false }], teams: [{ id: 'A', captain_player_id: null }] })
  })
})

describe('règlement Ardentia v4', () => {
  it('données neuves : v4 en vigueur (saison 2026-2027), v3 dans l’historique, saison rattachée, mi-temps 20 min', () => {
    const db = generateLeagueData(new Date('2026-11-09T10:00:00'))
    expect(db.Rulebook.map((r) => [r.version, r.status])).toEqual([['v4', 'current'], ['v3', 'archived']])
    expect(db.Season.find((s) => s.id === 'season_2026')!.rulebook_version).toBe('v4')
    expect(db.Competition.filter((c) => c.season_id === 'season_2026').every((c) => c.half_duration_min === 20)).toBe(true)
    expect(db.Settings[0]).not.toHaveProperty('tiebreakers')
  })
  it('migration des données déjà enregistrées (idempotente)', () => {
    const out = applyReglementV4({
      Rulebook: [], Season: [{ id: 'season_2026', name: 'S', start_date: '2026-08-22' }],
      Competition: [{ id: 'c', season_id: 'season_2026', name: 'C', phase: 'league_phase', half_duration_min: 15 }],
      Match: [{ id: 'm', season_id: 'season_2026', competition_id: 'c', home_team_id: 'a', away_team_id: 'b', status: 'scheduled', half_duration_min: 15 }],
      Settings: [{ id: 'settings', points_win: 3, tiebreakers: ['points'] } as never],
    })
    expect(out.Rulebook!.map((r) => r.version)).toEqual(['v4', 'v3'])
    expect(out.Season![0].rulebook_version).toBe('v4')
    expect(out.Competition![0].half_duration_min).toBe(20)
    expect(out.Match![0].half_duration_min).toBe(20)
    expect(out.Settings![0]).toEqual({ id: 'settings' })
    expect(applyReglementV4({ ...out })).toEqual({})
  })
})
