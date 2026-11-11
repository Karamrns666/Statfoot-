// Admin — « Visuels de la semaine » : choisir la compétition (PRÉ-SAISON, MASTER, CHALLENGER) et la journée,
// prévisualiser tout (résultats, classement, 3 Top 10, résultat + homme du match de chaque match), télécharger
// tout en ZIP ou un par un, copier le texte de publication. Mode « aperçu des zones » (config src/config/visuals.json).
import { useEffect, useMemo, useState } from 'react'
import { Archive, Check, Copy, Download, Loader2, ScanLine } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useVisualsConfig } from '@/hooks/useMatchVisuals'
import { useSeniorityMap } from '@/hooks/useSeniority'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { FilterSelect } from '@/components/league/FilterSelect'
import { EmptyState } from '@/components/league/Bits'
import { toast } from '@/components/ui/toast'
import { downloadBlob, weeklyPlan, type WeeklyVisual } from '@/lib/visuals'
import { canvasToPng } from '@/lib/visuals/render'
import { makeZip } from '@/lib/visuals/zip'
import { competitionTitle, playedRounds } from '@/lib/visuals/weekly'

export default function WeeklyVisualsAdmin() {
  const { db, league } = useData()
  const { seasonId } = useAdminScope()
  const cfg = useVisualsConfig()
  const seniority = useSeniorityMap()
  const comps = useMemo(() => db.Competition.filter((c) => c.season_id === seasonId && ['league_phase', 'gold', 'silver'].includes(c.phase) && playedRounds(league, c.id).length), [db.Competition, seasonId, league])
  const [compId, setCompId] = useState('')
  const comp = comps.find((c) => c.id === compId) ?? comps[0]
  const rounds = useMemo(() => (comp ? playedRounds(league, comp.id) : []), [league, comp])
  const [roundSel, setRoundSel] = useState('')
  const round = rounds.includes(Number(roundSel)) ? Number(roundSel) : rounds[0]
  const [zones, setZones] = useState(false)
  const [zip, setZip] = useState<string | null>(null)
  const plan = useMemo(() => (comp && round != null ? weeklyPlan(league, comp.id, round, cfg, (id) => seniority.get(id)?.tier) : []), [league, comp, round, cfg, seniority])

  const downloadAll = async () => {
    const files: { name: string; data: Uint8Array }[] = []
    let i = 0
    try {
      for (const v of plan) {
        setZip(`Image ${++i} / ${plan.length}…`)
        const b = await canvasToPng(await v.render())
        files.push({ name: v.fileName, data: new Uint8Array(await b.arrayBuffer()) }, { name: v.fileName.replace(/\.png$/, '.txt'), data: new TextEncoder().encode(v.caption) })
      }
      downloadBlob(makeZip(files), `mbl-${competitionTitle(comp).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-j${round}-visuels.zip`)
    } catch (e) { toast.error(`ZIP impossible : ${(e as Error).message}`) } finally { setZip(null) }
  }

  return (
    <AdminPage title="Visuels de la semaine" subtitle="Format 1080 × 1350 pour les visuels de la semaine, 1080 × 1080 pour ceux des matchs. Uniquement la journée et la compétition choisies ; le Match des capitaines n’y figure jamais.">
      {comps.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={comp?.id ?? ''} onChange={(v) => { setCompId(v); setRoundSel('') }} allLabel="Compétition" options={comps.map((c) => ({ value: c.id, label: competitionTitle(c) }))} />
            <FilterSelect value={String(round ?? '')} onChange={setRoundSel} allLabel="Journée" options={rounds.map((r) => ({ value: String(r), label: `Journée ${r}` }))} />
            <Button onClick={downloadAll} disabled={!plan.length || !!zip}>{zip ? <><Loader2 className="animate-spin" />{zip}</> : <><Archive />Télécharger tout (ZIP)</>}</Button>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><ScanLine className="size-4" />Aperçu des zones<Switch checked={zones} onCheckedChange={setZones} aria-label="Aperçu des zones" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plan.map((v) => <VisualTile key={`${v.key}-${zones}`} v={v} zones={zones} />)}
          </div>
        </div>
      ) : <EmptyState title="Aucune journée jouée">Les visuels de la semaine apparaissent dès qu’une journée de PRÉ-SAISON, MASTER ou CHALLENGER est jouée dans la saison choisie.</EmptyState>}
    </AdminPage>
  )
}

function VisualTile({ v, zones }: { v: WeeklyVisual; zones: boolean }) {
  const [url, setUrl] = useState<string>()
  const [blob, setBlob] = useState<Blob | null>(null)
  const [err, setErr] = useState<string>()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let alive = true, u: string | undefined
    v.render({ showZones: zones }).then(canvasToPng).then((b) => { if (!alive) return; u = URL.createObjectURL(b); setBlob(b); setUrl(u) }).catch((e) => alive && setErr((e as Error).message))
    return () => { alive = false; if (u) URL.revokeObjectURL(u) }
  }, [v, zones])
  const copy = async () => { try { await navigator.clipboard.writeText(v.caption); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { toast.error('Copie impossible : sélectionnez le texte') } }
  return (
    <figure className="flex flex-col rounded-xl border border-white/10 bg-night-950/40 p-2">
      <figcaption className="mb-1.5 truncate text-sm font-semibold" title={v.label}>{v.label}</figcaption>
      <div className="relative overflow-hidden rounded-lg bg-white/5" style={{ aspectRatio: v.aspect }}>
        {url && <img src={url} alt={v.label} className="size-full object-contain" />}
        {!url && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-white/80">{err ? `Erreur : ${err}` : <><Loader2 className="size-6 animate-spin text-neon" />Préparation…</>}</div>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button disabled={!blob || zones} onClick={() => downloadBlob(blob!, v.fileName)} className="w-full px-2" title={zones ? 'Désactivez l’aperçu des zones pour télécharger' : undefined}><Download />Télécharger</Button>
        <Button variant="contrast" onClick={copy} className="w-full px-2">{copied ? <Check /> : <Copy />}{copied ? 'Copié' : 'Copier le texte'}</Button>
      </div>
      <textarea readOnly value={v.caption} rows={4} className="mt-2 w-full resize-y rounded-lg bg-transparent font-mono text-[11px] leading-relaxed text-muted-foreground outline-none" aria-label={`Texte de publication — ${v.label}`} onFocus={(e) => e.currentTarget.select()} />
    </figure>
  )
}
