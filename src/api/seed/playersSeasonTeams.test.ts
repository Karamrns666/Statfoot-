import { describe, expect, it } from 'vitest'
import { applyPlayersSeasonTeams } from './migrations'

describe('applyPlayersSeasonTeams', () => {
  const Team = [
    { id: 't25_arw', short_name: 'ARW', season_id: 'season_2025' },
    { id: 't26_arw', short_name: 'ARW', season_id: 'season_2026' },
    { id: 't26_cob', short_name: 'COB', season_id: 'season_2026' },
  ]
  const Player = [
    { id: 'a', team_id: 't25_arw', season_ids: ['season_2026'] }, // importé sur la mauvaise saison
    { id: 'b', team_id: 't25_arw', season_ids: ['season_2025'] }, // joueur 2025 : inchangé
    { id: 'c', team_id: 't25_arw', season_ids: ['season_2025', 'season_2026'] }, // multi-saisons : inchangé
    { id: 'd', team_id: 't26_cob', season_ids: ['season_2026'] },
  ]
  it('replace les joueurs dans l’équipe de leur saison', () => {
    const out = applyPlayersSeasonTeams({ Team, Player } as never)
    expect((out.Player as { id: string; team_id: string }[]).map((p) => `${p.id}:${p.team_id}`)).toEqual(['a:t26_arw', 'b:t25_arw', 'c:t25_arw', 'd:t26_cob'])
    expect(applyPlayersSeasonTeams({ Team, Player: out.Player } as never)).toEqual({})
  })
})
