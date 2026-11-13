// Fixer / modifier la date, l'heure et le terrain d'un match, avec les contrôles du planning :
// terrain déjà pris ou créneau plein → refusé ; équipe qui joue deux fois le même jour → alerte non bloquante.
// Un match déjà publié qui change d'horaire ou de terrain est journalisé (le site et le mode TV se mettent à jour aussitôt).
import { base44 } from '@/api/base44Client'
import { useData } from './useData'
import { toast } from '@/components/ui/toast'
import { checkPlacement, fmtWhen } from '@/lib/matchTime'
import type { Match } from '@/types/entities'

export function useReschedule() {
  const { db } = useData()
  const name = (id: string) => db.Team.find((t) => t.id === id)?.name ?? id
  return async (m: Match, next: { date?: string; pitch?: string }): Promise<boolean> => {
    const cand = { ...m, date: next.date, pitch: next.pitch }
    if (cand.date === m.date && cand.pitch === m.pitch) return true
    const chk = checkPlacement(cand, db.Match.filter((x) => x.id !== m.id), name)
    if (chk.errors.length) { toast.error(chk.errors[0]); return false }
    await base44.entities.Match.update(m.id, { date: cand.date, pitch: cand.pitch })
    if (m.published !== false) base44.logActivity('match_reschedule', 'Match', { id: m.id, name: `${m.number ? `${m.number} · ` : ''}${name(m.home_team_id)} – ${name(m.away_team_id)}` } as never, { avant: fmtWhen(m), apres: fmtWhen(cand) })
    for (const w of chk.warnings) toast.info(`⚠ ${w}`)
    return true
  }
}
