// Sélecteur de saison global ("Toutes saisons" / saison)
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData } from './useData'
import type { Season } from '@/types/entities'

interface SeasonCtx { seasonId: string; setSeasonId: (id: string) => void; season: Season | null; scopeSeasonId: string | null; seasons: Season[]; allSeasons: Season[]; hasHidden: boolean }
const Ctx = createContext<SeasonCtx | null>(null)
const KEY = 'statfoot:ui:season'

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { db, ready } = useData()
  const [seasonId, setSeasonIdState] = useState<string>(() => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } })
  const allSeasons = useMemo(() => [...db.Season].sort((a, b) => b.start_date.localeCompare(a.start_date)), [db.Season])
  // saisons masquées : absentes du site public ; « Toutes saisons » est alors retiré (il les mélangerait)
  const seasons = useMemo(() => allSeasons.filter((s) => !s.hidden), [allSeasons])
  const hasHidden = seasons.length < allSeasons.length
  useEffect(() => {
    if (!ready) return
    if ((seasonId === 'all' && hasHidden) || (seasonId !== 'all' && !seasons.find((s) => s.id === seasonId))) {
      setSeasonIdState(seasons.find((s) => s.is_active)?.id ?? seasons[0]?.id ?? 'all')
    }
  }, [ready, seasons, seasonId, hasHidden])
  const value = useMemo<SeasonCtx>(() => {
    const season = seasons.find((s) => s.id === seasonId) ?? null
    return {
      seasonId, seasons, allSeasons, hasHidden, season,
      scopeSeasonId: seasonId === 'all' ? (hasHidden ? seasons.find((s) => s.is_active)?.id ?? seasons[0]?.id ?? null : null) : seasonId || null,
      setSeasonId: (id) => { setSeasonIdState(id); try { localStorage.setItem(KEY, id) } catch { /* ignore */ } },
    }
  }, [seasonId, seasons, allSeasons, hasHidden])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useSeason() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSeason hors SeasonProvider')
  return v
}
