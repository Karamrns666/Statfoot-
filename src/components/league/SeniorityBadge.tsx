// Badge d'ancienneté du club : PLATINUM (≥ 3 saisons) · GOLD (2) · SILVER (1).
import { useTeamSeniority } from '@/hooks/useSeniority'
import { SENIORITY_LABEL, SENIORITY_ORDER, SENIORITY_RULE, SENIORITY_STYLE, type Seniority, type SeniorityTier } from '@/lib/seniority'
import { cn } from '@/lib/utils'

const tip = (s: Seniority) => `${SENIORITY_LABEL[s.tier]} · ${s.seasons} saison${s.seasons > 1 ? 's' : ''} MBL`

export function SeniorityChip({ tier, seasons, size = 'sm', className }: { tier: SeniorityTier; seasons?: number; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const st = SENIORITY_STYLE[tier]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full font-extrabold uppercase leading-none tracking-wide ring-1 ring-black/10',
      size === 'xs' ? 'px-1.5 py-[3px] text-[9px]' : size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs', className)}
      style={{ background: st.frame, color: st.fg }}>
      {SENIORITY_LABEL[tier]}{seasons != null && size !== 'xs' && <span className="font-bold opacity-70">· {seasons} s.</span>}
    </span>
  )
}

/** Pastille ronde (P / G / S) pour les listes serrées sur mobile */
export function SeniorityDot({ tier, className }: { tier: SeniorityTier; className?: string }) {
  const st = SENIORITY_STYLE[tier]
  return <span className={cn('inline-flex size-[15px] shrink-0 items-center justify-center rounded-full text-[8px] font-black leading-none ring-1 ring-black/15', className)} style={{ background: st.frame, color: st.fg }}>{SENIORITY_LABEL[tier][0]}</span>
}

/** Badge d'une équipe (calcul automatique + correction admin). `showSeasons` affiche le nombre de saisons. */
export function SeniorityBadge({ teamId, size = 'sm', showSeasons = false, responsive = false, className }: { teamId?: string; size?: 'xs' | 'sm' | 'md'; showSeasons?: boolean; responsive?: boolean; className?: string }) {
  const s = useTeamSeniority(teamId)
  if (!s) return null
  // responsive : pastille ronde sur mobile, badge complet à partir de 640 px
  if (responsive) return <span title={tip(s)} aria-label={tip(s)} className="inline-flex shrink-0"><SeniorityDot tier={s.tier} className="sm:hidden" /><SeniorityChip tier={s.tier} size={size} className="hidden sm:inline-flex" /></span>
  return <span title={tip(s)} aria-label={tip(s)} className="inline-flex"><SeniorityChip tier={s.tier} seasons={showSeasons ? s.seasons : undefined} size={size} className={className} /></span>
}

export function SeniorityLegend({ className, cards = false }: { className?: string; cards?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground', className)}>
      <span>{cards ? 'Couleur de la carte = ancienneté du club :' : 'Ancienneté du club :'}</span>
      {SENIORITY_ORDER.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5"><SeniorityChip tier={t} size="xs" /><span>{SENIORITY_RULE[t]}</span></span>
      ))}
    </div>
  )
}
