// Chargement des entités via la couche src/api (mock Base44) + rafraîchissement automatique.
// Dans Base44 : remplacer par des hooks react-query autour de base44.entities.X.list().
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { base44, store } from '@/api/base44Client'
import { ensureSeeded } from '@/api/seed'
import { ENTITY_NAMES, type EntityMap, type EntityName, type Settings } from '@/types/entities'
import type { LeagueData } from '@/lib/stats'

export type DB = { [N in EntityName]: EntityMap[N][] }
interface DataState { db: DB; league: LeagueData; settings: Settings; ready: boolean }
const Ctx = createContext<DataState | null>(null)

const empty = Object.fromEntries(ENTITY_NAMES.map((n) => [n, []])) as unknown as DB

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(empty)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    ensureSeeded()
    let alive = true
    Promise.all(ENTITY_NAMES.map(async (n) => [n, await base44.entities[n].list()] as const)).then((pairs) => {
      if (!alive) return
      setDb(Object.fromEntries(pairs) as unknown as DB)
      setReady(true)
    })
    const unsub = store.subscribe(async (name) => {
      const rows = await base44.entities[name].list()
      if (alive) setDb((d) => ({ ...d, [name]: rows }))
    })
    return () => { alive = false; unsub() }
  }, [])
  const value = useMemo<DataState>(() => {
    const settings = db.Settings[0] ?? ({ id: 'settings' } as Settings)
    const league: LeagueData = {
      seasons: db.Season, competitions: db.Competition, divisions: db.Division, groups: db.Group, teams: db.Team,
      players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule,
      suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings, teamStats: db.MatchTeamStats,
    }
    return { db, league, settings, ready }
  }, [db, ready])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData hors DataProvider')
  return v
}

/** Accès indexé pratique */
export function useLookup() {
  const { db } = useData()
  return useMemo(() => ({
    team: new Map(db.Team.map((t) => [t.id, t])),
    player: new Map(db.Player.map((p) => [p.id, p])),
    competition: new Map(db.Competition.map((c) => [c.id, c])),
    season: new Map(db.Season.map((s) => [s.id, s])),
    venue: new Map(db.Venue.map((v) => [v.id, v])),
    group: new Map(db.Group.map((g) => [g.id, g])),
    division: new Map(db.Division.map((d) => [d.id, d])),
    live: new Map(db.LiveState.map((l) => [l.match_id, l])),
  }), [db])
}
