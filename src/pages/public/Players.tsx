import { useRookie } from '@/hooks/useSeniority'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { phaseName } from '@/lib/competitionNames'
import { LayoutGrid, ListOrdered, Search, Sparkles } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useRace, useSeasonCompetitions } from '@/hooks/useStats'
import { SEASON_2025_ID } from '@/api/seed/season2025'
import { computePlayerXP } from '@/lib/xp'
import { PageHeader, RankDelta, RookieBadge } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { IPGCard, MaterialLegend, XPCard } from '@/components/players/Cards'
import { Input } from '@/components/ui/input'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { Button } from '@/components/ui/button'
import { SortableTable } from '@/components/league/SortableTable'
import { shotColumns } from '@/components/league/shotColumns'
import { XPExplainer } from '@/components/players/XPExplainer'
import type { PhaseFilter } from '@/lib/stats'
import { playerName } from '@/lib/format'
import { IPG_RANKING } from '@/lib/ipg'
import { cn } from '@/lib/utils'

type View = 'cartes' | 'classement' | 'ipg'
type Sort = 'xp' | 'buts' | 'passes'
const VIEWS: { value: View; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'cartes', label: 'Cartes', icon: LayoutGrid },
  { value: 'classement', label: 'Classement', icon: ListOrdered },
  { value: 'ipg', label: 'Top 25 IPG', icon: Sparkles },
]

