// Sélecteur de saison global ("Toutes saisons" / saison)
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData } from './useData'
import type { Season } from '@/types/entities'

interface SeasonCtx { seasonId: string; setSeasonId: (id: string) => void; season: Season | null; scopeSeasonId: string | null; seasons: Season[] }
const Ctx = createContext<SeasonCtx | null>(null)
const KEY = 'statfoot:ui:season'

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { db, ready } = useData()
  const [seasonId, setSeasonIdState] = useState<string>(() => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } })
  const seasons = useMemo(() => [...db.Season].sort((a, b) => b.start_date.localeCompare(a.start_date)), [db.Season])
  useEffect(() => {
    if (!ready) return
    if (seasonId !== 'all' && !seasons.find((s) => s.id === seasonId)) {
      setSeasonIdState(seasons.find((s) => s.is_active)?.id ?? seasons[0]?.id ?? 'all')
    }
  }, [ready, seasons, seasonId])
  const value = useMemo<SeasonCtx>(() => {
    const season = seasons.find((s) => s.id === seasonId) ?? null
    return {
      seasonId, seasons, season, scopeSeasonId: seasonId === 'all' ? null : seasonId || null,
      setSeasonId: (id) => { setSeasonIdState(id); try { localStorage.setItem(KEY, id) } catch { /* ignore */ } },
    }
  }, [seasonId, seasons])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useSeason() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSeason hors SeasonProvider')
  return v
}
