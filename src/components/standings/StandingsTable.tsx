import { Link } from 'react-router-dom'
import type { StandingRow } from '@/lib/stats'
import { useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { SeniorityBadge } from '@/components/league/SeniorityBadge'
import { FormPills } from '@/components/league/Bits'
import { SortableTable, type SortColumn } from '@/components/league/SortableTable'
import { cn } from '@/lib/utils'
import { tiebreakText } from '@/components/reglement/TiebreakNote'

export interface Zone { from: number; to: number; color: string; label: string }

export function StandingsTable({ rows, compact = false, zones: zonesIn = [], highlightTeamId }: { rows: StandingRow[]; compact?: boolean; zones?: Zone[]; highlightTeamId?: string }) {
  // pas de zones (champion, qualifiés…) tant qu'aucun match n'est joué
  const zones = rows.some((r) => r.played > 0) ? zonesIn : []
  const L = useLookup()
  const zoneOf = (rank: number) => zones.find((z) => rank >= z.from && rank <= z.to)
  const formPoints = (r: StandingRow) => r.form.reduce((a, x) => a + (x === 'W' ? 3 : x === 'D' ? 1 : 0), 0)
  const full = !compact
  const n = 'num text-center text-base'
  const columns: SortColumn<StandingRow>[] = [
    { key: 'rank', label: 'Pos', headClassName: 'w-12 text-center', className: 'relative text-center', first: 'asc', sort: (r) => r.rank, render: (r) => { const z = zoneOf(r.rank); return <>{z && <span className="absolute inset-y-1 left-0 w-1 rounded-full" style={{ background: z.color }} title={z.label} />}<span className="num text-lg">{r.rank}</span>{r.tiebreak && r.played > 0 && <span className="absolute right-0.5 top-1 size-1.5 rounded-full bg-neon/80" title={tiebreakText(r, (id) => L.team.get(id)?.name ?? id) ?? ''} aria-label="Départagé à égalité de points" />}</> } },
    { key: 'team', label: 'Équipe', className: 'max-w-[46vw] sm:max-w-none', sort: (r) => L.team.get(r.team_id)?.name, render: (r) => { const t = L.team.get(r.team_id); return <Link to={`/equipes/${r.team_id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={t} size={26} /><span className="truncate font-semibold">{t?.name}</span><SeniorityBadge teamId={r.team_id} size="xs" responsive /></Link> } },
    { key: 'played', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: cn(n, 'text-muted-foreground'), sort: (r) => r.played, render: (r) => r.played },
    ...(full ? [
      { key: 'won', label: 'V', title: 'Victoires', headClassName: 'text-center', className: n, sort: (r) => r.won, render: (r) => r.won },
      { key: 'drawn', label: 'N', title: 'Nuls', headClassName: 'text-center', className: n, sort: (r) => r.drawn, render: (r) => r.drawn },
      { key: 'lost', label: 'D', title: 'Défaites', headClassName: 'text-center', className: n, sort: (r) => r.lost, render: (r) => r.lost },
      { key: 'gf', label: 'BP', title: 'Buts pour', headClassName: 'text-center hidden sm:table-cell', className: cn(n, 'hidden sm:table-cell'), sort: (r) => r.gf, render: (r) => r.gf },
      { key: 'ga', label: 'BC', title: 'Buts contre', headClassName: 'text-center hidden sm:table-cell', className: cn(n, 'hidden sm:table-cell'), sort: (r) => r.ga, render: (r) => r.ga },
      { key: 'yellow', label: 'CJ', title: 'Cartons jaunes (départage, critère 5)', headClassName: 'text-center hidden md:table-cell', className: cn(n, 'hidden md:table-cell text-amber-300/90'), sort: (r) => r.yellow, render: (r) => r.yellow },
      { key: 'red', label: 'CR', title: 'Cartons rouges (départage, critère 6)', headClassName: 'text-center hidden md:table-cell', className: cn(n, 'hidden md:table-cell text-red-300/90'), sort: (r) => r.red, render: (r) => r.red },
    ] as SortColumn<StandingRow>[] : []),
    { key: 'gd', label: 'Diff', title: 'Différence de buts', headClassName: 'text-center', sort: (r) => r.gd, className: 'num text-center text-base', render: (r) => <span className={r.gd > 0 ? 'text-win' : r.gd < 0 ? 'text-loss' : 'text-muted-foreground'}>{r.gd > 0 ? `+${r.gd}` : r.gd}</span> },
    { key: 'points', label: 'Pts', title: 'Points', headClassName: 'text-center', className: 'num text-center text-xl text-white', sort: (r) => r.points, render: (r) => r.points },
    { key: 'form', label: 'Forme', title: '5 derniers matchs (victoire 3, nul 1)', headClassName: cn(compact && 'hidden sm:table-cell'), className: cn(compact && 'hidden sm:table-cell'), sort: (r) => formPoints(r), render: (r) => <FormPills form={r.form} /> },
  ]
  return (
    <div>
      <SortableTable rows={rows} columns={columns} rowKey={(r) => r.team_id} initial={{ key: 'rank', dir: 'asc' }} rowClassName={(r) => highlightTeamId === r.team_id && 'bg-neon/10'} />
      {zones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4 px-2 text-xs text-muted-foreground">
          {zones.map((z) => <span key={z.label} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: z.color }} />{z.label}</span>)}
        </div>
      )}
    </div>
  )
}
