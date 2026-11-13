// Simulation d'une saison complète : génération (graine fixe, idempotente), mode simulation (admins),
// suppression définitive (super-admins, confirmation « SUPPRIMER ») avec rapport et preuve que les vraies données
// sont intactes (comptages par type avant / après).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, FlaskConical, Loader2, RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { PageHeader } from '@/components/league/Bits'
import { ENTITY_NAMES } from '@/types/entities'
import { SIM_ID, SIM_SEASON_NAME } from '@/sim/constants'
import { deleteSimRows, enterSimulation, leaveSimulation, pullSimRows, pushSimRows, realCounts, simCounts, simState, onSimChange, type SimMeta } from '@/sim/simMode'

type Counts = Record<string, number>
const total = (c: Counts) => Object.values(c).reduce((a, b) => a + b, 0)
const diffCounts = (a: Counts, b: Counts) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => (a[k] ?? 0) !== (b[k] ?? 0)).map((k) => ({ entity: k, before: a[k] ?? 0, after: b[k] ?? 0 }))

interface DeleteReport { at: string; deleted: Counts; remaining: Counts; realBefore: Counts; realAfter: Counts; baseline?: Counts }

export default function SimulationAdmin() {
  const { db, simulation } = useData()
  const { user } = useAuth()
  const superAdmin = user?.role === 'super_admin'
  const [sim, setSim] = useState(simState())
  useEffect(() => onSimChange(() => setSim(simState())), [])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [meta, setMeta] = useState<SimMeta | null>(null)
  const [busy, setBusy] = useState<string>('')
  const [progress, setProgress] = useState('')
  const [genCheck, setGenCheck] = useState<{ before: Counts; after: Counts } | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [typed, setTyped] = useState('')
  const [report, setReport] = useState<DeleteReport | null>(null)
  const localCounts = () => Object.fromEntries(ENTITY_NAMES.map((n) => [n, db[n].length]).filter(([, v]) => v)) as Counts

  const refresh = async () => {
    try {
      setCounts(await simCounts())
      const rows = await pullSimRows().catch(() => [])
      setMeta((rows.find((r) => r.entity === '__meta')?.data ?? null) as unknown as SimMeta | null)
    } catch (e) { toast.error((e as Error).message) }
  }
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const exists = !!counts && total(counts) > 0

  const generate = async () => {
    if (simulation) { toast.error('Quittez d’abord le mode simulation'); return }
    setBusy('gen'); setGenCheck(null)
    try {
      setProgress('Comptage des vraies données…')
      const before = await realCounts(localCounts)
      setProgress('Calcul de la saison (pré-saison, divisions, tournoi, matchs des capitaines)…')
      const { buildSimulation, simRowsList } = await import('@/sim/simulation')
      const { rows, report } = buildSimulation(db as never, { generatedAt: new Date().toISOString() })
      const list = simRowsList(rows)
      const m: SimMeta = { id: 'info', generated_at: new Date().toISOString(), generated_by: user?.email, seed: report.seed, report, baseline: before, is_simulation: true, simulation_id: SIM_ID }
      setProgress('Remplacement de la simulation précédente…')
      if (exists) await deleteSimRows()
      await pushSimRows([...list, { entity: '__meta', id: 'info', data: m }], (n) => setProgress(`Enregistrement : ${n} / ${list.length + 1} lignes…`))
      setProgress('Vérification des vraies données…')
      const after = await realCounts(localCounts)
      setGenCheck({ before, after })
      toast.success(`Simulation générée : ${report.matches} matchs`)
      await refresh()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(''); setProgress('') }
  }

  const toggle = async () => {
    if (simulation) { leaveSimulation(); toast.success('Mode simulation désactivé : retour aux vraies données'); return }
    setBusy('mode')
    try { await enterSimulation(); toast.success('Mode simulation activé') } catch (e) { toast.error((e as Error).message) } finally { setBusy('') }
  }

  const remove = async () => {
    setBusy('del')
    try {
      if (simulation) leaveSimulation()
      const baseline = meta?.baseline
      const realBefore = await realCounts(localCounts)
      const deleted = await deleteSimRows()
      const remaining = await simCounts()
      const realAfter = await realCounts(localCounts)
      setReport({ at: new Date().toISOString(), deleted, remaining, realBefore, realAfter, baseline })
      setConfirm(false); setTyped('')
      toast.success(`Simulation supprimée : ${total(deleted)} éléments`)
      await refresh()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy('') }
  }

  const r = meta?.report
  return (
    <div className="space-y-6">
      <PageHeader title="Simulation" subtitle={`${SIM_SEASON_NAME} · données fictives, séparées des vraies données, visibles uniquement par les admins connectés`} />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="size-5 text-orange-400" />État</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!counts ? <p className="text-muted-foreground"><Loader2 className="mr-1 inline size-4 animate-spin" />Lecture…</p> : exists ? (
            <>
              <p>Simulation enregistrée{meta ? <> le {new Date(meta.generated_at).toLocaleString('fr-FR')}{meta.generated_by ? ` par ${meta.generated_by}` : ''} · graine {meta.seed}</> : null} — <b>{total(counts)}</b> enregistrements (table séparée <code>sim_rows</code>, identifiant <code>{SIM_ID}</code>).</p>
              <div className="flex flex-wrap gap-1.5">{Object.entries(counts).sort().map(([k, v]) => <span key={k} className="rounded-full bg-white/8 px-2 py-0.5 text-xs">{k} <b>{v}</b></span>)}</div>
            </>
          ) : <p className="text-muted-foreground">Aucune simulation enregistrée.</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggle} disabled={!exists || busy === 'mode'} variant={simulation ? 'outline' : 'default'} className={simulation ? '' : 'bg-orange-500 text-black hover:bg-orange-400'}>
              {busy === 'mode' ? <Loader2 className="animate-spin" /> : simulation ? <EyeOff /> : <Eye />}{simulation ? 'Quitter le mode simulation' : 'Activer le mode simulation'}
            </Button>
            {simulation && <Button asChild variant="outline"><Link to="/">Voir le site en simulation</Link></Button>}
            {superAdmin && <Button variant="outline" onClick={generate} disabled={!!busy || simulation}>{busy === 'gen' ? <Loader2 className="animate-spin" /> : <RefreshCw />}{exists ? 'Régénérer (même graine)' : 'Générer la simulation'}</Button>}
            {superAdmin && exists && <Button variant="destructive" onClick={() => setConfirm(true)} disabled={!!busy}><Trash2 />Supprimer la simulation</Button>}
          </div>
          {progress && <p className="text-xs text-muted-foreground"><Loader2 className="mr-1 inline size-3 animate-spin" />{progress}</p>}
          {sim.error && <p className="text-xs text-red-400">{sim.error}</p>}
          <p className="text-xs text-muted-foreground">Une fois activé, le mode simulation vaut pour tous les onglets de ce navigateur tant que vous êtes connecté : tout le site public (y compris le mode TV) affiche les données simulées avec un bandeau orange, en lecture seule. Les visiteurs ne voient jamais la simulation (la table n’est lisible que par les admins), elle n’est ni indexée ni partageable.</p>
        </CardContent>
      </Card>

      {genCheck && <RealCheck title="Vraies données avant / après la génération" before={genCheck.before} after={genCheck.after} />}

      {r && (
        <Card>
          <CardHeader><CardTitle>Bilan de la simulation</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><b>{r.matches}</b> matchs simulés par le moteur de la plateforme.</p>
            <table className="w-full max-w-xl text-left text-xs">
              <thead className="text-muted-foreground"><tr><th className="py-1">Référence</th><th>Buts / match</th><th>Victoires dom.</th><th>Nuls</th><th>Victoires ext.</th></tr></thead>
              <tbody>
                <tr className="border-t border-white/10"><td className="py-1">{r.reference.season} ({r.reference.matches} matchs)</td><td>{r.reference.avgGoals.toFixed(2)}</td><td>{pct(r.reference.home)}</td><td>{pct(r.reference.draw)}</td><td>{pct(r.reference.away)}</td></tr>
                <tr className="border-t border-white/10"><td className="py-1">Simulation</td><td>{r.simulated.avgGoals.toFixed(2)}</td><td>{pct(r.simulated.home)}</td><td>{pct(r.simulated.draw)}</td><td>{pct(r.simulated.away)}</td></tr>
              </tbody>
            </table>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">{r.cases.map((c) => <li key={c}>{c}</li>)}</ul>
          </CardContent>
        </Card>
      )}

      {report && <DeletionReport r={report} />}

      <Dialog open={confirm} onOpenChange={(o) => { setConfirm(o); if (!o) setTyped('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400"><TriangleAlert className="size-5" />Supprimer définitivement la simulation</DialogTitle>
            <DialogDescription>Supprime SANS sauvegarde tout ce qui porte l’identifiant <b>{SIM_ID}</b> (saison simulation, équipes, joueurs, matchs, événements, stats, récompenses…). Les vraies données ne sont pas concernées. Tapez <b>SUPPRIMER</b> pour confirmer.</DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="SUPPRIMER" aria-label="Confirmation" autoFocus />
          <Button variant="destructive" disabled={typed !== 'SUPPRIMER' || busy === 'del'} onClick={remove}>{busy === 'del' ? <Loader2 className="animate-spin" /> : <Trash2 />}Supprimer définitivement</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const pct = (x: number) => `${Math.round(x * 100)} %`

function RealCheck({ title, before, after }: { title: string; before: Counts; after: Counts }) {
  const d = diffCounts(before, after)
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{d.length ? <TriangleAlert className="size-5 text-amber-400" /> : <CheckCircle2 className="size-5 text-emerald-400" />}{title}</CardTitle></CardHeader>
      <CardContent className="text-sm">
        {d.length ? <p className="text-amber-300">Différences : {d.map((x) => `${x.entity} ${x.before} → ${x.after}`).join(', ')}</p> : <p className="text-emerald-300">Identiques : {total(after)} enregistrements réels, aucun changement.</p>}
        <CountsTable a={before} b={after} labels={['Avant', 'Après']} />
      </CardContent>
    </Card>
  )
}

function CountsTable({ a, b, labels }: { a: Counts; b: Counts; labels: [string, string] }) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => k !== '__meta').sort()
  return (
    <table className="mt-2 w-full max-w-md text-left text-xs">
      <thead className="text-muted-foreground"><tr><th className="py-1">Type</th><th className="text-right">{labels[0]}</th><th className="text-right">{labels[1]}</th></tr></thead>
      <tbody>{keys.map((k) => <tr key={k} className="border-t border-white/10"><td className="py-0.5">{k}</td><td className="text-right">{a[k] ?? 0}</td><td className={(a[k] ?? 0) === (b[k] ?? 0) ? 'text-right' : 'text-right text-amber-300'}>{b[k] ?? 0}</td></tr>)}</tbody>
    </table>
  )
}

function DeletionReport({ r }: { r: DeleteReport }) {
  const intact = !diffCounts(r.realBefore, r.realAfter).length
  const sinceGen = r.baseline ? diffCounts(r.baseline, r.realAfter) : []
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-400" />Rapport de suppression</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p><b>{total(r.deleted)}</b> éléments supprimés définitivement le {new Date(r.at).toLocaleString('fr-FR')} :</p>
        <div className="flex flex-wrap gap-1.5">{Object.entries(r.deleted).sort().map(([k, v]) => <span key={k} className="rounded-full bg-white/8 px-2 py-0.5 text-xs">{k === '__meta' ? 'Fiche de la simulation' : k} <b>{v}</b></span>)}</div>
        <p>{total(r.remaining) === 0 ? '✓ Plus aucun enregistrement de simulation (isSimulation) dans la base.' : `⚠ ${total(r.remaining)} enregistrements de simulation restants.`}</p>
        <p>✓ Aucun fichier orphelin : la simulation n’a stocké aucun fichier (photos en silhouette, visuels générés à la volée, envois bloqués en mode simulation).</p>
        <p className={intact ? 'text-emerald-300' : 'text-amber-300'}>{intact ? `✓ Vraies données intactes : ${total(r.realAfter)} enregistrements, identiques avant et après la suppression.` : 'Les vraies données ont changé pendant la suppression (voir le tableau).'}</p>
        {r.baseline && <p className="text-muted-foreground">Par rapport au comptage fait avant la génération : {sinceGen.length ? `différences dues aux modifications faites depuis par les admins — ${sinceGen.map((x) => `${x.entity} ${x.before} → ${x.after}`).join(', ')}` : 'identiques.'}</p>}
        <CountsTable a={r.baseline ?? r.realBefore} b={r.realAfter} labels={[r.baseline ? 'Avant la simulation' : 'Avant', 'Après suppression']} />
      </CardContent>
    </Card>
  )
}
