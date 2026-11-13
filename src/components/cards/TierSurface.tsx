// Habillage commun des cartes joueur et équipe selon le niveau d'ancienneté du club :
// liseré métallique, fond, matière (holographique / or / métal brossé), motif, brillance et libellé du niveau.
import type { CSSProperties, ReactNode } from 'react'
import { SENIORITY_LABEL, SENIORITY_STYLE, type SeniorityTier } from '@/lib/seniority'
import { TierIcon } from '@/components/league/SeniorityBadge'
import { cn } from '@/lib/utils'

/** Fond + matière de la carte. `children` : contenu posé par-dessus. */
export function TierSurface({ tier, children, className, style }: { tier: SeniorityTier; children: ReactNode; className?: string; style?: CSSProperties }) {
  const st = SENIORITY_STYLE[tier]
  return (
    <div className={cn('pcard-face pcard-shape overflow-hidden rounded-b-2xl', className)} data-tier={tier}
      style={{ background: st.frame, padding: tier === 'platinum' ? 3.5 : 3, filter: `drop-shadow(0 14px 22px ${st.glow})`, ...style }}>
      <div className="pcard-shape relative flex h-full flex-col overflow-hidden rounded-b-[13px]" style={{ background: st.bg, color: st.fg }}>
        {st.pattern && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: st.pattern }} aria-hidden />}
        <div className={cn('pointer-events-none absolute inset-0', tier === 'platinum' && 'pcard-prism')} style={{ background: st.sheen, mixBlendMode: st.sheenBlend as CSSProperties['mixBlendMode'] }} aria-hidden />
        {st.holo && <div className="pcard-holo pointer-events-none absolute inset-0" style={{ backgroundImage: st.holo }} aria-hidden />}
        {/* liseré intérieur : platine brillant / or / acier */}
        <div className="pointer-events-none absolute inset-[3px] rounded-b-[11px] pcard-shape" style={{ boxShadow: tier === 'platinum' ? 'inset 0 0 0 1px rgb(230 236 245 / .45)' : 'inset 0 0 0 1px rgb(255 255 255 / .5)' }} aria-hidden />
        <div className="pcard-glare pointer-events-none absolute inset-0" aria-hidden />
        <div className="pcard-sheen pointer-events-none absolute inset-0" aria-hidden />
        {children}
      </div>
    </div>
  )
}

/** Libellé du niveau en toutes lettres, avec son icône, en haut de la carte */
export function TierRibbon({ tier, extra }: { tier: SeniorityTier; extra?: ReactNode }) {
  const st = SENIORITY_STYLE[tier]
  return (
    <div className="absolute inset-x-0 top-[2.4%] z-10 flex justify-center">
      <div className="flex items-center gap-[.35em] rounded-full px-[.7em] py-[.22em] text-[.7em] font-black uppercase leading-none tracking-[.2em]"
        style={{ background: st.badge, color: st.badgeText, boxShadow: tier === 'platinum' ? 'inset 0 0 0 1px rgb(230 236 245 / .8), 0 0 12px rgb(167 139 250 / .55)' : 'inset 0 0 0 1px rgb(0 0 0 / .15), 0 1px 3px rgb(0 0 0 / .2)' }}>
        <TierIcon tier={tier} className="size-[1.15em]" />
        <span>{SENIORITY_LABEL[tier]}</span>
        {extra}
      </div>
    </div>
  )
}
