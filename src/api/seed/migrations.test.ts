import { describe, expect, it } from 'vitest'
import { applyRules6v6 } from './migrations'
import { generateLeagueData } from './generate'
import type { Player } from '@/types/entities'

describe('règles 6 contre 6', () => {
  it('données de la ligue : rôles GK / FIELD uniquement, aucun hors-jeu, aucun trophée par poste', () => {
    const db = generateLeagueData(new Date('2026-11-04T19:00:00'))
    expect(new Set(db.Player.map((p) => p.position))).toEqual(new Set(['GK', 'FIELD']))
    expect(JSON.stringify({ ...db, Page: [] })).not.toMatch(/offside|hors-jeu|best_defender|best_midfielder|best_forward/i)
    expect(db.Page.find((p) => p.slug === 'reglement')!.content).toMatch(/Pas de hors-jeu/)
  })
  it('migration des données déjà enregistrées', () => {
    const legacy = (position: string) => ({ id: position, first_name: 'a', last_name: 'b', team_id: 't', position }) as unknown as Player
    const out = applyRules6v6({
      Player: ['GK', 'DEF', 'MID', 'FWD', 'FIELD'].map(legacy),
      MatchEvent: [{ id: 'e1', match_id: 'm', type: 'offside' as never }, { id: 'e2', match_id: 'm', type: 'goal' }],
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
})
