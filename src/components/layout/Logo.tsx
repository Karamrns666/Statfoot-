import { Link } from 'react-router-dom'
import { useData } from '@/hooks/useData'

/** Logo texte de la ligue (nom court + nom complet issus des Paramètres) */
export function Logo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
  const { settings } = useData()
  const short = settings.short_name ?? 'MBL'
  return (
    <Link to={to} className="flex items-center gap-2.5">
      {settings.logo_url
        ? <img src={settings.logo_url} alt="" className="size-10 rounded-xl object-contain" />
        : <div className="flex size-10 items-center justify-center rounded-xl bg-neon font-display text-lg font-black text-white shadow-[0_0_18px_-2px_rgb(242_107_29/.8)]">{short.slice(0, 3)}</div>}
      <div className="leading-none">
        <div className="title-caps text-xl text-white">{settings.league_name ?? 'StatFoot'}</div>
        {subtitle && <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.2em] text-neon">{subtitle}</div>}
      </div>
    </Link>
  )
}
