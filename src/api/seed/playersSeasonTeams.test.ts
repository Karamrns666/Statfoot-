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

describe('applyHideSeason2025', () => {
  it('masque la saison 2025 une seule fois', async () => {
    const { applyHideSeason2025 } = await import('./migrations')
    const Season = [{ id: 'season_2025', is_active: false }, { id: 'season_2026', is_active: true }]
    const out = applyHideSeason2025({ Season } as never)
    expect((out.Season as { id: string; hidden?: boolean }[]).map((s) => `${s.id}:${!!s.hidden}`)).toEqual(['season_2025:true', 'season_2026:false'])
    expect(applyHideSeason2025({ Season: out.Season } as never)).toEqual({})
  })
})

describe('applyLogoRevisions', () => {
  it('passe le logo Crédit Agricole à la nouvelle URL, sans toucher un logo importé', async () => {
    const { applyLogoRevisions } = await import('./migrations')
    const Team = [
      { id: 'a', short_name: 'CAM', logo_url: '/logos/cam.png', company_logo_url: '/logos/cam-full.png' },
      { id: 'b', short_name: 'CAM', logo_url: '/_files/perso.png' },
      { id: 'c', short_name: 'BMC', logo_url: '/logos/bmc.png' },
    ]
    const out = applyLogoRevisions({ Team, Club: [{ id: 'k', logo_url: '/logos/cam.png' }] } as never)
    const T = out.Team as { logo_url?: string; company_logo_url?: string }[]
    expect(T[0]).toMatchObject({ logo_url: '/logos/cam.png?v=2026-11', company_logo_url: '/logos/cam-full.png?v=2026-11' })
    expect(T[1].logo_url).toBe('/_files/perso.png')
    expect(T[2].logo_url).toBe('/logos/bmc.png')
    expect((out.Club as { logo_url: string }[])[0].logo_url).toBe('/logos/cam.png?v=2026-11')
    expect(applyLogoRevisions({ Team: T, Club: out.Club } as never)).toEqual({})
  })
})
