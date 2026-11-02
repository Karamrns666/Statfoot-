// Ligne de match compacte (page Matchs) : statut à gauche, deux équipes empilées avec leur score, favoris.
import { Link } from 'react-router-dom'
import { ChevronRight, Star } from 'lucide-react'
import type { Match, Team } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { fmtTime } from '@/lib/format'
import { STAGE_LABELS } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { useLiveLabel } from './LiveBadge'

const SHORT: Partial<Record<Match['status'], string>> = { finished: 'TER.', postponed: 'REP.', cancelled: 'ANN.' }

export function MatchRow({ match, favorites, onToggleFavorite }: { match: Match; favorites?: Set<string>; onToggleFavorite?: (teamId: string) => void }) {
  const L = useLookup()
  const home = L.team.get(match.home_team_id), away = L.team.get(match.away_team_id)
  const comp = L.competition.get(match.competition_id)
  const live = match.status === 'live', done = match.status === 'finished'
  const hs = match.home_score ?? 0, as = match.away_score ?? 0
  const stage = match.stage && match.stage !== 'league_phase' && match.stage !== 'cup' ? STAGE_LABELS[match.stage] : comp?.name
  return (
    <div className={cn('glass group relative flex items-stretch overflow-hidden rounded-2xl transition hover:border-neon/40 focus-within:border-neon/60', live && 'border-red-500/50')}>
      <Link to={`/matchs/${match.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`${home?.name ?? '?'} contre ${away?.name ?? '?'} — voir le match`} />
      <div className={cn('pointer-events-none relative flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-white/10 px-1 text-center', live ? 'bg-red-500/10' : 'bg-black/15')}>
        {live ? <LiveMinute match={match} />
          : SHORT[match.status] ? <span className={cn('font-display text-base font-extrabold', match.status === 'finished' ? 'text-muted-foreground' : 'text-amber-300')}>{SHORT[match.status]}</span>
            : <span className="num text-lg text-neon">{fmtTime(match.date)}</span>}
      </div>
      <div className="pointer-events-none relative min-w-0 flex-1 px-3 py-2.5">
        <TeamLine team={home} score={done || live ? hs : null} winner={done && hs > as} loser={done && hs < as} live={live} fav={favorites?.has(match.home_team_id)} onFav={onToggleFavorite && (() => onToggleFavorite(match.home_team_id))} />
        <TeamLine team={away} score={done || live ? as : null} winner={done && as > hs} loser={done && as < hs} live={live} fav={favorites?.has(match.away_team_id)} onFav={onToggleFavorite && (() => onToggleFavorite(match.away_team_id))} />
        <div className="mt-1.5 flex items-center gap-2 truncate text-[11px] text-muted-foreground">
          {match.pitch && <span>{match.pitch}</span>}
          {stage && <span className="truncate">· {stage}</span>}
          {done && match.home_ht_score != null && <span>· MT {match.home_ht_score}-{match.away_ht_score}</span>}
          {match.penalties && <span>· TAB {match.home_pens}-{match.away_pens}</span>}
        </div>
      </div>
      <div className="pointer-events-none relative flex items-center pr-2 text-white/25 transition group-hover:text-neon"><ChevronRight className="size-5" /></div>
    </div>
  )
}

function LiveMinute({ match }: { match: Match }) {
  const label = useLiveLabel(match)
  return <><span className="size-2 rounded-full bg-red-500 animate-pulse-live" /><span className="font-display text-sm font-extrabold text-red-400">{label}</span></>
}

function TeamLine({ team, score, winner, loser, live, fav, onFav }: { team?: Team; score: number | null; winner?: boolean; loser?: boolean; live?: boolean; fav?: boolean; onFav?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <TeamLogo team={team} size={24} />
      <span className={cn('min-w-0 flex-1 truncate text-[15px]', winner ? 'font-bold text-white' : loser ? 'text-muted-foreground' : 'font-semibold')}>{team?.name ?? 'À déterminer'}</span>
      {onFav && team && (
        <button type="button" onClick={onFav} aria-pressed={fav} aria-label={fav ? `Retirer ${team.name} des favoris` : `Ajouter ${team.name} aux favoris`} className="pointer-events-auto relative z-10 cursor-pointer rounded p-1 text-white/25 hover:text-award-gold">
          <Star className={cn('size-4', fav && 'fill-award-gold text-award-gold')} />
        </button>
      )}
      <span className={cn('num w-7 text-right text-2xl leading-none', live ? 'text-red-400' : winner ? 'text-white' : 'text-muted-foreground')}>{score ?? ''}</span>
    </div>
  )
}
