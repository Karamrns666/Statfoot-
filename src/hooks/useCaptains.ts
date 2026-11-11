import { useMemo } from 'react'
import { useData } from './useData'
import { captainPlayerStats, captainRecord, captainTeams } from '@/lib/captains'

/** Données du Match des capitaines (lues UNIQUEMENT ici, jamais par les calculs de la ligue). */
export function useCaptains() {
  const { db } = useData()
  return useMemo(() => {
    const matches = db.CaptainMatch ?? []
    return { teams: captainTeams(db.CaptainTeam), matches, record: captainRecord(matches), stats: captainPlayerStats(matches) }
  }, [db.CaptainMatch, db.CaptainTeam])
}
