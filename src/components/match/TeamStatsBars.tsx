import { useState } from 'react'
import type { LiveState, Match, MatchEvent, MatchTeamStats } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { STAT_LABELS, teamStats, type TeamLiveStats } from '@/lib/matchEngine'
import { TeamLogo } from '@/components/league/Identity'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Barres de stats Match / 1re MT / 2e MT — équipe dominante en valeur (inversé pour fautes et cartons). */
export function TeamStatsBars({ match, events, live, now, manual, compact }: { match: Match; events: MatchEvent[]; live?: LiveState; now: number; manual?: MatchTeamStats[]; compact?: boolean }) {
  const L = useLookup()
  const [period, setPeriod] = useState<'all' | '1H' | '2H'>('all')
  const fromEvents = teamStats(match, events, live, now, period === 'all' ? undefined : period)
  let stats: Record<'home' | 'away', TeamLiveStats> = fromEvents
  const mh = manual?.find((s) => s.team_id === match.home_team_id), ma = manual?.find((s) => s.team_id === match.away_team_id)
  if (mh && ma && period === 'all') {
    const conv = (s: MatchTeamStats, ev: TeamLiveStats): TeamLiveStats => ({ ...ev, possession: s.possession ?? ev.possession, shots: s.shots ?? ev.shots, shots_on_target: s.shots_on_target ?? ev.shots_on_target, shots_off_target: Math.max(0, (s.shots ?? 0) - (s.shots_on_target ?? 0)), corners: s.corners ?? ev.corners, fouls: s.fouls ?? ev.fouls, saves: s.saves ?? ev.saves })
    stats = { home: conv(mh, fromEvents.home), away: conv(ma, fromEvents.away) }
  }
  const hc = L.team.get(match.home_team_id)?.primary_color ?? '#F85A00', ac = L.team.get(match.away_team_id)?.primary_color ?? '#38bdf8'
  const keys = STAT_LABELS.filter((s) => !(manual && period === 'all' && ['throw_ins', 'free_kicks'].includes(s.key)) || stats.home[s.key] + stats.away[s.key] > 0)
  return (
    <Card>
      <CardContent className={cn('space-y-3 pt-4', compact && 'p-3')}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-bold"><TeamLogo team={L.team.get(match.home_team_id)} size={22} />{L.team.get(match.home_team_id)?.short_name}</span>
          <div className="flex gap-1 rounded-lg bg-night-950/50 p-1 text-xs">
            {(['all', '1H', '2H'] as const).map((p) => <button key={p} onClick={() => setPeriod(p)} className={cn('rounded-md px-2.5 py-1 font-semibold cursor-pointer', period === p ? 'bg-neon/20 text-neon' : 'text-muted-foreground')}>{p === 'all' ? 'Match' : p === '1H' ? '1re MT' : '2e MT'}</button>)}
          </div>
          <span className="flex items-center gap-2 text-sm font-bold">{L.team.get(match.away_team_id)?.short_name}<TeamLogo team={L.team.get(match.away_team_id)} size={22} /></span>
        </div>
        {keys.map((l) => {
          const hv = stats.home[l.key], av = stats.away[l.key], tot = hv + av || 1
          const homeBetter = l.lowerIsBetter ? hv < av : hv > av, awayBetter = l.lowerIsBetter ? av < hv : av > hv
          return (
            <div key={l.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={cn('num text-lg', homeBetter ? 'text-white' : 'text-muted-foreground')}>{hv}{l.pct && '%'}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{l.label}</span>
                <span className={cn('num text-lg', awayBetter ? 'text-white' : 'text-muted-foreground')}>{av}{l.pct && '%'}</span>
              </div>
              <div className="flex h-1.5 gap-1">
                <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(hv / tot) * 100}%`, background: hc, opacity: homeBetter ? 1 : 0.45 }} /></div>
                <div className="flex-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(av / tot) * 100}%`, background: ac, opacity: awayBetter ? 1 : 0.45 }} /></div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
