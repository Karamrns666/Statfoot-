import type { ReactNode } from 'react'
import type { Team } from '@/types/entities'
import { useData } from '@/hooks/useData'
import { teamLogoSvg } from '@/lib/logos'

/** Cadre commun des visuels 1080×1350 (style MBL : bleu nuit, orange, projecteurs) */
export function VisualFrame({ children, accent = '#F85A00', subtitle }: { children: ReactNode; accent?: string; subtitle?: string }) {
  const { settings } = useData()
  return (
    <div style={{ width: 1080, height: 1350, background: `radial-gradient(ellipse 60% 40% at 15% 0%, rgba(160,210,255,.28), transparent 70%), radial-gradient(ellipse 60% 40% at 85% 0%, rgba(160,210,255,.22), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, ${accent}33, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)`, fontFamily: 'Inter, sans-serif' }} className="relative flex flex-col items-center overflow-hidden px-16 pt-20 text-center">
      <div className="flex w-full items-center justify-between font-display font-black uppercase text-white" style={{ fontSize: 40, letterSpacing: 2 }}>
        <span>{settings.short_name ?? 'MBL'}</span><span style={{ color: '#F85A00' }}>{settings.league_name}</span>
      </div>
      <div className="mt-2 w-full text-left font-semibold text-white/60" style={{ fontSize: 30 }}>{subtitle}</div>
      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
      <div className="absolute inset-x-0 bottom-0 h-4" style={{ background: accent }} />
    </div>
  )
}

export function VisualTeam({ team, big }: { team?: Team; big?: boolean }) {
  const s = big ? 300 : 200
  return (
    <div className="flex flex-col items-center gap-4" style={{ width: s + 40 }}>
      <img src={team?.logo_url || teamLogoSvg(team?.short_name ?? '?')} width={s} height={s} alt="" style={{ borderRadius: '22%' }} />
      <div className="title-caps text-white" style={{ fontSize: big ? 52 : 40 }}>{team?.short_name}</div>
    </div>
  )
}
