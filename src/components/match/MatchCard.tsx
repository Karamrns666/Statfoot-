import { Link } from 'react-router-dom'
import { MapPin, Clock } from 'lucide-react'
import type { Match } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { CompetitionBadge } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { fmtRelativeDay, STATUS_LABEL } from '@/lib/format'
import { fmtDay, fmtHour } from '@/lib/matchTime'
import { STAGE_LABELS } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { LiveBadge } from './LiveBadge'
import { fmtScore } from '@/lib/matchEngine'

export function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const L = useLookup()
  const home = L.team.get(match.home_team_id), away = L.team.get(match.away_team_id)
  const comp = L.competition.get(match.competition_id)
  const venue = match.venue_id ? L.venue.get(match.venue_id) : undefined
  const done = match.status === 'finished', live = match.status === 'live'
  const showScore = done || live
  const hw = done && match.home_score! > match.away_score!, aw = done && match.away_score! > match.home_score!
  return (
    <Link to={`/matchs/${match.id}`} className={cn('glass group block rounded-2xl p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:border-neon/40 hover:shadow-[0_0_30px_-10px_rgb(242_107_29/.6)]', live && 'border-red-500/40')}>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <CompetitionBadge competition={comp} />
          <span className="truncate text-muted-foreground">{match.number ? <b className="text-foreground/80">{match.number} · </b> : null}{match.stage && match.stage !== 'league_phase' && match.stage !== 'cup' ? STAGE_LABELS[match.stage] : `J${match.round}`}</span>
        </div>
        {live ? <LiveBadge match={match} /> : <span className={cn('text-muted-foreground', match.status === 'postponed' && 'text-amber-300 font-semibold')}>{done ? STATUS_LABEL.finished : match.status === 'scheduled' ? fmtRelativeDay(match.date) : STATUS_LABEL[match.status]}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={home} size={compact ? 36 : 44} />
          <span className={cn('w-full truncate text-xs sm:text-sm font-semibold', aw && 'text-muted-foreground')}>{home?.name ?? 'À déterminer'}</span>
        </div>
        <div className="flex flex-col items-center">
          {showScore ? (
            <div className={cn('num flex items-center gap-1.5 text-3xl sm:text-4xl', live && 'text-red-400')}>
              <span className={cn(aw && 'opacity-50')}>{match.home_score ?? 0}</span><span className="text-muted-foreground/50 text-2xl">:</span><span className={cn(hw && 'opacity-50')}>{match.away_score ?? 0}</span>
            </div>
          ) : (
            match.date ? <div className="num text-2xl text-neon">{fmtHour(match.date)}</div> : <div className="text-center text-xs font-bold text-amber-200">Horaire<br />à définir</div>
          )}
          {done && match.penalties && <span className="text-[10px] text-muted-foreground">{fmtScore(match).split(' ').slice(1).join(' ')}</span>}
          {done && match.home_ht_score != null && !match.penalties && <span className="text-[10px] text-muted-foreground">MT {match.home_ht_score}-{match.away_ht_score}</span>}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={away} size={compact ? 36 : 44} />
          <span className={cn('w-full truncate text-xs sm:text-sm font-semibold', hw && 'text-muted-foreground')}>{away?.name ?? 'À déterminer'}</span>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/5 pt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{match.date ? `${fmtDay(match.date)} · ${fmtHour(match.date)}` : 'Horaire à définir'}</span>
          <span className="inline-flex items-center gap-1 truncate"><MapPin className="size-3" />{match.pitch ?? venue?.name ?? '—'}</span>
        </div>
      )}
    </Link>
  )
}
