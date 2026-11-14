import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useLiveLabel } from './LiveBadge'
import type { Match } from '@/types/entities'

export function ScoreTicker() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const items = useMemo(() => {
    const ms = db.Match.filter((m) => (m.status === 'finished' || m.status === 'live') && m.published !== false && (!scopeSeasonId || m.season_id === scopeSeasonId))
      .sort((a, b) => (a.status === 'live' ? -1 : b.status === 'live' ? 1 : (b.date ?? '').localeCompare(a.date ?? '')))
    return ms.slice(0, 14)
  }, [db.Match, scopeSeasonId])
  if (!items.length) return null
  const row = items.map((m) => {
    const h = L.team.get(m.home_team_id), a = L.team.get(m.away_team_id)
    return (
      <Link key={m.id} to={`/matchs/${m.id}`} className="tap flex shrink-0 items-center gap-2 px-4 text-sm hover:text-neon">
        {m.status === 'live' && <TickerLive m={m} />}
        <span className="font-display font-bold uppercase tracking-wide">{h?.short_name}</span>
        <span className="num rounded bg-white/10 px-1.5 text-base">{m.home_score}-{m.away_score}</span>
        <span className="font-display font-bold uppercase tracking-wide">{a?.short_name}</span>
        <span className="text-white/20">•</span>
      </Link>
    )
  })
  return (
    <div className="relative overflow-hidden border-b border-white/5 bg-night-950/70 py-1.5 no-print" aria-label="Derniers scores">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]"><div className="flex">{row}</div><div className="flex" aria-hidden>{row}</div></div>
    </div>
  )
}

function TickerLive({ m }: { m: Match }) {
  const label = useLiveLabel(m)
  return <span className="inline-flex items-center gap-1 rounded bg-red-500 px-1.5 text-[10px] font-bold uppercase text-white"><span className="size-1.5 rounded-full bg-white animate-pulse-live" />En direct · {label}</span>
}
