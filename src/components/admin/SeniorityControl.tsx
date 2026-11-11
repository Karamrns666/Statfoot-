// Admin — badge d'ancienneté du club, avec correction manuelle du nombre de saisons (journalisée).
import { useState } from 'react'
import { Pencil, RotateCcw } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { useTeamSeniority } from '@/hooks/useSeniority'
import { clubKey } from '@/lib/clubs'
import { SENIORITY_LABEL, seniorityTier } from '@/lib/seniority'
import { SeniorityChip } from '@/components/league/SeniorityBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import type { Team } from '@/types/entities'

export function SeniorityControl({ team }: { team: Team }) {
  const s = useTeamSeniority(team.id)
  const [open, setOpen] = useState(false)
  if (!s) return null
  return (
    <>
      <button onClick={() => setOpen(true)} className="group inline-flex cursor-pointer items-center gap-1.5" title={s.overridden ? `Corrigé à la main (calcul automatique : ${s.computed})` : 'Calcul automatique — cliquer pour corriger'} aria-label={`Ancienneté ${SENIORITY_LABEL[s.tier]}, ${s.seasons} saisons — corriger`}>
        <SeniorityChip tier={s.tier} seasons={s.seasons} />
        {s.overridden && <span className="text-[10px] font-bold text-neon">corrigé</span>}
        <Pencil className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
      </button>
      {open && <OverrideDialog team={team} computed={s.computed} current={s.overridden ? s.seasons : undefined} onClose={() => setOpen(false)} />}
    </>
  )
}

function OverrideDialog({ team, computed, current, onClose }: { team: Team; computed: number; current?: number; onClose: () => void }) {
  const { db } = useData()
  const [value, setValue] = useState(String(current ?? computed))
  const [reason, setReason] = useState('')
  const n = Math.max(0, Math.min(30, Math.round(Number(value) || 0)))
  const clubId = clubKey(team)
  const save = async (override?: number) => {
    const club = db.Club.find((c) => c.id === clubId)
    if (club) await base44.entities.Club.update(clubId, { seasons_override: override })
    else await base44.entities.Club.create({ id: clubId, name: team.name, logo_url: team.logo_url, seasons_override: override } as never)
    base44.logActivity('seniority', 'Club', { id: clubId, name: team.name } as never, { saisons: override ?? `automatique (${computed})`, avant: current ?? `automatique (${computed})`, motif: reason || undefined })
    toast.success(override ? `${team.name} : ${override} saison(s) → ${SENIORITY_LABEL[seniorityTier(override)]}` : `${team.name} : calcul automatique rétabli`)
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ancienneté du club</DialogTitle>
          <DialogDescription>{team.name} · calcul automatique : {computed} saison{computed > 1 ? 's' : ''} (liens approuvés). Corrigez si des saisons ont eu lieu avant le site. La modification est inscrite au journal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="sen-n">Nombre de saisons MBL</Label>
            <div className="flex items-center gap-3"><Input id="sen-n" type="number" min={1} max={30} value={value} onChange={(e) => setValue(e.target.value)} className="w-24" /><SeniorityChip tier={seniorityTier(n || 1)} size="md" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="sen-r">Motif (journal)</Label><Input id="sen-r" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : édition 2023-2024 jouée hors site" /></div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button disabled={n < 1} onClick={() => save(n === computed ? undefined : n)}>Enregistrer</Button>
            {current != null && <Button variant="outline" onClick={() => save(undefined)}><RotateCcw />Revenir au calcul automatique</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
