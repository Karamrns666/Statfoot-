import { useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useEffectiveSeason, useSeasonCompetitions } from '@/hooks/useStats'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { competitionStandings, generalStandings } from '@/lib/stats'
import { REGLEMENT } from '@/lib/reglement'
import { TiebreakNote } from '@/components/reglement/TiebreakNote'
import { competitionZones } from '@/lib/zones'
import { exportStandingsPdf } from '@/lib/pdf'


export default function Standings() {
  const { league, settings } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const comps = useSeasonCompetitions().filter((c) => c.phase !== 'knockout')
  const defaultTab = comps.find((c) => c.phase === 'gold')?.id ?? comps[0]?.id ?? 'general'
  const [tab, setTab] = useState(defaultTab)
  const general = useMemo(() => (season ? generalStandings(league, season.id) : []), [league, season])
  if (!comps.length) return <EmptyState title="Aucune compétition pour cette saison" />
  const pc = REGLEMENT.points
  const tabs = [...comps.map((c) => ({ id: c.id, label: c.name, rows: competitionStandings(league, c.id), comp: c })), ...(comps.length > 1 ? [{ id: 'general', label: 'Général', rows: general, comp: undefined }] : [])]
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  return (
    <div>
      <PageHeader title="Classement" subtitle={`${season?.name} · Victoire ${pc.win} pts · Nul ${pc.draw} pt · Défaite ${pc.loss} pt`}>
        <Button variant="outline" size="sm" onClick={() => exportStandingsPdf(`Classement ${current.label}`, `${settings.league_name} · ${season?.name}`, current.rows, (id) => L.team.get(id)?.name ?? id)}><FileDown />PDF</Button>
      </PageHeader>
      <Tabs value={current.id} onValueChange={setTab}>
        <TabsList>{tabs.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}</TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <Card><CardContent className="px-1 pt-4 sm:px-4">
              <StandingsTable rows={t.rows} zones={t.comp ? competitionZones(t.comp, t.rows.length, season?.gold_size ?? 10) : [{ from: 1, to: 10, color: '#facc15', label: 'Gold Cup' }, { from: 11, to: 20, color: '#94a3b8', label: 'Silver Cup' }]} />
            </CardContent></Card>
            <TiebreakNote rows={t.rows} />
            {t.id === 'general' && <p className="mt-2 px-1 text-xs text-muted-foreground">Classement général : Gold Cup (1–10) puis Silver Cup (11–20).</p>}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
