import { Link } from 'react-router-dom'
import { useData } from '@/hooks/useData'
import { cn } from '@/lib/utils'

export const MBL_LOGO = '/brand/mbl-logo.png'
export const ARDENTIA_LOGO_LIGHT = '/brand/ardentia-logo-light.png'
export const ARDENTIA_MARK = '/brand/ardentia-mark.png'

/** Blason MBL + nom de la ligue (issus des Paramètres) */
export function Logo({ to = '/', subtitle, className }: { to?: string; subtitle?: string; className?: string }) {
  const { settings } = useData()
  const name = settings.league_name ?? 'Morocco Business League'
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)} aria-label={`${settings.short_name ?? 'MBL'} — ${name}, accueil`}>
      <img src={settings.logo_url || MBL_LOGO} alt="" fetchPriority="high" width={41} height={44} className="h-11 w-auto shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,.45)]" />
      <div className="leading-none">
        <div className="font-display text-[22px] font-black uppercase tracking-[.01em] text-white">{settings.short_name ?? 'MBL'}</div>
        {subtitle !== '' && <div className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-sky-soft">{subtitle ?? name}</div>}
      </div>
    </Link>
  )
}

/** Signature « Organisé par Ardentia » */
export function OrganizedBy({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-muted-foreground', className)}>
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>Organisé par</span>
      <img src={ARDENTIA_LOGO_LIGHT} alt="Ardentia" className={size === 'sm' ? 'h-5 w-auto' : 'h-7 w-auto'} />
    </span>
  )
}
