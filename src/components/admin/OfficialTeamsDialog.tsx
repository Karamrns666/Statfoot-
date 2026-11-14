// Admin — « Liste officielle 2026-2027 » : rapproche les équipes de la saison avec les équipes officielles.
// 1) aperçu exact (gardées / renommées / créées / retirées avec joueurs et matchs) ; 2) sauvegarde JSON obligatoire ;
// 3) confirmation ; 4) rapport + journal. Relançable sans doublon (plan vide la 2e fois). Ne touche pas aux autres saisons.
import { useMemo, useState } from 'react'
import { Check, ClipboardList, Download, Loader2, ShieldCheck } from 'lucide-react'
import { base44, store } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { downloadBlob } from '@/lib/visuals'
import { OFFICIAL_TEAMS_2026, applyOfficialPlan, planIsEmpty, planOfficialTeams, planReport } from '@/lib/officialTeams'
import { ENTITY_NAMES } from '@/types/entities'

export function OfficialTeamsButton({ seasonId }: { seasonId: string }) {
  const [open, setOpen] = useState(false)
  if (seasonId !== 'season_2026') return null
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><ClipboardList />Liste officielle ({OFFICIAL_TEAMS_2026.length} équipes)</Button>
      {open && <OfficialTeamsDialog seasonId={seasonId} onClose={() => setOpen(false)} />}
    </>
  )
}

function OfficialTeamsDialog({ seasonId, onClose }: { seasonId: string; onClose: () => void }) {
  const { db } = useData()
  const plan = useMemo(() => planOfficialTeams(db, seasonId), [db, seasonId])
  const report = planReport(plan)
  const [backup, setBackup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<ReturnType<typeof planReport> | null>(null)
  const empty = planIsEmpty(plan)

  const saveBackup = async () => {
    const all = Object.fromEntries(await Promise.all(ENTITY_NAMES.map(async (n) => [n, await base44.entities[n].list()] as const)))
    downloadBlob(new Blob([JSON.stringify({ exported_at: new Date().toISOString(), reason: 'Liste officielle 2026-2027', data: all }, null, 1)], { type: 'application/json' }), `mbl-sauvegarde-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`)
    setBackup(true)
  }
  const apply = async () => {
    setBusy(true)
    try {
      const out = applyOfficialPlan(db, plan)
      store.batch(() => { for (const [name, rows] of Object.entries(out)) store.replace(name as never, rows as never) })
      base44.logActivity('official_list', 'Team', { id: seasonId, name: 'Liste officielle 2026-2027' } as never, report as never)
      setDone(report); toast.success('Liste officielle appliquée')
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const Block = ({ title, items, tone }: { title: string; items: string[]; tone?: string }) => (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title} ({items.length})</div>
      {items.length ? <ul className={`space-y-0.5 text-sm ${tone ?? ''}`}>{items.map((x) => <li key={x}>• {x}</li>)}</ul> : <p className="text-sm text-muted-foreground">—</p>}
    </div>
  )
  const r = done ?? report
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Liste officielle 2026-2027</DialogTitle>
          <DialogDescription>{done ? 'Rapport de l’opération (inscrit au journal d’activité).' : empty ? 'La saison correspond déjà exactement à la liste officielle : rien à faire.' : 'Vérifiez la liste exacte ci-dessous. Seule la saison 2026-2027 est modifiée ; 2025-2026 n’est jamais touchée.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Block title="Gardées" items={r.gardees} />
          <div className="space-y-4">
            <Block title="Renommées" items={r.renommees} />
            <Block title="Créées" items={r.creees} tone="text-win" />
            <Block title="Retirées de la saison" items={r.retirees} tone="text-red-300" />
          </div>
        </div>
        {!done && !empty && (
          <div className="sticky bottom-0 -mx-5 -mb-5 grid gap-2 border-t border-white/10 bg-night-800 px-5 pb-5 pt-3 sm:grid-cols-2">
            <Button variant="contrast" onClick={saveBackup}>{backup ? <Check /> : <Download />}1. Télécharger la sauvegarde (JSON)</Button>
            <Button onClick={apply} disabled={!backup || busy} title={backup ? undefined : 'Téléchargez d’abord la sauvegarde'}>{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}2. Confirmer et appliquer</Button>
          </div>
        )}
        {(done || empty) && <Button onClick={onClose}>Fermer</Button>}
      </DialogContent>
    </Dialog>
  )
}
