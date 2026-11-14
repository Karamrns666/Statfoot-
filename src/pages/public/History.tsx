import { useData, useLookup } from '@/hooks/useData'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { Palmares } from './Awards'
import type { Award } from '@/types/entities'
import { competitionNames, phaseName } from '@/lib/competitionNames'
import { cn } from '@/lib/utils'
import { generalStandings } from '@/lib/stats'

export default function History() {
  const { db, league } = useData()
  const L = useLookup()
  const closed = db.Season.filter((s) => s.status === 'closed').sort((a, b) => b.start_date.localeCompare(a.start_date))
  return (
    <div className="space-y-8">
      <PageHeader title="Historique" subtitle="Palmarès des saisons passées" />
      {!closed.length && <EmptyState title="Pas encore de saison terminée" />}
      <div className="grid gap-4 sm:grid-cols-2">
        {closed.map((s) => {
          const top = generalStandings(league, s.id).slice(0, 3)
          return (
            <Card key={s.id}><CardContent className="pt-5">
              <div className="title-caps text-2xl">{s.name}</div>
              <div className="mt-4 space-y-2">
                {top.map((r, i) => { const t = L.team.get(r.team_id); return (
                  <div key={r.team_id} className="flex items-center gap-3"><span className="num w-8 text-2xl" style={{ color: ['#facc15', '#cbd5e1', '#d97706'][i] }}>{i + 1}</span><TeamLogo team={t} size={32} /><span className="flex-1 font-semibold">{t?.name}</span><span className="text-sm text-muted-foreground">{i === 0 ? 'Champion · ' : ''}{r.points} pts</span></div>) })}
              </div>
            </CardContent></Card>
          )
        })}
      </div>
      <PalmaresTabs />
    </div>
  )
}

/** Palmarès par prix : saison entière, puis Prix de la Ligue (pré-saison, MASTER, CHALLENGER) et Prix du Tournoi */
function PalmaresTabs() {
  const [scope, setScope] = useState<NonNullable<Award['scope']>>('season')
  const tabs: [NonNullable<Award['scope']>, string][] = [['season', 'Saison'], ['league_phase', competitionNames().league_phase], ['gold', phaseName('gold')], ['silver', phaseName('silver')], ['tournament', 'Tournoi']]
  return (
    <section>
      <h2 className="title-caps mb-1 text-2xl">Palmarès</h2>
      <p className="mb-3 text-sm text-muted-foreground">Prix de la Ligue (saison, pré-saison, divisions) et Prix du Tournoi, séparés.</p>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={scope === k} onClick={() => setScope(k)} className={cn('min-h-9 cursor-pointer rounded-full border px-4 font-display text-sm font-bold uppercase', scope === k ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground hover:text-white')}>{l}</button>)}
      </div>
      <Palmares scope={scope} />
    </section>
  )
}
