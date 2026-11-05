import type { Lineup, MatchEvent, Player, Team } from '@/types/entities'
import { playerBadges } from '@/lib/matchEngine'
import { useLookup } from '@/hooks/useData'
import { PlayerAvatar } from '@/components/league/Identity'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/** Répartition des joueurs de champ en lignes (6 contre 6 : 5 joueurs de champ → 2-1-2). Aucun poste n'est attribué. */
function fieldRows(n: number): number[] {
  if (n <= 3) return n ? [n] : []
  if (n === 4) return [2, 2]
  if (n === 5) return [2, 1, 2]
  if (n === 6) return [2, 2, 2]
  return [...Array(Math.ceil(n / 3))].map((_, i) => Math.min(3, n - i * 3))
}

/** Positions automatiques (x,y en %) : le gardien en bas, les joueurs de champ répartis au-dessus. */
export function autoPositions(lineup: Lineup, players: Map<string, Player>) {
  const starters = (lineup.starter_ids ?? []).map((id) => players.get(id)).filter(Boolean) as Player[]
  const gkId = lineup.goalkeeper_id && starters.some((p) => p.id === lineup.goalkeeper_id) ? lineup.goalkeeper_id : starters.find((p) => p.position === 'GK')?.id
  const field = starters.filter((p) => p.id !== gkId)
  const out = new Map<string, { x: number; y: number }>()
  if (gkId) out.set(gkId, { x: 50, y: 88 })
  const rows = fieldRows(field.length)
  let k = 0
  rows.forEach((count, r) => {
    const y = rows.length === 1 ? 45 : 68 - (r * 50) / (rows.length - 1)
    for (let i = 0; i < count; i++) out.set(field[k++].id, { x: ((i + 1) / (count + 1)) * 100, y })
  })
  return out
}

export function PitchLineup({ lineup, team, events = [] }: { lineup?: Lineup; team?: Team; events?: MatchEvent[] }) {
  const highlight = (pid: string) => { const b = playerBadges(events, pid); return [b.goals ? `⚽${b.goals > 1 ? '×' + b.goals : ''}` : '', b.assists ? '🅰' : '', b.red ? '🟥' : b.yellow ? '🟨' : ''].join('') || null }
  const L = useLookup()
  if (!lineup) return <div className="glass flex aspect-[3/4] items-center justify-center rounded-2xl p-4 text-sm text-muted-foreground">Composition non communiquée</div>
  const pos = autoPositions(lineup, L.player)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm"><span className="font-display text-lg font-bold uppercase">{team?.name}</span><span className="rounded bg-white/10 px-2 py-0.5 text-xs">6 contre 6</span></div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10" style={{ background: 'repeating-linear-gradient(180deg,#0f3d2e 0 12.5%,#0d3528 12.5% 25%)' }}>
        <svg className="absolute inset-0 size-full opacity-40" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke="#fff" strokeWidth="2"><rect x="10" y="10" width="280" height="380" /><line x1="10" y1="10" x2="290" y2="10" /><circle cx="150" cy="10" r="45" /><rect x="80" y="330" width="140" height="60" /><rect x="120" y="370" width="60" height="20" /></g>
        </svg>
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
        {(lineup.starter_ids ?? []).map((id) => {
          const p = L.player.get(id); const xy = pos.get(id); if (!p || !xy) return null
          const tag = highlight(id)
          return (
            <Link key={id} to={`/joueurs/${id}`} className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center" style={{ left: `${xy.x}%`, top: `${xy.y}%` }}>
              <div className="relative">
                <PlayerAvatar player={p} team={team} size={42} />
                <span className="absolute -bottom-1 -right-2 flex size-5 items-center justify-center rounded-full bg-night-900 text-[10px] font-black ring-1 ring-white/30">{lineup.numbers?.[id] ?? p.number}</span>
                {lineup.captain_id === id && <span className="absolute -left-2 -top-2 flex size-4 items-center justify-center rounded-full bg-award-gold text-[9px] font-black text-night-950">C</span>}
                {lineup.goalkeeper_id === id && <span className="absolute -left-2 -bottom-1 flex size-4 items-center justify-center rounded-full bg-award-blue text-[9px] font-black text-white">G</span>}
                {tag && <span className="absolute -right-3 -top-2 rounded bg-night-900/90 px-1 text-[10px]">{tag}</span>}
              </div>
              <span className="max-w-full truncate rounded bg-night-950/70 px-1.5 text-[11px] font-semibold">{p.last_name}</span>
            </Link>
          )
        })}
      </div>
      {(lineup.substitute_ids?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Remplaçants</div>
          <div className="flex flex-wrap gap-1.5">
            {lineup.substitute_ids!.map((id) => {
              const p = L.player.get(id); const entered = events.some((e) => e.type === 'substitution' && e.player_id === id)
              return <Link to={`/joueurs/${id}`} key={id} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${entered ? 'bg-win/15 text-win' : 'bg-white/5 text-muted-foreground'}`}>{entered && <ArrowUpRight className="size-3" />}{p?.number} {p?.last_name}</Link>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
