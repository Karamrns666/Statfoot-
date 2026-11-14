import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import { migrate } from '@/api/seed/migrations'
import { ENTITY_NAMES } from '@/types/entities'
import { buildSimulation, SIM_ID, SIM_SEASON_ID, type RealDb } from './simulation'
import { isPlayed } from '@/lib/standings'
import { preseasonFormat } from '@/lib/preseason'

function realDb(): RealDb {
  const db = generateLeagueData() as unknown as Record<string, unknown[]>
  const out = migrate(db as never, 0) as Record<string, unknown[]>
  const real = { ...db, ...out } as Record<string, unknown[]>
  for (const n of ENTITY_NAMES) real[n] ??= []
  return real as unknown as RealDb
}

describe('simulation de saison', () => {
  const real = realDb()
  const before = JSON.stringify(real)
  const { rows, report } = buildSimulation(real)
  const all = Object.values(rows).flat() as unknown as Record<string, unknown>[]

  it('affiche le bilan', () => {
    console.log('BILAN SIMULATION', JSON.stringify(report, null, 1))
    expect(report.matches).toBeGreaterThan(150)
  })
  it('ne modifie pas les vraies données et marque chaque enregistrement', () => {
    expect(JSON.stringify(real)).toBe(before)
    expect(all.every((r) => r.is_simulation === true && r.simulation_id === SIM_ID)).toBe(true)
    const realIds = new Set(Object.values(real).flat().map((r) => `${(r as { id: string }).id}`))
    const clash = Object.entries(rows).flatMap(([e, l]) => (l ?? []).filter((r) => !['Settings', 'Page', 'Venue'].includes(e) && realIds.has((r as { id: string }).id)))
    expect(clash).toEqual([])
  })
  it('est reproductible (graine fixe)', () => {
    expect(JSON.stringify(buildSimulation(real).rows)).toBe(JSON.stringify(rows))
  })
  it('contient une saison complète', () => {
    const ms = rows.Match!
    const pre = ms.filter((m) => m.competition_id === 'sim_comp_pre')
    const nReal = rows.Team!.length - 4
    expect(pre).toHaveLength(preseasonFormat(nReal, 4).total)
    expect(ms.every((m) => isPlayed(m))).toBe(true)
    expect(rows.Team!.filter((t) => t.season_id === SIM_SEASON_ID).length).toBe(nReal + 4) // équipes de la saison + 4 nouvelles au tournoi
    expect(nReal).toBe(21)
    for (const t of rows.Team!) {
      const ps = rows.Player!.filter((p) => p.team_id === t.id)
      expect(ps.length).toBeGreaterThanOrEqual(10); expect(ps.length).toBeLessThanOrEqual(12)
      expect(ps.filter((p) => p.position === 'GK').length).toBeGreaterThanOrEqual(1)
      expect(ps.some((p) => p.id === t.captain_player_id)).toBe(true)
    }
    expect(ms.filter((m) => m.penalties).length).toBeGreaterThanOrEqual(2)
    expect(ms.filter((m) => m.forfeit_team_id).length).toBe(1)
    expect(ms.filter((m) => m.postponed_from).length).toBe(1)
    expect(rows.MatchEvent!.some((e) => e.type === 'second_yellow')).toBe(true)
    expect(rows.MatchEvent!.some((e) => e.type === 'own_goal')).toBe(true)
    expect(rows.DisciplineCase).toHaveLength(1)
    expect(rows.CaptainMatch!.length).toBeGreaterThanOrEqual(2)
    expect(rows.Match!.some((m) => m.stage === 'final')).toBe(true)
    // aucun joueur fictif ne porte le nom d'un vrai joueur
    const realNames = new Set(real.Player.map((p) => `${p.first_name} ${p.last_name}`.toLowerCase()))
    expect(rows.Player!.filter((p) => realNames.has(`${p.first_name} ${p.last_name}`.toLowerCase()))).toEqual([])
    // le joueur suspendu ne figure sur aucune feuille pendant sa suspension
    const c = rows.DisciplineCase![0]
    const next = ms.filter((m) => m.date! > c.decided_at! && (m.home_team_id === c.team_id || m.away_team_id === c.team_id) && m.competition_id === 'sim_comp_master').sort((a, b) => a.date!.localeCompare(b.date!)).slice(0, 2)
    for (const m of next) expect(rows.Lineup!.find((l) => l.match_id === m.id && l.team_id === c.team_id)!.present_ids).not.toContain(c.player_id)
  })
})
