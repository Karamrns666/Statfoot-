// Tournoi (phase de groupes puis élimination directe) : classements des groupes et tableau final.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Competition, Match } from '@/types/entities'
import { useData, useLookup } from '@/hooks/useData'
import { computeStandings, isKnockout, isPlayed, winnerOf } from '@/lib/standings'
import { sourceLabel, STAGE_LABELS } from '@/lib/schedule'
import { StandingsTable } from './StandingsTable'
import { Card, CardContent } from '@/components/ui/card'
import { TeamLogo } from '@/components/league/Identity'
import { cn } from '@/lib/utils'

export function TournamentView({ comp }: { comp: Competition }) {
  const { db } = useData()
  const L = useLookup()
  const groups = useMemo(() => db.Group.filter((g) => g.competition_id === comp.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [db.Group, comp.id])
  const matches = useMemo(() => db.Match.filter((m) => m.competition_id === comp.id), [db.Match, comp.id])
  const tables = useMemo(() => groups.map((g) => ({
    g,
    rows: computeStandings(matches.filter((m) => !isKnockout(m) && g.team_ids?.includes(m.home_team_id) && g.team_ids?.includes(m.away_team_id)), g.team_ids ?? [], null, db.MatchEvent, (a, b) => (L.team.get(a)?.name ?? a).localeCompare(L.team.get(b)?.name ?? b)),
  })), [groups, matches, db.MatchEvent, L.team])
  const ko = matches.filter(isKnockout)
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id
  const col = (stages: Match['stage'][]) => ko.filter((m) => stages.includes(m.stage)).sort((a, b) => (a.bracket_slot ?? '').localeCompare(b.bracket_slot ?? ''))
  const columns = [
    { title: STAGE_LABELS.quarter, list: col(['quarter']) },
    { title: STAGE_LABELS.semi, list: col(['semi']) },
    { title: STAGE_LABELS.final, list: col(['final']), extra: col(['third_place']) },
  ].filter((c) => c.list.length)
  return (
    <div className="space-y-6">
      {tables.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl font-black uppercase">Phase de groupes</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {tables.map(({ g, rows }) => (
              <Card key={g.id}><CardContent className="px-1 pt-4 sm:px-4">
                <div className="mb-2 px-2 font-bold">{g.name}</div>
                <StandingsTable rows={rows} compact zones={[{ from: 1, to: 2, color: '#22C55E', label: 'Qualifiés pour la phase finale' }]} />
              </CardContent></Card>
            ))}
          </div>
        </section>
      )}
      {columns.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl font-black uppercase">Tableau final</h3>
          <div className="glass overflow-x-auto rounded-2xl p-3 sm:p-5">
            <div className="flex min-w-[560px] items-stretch gap-4">
              {columns.map((c) => (
                <div key={c.title} className="flex flex-1 flex-col">
                  <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.title}</div>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {c.list.map((m) => <BracketMatch key={m.id} m={m} groupName={groupName} />)}
                    {c.extra?.map((m) => <div key={m.id}><div className="mb-1 mt-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{STAGE_LABELS.third_place}</div><BracketMatch m={m} groupName={groupName} /></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function BracketMatch({ m, groupName }: { m: Match; groupName: (id: string) => string }) {
  const L = useLookup()
  const w = winnerOf(m)
  const played = isPlayed(m)
  const line = (side: 'home' | 'away') => {
    const id = side === 'home' ? m.home_team_id : m.away_team_id
    const t = id ? L.team.get(id) : undefined
    const score = side === 'home' ? m.home_score : m.away_score
    const pens = side === 'home' ? m.home_pens : m.away_pens
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5', played && w && w !== id && 'opacity-55')}>
        {t ? <TeamLogo team={t} size={22} /> : <span className="size-[22px] rounded-full bg-white/10" />}
        <span className={cn('min-w-0 flex-1 truncate text-sm', w === id && 'font-black')}>{t?.name ?? sourceLabel(side === 'home' ? m.home_source : m.away_source, groupName)}</span>
        {played && <span className="num text-base font-black">{score}{m.penalties && pens != null && <span className="ml-1 text-[11px] font-bold text-muted-foreground">({pens})</span>}</span>}
      </div>
    )
  }
  return (
    <Link to={`/matchs/${m.id}`} className="block rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10">
      {line('home')}<div className="h-px bg-white/10" />{line('away')}
      {m.penalties && played && <div className="border-t border-white/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">Qualifié aux tirs au but</div>}
    </Link>
  )
}
