import { Link } from 'react-router-dom'
import type { StandingRow } from '@/lib/stats'
import { useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { FormPills } from '@/components/league/Bits'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Zone { from: number; to: number; color: string; label: string }

export function StandingsTable({ rows, compact = false, zones = [], highlightTeamId }: { rows: StandingRow[]; compact?: boolean; zones?: Zone[]; highlightTeamId?: string }) {
  const L = useLookup()
  const zoneOf = (rank: number) => zones.find((z) => rank >= z.from && rank <= z.to)
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">Pos</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">MJ</TableHead>
            {!compact && <><TableHead className="text-center">V</TableHead><TableHead className="text-center">N</TableHead><TableHead className="text-center">D</TableHead><TableHead className="text-center hidden sm:table-cell">BP</TableHead><TableHead className="text-center hidden sm:table-cell">BC</TableHead></>}
            <TableHead className="text-center">Diff</TableHead>
            <TableHead className="text-center">Pts</TableHead>
            <TableHead className={cn(compact ? 'hidden sm:table-cell' : '')}>Forme</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const t = L.team.get(r.team_id)
            const z = zoneOf(r.rank)
            return (
              <TableRow key={r.team_id} className={cn(highlightTeamId === r.team_id && 'bg-neon/10')}>
                <TableCell className="relative text-center">
                  {z && <span className="absolute inset-y-1 left-0 w-1 rounded-full" style={{ background: z.color }} title={z.label} />}
                  <span className="num text-lg">{r.rank}</span>
                </TableCell>
                <TableCell className="max-w-[46vw] sm:max-w-none">
                  <Link to={`/equipes/${r.team_id}`} className="flex items-center gap-2 hover:text-neon">
                    <TeamLogo team={t} size={26} />
                    <span className="truncate font-semibold">{t?.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="num text-center text-base text-muted-foreground">{r.played}</TableCell>
                {!compact && <>
                  <TableCell className="num text-center text-base">{r.won}</TableCell>
                  <TableCell className="num text-center text-base">{r.drawn}</TableCell>
                  <TableCell className="num text-center text-base">{r.lost}</TableCell>
                  <TableCell className="num text-center text-base hidden sm:table-cell">{r.gf}</TableCell>
                  <TableCell className="num text-center text-base hidden sm:table-cell">{r.ga}</TableCell>
                </>}
                <TableCell className={cn('num text-center text-base', r.gd > 0 ? 'text-win' : r.gd < 0 ? 'text-loss' : 'text-muted-foreground')}>{r.gd > 0 ? `+${r.gd}` : r.gd}</TableCell>
                <TableCell className="num text-center text-xl text-white">{r.points}</TableCell>
                <TableCell className={cn(compact ? 'hidden sm:table-cell' : '')}><FormPills form={r.form} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {zones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4 px-2 text-xs text-muted-foreground">
          {zones.map((z) => <span key={z.label} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: z.color }} />{z.label}</span>)}
        </div>
      )}
    </div>
  )
}
