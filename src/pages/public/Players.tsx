import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LayoutGrid, ListOrdered, Search, Sparkles } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useRace } from '@/hooks/useStats'
import { PageHeader, RankDelta, RookieBadge } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { PlayerAvatar, PositionBadge, TeamLogo } from '@/components/league/Identity'
import { IPGCard, MaterialLegend, XPCard } from '@/components/players/Cards'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isRookie, type PhaseFilter } from '@/lib/stats'
import { POSITION_LONG, playerName } from '@/lib/format'
import { IPG_RANKING } from '@/lib/ipg'
import { cn } from '@/lib/utils'
import type { Position } from '@/types/entities'

type View = 'cartes' | 'classement' | 'ipg'
type Sort = 'xp' | 'buts' | 'passes'
const VIEWS: { value: View; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'cartes', label: 'Cartes', icon: LayoutGrid },
  { value: 'classement', label: 'Classement', icon: ListOrdered },
  { value: 'ipg', label: 'Top 25 IPG', icon: Sparkles },
]

export default function Players() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.some((v) => v.value === params.get('vue')) ? params.get('vue') : 'cartes') as View
  const setView = (v: View) => setParams((p) => { p.set('vue', v); return p }, { replace: true })
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [pos, setPos] = useState('')
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const [sort, setSort] = useState<Sort>('xp')
  const [shown, setShown] = useState(40)
  const ranking = useRace({ seasonId: scopeSeasonId, phase }, 'xp')
  const hasCups = db.Competition.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && (c.phase === 'gold' || c.phase === 'silver'))
  const seasonTeams = useMemo(() => {
    const ids = new Set(db.Competition.filter((c) => !scopeSeasonId || c.season_id === scopeSeasonId).flatMap((c) => c.team_ids ?? []))
    return db.Team.filter((t) => ids.has(t.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [db.Competition, db.Team, scopeSeasonId])

  const rows = useMemo(() => {
    const list = ranking.filter((r) => {
      const p = L.player.get(r.item.player_id)
      if (!p) return false
      if (team && p.team_id !== team) return false
      if (pos && p.position !== pos) return false
      if (q && !playerName(p).toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    if (sort === 'buts') return [...list].sort((a, b) => b.item.goals - a.item.goals || b.item.assists - a.item.assists || a.rank - b.rank)
    if (sort === 'passes') return [...list].sort((a, b) => b.item.assists - a.item.assists || b.item.goals - a.item.goals || a.rank - b.rank)
    return list
  }, [ranking, L.player, team, pos, q, sort])

  return (
    <div>
      <PageHeader title="Joueurs" subtitle={view === 'ipg' ? 'Indice de Performance Globale — les 25 joueurs les plus complets de la ligue' : 'Touchez une carte pour la retourner. Classement mis à jour après chaque match.'}>
        <div className="glass flex rounded-xl p-1" role="tablist" aria-label="Affichage">
          {VIEWS.map((v) => (
            <button key={v.value} role="tab" aria-selected={view === v.value} onClick={() => setView(v.value)} className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition', view === v.value ? 'bg-neon text-white' : 'text-muted-foreground hover:text-white')}>
              <v.icon className="size-4" />{v.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {view === 'ipg' ? <IPGView /> : (
        <>
          <div className="glass mb-5 flex flex-wrap gap-2 rounded-2xl p-3">
            <div className="relative w-full sm:w-60"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un joueur" className="h-9 pl-9" aria-label="Rechercher un joueur" /></div>
            {hasCups && <FilterSelect label="Phase" value={phase === 'all' ? '' : phase} onChange={(v) => setPhase((v || 'all') as PhaseFilter)} allLabel="Toute la saison" options={[{ value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: 'Gold Cup' }, { value: 'silver', label: 'Silver Cup' }].filter((o) => db.Competition.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && c.phase === o.value))} />}
            <FilterSelect label="Équipe" value={team} onChange={setTeam} allLabel="Toutes équipes" options={seasonTeams.map((t) => ({ value: t.id, label: t.name }))} />
            <FilterSelect label="Poste" value={pos} onChange={setPos} allLabel="Tous postes" options={(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((p) => ({ value: p, label: POSITION_LONG[p] }))} />
            {view === 'cartes' && <FilterSelect label="Trier par" value={sort === 'xp' ? '' : sort} onChange={(v) => setSort((v || 'xp') as Sort)} allLabel="Rang XP" options={[{ value: 'buts', label: 'Buts' }, { value: 'passes', label: 'Passes décisives' }]} />}
          </div>

          {view === 'cartes' ? (
            <>
              <MaterialLegend className="mb-4" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
                {rows.slice(0, shown).map((r) => {
                  const p = L.player.get(r.item.player_id)!
                  return <XPCard key={p.id} r={r} player={p} team={L.team.get(p.team_id)} />
                })}
              </div>
              {!rows.length && <p className="glass rounded-2xl p-8 text-center text-muted-foreground">Aucun joueur ne correspond à ces filtres.</p>}
              {rows.length > shown && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setShown((n) => n + 40)}>Afficher 40 joueurs de plus ({rows.length - shown} restants)</Button></div>}
            </>
          ) : (
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
          )}
        </>
      )}
    </div>
  )
}

function IPGView() {
  const [top, rest] = [IPG_RANKING.slice(0, 3), IPG_RANKING.slice(3)]
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 items-end gap-3 sm:gap-6 lg:mx-auto lg:max-w-4xl">
        {[1, 0, 2].map((i) => top[i] && <IPGCard key={top[i].rank} e={top[i]} className={i === 0 ? '' : 'sm:scale-[.92] origin-bottom'} />)}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
        {rest.map((e) => <IPGCard key={e.rank} e={e} />)}
      </div>
      <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
        <h2 className="font-display text-xl font-black text-white">Comment l’IPG est calculé</h2>
        <p className="mt-2 max-w-3xl">L’Indice de Performance Globale combine les buts et passes décisives, la part du joueur dans les buts de son équipe, le taux de victoires de l’équipe, les actions décisives (buts et passes qui changent le score) et le niveau des adversaires, moins une pénalité pour les cartons. L’indice est ramené sur 100 : le meilleur joueur obtient 100.</p>
      </div>
    </div>
  )
}
