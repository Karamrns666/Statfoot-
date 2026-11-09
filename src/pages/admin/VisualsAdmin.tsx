// Admin — Visuels réseaux sociaux : matchs d'une journée avec leurs visuels, « Tout télécharger (ZIP) »,
// et mise en page (aperçu des zones sur le modèle, réglage des zones sans toucher au code).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Archive, Eye, Loader2, RotateCcw, Save } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useVisualPreview, useVisualsConfig } from '@/hooks/useMatchVisuals'
import { AdminPage } from '@/components/admin/AdminLayout'
import { MatchVisualsPanel } from '@/components/visuals/MatchVisualsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { FilterSelect } from '@/components/league/FilterSelect'
import { renderMatchPng, visualFileName } from '@/lib/visuals'
import { DEFAULT_VISUALS_CONFIG, layoutProblems, resolveVisualsConfig } from '@/lib/visuals/config'
import { makeZip } from '@/lib/visuals/zip'
import { downloadBlob } from '@/lib/visuals'
import { fmtDate } from '@/lib/format'
import { isPlayed } from '@/lib/stats'

export default function VisualsAdmin() {
  const { db, league } = useData()
  const L = useLookup()
  const { seasonId, competitionId } = useAdminScope()
  const cfg = useVisualsConfig()
  const finished = useMemo(() => db.Match.filter((m) => m.season_id === seasonId && (!competitionId || m.competition_id === competitionId) && isPlayed(m)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')), [db.Match, seasonId, competitionId])
  const rounds = useMemo(() => [...new Map(finished.map((m) => [`${m.competition_id}#${m.round}`, m])).values()], [finished])
  const [roundKey, setRoundKey] = useState<string>('')
  const key = roundKey || (rounds.at(-1) ? `${rounds.at(-1)!.competition_id}#${rounds.at(-1)!.round}` : '')
  const matches = finished.filter((m) => `${m.competition_id}#${m.round}` === key)
  const [zip, setZip] = useState<string | null>(null)

  const downloadAll = async () => {
    const files: { name: string; data: Uint8Array }[] = []
    let i = 0
    for (const m of matches) {
      setZip(`Images ${++i} / ${matches.length}…`)
      for (const kind of ['resultat', 'mvp'] as const) {
        const b = await renderMatchPng(kind, league, m, cfg)
        if (b) files.push({ name: visualFileName(kind, league, m), data: new Uint8Array(await b.arrayBuffer()) })
      }
      const caption = (await import('@/lib/visuals')).matchVisualPlan(league, m, cfg).caption
      files.push({ name: visualFileName('resultat', league, m).replace('-resultat.png', '-texte.txt'), data: new TextEncoder().encode(caption) })
    }
    const first = matches[0]
    downloadBlob(makeZip(files), `mbl-visuels-${L.competition.get(first?.competition_id ?? '')?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'journee'}-j${first?.round ?? ''}.zip`)
    setZip(null)
  }

  return (
    <AdminPage title="Visuels réseaux sociaux" subtitle="Résultat et homme du match, au format de la charte (1080 × 1080). Générés automatiquement dès qu’un match passe « Terminé », régénérés à chaque correction.">
      <Tabs defaultValue="journee">
        <TabsList><TabsTrigger value="journee">Par journée</TabsTrigger><TabsTrigger value="mise-en-page">Mise en page</TabsTrigger></TabsList>
        <TabsContent value="journee" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect className="sm:w-80" value={key} onChange={setRoundKey} allLabel={null} options={[...rounds].reverse().map((m) => ({ value: `${m.competition_id}#${m.round}`, label: `${L.competition.get(m.competition_id)?.name ?? ''} · Journée ${m.round} (${fmtDate(m.date, 'd MMM')})` }))} />
            <Button onClick={downloadAll} disabled={!matches.length || !!zip}>{zip ? <Loader2 className="animate-spin" /> : <Archive />}{zip ?? `Tout télécharger (ZIP)`}</Button>
            <span className="text-xs text-muted-foreground">{matches.length} match{matches.length > 1 ? 's' : ''} · 2 visuels + texte par match</span>
          </div>
          {!matches.length && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">Aucun match terminé dans cette sélection.</p>}
          {matches.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                {L.team.get(m.home_team_id)?.name} <span className="num text-neon">{m.home_score} - {m.away_score}</span> {L.team.get(m.away_team_id)?.name}
                <Link to={`/admin/match-center/${m.id}`} className="ml-auto text-xs font-normal text-neon hover:underline">Ouvrir le match</Link>
              </CardTitle></CardHeader>
              <CardContent><MatchVisualsPanel match={m} /></CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="mise-en-page"><LayoutEditor sampleId={matches[0]?.id ?? finished.at(-1)?.id} /></TabsContent>
      </Tabs>
    </AdminPage>
  )
}

/** Aperçu des zones sur le modèle + surcharge JSON de src/config/visuals.json (enregistrée dans les réglages). */
function LayoutEditor({ sampleId }: { sampleId?: string }) {
  const { db, settings } = useData()
  const match = db.Match.find((m) => m.id === sampleId)
  const [text, setText] = useState(() => JSON.stringify(settings.visuals_config ?? {}, null, 2))
  const [zones, setZones] = useState(true)
  const parsed = useMemo(() => { try { return { v: JSON.parse(text || '{}') as Record<string, unknown> } } catch (e) { return { err: (e as Error).message } } }, [text])
  const cfg = useMemo(() => resolveVisualsConfig(parsed.v ?? settings.visuals_config), [parsed.v, settings.visuals_config])
  const problems = layoutProblems(cfg)
  const res = useVisualPreview('resultat', match, { showZones: zones, cfg })
  const mvp = useVisualPreview('mvp', match, { showZones: zones, cfg })
  const save = async () => {
    if (!parsed.v) return
    await base44.entities.Settings.update(settings.id, { visuals_config: parsed.v })
    toast.success('Mise en page enregistrée — les visuels seront régénérés')
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={zones ? 'default' : 'outline'} onClick={() => setZones((z) => !z)} aria-pressed={zones}><Eye />Aperçu des zones</Button>
        <span className="text-xs text-muted-foreground">Vert : zones de texte et d’image. Rouge : décor du modèle, à ne jamais recouvrir.</span>
      </div>
      {problems.length > 0 && <div role="alert" className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />À vérifier</p><ul className="ml-5 list-disc text-xs">{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>}
      <div className="grid gap-3 md:grid-cols-2">
        {[['Résultat', res], ['Homme du match', mvp]].map(([t, v]) => {
          const p = v as typeof res
          return <figure key={t as string} className="rounded-xl border border-white/10 p-2"><figcaption className="mb-1 text-sm font-semibold">{t as string}</figcaption><div className="relative aspect-square overflow-hidden rounded-lg bg-white/5">{p.url ? <img src={p.url} alt={`Aperçu ${t}`} className="size-full" /> : <p className="p-4 text-xs text-muted-foreground">{p.busy ? 'Rendu…' : 'Aucun match terminé pour l’aperçu (ou pas d’homme du match).'}</p>}</div></figure>
        })}
      </div>
      <Card>
        <CardHeader><CardTitle>Réglages des zones</CardTitle><CardDescription>Surcharge partielle des valeurs par défaut (src/config/visuals.json) : n’indiquez que ce qui change. Exemple : {'{ "resultat": { "zones": { "footer": { "y": 960, "size": 26 } } } }'}</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="min-h-56 w-full rounded-lg border border-input bg-night-950/60 p-3 font-mono text-xs" aria-label="Surcharge JSON de la mise en page" />
          {parsed.err && <p className="text-xs text-red-300" role="alert">JSON invalide : {parsed.err}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={!!parsed.err}><Save />Enregistrer</Button>
            <Button variant="outline" onClick={() => setText('{}')}><RotateCcw />Valeurs par défaut</Button>
          </div>
          <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Voir toutes les zones par défaut</summary><pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-night-950/60 p-3">{JSON.stringify({ colors: DEFAULT_VISUALS_CONFIG.colors, resultat: DEFAULT_VISUALS_CONFIG.resultat.zones, mvp: DEFAULT_VISUALS_CONFIG.mvp.zones }, null, 2)}</pre></details>
        </CardContent>
      </Card>
    </div>
  )
}
