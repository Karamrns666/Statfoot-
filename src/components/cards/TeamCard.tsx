// Carte équipe : même système de niveau que la carte joueur (Platinum / Gold / Silver selon l'ancienneté du club) —
// logo en grand, nom, badge de niveau, nombre de saisons MBL, division et 3 stats clés de la saison.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Team } from '@/types/entities'
import { isBrandLogo, teamLogoSvg } from '@/lib/logos'
import { SENIORITY_STYLE, type SeniorityTier } from '@/lib/seniority'
import { useData } from '@/hooks/useData'
import { useSeasonCompetitions } from '@/hooks/useStats'
import { useTeamSeniority } from '@/hooks/useSeniority'
import { useCardShine } from '@/hooks/useCardShine'
import { competitionStandings } from '@/lib/stats'
import { competitionNames, phaseName } from '@/lib/competitionNames'
import { cn } from '@/lib/utils'
import { TierRibbon, TierSurface } from './TierSurface'

export interface TeamCardProps {
  team: Team
  tier: SeniorityTier
  seasons: number
  /** MASTER / CHALLENGER (ou « Pré-saison » avant la répartition) */
  division?: string
  points?: number
  goals?: number
  rank?: number
  href?: string
  className?: string
  /** export PNG : pas de lien ni d'effet */
  faceOnly?: boolean
}

export function TeamCard(p: TeamCardProps) {
  const st = SENIORITY_STYLE[p.tier]
  const shine = useCardShine<HTMLDivElement>()
  const logo = p.team.logo_url || teamLogoSvg(p.team.short_name, p.team.primary_color, p.team.secondary_color)
  const brand = isBrandLogo(p.team.logo_url)
  const stats = [
    { label: 'PTS', value: p.points ?? 0, hint: 'Points' },
    { label: 'BUTS', value: p.goals ?? 0, hint: 'Buts marqués' },
    { label: 'RANG', value: p.rank ? `${p.rank}e` : '–', hint: 'Classement' },
  ]
  const body = (
    <TierSurface tier={p.tier}>
      <TierRibbon tier={p.tier} />
      {/* logo en grand, sur un halo aux couleurs du club */}
      <div className="relative flex h-[50%] shrink-0 items-end justify-center pb-[2%]">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(48% 46% at 50% 62%, ${p.team.primary_color ?? '#0B2E73'}55, transparent 72%)` }} aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 font-display text-[7.5em] font-black leading-none opacity-[.07]" aria-hidden>{p.team.short_name}</div>
        <img src={logo} alt="" draggable={false}
          className={cn('relative size-[52%] object-contain', brand ? 'rounded-[22%] bg-white p-[3%] shadow-[0_10px_24px_rgb(0_0_0/.35)]' : 'drop-shadow-[0_10px_16px_rgb(0_0_0/.45)]')}
          style={brand && p.tier === 'platinum' ? { boxShadow: '0 0 0 2px rgb(230 236 245 / .9), 0 0 22px rgb(167 139 250 / .55), 0 10px 24px rgb(0 0 0 / .45)' } : undefined} />
      </div>
      <div className="relative z-10 px-[7%] text-center">
        <div className="line-clamp-2 pt-[.12em] font-display text-[2em] font-black uppercase leading-[1.02]" style={{ textShadow: st.textShadow }}>{p.team.name}</div>
        <div className="mt-[.55em] flex flex-wrap items-center justify-center gap-[.4em] text-[.82em] font-extrabold">
          {p.division && <span className="rounded-full px-[.7em] py-[.25em] uppercase tracking-wider" style={{ background: st.bar, color: st.barText }}>{p.division}</span>}
          <span style={{ color: st.fgSoft }}>{p.seasons} saison{p.seasons > 1 ? 's' : ''} MBL</span>
        </div>
      </div>
      <div className="relative mt-auto grid grid-cols-3 divide-x divide-white/15 border-t-[.22em] border-[#F05A22]" style={{ background: st.bar, color: st.barText }}>
        {stats.map((s) => (
          <div key={s.label} className="py-[.65em] text-center" title={s.hint}>
            <div className="font-display text-[1.9em] font-extrabold leading-none">{s.value}</div>
            <div className="mt-[.15em] text-[.75em] font-bold" style={{ color: st.barLabel }}>{s.label}</div>
          </div>
        ))}
      </div>
    </TierSurface>
  )
  const inner = <div className="pcard-inner text-[clamp(8.5px,4.6cqw,40px)]">{body}</div>
  if (p.faceOnly || !p.href) return <div className={cn('pcard tcard aspect-[63/92] w-full', p.className)} {...(p.faceOnly ? {} : shine)}>{inner}</div>
  return (
    <Link to={p.href} aria-label={`${p.team.name} — fiche de l'équipe`} className={cn('block w-full rounded-2xl outline-none transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon', p.className)}>
      <div className="pcard tcard aspect-[63/92] w-full" {...shine}>{inner}</div>
    </Link>
  )
}

/** Statistiques de la saison d'une équipe : division, points, buts marqués, rang */
export function useTeamCardData(teamId: string) {
  const { league } = useData()
  const comps = useSeasonCompetitions()
  const sen = useTeamSeniority(teamId)
  return useMemo(() => {
    const div = comps.find((c) => (c.phase === 'gold' || c.phase === 'silver') && c.team_ids?.includes(teamId))
    const comp = div ?? comps.find((c) => c.team_ids?.includes(teamId))
    const row = comp ? competitionStandings(league, comp.id).find((r) => r.team_id === teamId) : undefined
    return {
      tier: sen?.tier ?? 'silver' as SeniorityTier, seasons: sen?.seasons ?? 1,
      division: div ? phaseName(div.phase) : comp?.phase === 'league_phase' ? competitionNames().league_phase : comp ? phaseName(comp.phase) : undefined,
      points: row?.points ?? 0, goals: row?.gf ?? 0, rank: row && row.played ? row.rank : undefined,
    }
  }, [league, comps, sen, teamId])
}

/** Carte d'une équipe de la saison affichée (données calculées) */
export function SeasonTeamCard({ team, className, faceOnly }: { team: Team; className?: string; faceOnly?: boolean }) {
  const d = useTeamCardData(team.id)
  return <TeamCard team={team} {...d} href={faceOnly ? undefined : `/equipes/${team.id}`} className={className} faceOnly={faceOnly} />
}
