// Classement IPG (Indice de Performance Globale) — Top 25 fourni par la ligue (IPG_Top25_FINAL_A_REVERIFIER.xlsx).
import { IPG_TOP25, type IPGRow } from '@/api/seed/season2025.data'
import { s25PlayerId } from '@/api/seed/season2025'

export interface IPGEntry extends IPGRow { rank: number; player_id?: string }

/** Trié par indice IPG décroissant (colonne « Indice de Performance Globale »). */
export const IPG_RANKING: IPGEntry[] = [...IPG_TOP25]
  .sort((a, b) => b.ipg - a.ipg)
  .map((r, i) => ({ ...r, rank: i + 1, player_id: r.player >= 0 ? s25PlayerId(r.player) : undefined }))

export function splitName(full: string) {
  const m = full.trim().match(/^([A-Za-zÀ-ÿ])\.\s*(.+)$/)
  const last = (m ? m[2] : full).trim()
  return { first: m ? `${m[1].toUpperCase()}.` : '', last: last.toLowerCase().replace(/(^|[\s-])\S/g, (x) => x.toUpperCase()) }
}
