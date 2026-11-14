import type { CSSProperties } from 'react'
// Légende des 3 niveaux de carte, côte à côte (page Équipes, page Joueurs)
import { InfoTip } from '@/components/league/InfoTip'
import { SENIORITY_LABEL, SENIORITY_ORDER, SENIORITY_RULE, SENIORITY_STYLE } from '@/lib/seniority'
import { TierIcon } from '@/components/league/SeniorityBadge'
import { useCardShine } from '@/hooks/useCardShine'
import { cn } from '@/lib/utils'

function LegendCard({ tier }: { tier: (typeof SENIORITY_ORDER)[number] }) {
  const st = SENIORITY_STYLE[tier]
  const shine = useCardShine<HTMLDivElement>()
  return (
    <div className="tcard w-full [container-type:inline-size]" {...shine}>
      <div className="rounded-[14px] p-[2.5px]" style={{ background: st.frame, filter: `drop-shadow(0 6px 12px ${st.glow})` }}>
        <div className="relative overflow-hidden rounded-[12px] px-2 py-3 text-center" style={{ background: st.bg, color: st.fg }}>
          {st.pattern && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: st.pattern }} aria-hidden />}
          <div className={cn('pointer-events-none absolute inset-0', tier === 'platinum' && 'pcard-prism')} style={{ background: st.sheen, mixBlendMode: st.sheenBlend as CSSProperties['mixBlendMode'] }} aria-hidden />
          {st.holo && <div className="pcard-holo pointer-events-none absolute inset-0" style={{ backgroundImage: st.holo }} aria-hidden />}
          <div className="pcard-glare pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative flex flex-col items-center gap-1">
            <TierIcon tier={tier} className="size-5 sm:size-6" style={{ filter: tier === 'platinum' ? 'drop-shadow(0 0 8px rgb(167 139 250 / .8))' : undefined }} />
            <div className="font-display text-[clamp(13px,7cqw,22px)] font-black uppercase leading-none tracking-[.12em]" style={{ textShadow: st.textShadow }}>{SENIORITY_LABEL[tier]}</div>
            <div className="text-[clamp(10px,5cqw,13px)] font-bold leading-tight" style={{ color: st.fgSoft }}>{SENIORITY_RULE[tier]}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TierLegendCards({ className, title = 'Niveau de la carte = ancienneté du club' }: { className?: string; title?: string }) {
  return (
    <section className={cn('mb-6', className)} aria-label="Légende des niveaux de carte">
      <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">{title}<InfoTip id="niveaux" /></p>
      <div className="grid max-w-xl grid-cols-3 gap-2 sm:gap-4">
        {SENIORITY_ORDER.map((t) => <LegendCard key={t} tier={t} />)}
      </div>
    </section>
  )
}
