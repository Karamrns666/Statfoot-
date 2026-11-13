import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { isDeletableSimRow } from './simMode'
import { SIM_ID } from './constants'

describe('suppression de la simulation', () => {
  it('ne supprime JAMAIS une donnée réelle', () => {
    const real = [
      { entity: 'Team', id: 't26_cob', data: { id: 't26_cob', name: 'Cobco' } },
      { entity: 'Player', id: 'p1', data: { id: 'p1', is_simulation: false, simulation_id: SIM_ID } },
      { entity: 'Match', id: 'm1', data: { id: 'm1', simulation_id: SIM_ID } }, // drapeau absent
      { entity: 'Match', id: 'm2', data: { id: 'm2', is_simulation: 'true', simulation_id: SIM_ID } }, // pas un vrai booléen
      { entity: 'Match', id: 'm3', data: { id: 'm3', is_simulation: true, simulation_id: 'autre-simulation' } },
      { entity: 'Season', id: 'season_2026', data: null },
    ]
    for (const r of real) expect(isDeletableSimRow(r)).toBe(false)
    expect(isDeletableSimRow({ entity: 'Team', id: 'x', data: { is_simulation: true, simulation_id: SIM_ID }, sim_id: 'autre', is_simulation: true })).toBe(false)
  })
  it('supprime les lignes de la simulation demandée', () => {
    expect(isDeletableSimRow({ data: { id: 'sim_t_cob', is_simulation: true, simulation_id: SIM_ID }, sim_id: SIM_ID, is_simulation: true })).toBe(true)
  })
  it('la fonction SQL filtre sur le simulationId ET isSimulation, et seulement dans la table de simulation', () => {
    const sql = readFileSync('supabase/simulation.sql', 'utf8')
    const fn = sql.slice(sql.indexOf('function public.delete_simulation'), sql.indexOf('end $$;', sql.indexOf('function public.delete_simulation')))
    expect(fn).toMatch(/delete from public\.sim_rows/)
    expect(fn).not.toMatch(/entity_rows/)
    expect(fn).toMatch(/sim_id = p_sim_id and is_simulation = true/)
    expect(fn).toMatch(/\(data->>'is_simulation'\)::boolean is true and data->>'simulation_id' = p_sim_id/)
    expect(fn).toMatch(/is_super_admin\(\)/)
    // aucune politique DELETE directe sur la table de simulation, et rien ne touche entity_rows
    expect(sql).not.toMatch(/for delete/)
    expect(sql).not.toMatch(/(delete from|update|insert into)\s+public\.entity_rows/)
  })
})
