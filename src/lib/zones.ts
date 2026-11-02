import type { Competition, Division } from '@/types/entities'
import type { Zone } from '@/components/standings/StandingsTable'

/** Zones colorées du classement : qualification phase finale, montée, descente. */
export function competitionZones(c: Competition, division: Division | undefined, nTeams: number): Zone[] {
  const zones: Zone[] = []
  const ko = c.knockout_rounds ?? []
  if (ko.length) {
    const q = ko.includes('quarter') ? 8 : ko.includes('semi') ? 4 : 2
    zones.push({ from: 1, to: q, color: '#22d3ee', label: 'Qualifié phase finale' })
  }
  if (division?.promotion_count) zones.push({ from: 1, to: division.promotion_count, color: '#22c55e', label: 'Montée' })
  if (division?.relegation_count) zones.push({ from: nTeams - division.relegation_count + 1, to: nTeams, color: '#ef4444', label: 'Descente' })
  return zones
}
