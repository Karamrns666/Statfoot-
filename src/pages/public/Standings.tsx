import { useEffect, useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { competitionSlug, legacySlugPhase, phaseName, slugify } from '@/lib/competitionNames'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePreseason } from '@/hooks/usePreseason'
import { PreseasonTable } from '@/components/preseason/PreseasonTable'
import { displayRanking } from '@/pages/public/Preseason'
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
import { TournamentView } from '@/components/standings/TournamentView'


export default function Standings() {
  const { league, settings } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const allComps = useSeasonCompetitions()
  const comps = allComps.filter((c) => c.phase !== 'knockout')
  const tournaments = allComps.filter((c) => c.phase === 'knockout' && c.format === 'groups_knockout')
  const { slug } = useParams()
  const navigate = useNavigate()
  // /classement/master, /classement/challenger… ; anciennes adresses (gold-cup, silver-cup) redirigées
  const legacy = slug ? legacySlugPhase(slug) : undefined
  const fromSlug = slug ? comps.find((c) => (legacy ? c.phase === legacy : competitionSlug(c) === slug.toLowerCase())) : undefined
  useEffect(() => {
    if (!slug) return
    const target = legacy ? `/classement/${slugify(phaseName(legacy))}` : undefined
    if (target && target !== `/classement/${slug}`) navigate(target, { replace: true })
  }, [slug, legacy, navigate])
  const defaultTab = fromSlug?.id ?? comps.find((c) => c.phase === 'gold')?.id ?? comps[0]?.id ?? 'general'
  const [picked, setTab] = useState<string | undefined>(undefined)
  const tab = picked ?? defaultTab
  const general = useMemo(() => (season ? generalStandings(league, season.id) : []), [league, season])
  const pre = usePreseason(season?.id)
  if (!comps.length) return <EmptyState title="Aucune compétition pour cette saison" />
  const pc = REGLEMENT.points
  const preRows = pre ? displayRanking(pre).map((r) => ({ ...r, gd: r.diff, yellow: 0, red: 0, form: [] })) : []
  const tabs = [...comps.map((c) => ({ id: c.id, label: c.name, rows: pre && c.id === pre.comp.id ? preRows : competitionStandings(league, c.id), comp: c })), ...(comps.length > 1 ? [{ id: 'general', label: 'Général', rows: general, comp: undefined }] : [])]
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  const tabValue = tournaments.some((c) => c.id === tab) ? tab : current.id
  return (
    <div>
      <PageHeader title="Classement" subtitle={`${season?.name} · Victoire ${pc.win} pts · Nul ${pc.draw} pt · Défaite ${pc.loss} pt`}>
        <Button variant="outline" size="sm" onClick={() => exportStandingsPdf(`Classement ${current.label}`, `${settings.league_name} · ${season?.name}`, current.rows, (id) => L.team.get(id)?.name ?? id)}><FileDown />PDF</Button>
      </PageHeader>
      <Tabs value={tabValue} onValueChange={setTab}>
        <TabsList>{tabs.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}{tournaments.map((c) => <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>)}</TabsList>
        {tournaments.map((c) => <TabsContent key={c.id} value={c.id}><TournamentView comp={c} /></TabsContent>)}
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            {pre && t.comp?.id === pre.comp.id ? (
              <div className="space-y-2">
                <PreseasonTable rows={displayRanking(pre)} masterSize={pre.ps.split?.master_size ?? pre.cfg.masterSize} final={!!pre.ps.final_ranking} />
                <p className="px-1 text-xs text-muted-foreground">Départage de la pré-saison : points, différence de buts, buts marqués, force des adversaires, tirage au sort. <Link to="/pre-saison" className="text-neon underline">Journées, explications et parcours</Link></p>
              </div>
            ) : <>
            <Card><CardContent className="px-1 pt-4 sm:px-4">
              <StandingsTable rows={t.rows} zones={t.comp ? competitionZones(t.comp, t.rows.length, season?.gold_size ?? 10) : [{ from: 1, to: 10, color: '#facc15', label: phaseName('gold') }, { from: 11, to: 20, color: '#94a3b8', label: phaseName('silver') }]} />
            </CardContent></Card>
            <TiebreakNote rows={t.rows} />
            </>}
            {t.id === 'general' && <p className="mt-2 px-1 text-xs text-muted-foreground">Classement général : {phaseName('gold')} (1–10) puis {phaseName('silver')} (11–20).</p>}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
