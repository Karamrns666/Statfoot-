// Prochain match avec compte à rebours (page Matchs, accueil).
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Match } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { TeamLogo } from '@/components/league/Identity'
import { CompetitionBadge } from '@/components/league/Bits'
import { countdown } from '@/lib/ics'
import { fmtWhen } from '@/lib/matchTime'

export function NextMatchBanner({ match }: { match: Match }) {
  const L = useLookup()
  const now = useNow(1000)
  const h = L.team.get(match.home_team_id), a = L.team.get(match.away_team_id)
  const c = countdown(match.date, now)
  return (
    <Link to={`/matchs/${match.id}`} className="glass mb-5 grid items-center gap-4 rounded-2xl border-neon/30 p-4 transition hover:border-neon/60 sm:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden text-xs font-bold text-neon sm:block">Prochain<br />match</div>
        <TeamLogo team={h} size={40} /><span className="truncate font-display text-xl font-black">{h?.name}</span>
        <span className="text-muted-foreground">–</span>
        <span className="truncate font-display text-xl font-black">{a?.name}</span><TeamLogo team={a} size={40} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm sm:justify-end">
        <CompetitionBadge competition={L.competition.get(match.competition_id)} />
        <span className="text-muted-foreground">{match.number ? `${match.number} · ` : ''}{fmtWhen(match, { pitch: false })}</span>
        {match.pitch && <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-3.5" />{match.pitch}</span>}
        {c && <span className="num rounded-lg bg-neon px-2.5 py-1 text-lg text-white" aria-label="Temps restant avant le coup d'envoi">{c.d ? `${c.d} j ${String(c.h).padStart(2, '0')} h` : `${String(c.h).padStart(2, '0')}:${String(c.m).padStart(2, '0')}:${String(c.s).padStart(2, '0')}`}</span>}
      </div>
    </Link>
  )
}
