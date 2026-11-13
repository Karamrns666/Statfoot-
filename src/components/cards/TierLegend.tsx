// Légende des 3 niveaux de carte, côte à côte (page Équipes, page Joueurs)
import { SENIORITY_LABEL, SENIORITY_ORDER, SENIORITY_RULE, SENIORITY_STYLE } from '@/lib/seniority'
import { TierIcon } from '@/components/league/SeniorityBadge'
import { useCardShine } from '@/hooks/useCardShine'
import { cn } from '@/lib/utils'
import { TierSurface } from './TierSurface'

function LegendCard({ tier }: { tier: (typeof SENIORITY_ORDER)[number] }) {
  const st = SENIORITY_STYLE[tier]
  const shine = useCardShine<HTMLDivElement>()
  return (
    <div className="pcard aspect-[63/50] w-full" {...shine}>
      <div className="pcard-inner text-[clamp(8px,6cqw,16px)]">
        <TierSurface tier={tier} style={{ filter: `drop-shadow(0 8px 14px ${st.glow})` }}>
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-[.3em] px-[6%] pt-[6%] text-center">
            <TierIcon tier={tier} className="size-[1.9em]" style={{ filter: tier === 'platinum' ? 'drop-shadow(0 0 8px rgb(167 139 250 / .8))' : undefined }} />
            <div className="font-display text-[1.45em] font-black uppercase leading-none tracking-[.12em]" style={{ textShadow: st.textShadow }}>{SENIORITY_LABEL[tier]}</div>
            <div className="text-[.85em] font-bold leading-tight" style={{ color: st.fgSoft }}>{SENIORITY_RULE[tier]}</div>
          </div>
        </TierSurface>
      </div>
    </div>
  )
}

export function TierLegendCards({ className, title = 'Niveau de la carte = ancienneté du club' }: { className?: string; title?: string }) {
  return (
    <section className={cn('mb-6', className)} aria-label="Légende des niveaux de carte">
      <p className="mb-2 text-xs text-muted-foreground">{title}</p>
      <div className="grid max-w-xl grid-cols-3 gap-2 sm:gap-4">
        {SENIORITY_ORDER.map((t) => <LegendCard key={t} tier={t} />)}
      </div>
    </section>
  )
}
