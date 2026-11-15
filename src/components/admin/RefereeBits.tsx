// Arbitre du match (choix dans la liste + ajout rapide) et évaluation de l'arbitre en fin de match.
import { useState } from 'react'
import { Lock, Plus, Star } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { CRITERIA, canEditEvaluation, isLocked, overallScore, refereeName, type Criterion } from '@/lib/referee'
import type { Match, Referee, RefereeEvaluation } from '@/types/entities'
import { cn } from '@/lib/utils'

/** Choix de l'arbitre d'un match ; « + Nouvel arbitre » pour l'ajouter sans quitter l'écran */
export function RefereePicker({ match, disabled, onDone }: { match: Match; disabled?: boolean; onDone?: () => void }) {
  const { db } = useData()
  const refs = (db.Referee ?? []).filter((r) => r.active !== false).sort((a, b) => refereeName(a).localeCompare(refereeName(b)))
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ first_name: '', last_name: '', phone: '', association: 'Association Sifflé d’Or' })
  const set = async (r: Referee) => {
    await base44.entities.Match.update(match.id, { referee_id: r.id, referee_name: refereeName(r) })
    toast.success(`Arbitre : ${refereeName(r)}`); onDone?.()
  }
  const add = async () => {
    if (!f.first_name.trim() || !f.last_name.trim()) { toast.error('Nom et prénom de l’arbitre obligatoires'); return }
    const r = await base44.entities.Referee.create({ ...f, active: true }) as Referee
    setAdding(false); await set(r)
  }
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {refs.map((r) => (
          <Button key={r.id} variant={match.referee_id === r.id ? 'default' : 'secondary'} size="lg" className="h-12 justify-start" disabled={disabled} onClick={() => set(r)}>
            {refereeName(r)}{r.association && <span className="ml-auto truncate text-xs opacity-70">{r.association}</span>}
          </Button>
        ))}
        {!refs.length && !adding && <p className="text-sm text-muted-foreground">Aucun arbitre enregistré : ajoutez-le ci-dessous.</p>}
      </div>
      {adding ? (
        <div className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
          <Input placeholder="Prénom" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
          <Input placeholder="Nom" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
          <Input placeholder="Téléphone" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="Association" value={f.association} onChange={(e) => setF({ ...f, association: e.target.value })} />
          <Button className="sm:col-span-2" onClick={add}><Plus />Ajouter et choisir cet arbitre</Button>
        </div>
      ) : <Button variant="outline" className="w-full" disabled={disabled} onClick={() => setAdding(true)}><Plus />Nouvel arbitre</Button>}
    </div>
  )
}

/** Évaluation privée de l'arbitre (s'ouvre automatiquement à la fin du match) */
export function RefereeEvaluationForm({ match, onSaved }: { match: Match; onSaved?: () => void }) {
  const { db } = useData()
  const { user } = useAuth()
  const existing = (db.RefereeEvaluation ?? []).find((e) => e.match_id === match.id)
  const editable = canEditEvaluation(existing, user?.role)
  const [scores, setScores] = useState<Partial<Record<Criterion, number>>>(existing?.scores ?? {})
  const [comment, setComment] = useState(existing?.comment ?? '')
  const overall = overallScore(scores)
  const complete = CRITERIA.every((c) => (scores[c.key] ?? 0) >= 1)
  const save = async () => {
    const now = new Date().toISOString()
    const data = { match_id: match.id, referee_id: match.referee_id, referee_name: match.referee_name, scores: scores as RefereeEvaluation['scores'], overall, comment: comment.trim() || undefined }
    if (existing) {
      await base44.entities.RefereeEvaluation.update(existing.id, { ...data, updated_by: user?.email })
      if (isLocked(existing)) base44.logActivity('referee_evaluation_edit_locked', 'RefereeEvaluation', existing as never, { avant: existing.scores, apres: scores, note: overall })
    } else {
      await base44.entities.RefereeEvaluation.create({ id: `eval_${match.id}`, ...data, author_email: user?.email, submitted_at: now } as RefereeEvaluation)
    }
    toast.success('Évaluation de l’arbitre enregistrée dans la feuille de match'); onSaved?.()
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Arbitre : <b className="text-white">{match.referee_name ?? 'non renseigné'}</b> · évaluation <b>privée</b> (jamais affichée sur le site public).</p>
      {!editable && <p className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 p-2 text-xs text-amber-200"><Lock className="size-3.5" />Verrouillée (plus de 24 h) : seul un super-admin peut la modifier.</p>}
      {CRITERIA.map((c) => (
        <div key={c.key}>
          <div className="text-sm font-semibold">{c.label}</div>
          <div className="text-xs text-muted-foreground">{c.help}</div>
          <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label={c.label}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={scores[c.key] === n} aria-label={`${n} sur 5`} disabled={!editable}
                onClick={() => setScores({ ...scores, [c.key]: n })}
                className={cn('flex size-11 cursor-pointer items-center justify-center rounded-xl border transition disabled:cursor-not-allowed', (scores[c.key] ?? 0) >= n ? 'border-amber-300 bg-amber-300/20 text-amber-200' : 'border-white/15 text-muted-foreground')}>
                <Star className={cn('size-5', (scores[c.key] ?? 0) >= n && 'fill-current')} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-white/5 p-3 text-sm">Note globale : <b className="font-display text-2xl text-amber-200">{overall ? overall.toFixed(1).replace('.', ',') : '–'}</b> / 5</div>
      <Textarea rows={3} placeholder="Commentaire (facultatif)" value={comment} disabled={!editable} onChange={(e) => setComment(e.target.value)} />
      <Button size="xl" className="w-full" disabled={!editable || !complete} onClick={save}>Enregistrer l’évaluation</Button>
      {existing && <p className="text-xs text-muted-foreground">Saisie par {existing.author_email ?? '—'} le {new Date(existing.submitted_at).toLocaleString('fr-FR')}{existing.updated_by ? ` · modifiée par ${existing.updated_by}` : ''}</p>}
    </div>
  )
}
