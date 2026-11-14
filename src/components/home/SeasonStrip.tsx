// Bandeau de chiffres sous le billboard : équipes, joueurs participants, matchs joués / total,
// état de la pré-saison, et case coupée en deux MASTER | CHALLENGER (chaque moitié mène à son classement).
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, ChevronRight, Flag, UserCheck, Users } from 'lucide-react'
import { StatTile } from '@/components/league/Bits'
import type { PhaseState, SeasonStrip as Strip } from '@/lib/seasonStrip'
import { cn } from '@/lib/utils'
import { divisionLogo } from '@/lib/divisionLogo'

const GOLD = '#E8B931', SILVER = '#C9D3DD'

export function SeasonStrip({ s }: { s: Strip }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <StatTile label="Équipes" value={s.teams} icon={<Users />} color="#8FD0E6" />
      <StatTile label="Joueurs participants" value={s.players} icon={<UserCheck />} color="#FFFFFF" />
      <StatTile label="Matchs joués" value={s.total ? <>{s.played}<span className="text-[.6em] text-muted-foreground">/{s.total}</span></> : s.played} icon={<CalendarDays />} color="#F85A00" />
      <PhaseTile p={s.preseason} color="#F85A00" />
      <div className="glass col-span-2 grid grid-cols-2 overflow-hidden rounded-2xl">
        <PhaseHalf p={s.master} color={GOLD} />
        <PhaseHalf p={s.challenger} color={SILVER} className="border-l border-white/10" />
      </div>
    </div>
  )
}

function StateLine({ p, color }: { p: PhaseState; color: string }) {
  if (p.status === 'done') return <span className="inline-flex items-center gap-1 whitespace-nowrap" style={{ color }}><CheckCircle2 className="size-[.9em]" aria-hidden />Terminée</span>
  if (p.status === 'upcoming') return <span className="whitespace-nowrap text-muted-foreground">À venir</span>
  return <span className="whitespace-nowrap" style={{ color }}>{p.roundLabel ?? (p.round ? `J${p.round}` : 'En cours')}</span>
}

function PhaseTile({ p, color }: { p: PhaseState; color: string }) {
  return (
    <Link to={p.href} className="glass group relative overflow-hidden rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-neon">
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-30 blur-2xl" style={{ background: color }} />
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><Flag className="size-4" style={{ color }} aria-hidden />{p.name}</div>
      <div className="num mt-1 text-2xl sm:text-3xl"><StateLine p={p} color={color} /></div>
      <div className="text-xs text-muted-foreground">{p.status === 'running' ? `${p.played}/${p.total} matchs` : p.status === 'done' ? `${p.total} matchs joués` : 'Calendrier à venir'}</div>
    </Link>
  )
}

function PhaseHalf({ p, color, className }: { p: PhaseState; color: string; className?: string }) {
  return (
    <Link to={p.href} className={cn('group relative min-w-0 p-4 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon', className)}>
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="flex items-center justify-between gap-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color }}><span className="flex min-w-0 items-center gap-1.5">{divisionLogo(p.competition ?? { phase: color === GOLD ? 'gold' : 'silver' }) && <img src={divisionLogo(p.competition ?? { phase: color === GOLD ? 'gold' : 'silver' })} alt="" className="size-6 shrink-0 object-contain" />}<span className="truncate">{p.name}</span></span><ChevronRight className="size-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden /></div>
      <div className="num mt-1 text-2xl sm:text-3xl"><StateLine p={p} color={color} /></div>
      <div className="whitespace-nowrap text-xs text-muted-foreground">{p.status === 'running' ? `${p.played}/${p.total} matchs` : p.status === 'done' ? `${p.total} matchs joués` : 'Après la pré-saison'}</div>
    </Link>
  )
}
