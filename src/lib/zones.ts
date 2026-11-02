import type { Competition } from '@/types/entities'
import type { Zone } from '@/components/standings/StandingsTable'

/** Zones du classement : phase de ligue → Gold (1–10) / Silver (11–20). */
export function competitionZones(c: Competition, nTeams: number, goldSize = 10): Zone[] {
  if (c.phase === 'league_phase') return [
    { from: 1, to: Math.min(goldSize, nTeams), color: '#facc15', label: 'Qualifié Gold Cup' },
    { from: goldSize + 1, to: nTeams, color: '#94a3b8', label: 'Silver Cup' },
  ]
  if (c.phase === 'gold') return [{ from: 1, to: 1, color: '#F26B1D', label: 'Champion' }]
  return []
}
