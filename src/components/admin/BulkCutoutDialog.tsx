// « Détourer toutes les photos existantes » : traite en lot les joueurs qui ont une photo mais pas encore
// de version détourée (y compris ceux dont le détourage automatique a échoué), avec progression et liste des échecs.
import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Scissors, Square, XCircle } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { cutoutFromUrl, releaseCutoutLock, takeCutoutLock } from '@/lib/playerCutout'
import { playerName } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const OWNER = `bulk-${Math.random().toString(36).slice(2)}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function BulkCutoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { db } = useData()
  const todo = useMemo(() => db.Player.filter((p) => p.photo_url && !p.photo_cutout_url && p.photo_card_mode !== 'original'), [db.Player])
  const [run, setRun] = useState<{ total: number; done: number; ok: number; current?: string; pct: number; label: string } | null>(null)
  const [fails, setFails] = useState<{ name: string; reason: string }[]>([])
  const stop = useRef(false)
  const running = !!run && run.done < run.total && !stop.current

  const start = async () => {
    const list = [...todo]
    stop.current = false; setFails([])
    setRun({ total: list.length, done: 0, ok: 0, pct: 0, label: 'En attente du détourage automatique en cours…' })
    while (!takeCutoutLock(OWNER, 300_000)) { if (stop.current) return; await sleep(1500) } // laisse finir la photo en cours
    let ok = 0
    for (let i = 0; i < list.length && !stop.current; i++) {
      const p = list[i], name = playerName(p)
      setRun({ total: list.length, done: i, ok, current: name, pct: 0, label: 'Préparation…' })
      takeCutoutLock(OWNER, 300_000)
      try {
        const url = await cutoutFromUrl(p.photo_url!, (pct, label) => setRun((r) => (r ? { ...r, pct, label } : r)))
        await base44.entities.Player.update(p.id, { photo_cutout_url: url, photo_cutout_status: 'ok', photo_cutout_source: p.photo_url, photo_cutout_tries: 0, photo_card_mode: 'cutout' })
        ok++
      } catch (e) {
        await base44.entities.Player.update(p.id, { photo_cutout_status: 'failed', photo_cutout_source: p.photo_url, photo_cutout_tries: (p.photo_cutout_tries ?? 0) + 1 })
        setFails((f) => [...f, { name, reason: (e as Error).message || 'erreur inconnue' }])
      }
    }
    releaseCutoutLock(OWNER)
    setRun((r) => (r ? { ...r, done: stop.current ? r.done : r.total, ok, current: undefined, pct: 100, label: stop.current ? 'Arrêté' : 'Terminé' } : r))
  }

  const overall = run ? Math.round(((run.done + (run.done < run.total ? run.pct / 100 : 0)) / Math.max(1, run.total)) * 100) : 0
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stop.current = true; onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Détourer toutes les photos existantes</DialogTitle>
          <DialogDescription>Chaque photo est détourée dans ce navigateur, une à la fois. Gardez cette fenêtre ouverte pendant le traitement.</DialogDescription>
        </DialogHeader>
        {!run ? (
          <p className="text-sm">{todo.length ? <><b className="num text-lg text-neon">{todo.length}</b> joueur{todo.length > 1 ? 's ont' : ' a'} une photo sans version détourée.</> : 'Toutes les photos sont déjà détourées (ou utilisent la photo originale par choix).'}</p>
        ) : (
          <div className="space-y-3" role="status" aria-live="polite">
            <div>
              <div className="flex items-baseline justify-between text-sm"><span>{run.done < run.total && !stop.current ? `Photo ${run.done + 1} / ${run.total}${run.current ? ` — ${run.current}` : ''}` : run.label}</span><span className="num">{overall} %</span></div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100} aria-label="Progression globale"><div className="h-full rounded-full bg-neon transition-[width] duration-300" style={{ width: `${overall}%` }} /></div>
              {running && <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />{run.label}</p>}
            </div>
            <p className="flex items-center gap-1.5 text-sm"><CheckCircle2 className="size-4 text-win" />{run.ok ?? 0} réussie{(run.ok ?? 0) > 1 ? 's' : ''}{fails.length > 0 && <><XCircle className="ml-3 size-4 text-loss" />{fails.length} échec{fails.length > 1 ? 's' : ''}</>}</p>
            {fails.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-night-950/50 p-2 text-xs">
                {fails.map((f, i) => <li key={i}><b>{f.name}</b> — {f.reason}</li>)}
              </ul>
            )}
            {fails.length > 0 && !running && <p className="text-xs text-muted-foreground">Pour ces joueurs, la carte affiche la photo originale recadrée. Ouvrez leur fiche pour relancer le détourage ou importer un PNG détouré.</p>}
          </div>
        )}
        <DialogFooter>
          {running
            ? <Button variant="outline" onClick={() => { stop.current = true; setRun((r) => (r ? { ...r } : r)) }}><Square />Arrêter après la photo en cours</Button>
            : <Button disabled={!todo.length} onClick={start}><Scissors />{run ? 'Relancer sur les photos restantes' : `Détourer ${todo.length} photo${todo.length > 1 ? 's' : ''}`}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
