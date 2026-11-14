// Ajustements manuels de classement (super-admin) : couche SÉPARÉE appliquée par-dessus le calcul automatique.
// Le calcul automatique n'est jamais modifié : on part de ses lignes, on ajoute les corrections actives,
// puis on retrie. Annuler un ajustement (active = false) rend exactement le classement automatique.
import type { StandingAdjustment } from '@/types/entities'

export interface AdjustableRow { team_id: string; points: number; gf: number; ga: number }

export const activeAdjustments = (list: StandingAdjustment[] | undefined, competitionId: string) =>
  (list ?? []).filter((a) => a.active && a.competition_id === competitionId)

/** Totaux des corrections actives par équipe */
export function adjustmentTotals(adjs: StandingAdjustment[]) {
  const out = new Map<string, { points: number; gf: number; ga: number; forced?: number; items: StandingAdjustment[] }>()
  for (const a of adjs) {
    const t = out.get(a.team_id) ?? { points: 0, gf: 0, ga: 0, items: [] }
    t.points += a.points ?? 0; t.gf += a.gf ?? 0; t.ga += a.ga ?? 0
    if (a.forced_order != null) t.forced = a.forced_order
    t.items.push(a)
    out.set(a.team_id, t)
  }
  return out
}

/** Applique points / buts (copie des lignes ; `diffKey` = gd ou diff selon le tableau) */
export function applyAdjustments<R extends AdjustableRow>(rows: R[], adjs: StandingAdjustment[], diffKey: 'gd' | 'diff' = 'gd'): R[] {
  if (!adjs.length) return rows
  const tot = adjustmentTotals(adjs)
  return rows.map((r) => {
    const t = tot.get(r.team_id); if (!t) return r
    const gf = r.gf + t.gf, ga = r.ga + t.ga
    return { ...r, points: r.points + t.points, gf, ga, [diffKey]: gf - ga }
  })
}

/**
 * Ordre imposé parmi les équipes à égalité de points : dans chaque bloc d'équipes au même total, celles qui ont
 * un ordre imposé passent devant (1, 2, …), les autres gardent l'ordre du départage automatique.
 */
export function applyForcedOrder<R extends { team_id: string; points: number }>(sorted: R[], adjs: StandingAdjustment[]): R[] {
  const forced = new Map<string, number>()
  for (const a of adjs) if (a.forced_order != null) forced.set(a.team_id, a.forced_order)
  if (!forced.size) return sorted
  const out: R[] = []
  for (let i = 0; i < sorted.length;) {
    let j = i; while (j < sorted.length && sorted[j].points === sorted[i].points) j++
    const block = sorted.slice(i, j).map((r, k) => ({ r, k }))
    block.sort((a, b) => (forced.get(a.r.team_id) ?? 1e6) - (forced.get(b.r.team_id) ?? 1e6) || a.k - b.k)
    out.push(...block.map((x) => x.r)); i = j
  }
  return out
}

const fmtSigned = (n: number, unit: string) => `${n > 0 ? '+' : '−'}${Math.abs(n)} ${unit}`
const fmtDay = (d: string) => { const [y, m, j] = d.slice(0, 10).split('-'); return y && m && j ? `${j}/${m}` : d }

/** « −3 pts : décision Ardentia du 20/11 » */
export function adjustmentLabel(a: StandingAdjustment) {
  const parts: string[] = []
  if (a.points) parts.push(fmtSigned(a.points, a.points === 1 || a.points === -1 ? 'pt' : 'pts'))
  if (a.gf) parts.push(fmtSigned(a.gf, a.gf === 1 || a.gf === -1 ? 'but pour' : 'buts pour'))
  if (a.ga) parts.push(fmtSigned(a.ga, a.ga === 1 || a.ga === -1 ? 'but contre' : 'buts contre'))
  if (a.forced_order != null) parts.push(`ordre imposé à égalité (${a.forced_order})`)
  return `${parts.join(', ') || 'Ajustement'} : décision Ardentia du ${fmtDay(a.decision_date)}`
}
