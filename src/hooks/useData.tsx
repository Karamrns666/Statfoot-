// Chargement des entités via la couche src/api (mock Base44) + rafraîchissement automatique.
// Dans Base44 : remplacer par des hooks react-query autour de base44.entities.X.list().
import { createContext, startTransition, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyCompetitionNames } from '@/lib/competitionNames'
import { base44, store } from '@/api/base44Client'
import { startCloudSync } from '@/api/cloudSync'
import { cloudEnabled } from '@/api/cloud'
import { ENTITY_NAMES, type EntityMap, type EntityName, type Settings } from '@/types/entities'
import type { LeagueData } from '@/lib/stats'
import { leagueFromDb } from '@/lib/leagueData'
import { onSimChange, resumeSimulation, simState } from '@/sim/simMode'

export type DB = { [N in EntityName]: EntityMap[N][] }
interface DataState { db: DB; league: LeagueData; settings: Settings; ready: boolean; simulation: boolean }
const Ctx = createContext<DataState | null>(null)

const empty = Object.fromEntries(ENTITY_NAMES.map((n) => [n, []])) as unknown as DB

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(empty)
  const [ready, setReady] = useState(false)
  // mode simulation (admin) : tout le site lit le jeu de données simulé, rangé à part des vraies données
  const [sim, setSim] = useState(simState())
  useEffect(() => onSimChange(() => setSim(simState())), [])
  useEffect(() => {
    let alive = true
    if (cloudEnabled && store.all('AdminUser').length) store.replace('AdminUser', []) // anciens comptes de démonstration locaux
    // Données locales de la ligue (jeu de départ) : chargées seulement hors Supabase, ou en secours si Supabase
    // ne répond pas et que ce navigateur n'a encore aucune donnée → le visiteur ne calcule plus toute la ligue pour rien.
    const seedLocal = () => import('@/api/seed').then((m) => { m.ensureSeeded() })
    // Supabase : on attend la première copie des données partagées (12 s maximum, sinon données locales)
    const first = cloudEnabled
      ? Promise.race([startCloudSync(), new Promise((r) => setTimeout(r, 12000))]).then(() => (store.all('Team').length ? undefined : seedLocal()))
      : seedLocal()
    first.then(() => Promise.all(ENTITY_NAMES.map(async (n) => [n, await base44.entities[n].list()] as const))).then((pairs) => {
      if (!alive) return
      // premier rendu avec les données : en transition (React découpe le travail → page qui reste réactive)
      startTransition(() => {
        setDb(Object.fromEntries(pairs) as unknown as DB)
        setReady(true)
      })
      resumeSimulation()
    })
    const unsub = store.subscribe(async (name) => {
      const rows = await base44.entities[name].list()
      if (alive) setDb((d) => ({ ...d, [name]: rows }))
    })
    return () => { alive = false; unsub() }
  }, [])
  const value = useMemo<DataState>(() => {
    const simulation = sim.active && !!sim.rows
    const view: DB = simulation ? (Object.fromEntries(ENTITY_NAMES.map((n) => [n, (sim.rows as Record<string, unknown[]>)[n] ?? []])) as unknown as DB) : db
    const settings = view.Settings[0] ?? ({ id: 'settings' } as Settings)
    applyCompetitionNames(settings) // noms MASTER / CHALLENGER (config admin) disponibles partout
    const league: LeagueData = leagueFromDb(view, settings)
    return { db: view, league, settings, ready, simulation }
  }, [db, ready, sim])
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
    match: new Map(db.Match.map((m) => [m.id, m])),
  }), [db])
}
