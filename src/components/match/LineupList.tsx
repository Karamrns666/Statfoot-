// Composition d'une équipe pour un match (6 contre 6) : deux listes simples, sans terrain.
//  · Titulaires : 6 joueurs, le gardien d'abord, gardien et capitaine signalés.
//  · Remplaçants : les autres présents, avec une flèche s'ils sont entrés en jeu.
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Lineup, MatchEvent, Player, Team } from '@/types/entities'
import { playerBadges } from '@/lib/matchEngine'
import { playerName } from '@/lib/format'
import { useLookup } from '@/hooks/useData'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { PLAYERS_ON_PITCH } from '@/config/rules'

function highlights(events: MatchEvent[], pid: string) {
  const b = playerBadges(events, pid)
  return [b.goals ? `⚽${b.goals > 1 ? '×' + b.goals : ''}` : '', b.assists ? `🅰${b.assists > 1 ? '×' + b.assists : ''}` : '', b.red ? '🟥' : b.yellow ? '🟨' : ''].join('')
}

function Row({ p, lineup, team, events, entered }: { p: Player; lineup: Lineup; team?: Team; events: MatchEvent[]; entered?: boolean }) {
  const tag = highlights(events, p.id)
  return (
    <li>
      <Link to={`/joueurs/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/5">
        <span className="num w-6 shrink-0 text-right text-sm text-muted-foreground">{lineup.numbers?.[p.id] ?? p.number ?? ''}</span>
        <PlayerAvatar player={p} team={team} size={32} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{playerName(p)}</span>
        {entered && <ArrowUpRight className="size-4 shrink-0 text-win" aria-label="Entré en jeu" />}
        {tag && <span className="shrink-0 text-xs">{tag}</span>}
        <RoleBadge position={lineup.goalkeeper_id === p.id ? 'GK' : 'FIELD'} captain={lineup.captain_id === p.id} />
      </Link>
    </li>
  )
}

export function LineupList({ lineup, team, events = [] }: { lineup?: Lineup; team?: Team; events?: MatchEvent[] }) {
  const L = useLookup()
  const header = (
    <div className="mb-3 flex items-center gap-2">
      <TeamLogo team={team} size={28} />
      <span className="title-caps min-w-0 flex-1 truncate text-lg">{team?.name}</span>
    </div>
  )
  if (!lineup) return <div className="glass rounded-2xl p-4">{header}<p className="text-sm text-muted-foreground">Composition non communiquée</p></div>
  const get = (ids?: string[]) => (ids ?? []).map((id) => L.player.get(id)).filter(Boolean) as Player[]
  const num = (p: Player) => lineup.numbers?.[p.id] ?? p.number ?? 99
  const starters = get(lineup.starter_ids).sort((a, b) => Number(b.id === lineup.goalkeeper_id) - Number(a.id === lineup.goalkeeper_id) || num(a) - num(b))
  const subs = get(lineup.substitute_ids).sort((a, b) => num(a) - num(b))
  const entered = new Set(events.filter((e) => e.type === 'substitution').map((e) => e.player_id))
  return (
    <div className="glass rounded-2xl p-4">
      {header}
      <h3 className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase text-muted-foreground">
        <span>Titulaires</span><span className="num">{starters.length} / {PLAYERS_ON_PITCH}</span>
      </h3>
      <ul className="space-y-0.5">{starters.map((p) => <Row key={p.id} p={p} lineup={lineup} team={team} events={events} />)}</ul>
      <h3 className="mb-1 mt-4 text-xs font-bold uppercase text-muted-foreground">Remplaçants</h3>
      {subs.length
        ? <ul className="space-y-0.5">{subs.map((p) => <Row key={p.id} p={p} lineup={lineup} team={team} events={events} entered={entered.has(p.id)} />)}</ul>
        : <p className="px-2 text-sm text-muted-foreground">Aucun remplaçant</p>}
    </div>
  )
}
