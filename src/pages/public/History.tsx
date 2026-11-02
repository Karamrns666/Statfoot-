import { useData, useLookup } from '@/hooks/useData'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { Card, CardContent } from '@/components/ui/card'
import { Palmares } from './Awards'
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
      <Palmares />
    </div>
  )
}