export default function Players() {
  const rookie = useRookie()
  const { db, league } = useData()
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
  const race = useRace({ seasonId: scopeSeasonId, phase }, 'xp')
  // Les joueurs inscrits à la saison mais n'ayant pas encore joué apparaissent aussi (sans rang, 0 XP) :
  // l'effectif est visible dès sa saisie, avant le premier match.
  const ranking = useMemo(() => {
    if (phase !== 'all') return race
    const seen = new Set(race.map((r) => r.item.player_id))
    const rest = [...computePlayerXP(league, { seasonId: scopeSeasonId, phase }).values()]
      .filter((s) => !seen.has(s.player_id))
      .sort((a, b) => playerName(L.player.get(a.player_id)).localeCompare(playerName(L.player.get(b.player_id))))
      .map((item) => ({ item, rank: 0, previousRank: null, delta: null }))
    return [...race, ...rest]
  }, [race, league, scopeSeasonId, phase, L.player])
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
      if (pos === 'GK' && p.position !== 'GK') return false
      if (pos === 'C' && !(p.is_captain || L.team.get(p.team_id)?.captain_player_id === p.id)) return false
      if (q && !playerName(p).toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    if (sort === 'buts') return [...list].sort((a, b) => b.item.goals - a.item.goals || b.item.assists - a.item.assists || a.rank - b.rank)
    if (sort === 'passes') return [...list].sort((a, b) => b.item.assists - a.item.assists || b.item.goals - a.item.goals || a.rank - b.rank)
    return list
  }, [ranking, L.player, team, pos, q, sort])

  return (
    <div>
      <PageHeader title="Joueurs" subtitle={view === 'ipg' ? (scopeSeasonId === SEASON_2025_ID ? 'Indice de Performance Globale — les 25 joueurs les plus complets de la saison 2025-2026' : 'Indice de Performance Globale — calculé après le premier match de la saison') : 'Touchez une carte pour la retourner. Classement mis à jour après chaque match.'}>
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
          <XPExplainer seasonId={scopeSeasonId} className="mb-4" />
          <div className="glass mb-5 flex flex-wrap gap-2 rounded-2xl p-3">
            <div className="relative w-full sm:w-60"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un joueur" className="h-9 pl-9" aria-label="Rechercher un joueur" /></div>
            {hasCups && <FilterSelect label="Phase" value={phase === 'all' ? '' : phase} onChange={(v) => setPhase((v || 'all') as PhaseFilter)} allLabel="Toute la saison" options={[{ value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: phaseName('gold') }, { value: 'silver', label: phaseName('silver') }].filter((o) => db.Competition.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && c.phase === o.value))} />}
            <FilterSelect label="Équipe" value={team} onChange={setTeam} allLabel="Toutes équipes" options={seasonTeams.map((t) => ({ value: t.id, label: t.name }))} />
            <FilterSelect label="Rôle" value={pos} onChange={setPos} allLabel="Tous les joueurs" options={[{ value: 'GK', label: 'Gardiens' }, { value: 'C', label: 'Capitaines' }]} />
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
              {!rows.length && (ranking.length ? <p className="glass rounded-2xl p-8 text-center text-muted-foreground">Aucun joueur ne correspond à ces filtres.</p> : <SeasonNotStarted what="Les effectifs et le classement des joueurs" />)}
              {rows.length > shown && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setShown((n) => n + 40)}>Afficher 40 joueurs de plus ({rows.length - shown} restants)</Button></div>}
            </>
          ) : (
            <div className="glass rounded-2xl p-1 sm:p-3">
              <SortableTable rows={rows.slice(0, 200)} rowKey={(r) => r.item.player_id} initial={{ key: 'rank', dir: 'asc' }} columns={[
                { key: 'rank', label: 'Rang', headClassName: 'text-center', className: 'text-center', first: 'asc', sort: (r) => r.rank || 9999, render: (r) => <><div className="num text-lg">{r.rank || '—'}</div><RankDelta delta={r.delta} /></> },
                { key: 'name', label: 'Joueur', sort: (r) => playerName(L.player.get(r.item.player_id)), render: (r) => { const p = L.player.get(r.item.player_id)!; return (
                  <Link to={`/joueurs/${p.id}`} className="flex items-center gap-3 hover:text-neon">
                    <PlayerAvatar player={p} team={L.team.get(p.team_id)} size={36} />
                    <div className="min-w-0"><div className="flex items-center gap-2 font-semibold">{playerName(p)}</div><div className="flex items-center gap-1.5"><RoleBadge position={p.position} captain={p.is_captain || L.team.get(p.team_id)?.captain_player_id === p.id} />{rookie(p) && <RookieBadge />}</div></div>
                  </Link>) } },
                { key: 'team', label: 'Équipe', headClassName: 'hidden sm:table-cell', className: 'hidden sm:table-cell', sort: (r) => L.team.get(r.item.team_id)?.name, render: (r) => { const t = L.team.get(r.item.team_id); return <span className="flex items-center gap-2 text-sm"><TeamLogo team={t} size={20} />{t?.name}</span> } },
                { key: 'mj', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center text-base', sort: (r) => r.item.matches, render: (r) => r.item.matches },
                { key: 'goals', label: 'Buts', headClassName: 'text-center', className: 'num text-center text-base', sort: (r) => r.item.goals, render: (r) => r.item.goals },
                { key: 'assists', label: 'Passes', headClassName: 'text-center', className: 'num text-center text-base', sort: (r) => r.item.assists, render: (r) => r.item.assists },
                ...shotColumns<(typeof rows)[number]>((r) => r.item.shot, 'hidden md:table-cell'),
                { key: 'xp', label: 'XP', headClassName: 'text-center', className: 'num text-center text-xl text-neon', sort: (r) => r.item.xp, render: (r) => r.item.xp },
              ]} />
              {rows.length > 200 && <p className="p-3 text-center text-xs text-muted-foreground">200 premiers affichés — affinez avec les filtres.</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function IPGView() {
  const { scopeSeasonId } = useSeason()
  // Top 25 IPG fourni par la ligue : uniquement pour la saison 2025-2026 (consultable via le sélecteur de saison)
  if (scopeSeasonId !== SEASON_2025_ID) return <SeasonIPG seasonId={scopeSeasonId} />
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

/** Saison en cours : uniquement les joueurs RÉELLEMENT inscrits ; IPG « – » tant qu'aucun match n'est joué, tri par équipe puis par nom */
function SeasonIPG({ seasonId }: { seasonId: string | null }) {
  const { db, league } = useData()
  const L = useLookup()
  const comps = useSeasonCompetitions()
  const items = useMemo(() => {
    const teamIds = new Set(comps.flatMap((c) => c.team_ids ?? []))
    const xp = computePlayerXP(league, { seasonId })
    return db.Player
      .filter((p) => p.season_ids?.includes(seasonId ?? '') && teamIds.has(p.team_id) && p.status !== 'inactive')
      .map((p) => ({ p, t: L.team.get(p.team_id), x: xp.get(p.id) }))
      .filter((x) => x.x)
      .sort((a, b) => (a.t?.name ?? '').localeCompare(b.t?.name ?? '') || `${a.p.last_name} ${a.p.first_name}`.localeCompare(`${b.p.last_name} ${b.p.first_name}`))
  }, [db.Player, league, comps, seasonId, L.team])
  if (!items.length) return <SeasonNotStarted what="Les effectifs et l’Indice de Performance Globale" />
  return (
    <div className="space-y-5">
      <p className="glass rounded-2xl px-4 py-3 text-sm text-muted-foreground"><b className="text-white">IPG « – » :</b> indice calculé après le premier match. {items.length} joueurs inscrits, classés par équipe puis par nom.</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map(({ p, t, x }) => <XPCard key={p.id} r={{ item: x!, rank: 0, previousRank: null, delta: null }} player={p} team={t} ipg="–" />)}
      </div>
    </div>
  )
}
