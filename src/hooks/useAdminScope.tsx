// Sélecteur global Saison / Compétition en haut de chaque page admin
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData } from './useData'

interface Ctx { seasonId: string; setSeasonId: (s: string) => void; competitionId: string; setCompetitionId: (c: string) => void }
const C = createContext<Ctx | null>(null)
export function AdminScopeProvider({ children }: { children: ReactNode }) {
  const { db } = useData()
  const active = db.Season.find((s) => s.is_active)?.id ?? db.Season[0]?.id ?? ''
  const [seasonId, setSeasonId] = useState(() => localStorage.getItem('statfoot:admin:season') ?? active)
  const [competitionId, setCompetitionId] = useState('')
  useEffect(() => { if (!db.Season.some((s) => s.id === seasonId)) setSeasonId(active) }, [db.Season, seasonId, active])
  useEffect(() => { try { localStorage.setItem('statfoot:admin:season', seasonId) } catch { /* */ } }, [seasonId])
  useEffect(() => { if (competitionId && !db.Competition.some((c) => c.id === competitionId && c.season_id === seasonId)) setCompetitionId('') }, [seasonId, competitionId, db.Competition])
  const v = useMemo(() => ({ seasonId, setSeasonId, competitionId, setCompetitionId }), [seasonId, competitionId])
  return <C.Provider value={v}>{children}</C.Provider>
}
export function useAdminScope() { const v = useContext(C); if (!v) throw new Error('useAdminScope'); return v }
