// Récompenses d'une période (journée, mois, saison) : meilleur joueur, buteur, passeur, gardien, équipe.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Footprints, Goal, Hand, Shield, Star } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { PlayerAvatar, TeamLogo } from '@/components/league/Identity'
import { REWARD_LABEL, periodRewards, type Period, type RewardKey } from '@/lib/rewards'
import { playerName } from '@/lib/format'
import { cn } from '@/lib/utils'

export const REWARD_STYLE: Record<RewardKey, { color: string; icon: typeof Star }> = {
  best_player: { color: '#E8B931', icon: Star }, top_scorer: { color: '#F85A00', icon: Goal }, top_assist: { color: '#FF8A3D', icon: Footprints },
  best_keeper: { color: '#6CB4CC', icon: Hand }, best_team: { color: '#22C55E', icon: Shield },
}

export function RewardsList({ seasonId, period, competitionId, compact }: { seasonId: string; period: Period; competitionId?: string | null; compact?: boolean }) {
  const { league } = useData()
  const L = useLookup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => periodRewards(league, seasonId, period, competitionId), [league, seasonId, JSON.stringify(period), competitionId])
  if (!list.length) return <p className="glass rounded-2xl p-4 text-sm text-muted-foreground">Pas encore de match joué sur cette période.</p>
  return (
    <div className={cn('grid gap-2', !compact && 'sm:grid-cols-2 lg:grid-cols-5')}>
      {list.map((r) => {
        const st = REWARD_STYLE[r.key]
        const p = r.player_id ? L.player.get(r.player_id) : undefined, t = r.team_id ? L.team.get(r.team_id) : undefined
        const href = p ? `/joueurs/${p.id}` : t ? `/equipes/${t.id}` : '#'
        return (
          <Link key={r.key} to={href} className={cn('glass group relative overflow-hidden rounded-2xl transition hover:-translate-y-0.5', compact ? 'flex items-center gap-3 p-3' : 'flex flex-col items-center p-4 text-center')} style={{ borderColor: `${st.color}55` }}>
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: st.color }} />
            <div className={cn('flex items-center gap-1.5 text-xs font-bold', compact && 'w-32 shrink-0')} style={{ color: st.color }}><st.icon className="size-4" />{REWARD_LABEL[r.key]}</div>
            {p ? <PlayerAvatar player={p} team={t} size={compact ? 36 : 64} className={cn(!compact && 'mt-3')} /> : <TeamLogo team={t} size={compact ? 36 : 64} className={cn(!compact && 'mt-3')} />}
            <div className={cn('min-w-0', compact ? 'flex-1' : 'mt-2 w-full')}>
              <div className="truncate font-display text-lg font-black leading-tight">{p ? playerName(p) : t?.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{p ? `${t?.name ?? ''} · ` : ''}{r.detail}</div>
            </div>
            <div className={cn('font-display font-black leading-none', compact ? 'text-2xl' : 'mt-2 text-4xl')} style={{ color: st.color }}>{r.value}<span className="ml-1 text-xs font-bold text-muted-foreground">{r.unit}</span></div>
          </Link>
        )
      })}
    </div>
  )
}
