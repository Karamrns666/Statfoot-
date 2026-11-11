import { describe, expect, it } from 'vitest'
import { seniorityTier, teamSeniority } from './seniority'
import type { Competition, Season, Team } from '@/types/entities'

const seasons = [
  { id: 's1', name: 'Saison 2024-2025', start_date: '2024-09-01' },
  { id: 's2', name: 'Saison 2025-2026', start_date: '2025-09-01' },
  { id: 's3', name: 'Saison 2026-2027', start_date: '2026-09-01' },
] as Season[]
const comps = [] as Competition[]
const T = (id: string, season_id: string, club_id?: string) => ({ id, name: id, season_id, club_id }) as Team

describe('ancienneté', () => {
  it('seuils : 1 → Silver, 2 → Gold, ≥3 → Platinum', () => {
    expect(seniorityTier(1)).toBe('silver')
    expect(seniorityTier(2)).toBe('gold')
    expect(seniorityTier(3)).toBe('platinum')
    expect(seniorityTier(5)).toBe('platinum')
  })
  it('compte les saisons du club (liens approuvés uniquement)', () => {
    const teams = [T('a1', 's1', 'c_a'), T('a2', 's2', 'c_a'), T('a3', 's3', 'c_a'), T('b2', 's2', 'c_b'), T('b3', 's3', 'c_b'), T('n3', 's3')]
    expect(teamSeniority(teams[2], teams, comps, seasons)).toMatchObject({ tier: 'platinum', seasons: 3 })
    expect(teamSeniority(teams[4], teams, comps, seasons)).toMatchObject({ tier: 'gold', seasons: 2 })
    expect(teamSeniority(teams[5], teams, comps, seasons)).toMatchObject({ tier: 'silver', seasons: 1 })
    // l'équipe 2025-2026 du club A garde son badge de l'époque (2 saisons → Gold)
    expect(teamSeniority(teams[1], teams, comps, seasons)).toMatchObject({ tier: 'gold', seasons: 2 })
  })
  it('la correction de l’admin est prioritaire', () => {
    const teams = [T('n3', 's3')]
    const s = teamSeniority(teams[0], teams, comps, seasons, [{ id: 'club_n3', seasons_override: 4 }])
    expect(s).toMatchObject({ tier: 'platinum', seasons: 4, computed: 1, overridden: true })
  })
})
