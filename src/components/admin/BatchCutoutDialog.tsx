// Admin — « Détourer toutes les photos existantes » : traite en lot les joueurs qui ont une photo
// mais pas encore de version détourée (y compris ceux dont le détourage automatique a échoué).
// Progression globale + photo en cours, liste des échecs, arrêt possible à tout moment.
import { useRef, useState } from 'react'
import { CheckCircle2, Scissors, Square, XCircle } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { cutoutPlayerPhoto, failedCutout } from '@/api/playerPhotos'
import { useData } from '@/hooks/useData'
import { needsCutout, pauseAutoCutouts } from '@/lib/cutoutQueue'
import { playerName } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Player } from '@/types/entities'

interface Run { total: number; done: number; ok: number; current?: { name: string; pct: number; label: string }; failures: { id: string; name: string; reason: string }[]; finished: boolean; stopped: boolean }

export function BatchCutoutButton() {
  const { db } = useData()
  const todo = db.Player.filter((p) => needsCutout(p, true))
  const [open, setOpen] = useState(false)
  const [run, setRun] = useState<Run | null>(null)
  const stop = useRef(false)

  const start = async () => {
    const list: Player[] = db.Player.filter((p) => needsCutout(p, true))
    stop.current = false
    pauseAutoCutouts(true)
    let state: Run = { total: list.length, done: 0, ok: 0, failures: [], finished: false, stopped: false }
    setRun(state)
    for (const p of list) {
      if (stop.current) { state = { ...state, stopped: true }; break }
      const name = playerName(p)
      state = { ...state, current: { name, pct: 0, label: 'Préparation…' } }; setRun(state)
      try {
        const patch = await cutoutPlayerPhoto(p.photo_url!, (pct, label) => setRun((r) => (r ? { ...r, current: { name, pct, label } } : r)))
        await base44.entities.Player.update(p.id, patch)
        state = { ...state, ok: state.ok + 1 }
      } catch (e) {
        await base44.entities.Player.update(p.id, failedCutout(p, p.photo_url!))
        state = { ...state, failures: [...state.failures, { id: p.id, name, reason: (e as Error).message || 'erreur' }] }
      }
      state = { ...state, done: state.done + 1, current: undefined }; setRun(state)
    }
    pauseAutoCutouts(false)
    setRun({ ...state, current: undefined, finished: true })
  }
  const running = !!run && !run.finished
  const pct = run?.total ? Math.round(((run.done + (run.current ? run.current.pct / 100 : 0)) / run.total) * 100) : 0

  return (
    <>
      <Button size="sm" variant="outline" className="h-9" onClick={() => { setRun(null); setOpen(true) }}><Scissors />Détourer toutes les photos existantes{todo.length ? ` (${todo.length})` : ''}</Button>
      <Dialog open={open} onOpenChange={(o) => { if (!running) setOpen(o) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détourage des photos existantes</DialogTitle>
            <DialogDescription>Supprime le fond des photos des joueurs qui n’ont pas encore de version détourée, une photo après l’autre, dans ce navigateur. Gardez cette fenêtre ouverte pendant le traitement.</DialogDescription>
          </DialogHeader>
          {!run ? (
            <p className="text-sm">{todo.length ? <><b>{todo.length}</b> joueur{todo.length > 1 ? 's' : ''} à traiter.</> : 'Toutes les photos ont déjà une version détourée (ou la photo originale a été choisie).'}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs"><span>{run.done} / {run.total} photo{run.total > 1 ? 's' : ''}</span><span className="num">{pct} %</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Avancement du traitement en lot">
                  <div className="h-full rounded-full bg-neon transition-[width] duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {run.current && <p className="text-xs text-muted-foreground" role="status"><b className="text-white">{run.current.name}</b> — {run.current.label} {run.current.pct} %</p>}
              {run.finished && (
                <p className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-win" />{run.ok} photo{run.ok > 1 ? 's' : ''} détourée{run.ok > 1 ? 's' : ''}{run.stopped ? ' (traitement arrêté)' : ''}.
                </p>
              )}
              {run.failures.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-300"><XCircle className="size-4" />{run.failures.length} échec{run.failures.length > 1 ? 's' : ''}</div>
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-night-950/50 p-2 text-xs">
                    {run.failures.map((f) => <li key={f.id}><b>{f.name}</b> — {f.reason}</li>)}
                  </ul>
                  <p className="mt-1 text-[11px] text-muted-foreground">Ces joueurs gardent leur photo originale sur la carte. Ouvrez leur fiche pour relancer ou importer un PNG détouré.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {running ? <Button variant="outline" onClick={() => { stop.current = true }}><Square />Arrêter après cette photo</Button>
              : <>
                <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
                {(!run || run.finished) && todo.length > 0 && <Button onClick={start}><Scissors />{run ? 'Relancer' : 'Lancer'} le détourage</Button>}
              </>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
