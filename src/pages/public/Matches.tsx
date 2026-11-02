import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarX } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { MatchCard } from '@/components/match/MatchCard'
import { STATUS_LABEL, fmtDate } from '@/lib/format'
import { STAGE_LABELS } from '@/lib/schedule'
import type { Match, MatchStatus } from '@/types/entities'

export default function Matches() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [sp, setSp] = useSearchParams()
  const f = { round: sp.get('journee') ?? '', comp: sp.get('competition') ?? '', team: sp.get('equipe') ?? '', status: sp.get('statut') ?? '' }
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }) }
  const [view, setView] = useState<'round' | 'date'>('round')

  const base = useMemo(() => db.Match.filter((m) => m.published !== false && (!scopeSeasonId || m.season_id === scopeSeasonId)), [db.Match, scopeSeasonId])
  const rounds = useMemo(() => [...new Set(base.map((m) => m.round ?? 0))].sort((a, b) => a - b), [base])
  const comps = useMemo(() => db.Competition.filter((c) => !scopeSeasonId || c.season_id === scopeSeasonId), [db.Competition, scopeSeasonId])
  const filtered = base.filter((m) =>
    (!f.round || String(m.round) === f.round) && (!f.comp || m.competition_id === f.comp) &&
    (!f.team || m.home_team_id === f.team || m.away_team_id === f.team) && (!f.status || m.status === f.status))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const groups = useMemo(() => {
    const g = new Map<string, Match[]>()
    for (const m of filtered) {
      const k = view === 'round'
        ? `${scopeSeasonId ? '' : L.season.get(m.season_id)?.name + ' · '}${m.stage && m.stage !== 'league' && m.stage !== 'group' ? STAGE_LABELS[m.stage] : `Journée ${m.round}`}`
        : fmtDate(m.date, 'EEEE d MMMM yyyy')
      if (!g.has(k)) g.set(k, []); g.get(k)!.push(m)
    }
    return [...g.entries()]
  }, [filtered, view, scopeSeasonId, L.season])

  return (
    <div>
      <PageHeader title="Matchs" subtitle="Calendrier et résultats" />
      <div className="glass mb-6 flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <FilterSelect label="Journée" value={f.round} onChange={(v) => set('journee', v)} allLabel="Toutes journées" options={rounds.map((r) => ({ value: String(r), label: `Journée ${r}` }))} />
        <FilterSelect label="Compétition" value={f.comp} onChange={(v) => set('competition', v)} allLabel="Toutes compétitions" options={comps.map((c) => ({ value: c.id, label: scopeSeasonId ? c.name : `${c.name} · ${L.season.get(c.season_id)?.name}` }))} />
        <FilterSelect label="Équipe" value={f.team} onChange={(v) => set('equipe', v)} allLabel="Toutes équipes" options={db.Team.map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect label="Statut" value={f.status} onChange={(v) => set('statut', v)} allLabel="Tous statuts" options={(Object.keys(STATUS_LABEL) as MatchStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
        <div className="ml-auto flex gap-1 rounded-lg bg-night-950/50 p-1 text-xs">
          {(['round', 'date'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 font-semibold cursor-pointer ${view === v ? 'bg-neon/15 text-neon' : 'text-muted-foreground'}`}>{v === 'round' ? 'Par journée' : 'Par date'}</button>)}
        </div>
      </div>
      {groups.length === 0 && <EmptyState title="Aucun match" icon={<CalendarX />}>Aucun match ne correspond à ces filtres.</EmptyState>}
      <div className="space-y-8">
        {groups.map(([k, ms]) => (
          <section key={k}>
            <h2 className="title-caps mb-3 flex items-center gap-3 text-xl capitalize"><span>{k}</span><span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" /><span className="text-xs font-semibold normal-case text-muted-foreground">{ms.length} match{ms.length > 1 ? 's' : ''}</span></h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ms.map((m) => <MatchCard key={m.id} match={m} />)}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
