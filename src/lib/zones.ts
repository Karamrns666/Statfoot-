import type { Competition } from '@/types/entities'
import type { Zone } from '@/components/standings/StandingsTable'

/** Zones du classement : championnat → champion ; phase de ligue (suisse) → Gold (1–10) / Silver (11–20). */
export function competitionZones(c: Competition, nTeams: number, goldSize = 10): Zone[] {
  if (c.format === 'league') return [{ from: 1, to: 1, color: '#F85A00', label: 'Champion' }, { from: 2, to: Math.min(3, nTeams), color: '#6CB4CC', label: 'Podium' }]
  if (c.phase === 'league_phase' && c.split) return [
    { from: 1, to: Math.min(c.split.gold_to, nTeams), color: '#E8B931', label: `Qualifié ${c.split.gold_name ?? 'Gold Cup'}` },
    { from: c.split.silver_from, to: nTeams, color: '#C9D3DD', label: c.split.silver_name ?? 'Silver Cup' },
  ]
  if (c.phase === 'league_phase' && c.format === 'swiss' && !c.split && c.status !== 'finished') return []
  if (c.phase === 'league_phase') return [
    { from: 1, to: Math.min(goldSize, nTeams), color: '#facc15', label: 'Qualifié Gold Cup' },
    { from: goldSize + 1, to: nTeams, color: '#94a3b8', label: 'Silver Cup' },
  ]
  if (c.phase === 'gold') return [{ from: 1, to: 1, color: '#F85A00', label: 'Champion' }]
  return []
}
