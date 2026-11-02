import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useRace } from '@/hooks/useStats'
import { PageHeader, RankDelta, RookieBadge } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { PlayerAvatar, PositionBadge, TeamLogo } from '@/components/league/Identity'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isRookie, type PhaseFilter } from '@/lib/stats'
import { POSITION_LONG, playerName } from '@/lib/format'
import type { Position } from '@/types/entities'

export default function Players() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [pos, setPos] = useState('')
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const ranking = useRace({ seasonId: scopeSeasonId, phase }, 'xp')
  const rows = useMemo(() => ranking.filter((r) => {
    const p = L.player.get(r.item.player_id)
    if (!p) return false
    if (team && p.team_id !== team) return false
    if (pos && p.position !== pos) return false
    if (q && !playerName(p).toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [ranking, L.player, team, pos, q])
  return (
    <div>
      <PageHeader title="Joueurs" subtitle="Classement XP — mis à jour automatiquement après chaque match" />
      <div className="glass mb-4 flex flex-wrap gap-2 rounded-2xl p-3">
        <div className="relative w-full sm:w-60"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un joueur" className="h-9 pl-9" /></div>
        <FilterSelect label="Phase" value={phase === 'all' ? '' : phase} onChange={(v) => setPhase((v || 'all') as PhaseFilter)} allLabel="Toute la saison" options={[{ value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: 'Gold Cup' }, { value: 'silver', label: 'Silver Cup' }]} />
        <FilterSelect label="Équipe" value={team} onChange={setTeam} allLabel="Toutes équipes" options={db.Team.map((t) => ({ value: t.id, label: t.name })).sort((a, b) => a.label.localeCompare(b.label))} />
        <FilterSelect label="Poste" value={pos} onChange={setPos} allLabel="Tous postes" options={(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((p) => ({ value: p, label: POSITION_LONG[p] }))} />
      </div>
      <div className="glass rounded-2xl p-1 sm:p-3">
        <Table>
          <TableHeader><TableRow><TableHead className="text-center">Rang</TableHead><TableHead>Joueur</TableHead><TableHead className="hidden sm:table-cell">Équipe</TableHead><TableHead className="text-center">MJ</TableHead><TableHead className="text-center">Buts</TableHead><TableHead className="text-center">Passes</TableHead><TableHead className="text-center">XP</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.slice(0, 200).map((r) => {
              const p = L.player.get(r.item.player_id)!, t = L.team.get(p.team_id)
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-center"><div className="num text-lg">{r.rank}</div><RankDelta delta={r.delta} /></TableCell>
                  <TableCell>
                    <Link to={`/joueurs/${p.id}`} className="flex items-center gap-3 hover:text-neon">
                      <PlayerAvatar player={p} team={t} size={36} />
                      <div className="min-w-0"><div className="flex items-center gap-2 font-semibold">{playerName(p)}</div><div className="flex items-center gap-1.5"><PositionBadge position={p.position} />{isRookie(p) && <RookieBadge />}</div></div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><span className="flex items-center gap-2 text-sm"><TeamLogo team={t} size={20} />{t?.name}</span></TableCell>
                  <TableCell className="num text-center text-base">{r.item.matches}</TableCell>
                  <TableCell className="num text-center text-base">{r.item.goals}</TableCell>
                  <TableCell className="num text-center text-base">{r.item.assists}</TableCell>
                  <TableCell className="num text-center text-xl text-neon">{r.item.xp}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {rows.length > 200 && <p className="p-3 text-center text-xs text-muted-foreground">200 premiers affichés — affinez avec les filtres.</p>}
      </div>
    </div>
  )
}
