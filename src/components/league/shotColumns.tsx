// Colonnes « Tirs · Cadrés · Précision · Tirs/but » réutilisées par tous les tableaux de stats (joueurs et équipes).
import type { SortColumn } from './SortableTable'
import { fmtAccuracy, fmtShots, fmtShotsPerGoal, sortAccuracy, sortShots, sortShotsPerGoal, type ShotTotals } from '@/lib/shots'
import { cn } from '@/lib/utils'

export function shotColumns<T>(get: (r: T) => ShotTotals | null | undefined, hide = ''): SortColumn<T>[] {
  const cell = cn('num text-center text-base', hide)
  const head = cn('text-center', hide)
  return [
    { key: 'shots', label: 'Tirs', headClassName: head, className: cell, sort: (r) => sortShots(get(r), 'shots'), render: (r) => fmtShots(get(r), 'shots') },
    { key: 'on_target', label: 'Cadrés', title: 'Tirs cadrés (buts compris)', headClassName: head, className: cell, sort: (r) => sortShots(get(r), 'on_target'), render: (r) => fmtShots(get(r), 'on_target') },
    { key: 'accuracy', label: 'Préc.', title: 'Précision : tirs cadrés / tirs', headClassName: head, className: cell, sort: (r) => sortAccuracy(get(r)), render: (r) => fmtAccuracy(get(r)) },
    // moins de tirs par but = plus efficace : premier clic croissant
    { key: 'per_goal', label: 'Tirs/but', title: 'Tirs nécessaires pour marquer un but', first: 'asc', headClassName: head, className: cell, sort: (r) => sortShotsPerGoal(get(r)), render: (r) => fmtShotsPerGoal(get(r)) },
  ]
}
