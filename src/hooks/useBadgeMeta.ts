// Rareté / catégorie / pictogramme d'un badge, avec la rareté éventuellement corrigée dans l'admin (Paramètres)
import { useCallback } from 'react'
import { useData } from './useData'
import { badgeMeta, RARITY_RANK, type BadgeMeta } from '@/lib/badgeCatalog'
import type { BadgeState } from '@/lib/badges'

export function useBadgeMeta() {
  const { settings } = useData()
  const ov = settings.badge_rarity
  return useCallback((id: string): BadgeMeta => badgeMeta(id, ov), [ov])
}
/** Badges débloqués, du plus rare au plus courant (puis palier le plus haut) */
export function useSortByRarity() {
  const meta = useBadgeMeta()
  return useCallback((bs: BadgeState[]) => [...bs].sort((a, b) => {
    const ma = meta(a.def.id), mb = meta(b.def.id)
    return RARITY_RANK[mb.rarity] - RARITY_RANK[ma.rarity] || (mb.level ?? 0) - (ma.level ?? 0)
  }), [meta])
}
