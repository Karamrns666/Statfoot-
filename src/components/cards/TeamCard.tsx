// Carte équipe HORIZONTALE (design propre aux équipes, différent des cartes joueurs) : le niveau Platinum / Gold / Silver
// se lit à la matière (fond sombre holographique / or / argent brossé) — logo en grand, nom, niveau écrit en toutes
// lettres, nombre de saisons MBL, division et 3 stats clés de la saison.
import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Team } from '@/types/entities'
import { isBrandLogo, teamLogoSvg } from '@/lib/logos'
import { SENIORITY_LABEL, SENIORITY_STYLE, type SeniorityTier } from '@/lib/seniority'
import { useData } from '@/hooks/useData'
import { useSeasonCompetitions } from '@/hooks/useStats'
import { useTeamSeniority } from '@/hooks/useSeniority'
import { useCardShine } from '@/hooks/useCardShine'
import { useCompetitionRanking } from '@/hooks/useRanking'
import { competitionStandings } from '@/lib/stats'
import { competitionNames, phaseName } from '@/lib/competitionNames'
import { cn } from '@/lib/utils'
import { TierIcon } from '@/components/league/SeniorityBadge'

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
    { label: 'RANG', value: p.rank ? (p.rank === 1 ? '1er' : `${p.rank}e`) : '–', hint: p.rank ? 'Classement' : 'Classement disponible après les premiers résultats' },
  ]
  // carte HORIZONTALE propre aux équipes (pas la forme des cartes joueurs) : le niveau se lit à la matière
  const body = (
    <div className="relative h-full rounded-[1.1em] p-[.2em]" style={{ background: st.frame, filter: `drop-shadow(0 .7em 1.1em ${st.glow})` }} data-tier={p.tier}>
      <div className="relative h-full overflow-hidden rounded-[.95em]" style={{ background: st.bg, color: st.fg }}>
        {st.pattern && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: st.pattern }} aria-hidden />}
        <div className={cn('pointer-events-none absolute inset-0', p.tier === 'platinum' && 'pcard-prism')} style={{ background: st.sheen, mixBlendMode: st.sheenBlend as CSSProperties['mixBlendMode'] }} aria-hidden />
        {st.holo && <div className="pcard-holo pointer-events-none absolute inset-0" style={{ backgroundImage: st.holo }} aria-hidden />}
        <div className="pointer-events-none absolute inset-[.25em] rounded-[.8em]" style={{ boxShadow: p.tier === 'platinum' ? 'inset 0 0 0 1px rgb(230 236 245 / .45)' : 'inset 0 0 0 1px rgb(255 255 255 / .55)' }} aria-hidden />
        <div className="pcard-glare pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid h-full grid-cols-[38%_1fr]">
          {/* logo en grand */}
          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 55% at 50% 50%, ${p.team.primary_color ?? '#0B2E73'}55, transparent 75%)` }} aria-hidden />
            <img src={logo} alt="" draggable={false}
              className={cn('relative aspect-square w-[78%] object-contain', brand ? 'rounded-[20%] bg-white p-[8%] shadow-[0_.5em_1.2em_rgb(0_0_0/.35)]' : 'drop-shadow-[0_.5em_.8em_rgb(0_0_0/.45)]')}
              style={brand && p.tier === 'platinum' ? { boxShadow: '0 0 0 2px rgb(230 236 245 / .9), 0 0 1.2em rgb(167 139 250 / .55)' } : undefined} />
          </div>
          <div className="flex min-w-0 flex-col py-[.75em] pr-[.85em]">
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-[.35em] rounded-full px-[.7em] py-[.25em] text-[.72em] font-black uppercase tracking-[.16em]"
                style={{ background: st.badge, color: st.badgeText, boxShadow: p.tier === 'platinum' ? 'inset 0 0 0 1px rgb(230 236 245 / .8), 0 0 .8em rgb(167 139 250 / .5)' : 'inset 0 0 0 1px rgb(0 0 0 / .15)' }}>
                <TierIcon tier={p.tier} className="size-[1.15em]" />{SENIORITY_LABEL[p.tier]}
              </span>
            </div>
            <div className="mt-[.35em] line-clamp-2 font-display text-[1.6em] font-black uppercase leading-[1.02] [overflow-wrap:break-word]" style={{ textShadow: st.textShadow }}>{p.team.name}</div>
            <div className="mt-[.3em] flex flex-wrap items-center gap-x-[.5em] gap-y-[.2em] text-[.8em] font-extrabold" style={{ color: st.fgSoft }}>
              <span>{p.seasons} saison{p.seasons > 1 ? 's' : ''} MBL</span>
              {p.division && <span className="rounded-full px-[.6em] py-[.15em] uppercase tracking-wider" style={{ background: st.bar, color: st.barText }}>{p.division}</span>}
            </div>
            <div className="mt-auto grid grid-cols-3 gap-[.35em] pt-[.5em]">
              {stats.map((x) => (
                <div key={x.label} className="rounded-[.55em] py-[.35em] text-center" style={{ background: st.bar, color: st.barText }} title={x.hint}>
                  <div className="font-display text-[1.35em] font-extrabold leading-none">{x.value}</div>
                  <div className="mt-[.15em] text-[.62em] font-bold tracking-wider" style={{ color: st.barLabel }}>{x.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  const inner = <div className="h-full text-[clamp(8px,3.6cqw,30px)]">{body}</div>
  if (p.faceOnly || !p.href) return <div className={cn('tcard aspect-[16/10] w-full [container-type:inline-size]', p.className)} {...(p.faceOnly ? {} : shine)}>{inner}</div>
  return (
    <Link to={p.href} aria-label={`${p.team.name} — fiche de l'équipe`} className={cn('block w-full rounded-2xl outline-none transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon', p.className)}>
      <div className="tcard aspect-[16/10] w-full [container-type:inline-size]" {...shine}>{inner}</div>
    </Link>
  )
}

/** Statistiques de la saison d'une équipe : division, points, buts marqués, rang */
export function useTeamCardData(teamId: string) {
  const { league } = useData()
  const comps = useSeasonCompetitions()
  const sen = useTeamSeniority(teamId)
  const div = comps.find((c) => (c.phase === 'gold' || c.phase === 'silver') && c.team_ids?.includes(teamId))
  const comp = div ?? comps.find((c) => c.team_ids?.includes(teamId))
  const ranking = useCompetitionRanking(comp?.id) // même rang que la page Classement
  return useMemo(() => {
    const row = comp ? competitionStandings(league, comp.id).find((r) => r.team_id === teamId) : undefined
    const rk = ranking.byTeam.get(teamId)
    return {
      tier: sen?.tier ?? 'silver' as SeniorityTier, seasons: sen?.seasons ?? 1,
      division: div ? phaseName(div.phase) : comp?.phase === 'league_phase' ? competitionNames().league_phase : comp ? phaseName(comp.phase) : undefined,
      points: rk?.points ?? 0, goals: row?.gf ?? 0, rank: ranking.started && rk ? rk.rank : undefined,
    }
  }, [league, comp, div, ranking, sen, teamId])
}

/** Carte d'une équipe de la saison affichée (données calculées) */
export function SeasonTeamCard({ team, className, faceOnly }: { team: Team; className?: string; faceOnly?: boolean }) {
  const d = useTeamCardData(team.id)
  return <TeamCard team={team} {...d} href={faceOnly ? undefined : `/equipes/${team.id}`} className={className} faceOnly={faceOnly} />
}
