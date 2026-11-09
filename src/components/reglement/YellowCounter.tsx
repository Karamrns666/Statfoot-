// Compteur de cumul des jaunes « 2/3 » (Art. 11.5), avertissement visuel à 2/3.
import { REGLEMENT, counterLabel, isThreatened, type PlayerDiscipline } from '@/lib/reglement'
import { cn } from '@/lib/utils'

export function YellowCounter({ d, className }: { d?: Pick<PlayerDiscipline, 'counter' | 'remaining'>; className?: string }) {
  const n = Math.min(d?.counter ?? 0, REGLEMENT.cards.yellowsForSuspension)
  const warn = isThreatened(d)
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label={`Cartons jaunes : ${counterLabel(d)}`} title={`Cumul de jaunes (Art. ${REGLEMENT.cards.artYellow}) : à ${REGLEMENT.cards.yellowsForSuspension}, 1 match de suspension`}>
      {Array.from({ length: REGLEMENT.cards.yellowsForSuspension }, (_, i) => <span key={i} className={cn('h-4 w-3 rounded-[2px] border', i < n ? 'border-amber-300 bg-amber-300' : 'border-white/20')} aria-hidden />)}
      <span className={cn('num text-sm', warn ? 'text-amber-300' : 'text-muted-foreground')}>{counterLabel(d)}</span>
    </span>
  )
}
