import type { ReactNode } from 'react'
import type { Team } from '@/types/entities'
import { useData } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { ARDENTIA_LOGO_LIGHT, MBL_LOGO } from '@/components/layout/Logo'

/** Cadre commun des visuels 1080×1350 (style MBL : bleu nuit, orange, projecteurs) */
export function VisualFrame({ children, accent = '#F85A00', subtitle, height = 1350 }: { children: ReactNode; accent?: string; subtitle?: string; height?: number }) {
  const { settings } = useData()
  return (
    <div style={{ width: 1080, height, background: `radial-gradient(ellipse 60% 40% at 15% 0%, rgba(160,210,255,.28), transparent 70%), radial-gradient(ellipse 60% 40% at 85% 0%, rgba(160,210,255,.22), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, ${accent}33, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)`, fontFamily: 'Manrope, sans-serif' }} className="relative flex flex-col items-center overflow-hidden px-16 pt-14 text-center">
      {/* en-tête : logo MBL à gauche, Ardentia (organisateur) à droite */}
      <div className="flex w-full items-center justify-between gap-8 text-white">
        <div className="flex items-center gap-5 text-left">
          <img src={settings.logo_url || MBL_LOGO} alt="" style={{ height: 124, width: 'auto' }} />
          <div className="font-display font-black uppercase leading-none">
            <div style={{ fontSize: 46, letterSpacing: 2 }}>{settings.short_name ?? 'MBL'}</div>
            <div style={{ fontSize: 26, letterSpacing: 1.5, color: '#F85A00', marginTop: 6 }}>{settings.league_name}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-semibold uppercase text-white/60" style={{ fontSize: 18, letterSpacing: 3 }}>Organisé par</span>
          <img src={ARDENTIA_LOGO_LIGHT} alt="Ardentia" style={{ height: 66, width: 'auto' }} />
        </div>
      </div>
      {subtitle && <div className="mt-5 w-full text-left font-semibold text-white/60" style={{ fontSize: 30 }}>{subtitle}</div>}
      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
      <div className="absolute inset-x-0 bottom-0 h-4" style={{ background: accent }} />
    </div>
  )
}

export function VisualTeam({ team, big }: { team?: Team; big?: boolean }) {
  const s = big ? 300 : 200
  return (
    <div className="flex flex-col items-center gap-4" style={{ width: s + 40 }}>
      <TeamLogo team={team} size={s} />
      <div className="title-caps text-white" style={{ fontSize: big ? 52 : 40 }}>{team?.short_name}</div>
    </div>
  )
}
