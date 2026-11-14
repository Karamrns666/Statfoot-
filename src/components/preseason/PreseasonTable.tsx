// Classement de la pré-saison (admin + site) : Rang, Équipe, J, V, N, D, Buts +, Buts −, Diff., Points,
// Force des adversaires, Division (zone MASTER / CHALLENGER, provisoire tant que la pré-saison n'est pas close).
import { InfoTip } from '@/components/league/InfoTip'
import { Link } from 'react-router-dom'
import { useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { competitionNames } from '@/lib/competitionNames'
import type { PreseasonRow } from '@/lib/preseason'
import { cn } from '@/lib/utils'
import { Table } from '@/components/ui/table'

export const DIVISION_STYLE = {
  master: { color: '#E8B931', bg: 'rgb(232 185 49 / .10)', logo: '/brand/logo-master.png' },
  challenger: { color: '#7FB2E5', bg: 'rgb(127 178 229 / .08)', logo: '/brand/logo-challenger.png' },
} as const

export function DivisionMark({ div, size = 22, label = true, className }: { div: 'master' | 'challenger'; size?: number; label?: boolean; className?: string }) {
  const n = competitionNames()
  const name = div === 'master' ? n.gold : n.silver
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-display font-black uppercase leading-none tracking-wide', className)} style={{ color: DIVISION_STYLE[div].color }}>
      <img src={DIVISION_STYLE[div].logo} alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />{label && name}
    </span>
  )
}

export function PreseasonTable({ rows, masterSize, final = false, compact = false, highlight }: { rows: PreseasonRow[]; masterSize: number; final?: boolean; compact?: boolean; highlight?: string }) {
  const L = useLookup()
  const n = competitionNames()
  const anyPlayed = rows.some((r) => r.played > 0)
  const th = 'px-1.5 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground'
  const td = 'num px-1.5 py-1.5 text-center'
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <Table stickyCols={2} stickyHeader={rows.length > 12} className="min-w-[640px] border-collapse">
        <thead className="bg-white/[.03]">
          <tr>
            <th className={cn(th, 'w-10')}>Rang</th><th className={cn(th, 'text-left')}>Équipe</th>
            <th className={th} title="Matchs joués">J</th><th className={th}>V</th><th className={th}>N</th><th className={th}>D</th>
            {!compact && <><th className={th}>Buts +</th><th className={th}>Buts −</th></>}
            <th className={th}><span className="whitespace-nowrap">Diff. <InfoTip id="diff" /></span></th><th className={th}><span className="whitespace-nowrap">Points <InfoTip id="points" /></span></th>
            <th className={th}><span className="whitespace-nowrap">Force adv. <InfoTip id="force" /></span></th>
            {!compact && <th className={cn(th, 'text-left')}>Division{!final && anyPlayed ? ' (prov.)' : ''}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const div = r.rank <= masterSize ? 'master' : 'challenger'
            const t = L.team.get(r.team_id)
            const cut = r.rank === masterSize
            return (
              <tr key={r.team_id} className={cn('border-t border-white/5', cut && 'border-b-[3px] border-b-white/70', highlight === r.team_id && 'outline outline-2 -outline-offset-2 outline-neon')} style={{ background: anyPlayed || final ? DIVISION_STYLE[div].bg : undefined }}>
                <td className={cn(td, 'relative text-base font-black')}><span className="absolute inset-y-1 left-0 w-1 rounded-full" style={{ background: anyPlayed || final ? DIVISION_STYLE[div].color : 'transparent' }} />{r.rank}</td>
                <td className="px-1.5 py-1.5"><Link to={`/equipes/${r.team_id}`} className="flex min-w-0 items-center gap-2 font-semibold hover:text-neon"><TeamLogo team={t} size={26} /><span className="leading-tight [overflow-wrap:break-word]">{t?.name ?? r.team_id}</span></Link></td>
                <td className={td}>{r.played}</td><td className={td}>{r.won}</td><td className={td}>{r.drawn}</td><td className={td}>{r.lost}</td>
                {!compact && <><td className={td}>{r.gf}</td><td className={td}>{r.ga}</td></>}
                <td className={cn(td, r.diff > 0 ? 'text-win' : r.diff < 0 ? 'text-red-300' : '')}>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                <td className={cn(td, 'text-lg font-black')}>{r.points}</td>
                <td className={cn(td, 'text-muted-foreground')}>{r.force}</td>
                {!compact && <td className="px-1.5 py-1.5">{(anyPlayed || final) && <DivisionMark div={div} size={20} className="text-xs" />}</td>}
              </tr>
            )
          })}
        </tbody>
      </Table>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><DivisionMark div="master" size={18} label={false} /><b style={{ color: DIVISION_STYLE.master.color }}>{n.gold}</b> ({Math.min(masterSize, rows.length)} équipes)</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1.5"><DivisionMark div="challenger" size={18} label={false} /><b style={{ color: DIVISION_STYLE.challenger.color }}>{n.silver}</b> ({Math.max(0, rows.length - masterSize)} équipes)</span>
        {!final && anyPlayed && <span className="ml-auto">Zone provisoire jusqu’à la clôture</span>}
      </div>
    </div>
  )
}
