// Classement compact : tient dans la largeur de l'écran, AUCUN défilement interne (ni vertical, ni horizontal).
// Rang · Logo + Nom · J · Diff. · Pts (+ Forme à partir de 390 px s'il y a des matchs). Lignes et logos de taille fixe.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLookup } from '@/hooks/useData'
import { FitName, TeamLogo } from '@/components/league/Identity'
import { FormPills } from '@/components/league/Bits'
import type { Result } from '@/lib/stats'
import { cn } from '@/lib/utils'

export interface CompactRow { team_id: string; rank: number; played: number; diff: number; points: number; form?: Result[] }

export function CompactStandings({ rows, accent, background, cutAfter, highlight, legend }: {
  rows: CompactRow[]
  /** couleur de la barre de rang (zone) */
  accent?: (r: CompactRow) => string | undefined
  background?: (r: CompactRow) => string | undefined
  /** trait de séparation sous ce rang (MASTER / CHALLENGER) */
  cutAfter?: number
  highlight?: string
  legend?: ReactNode
}) {
  const L = useLookup()
  const showForm = rows.some((r) => r.form && r.form.length > 0)
  const th = 'h-8 px-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground'
  return (
    <div className="compact-standings rounded-2xl border border-white/10">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-10" /><col />
          <col className="w-9" /><col className="w-11" /><col className="w-11" />
          {showForm && <col className="hidden w-[5.5rem] min-[390px]:table-column" />}
        </colgroup>
        <thead className="bg-white/[.03]">
          <tr>
            <th className={th} scope="col">Rang</th>
            <th className={cn(th, 'text-left')} scope="col">Équipe</th>
            <th className={th} scope="col" title="Matchs joués">J</th>
            <th className={th} scope="col" title="Différence de buts">Diff.</th>
            <th className={th} scope="col" title="Points">Pts</th>
            {showForm && <th className={cn(th, 'hidden min-[390px]:table-cell')} scope="col">Forme</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const t = L.team.get(r.team_id)
            const a = accent?.(r)
            return (
              <tr key={r.team_id} className={cn('h-11 border-t border-white/5', cutAfter === r.rank && 'border-b-[3px] border-b-white/70', highlight === r.team_id && 'outline outline-2 -outline-offset-2 outline-neon')} style={{ background: background?.(r) }}>
                <td className="num relative text-center text-base font-black">{a && <span className="absolute inset-y-1 left-0 w-1 rounded-full" style={{ background: a }} />}{r.rank}</td>
                <td className="overflow-hidden px-1">
                  <Link to={`/equipes/${r.team_id}`} className="flex min-w-0 items-center gap-2 font-semibold hover:text-neon">
                    <TeamLogo team={t} size="xs" />
                    <FitName team={t} />
                  </Link>
                </td>
                <td className="num text-center text-muted-foreground">{r.played}</td>
                <td className={cn('num text-center', r.diff > 0 ? 'text-win' : r.diff < 0 ? 'text-red-300' : '')}>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                <td className="num text-center text-lg font-black text-white">{r.points}</td>
                {showForm && <td className="hidden px-1 min-[390px]:table-cell"><div className="flex justify-center"><FormPills form={(r.form ?? []).slice(-3)} /></div></td>}
              </tr>
            )
          })}
        </tbody>
      </table>
      {legend && <div className="border-t border-white/10 px-3 py-2 text-xs text-muted-foreground">{legend}</div>}
    </div>
  )
}
