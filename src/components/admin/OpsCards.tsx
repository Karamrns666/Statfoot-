// Paramètres → exploitation du site en ligne (super-admin) : sauvegardes quotidiennes et erreurs remontées.
import { useEffect, useState } from 'react'
import { AlertTriangle, DatabaseBackup, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import { accessToken, cloudEnabled } from '@/api/cloud'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { fmtDateTime } from '@/lib/format'

async function api(body: object) {
  const t = await accessToken()
  const r = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error ?? `Erreur ${r.status}`)
  return d
}
type File = { name: string; size: number | null; created_at: string }

export function BackupsCard({ superAdmin }: { superAdmin: boolean }) {
  const [files, setFiles] = useState<File[] | null>(null)
  const [busy, setBusy] = useState('')
  const [report, setReport] = useState<string>('')
  const [restore, setRestore] = useState<{ file: string; confirm: string } | null>(null)
  const load = () => api({ action: 'list' }).then((d) => setFiles(d.files)).catch((e) => { setFiles([]); setReport(e.message) })
  useEffect(() => { if (cloudEnabled) void load() }, [])
  if (!cloudEnabled) return null
  const run = async (label: string, body: object, after?: (d: Record<string, unknown>) => string) => {
    setBusy(label)
    try { const d = await api(body); setReport(after ? after(d) : 'OK'); await load() } catch (e) { toast.error((e as Error).message) } finally { setBusy('') }
  }
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><DatabaseBackup className="size-4" />Sauvegardes de la base</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">Une sauvegarde complète des vraies données est faite automatiquement chaque nuit à 3 h (30 jours conservés). La simulation n’est jamais sauvegardée.</p>
        <Button size="sm" onClick={() => run('backup', { action: 'backup' }, (d) => `Sauvegarde ${d.file} : ${d.rows} lignes.`)} disabled={!!busy}>{busy === 'backup' ? <Loader2 className="animate-spin" /> : <DatabaseBackup />}Sauvegarder maintenant</Button>
        {report && <p className="rounded-lg bg-white/5 p-2 text-xs">{report}</p>}
        <ul className="max-h-64 space-y-1 overflow-auto">
          {files === null && <li className="text-muted-foreground">Chargement…</li>}
          {files?.length === 0 && <li className="text-muted-foreground">Aucune sauvegarde pour l’instant.</li>}
          {files?.map((f) => (
            <li key={f.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5">
              <span className="font-semibold">{f.name.replace('.json.gz', '')}</span>
              <span className="text-xs text-muted-foreground">{f.size ? `${Math.round(f.size / 1024)} Ko` : ''}</span>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run(`v${f.name}`, { action: 'verify', file: f.name }, (d) => {
                  const diff = d.differences as { entity: string; sauvegarde: number; actuel: number }[]
                  return `${f.name} lisible : ${d.rows} lignes. ${diff.length ? `Écarts avec la base actuelle : ${diff.map((x) => `${x.entity} ${x.sauvegarde}→${x.actuel}`).join(', ')}` : 'Identique à la base actuelle.'}`
                })}>{busy === `v${f.name}` ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Vérifier</Button>
                {superAdmin && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setRestore({ file: f.name, confirm: '' })}><RotateCcw />Restaurer</Button>}
              </span>
            </li>
          ))}
        </ul>
        {restore && (
          <div className="space-y-2 rounded-xl border border-red-400/40 bg-red-500/10 p-3">
            <p className="text-xs">Restaurer remet TOUTE la base dans l’état du <b>{restore.file.replace('.json.gz', '')}</b>. L’état actuel est d’abord sauvegardé. Tapez le nom du fichier pour confirmer :</p>
            <Input value={restore.confirm} onChange={(e) => setRestore({ ...restore, confirm: e.target.value })} placeholder={restore.file} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={restore.confirm !== restore.file || !!busy} onClick={() => run('restore', { action: 'restore', file: restore.file, confirm: restore.confirm }, (d) => `Restauré : ${d.restored} lignes (${d.removed} retirées). Rechargez la page.`).then(() => setRestore(null))}>Restaurer</Button>
              <Button size="sm" variant="ghost" onClick={() => setRestore(null)}>Annuler</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ErrRow = { id: string; created_date: string; message: string; url: string; ua: string; stack?: string }
export function ErrorsCard() {
  const { db } = useData()
  const list = ((db as unknown as Record<string, ErrRow[]>).ClientError ?? []).slice().sort((a, b) => b.created_date.localeCompare(a.created_date)).slice(0, 50)
  if (!cloudEnabled) return null
  const day = list.filter((e) => Date.now() - Date.parse(e.created_date) < 864e5).length
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4" />Erreurs du site {day > 0 && <span className="rounded-full bg-red-500 px-2 text-xs text-white">{day} en 24 h</span>}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">Erreurs JavaScript rencontrées par les visiteurs (navigateur, page). Visible uniquement par les admins.</p>
        {!list.length && <p className="text-muted-foreground">Aucune erreur remontée.</p>}
        <ul className="max-h-72 space-y-1.5 overflow-auto">
          {list.map((e) => (
            <li key={e.id} className="rounded-lg border border-white/10 p-2 text-xs">
              <div className="font-semibold text-red-200">{e.message}</div>
              <div className="text-muted-foreground">{fmtDateTime(e.created_date)} · {e.url.replace(/^https?:\/\/[^/]+/, '')} · {/iPhone|iPad/.test(e.ua) ? 'iPhone / iPad' : /Android/.test(e.ua) ? 'Android' : /Firefox/.test(e.ua) ? 'Firefox' : /Safari/.test(e.ua) && !/Chrome/.test(e.ua) ? 'Safari' : 'Chrome / autre'}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
