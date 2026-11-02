import { useMemo } from 'react'
import { useData } from './useData'
import { useSeason } from './useSeason'
import { computePlayerXP, computeTeamStats, raceWithEvolution, type LeagueData, type RaceKey, type XPScope } from '@/lib/stats'
import { allPlayerLogs, cardMaterial, playerBadges, unlockedByRarity, type BadgeState, type BadgeTier } from '@/lib/badges'

/** Saison "effective" : la saison sélectionnée, ou la saison active si "Toutes saisons". */
export function useEffectiveSeason() {
  const { seasons, season } = useSeason()
  return season ?? seasons.find((s) => s.is_active) ?? seasons[0] ?? null
}
export function useSeasonCompetitions(seasonId?: string | null) {
  const { db } = useData()
  const eff = useEffectiveSeason()
  const sid = seasonId ?? eff?.id
  return useMemo(() => db.Competition.filter((c) => c.season_id === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [db.Competition, sid])
}
const k = (s: object) => JSON.stringify(s)
/** XP + stats joueurs — LA source unique (fiche joueur, trophées, accueil, admin) */
export function usePlayerXP(scope: XPScope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computePlayerXP(league, scope), [league, k(scope)])
}
export function useRace(scope: XPScope, key: RaceKey) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => raceWithEvolution(league, scope, key), [league, k(scope), key])
}
export function useTeamStats(scope: XPScope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeTeamStats(league, scope), [league, k(scope)])
}

export interface PlayerBadgeSummary { badges: BadgeState[]; unlocked: BadgeState[]; material: BadgeTier | null; total: number }
// cache partagé : chaque carte appelle le hook, le calcul n'est fait qu'une fois par (données, saison)
const badgeCache = new WeakMap<object, Map<string, Map<string, PlayerBadgeSummary>>>()
function computeAllBadges(league: LeagueData, seasonId: string | null | undefined) {
  let bySeason = badgeCache.get(league)
  if (!bySeason) { bySeason = new Map(); badgeCache.set(league, bySeason) }
  const key = seasonId ?? 'all'
  const hit = bySeason.get(key)
  if (hit) return hit
  const logs = allPlayerLogs(league, seasonId)
  const out = new Map<string, PlayerBadgeSummary>()
  for (const p of league.players) {
    const log = logs.get(p.id) ?? []
    const badges = playerBadges(log, { keeper: p.position === 'GK' || log.some((l) => l.keeper && l.saves > 0) })
    out.set(p.id, { badges, unlocked: unlockedByRarity(badges), material: cardMaterial(badges), total: badges.length })
  }
  bySeason.set(key, out)
  return out
}
/** Badges de tous les joueurs d'une saison (par défaut : la saison affichée) — utilisé par les cartes */
export function usePlayerBadges(seasonId?: string | null) {
  const { league } = useData()
  const { scopeSeasonId } = useSeason()
  const eff = useEffectiveSeason()
  const sid = seasonId !== undefined ? seasonId : scopeSeasonId ?? eff?.id ?? null
  return useMemo(() => computeAllBadges(league, sid), [league, sid])
}
