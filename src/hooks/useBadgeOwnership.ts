// Qui a débloqué chaque badge dans la saison (joueurs RÉELLEMENT inscrits à la saison uniquement)
import { useMemo } from 'react'
import { useData } from './useData'
import { usePlayerBadges } from './useStats'
import type { BadgeState } from '@/lib/badges'
import type { Match } from '@/types/entities'

export interface Ownership { count: number; total: number; pct: number; players: string[] }

export function useBadgeOwnership(seasonId: string | null) {
  const { db } = useData()
  const all = usePlayerBadges(seasonId)
  return useMemo(() => {
    const ids = db.Player.filter((p) => !seasonId || p.season_ids?.includes(seasonId)).map((p) => p.id)
    const out = new Map<string, Ownership>()
    for (const pid of ids) for (const b of all.get(pid)?.badges ?? []) {
      const o = out.get(b.def.id) ?? { count: 0, total: ids.length, pct: 0, players: [] }
      if (b.unlocked) { o.count++; o.players.push(pid) }
      out.set(b.def.id, o)
    }
    for (const o of out.values()) o.pct = o.total ? (o.count / o.total) * 100 : 0
    return out
  }, [db.Player, all, seasonId])
}

/** Derniers badges débloqués (matchs validés), du plus récent au plus ancien */
export function useRecentUnlocks(seasonId: string | null, n = 8) {
  const { db } = useData()
  const all = usePlayerBadges(seasonId)
  return useMemo(() => {
    const rows: { playerId: string; badge: BadgeState; match: Match }[] = []
    for (const p of db.Player) {
      if (seasonId && !p.season_ids?.includes(seasonId)) continue
      for (const b of all.get(p.id)?.badges ?? []) if (b.unlocked && b.unlocked_match) rows.push({ playerId: p.id, badge: b, match: b.unlocked_match })
    }
    return rows.sort((a, b) => (b.match.date ?? '').localeCompare(a.match.date ?? '')).slice(0, n)
  }, [db.Player, all, seasonId, n])
}
