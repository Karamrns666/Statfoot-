// Indicateur d'infériorité numérique après un rouge (Art. 2.7) : « 5 c. 6 — 1:43 ». Match centre et mode TV.
import { fmtInferiority, REGLEMENT, type Inferiority } from '@/lib/reglement'
import { cn } from '@/lib/utils'

export function InferiorityBar({ list, home, away, size = 'md' }: { list: Inferiority[]; home?: string; away?: string; size?: 'md' | 'xl' }) {
  if (!list.length) return null
  return (
    <div className={cn('mt-2 flex flex-wrap justify-center gap-2', size === 'xl' && 'mt-4 gap-4')} role="status" aria-live="polite">
      {list.map((inf) => (
        <span key={inf.side} className={cn('inline-flex items-center gap-2 rounded-full border border-red-400/50 bg-red-500/15 font-bold text-red-100', size === 'xl' ? 'px-5 py-2 text-3xl' : 'px-3 py-1 text-sm')}
          title={`Infériorité numérique de ${REGLEMENT.inferiority.ms / 60000} minutes de jeu effectif après un carton rouge (Art. ${REGLEMENT.inferiority.art})`}>
          <span className={cn('rounded-sm bg-red-500', size === 'xl' ? 'h-7 w-5' : 'h-4 w-3')} aria-hidden />
          <span>{inf.side === 'home' ? home : away}</span>
          <span className="num tabular-nums">{fmtInferiority(inf, list)}</span>
        </span>
      ))}
    </div>
  )
}
