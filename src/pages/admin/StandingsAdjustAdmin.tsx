// Ajustements manuels de classement — SUPER-ADMIN uniquement.
// Couche séparée et réversible : points ±, buts pour / contre ±, ordre imposé entre équipes à égalité.
// Motif obligatoire, journalisé avec le rang / les points avant et après. « Réinitialiser au calcul automatique »
// annule les ajustements actifs (ils restent dans l'historique) et rend exactement le classement calculé.
import { useMemo, useState } from 'react'
import { Gavel, RotateCcw, Undo2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useAdminScope } from '@/hooks/useAdminScope'
import { usePreseason, isPreseasonComp } from '@/hooks/usePreseason'
import { AdminPage } from '@/components/admin/AdminLayout'
import { FilterSelect } from '@/components/league/FilterSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { competitionStandings } from '@/lib/standings'
import { preseasonRanking } from '@/lib/preseason'
import { activeAdjustments, adjustmentLabel } from '@/lib/adjustments'
import { fmtDateTime } from '@/lib/format'
import type { StandingAdjustment } from '@/types/entities'
import { cn } from '@/lib/utils'

type Snap = { rank: number; points: number; gf: number; ga: number }
const today = () => new Date().toISOString().slice(0, 10)

export default function StandingsAdjustAdmin() {
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const { seasonId } = useAdminScope()
  // compétitions à classement (pas les phases finales à élimination)
  const comps = db.Competition.filter((c) => c.season_id === seasonId && c.phase !== 'knockout')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const [compId, setCompId] = useState('')
  const comp = comps.find((c) => c.id === compId) ?? comps[0]
  const pre = usePreseason(seasonId)
  const all = (db.StandingAdjustment ?? []).filter((a) => a.competition_id === comp?.id)
  const active = activeAdjustments(all, comp?.id ?? '')

  /** classement de la compétition avec une liste d'ajustements donnée */
  const rank = useMemo(() => (adjs: StandingAdjustment[]): Snap[] & { team_id: string }[] => {
    if (!comp) return []
    if (isPreseasonComp(comp) && pre) return preseasonRanking(pre.teamIds, pre.pm, { order: pre.state.finished ? pre.cfg.finalOrder : pre.cfg.intermediateOrder, drawOrder: pre.drawOrder, points: pre.cfg.points, adjustments: adjs }) as never
    return competitionStandings({ ...league, adjustments: adjs }, comp.id) as never
  }, [comp, pre, league])
  const auto = rank([]), current = rank(active)
  const snap = (rows: (Snap & { team_id: string })[], team: string): Snap => { const r = rows.find((x) => x.team_id === team); return { rank: r?.rank ?? 0, points: r?.points ?? 0, gf: r?.gf ?? 0, ga: r?.ga ?? 0 } }

  const [f, setF] = useState({ team: '', points: '', gf: '', ga: '', forced: '', reason: '', date: today() })
  const num = (s: string) => (s.trim() === '' ? 0 : Number(s))
  const draft = (): StandingAdjustment | null => {
    if (!comp || !f.team) return null
    return { id: 'draft', competition_id: comp.id, team_id: f.team, points: num(f.points) || undefined, gf: num(f.gf) || undefined, ga: num(f.ga) || undefined, forced_order: f.forced.trim() ? Number(f.forced) : undefined, reason: f.reason.trim(), decision_date: f.date, active: true } as StandingAdjustment
  }
  const d = draft()
  const preview = d ? rank([...active, d]) : null
  const invalid = !d ? 'Choisissez une équipe.' : !f.reason.trim() ? 'Le motif est obligatoire.' : [f.points, f.gf, f.ga, f.forced].some((x) => x.trim() && !Number.isInteger(Number(x))) ? 'Valeurs entières uniquement.' : !d.points && !d.gf && !d.ga && d.forced_order == null ? 'Indiquez au moins une correction.' : !f.date ? 'Date de la décision obligatoire.' : null

  const apply = async () => {
    if (!d || invalid || !preview) return
    const before = snap(current, d.team_id), after = snap(preview, d.team_id)
    const { id: _id, ...row } = d; void _id
    const created = await base44.entities.StandingAdjustment.create({ ...row, created_by: user?.email, before, after })
    base44.logActivity('standing_adjustment', 'StandingAdjustment', created as never, { competition: comp?.name, equipe: L.team.get(d.team_id)?.name, ajustement: adjustmentLabel(d), motif: d.reason, avant: before, apres: after })
    toast.success('Ajustement appliqué')
    setF({ team: '', points: '', gf: '', ga: '', forced: '', reason: '', date: today() })
  }
  const cancel = async (list: StandingAdjustment[], what: string) => {
    if (!list.length || !confirm(`${what} ? Le classement reviendra au calcul automatique pour ${list.length > 1 ? 'ces ajustements' : 'cet ajustement'} (l’historique est conservé).`)) return
    const before = current
    for (const a of list) await base44.entities.StandingAdjustment.update(a.id, { active: false, cancelled_at: new Date().toISOString(), cancelled_by: user?.email })
    const after = rank(active.filter((a) => !list.includes(a)))
    for (const a of list) base44.logActivity('standing_adjustment_cancel', 'StandingAdjustment', a as never, { competition: comp?.name, equipe: L.team.get(a.team_id)?.name, ajustement: adjustmentLabel(a), avant: snap(before, a.team_id), apres: snap(after, a.team_id) })
    toast.success(list.length > 1 ? 'Classement revenu au calcul automatique' : 'Ajustement annulé')
  }

  const teams = (current as { team_id: string }[]).map((r) => r.team_id)
  return (
    <AdminPage title="Ajustements de classement" subtitle="Réservé aux super-admins. Correction ajoutée au calcul automatique (jamais modifié), avec motif public et journal."
      actions={<Button variant="destructive" disabled={!active.length} onClick={() => cancel(active, 'Réinitialiser au calcul automatique')}><RotateCcw />Réinitialiser au calcul automatique</Button>}>
      <div className="mb-4 max-w-sm"><FilterSelect label="Compétition" value={comp?.id ?? ''} onChange={setCompId} allLabel={null} options={comps.map((c) => ({ value: c.id, label: c.name }))} /></div>
      {!comp ? <p className="text-sm text-muted-foreground">Aucune compétition pour cette saison.</p> : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="size-4" />Nouvel ajustement</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="block">Équipe
                <select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-input bg-night-950 px-2">
                  <option value="">— Choisir —</option>
                  {teams.map((t) => <option key={t} value={t}>{L.team.get(t)?.name ?? t}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label>Points ±<Input inputMode="numeric" placeholder="ex. -3" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} /></label>
                <label>Buts pour ±<Input inputMode="numeric" placeholder="0" value={f.gf} onChange={(e) => setF({ ...f, gf: e.target.value })} /></label>
                <label>Buts contre ±<Input inputMode="numeric" placeholder="0" value={f.ga} onChange={(e) => setF({ ...f, ga: e.target.value })} /></label>
              </div>
              <label className="block">Ordre imposé à égalité de points (facultatif : 1 = devant)<Input inputMode="numeric" value={f.forced} onChange={(e) => setF({ ...f, forced: e.target.value })} /></label>
              <label className="block">Motif (obligatoire, affiché au public)<Textarea rows={3} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="ex. Joueur non inscrit aligné contre CTR (Art. 2.3)" /></label>
              <label className="block">Date de la décision<Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
              {d && preview && (
                <p className="rounded-lg bg-white/5 p-2 text-xs">
                  {L.team.get(d.team_id)?.name} : {snap(current, d.team_id).rank}e · {snap(current, d.team_id).points} pts → <b>{snap(preview, d.team_id).rank}e · {snap(preview, d.team_id).points} pts</b>
                  <span className="mt-0.5 block text-muted-foreground">Affiché au public : « {adjustmentLabel(d)} »</span>
                </p>
              )}
              {invalid && f.team && <p className="text-xs text-amber-300">{invalid}</p>}
              <Button className="w-full" disabled={!!invalid} onClick={apply}><Gavel />Appliquer l’ajustement</Button>
            </CardContent>
          </Card>
          <div className="space-y-4 lg:col-span-3">
            <Card>
              <CardHeader><CardTitle>Classement : automatique → ajusté</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground"><th className="px-3 py-2 text-left">Équipe</th><th className="px-2 text-center">Auto</th><th className="px-2 text-center">Ajusté</th></tr></thead>
                  <tbody>{(current as (Snap & { team_id: string })[]).map((r) => {
                    const a = snap(auto as never, r.team_id), changed = a.rank !== r.rank || a.points !== r.points || a.gf !== r.gf || a.ga !== r.ga
                    return (
                      <tr key={r.team_id} className={cn('border-t border-white/5', changed && 'bg-amber-400/10')}>
                        <td className="px-3 py-1.5">{L.team.get(r.team_id)?.name}</td>
                        <td className="num px-2 text-center text-muted-foreground">{a.rank}e · {a.points}</td>
                        <td className={cn('num px-2 text-center', changed && 'font-bold text-amber-300')}>{r.rank}e · {r.points}</td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Historique des ajustements</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {!all.length && <p className="text-muted-foreground">Aucun ajustement : le classement est celui du calcul automatique.</p>}
                {all.slice().sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? '')).map((a) => (
                  <div key={a.id} className={cn('rounded-xl border p-3', a.active ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 opacity-60')}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <b>{L.team.get(a.team_id)?.name}</b> — {adjustmentLabel(a)}
                        <div className="text-muted-foreground">{a.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.before && a.after && <>Avant {a.before.rank}e · {a.before.points} pts → après {a.after.rank}e · {a.after.points} pts · </>}
                          par {a.created_by ?? '—'}{a.created_date ? ` le ${fmtDateTime(a.created_date)}` : ''}
                          {!a.active && <> · annulé{a.cancelled_by ? ` par ${a.cancelled_by}` : ''}{a.cancelled_at ? ` le ${fmtDateTime(a.cancelled_at)}` : ''}</>}
                        </div>
                      </div>
                      {a.active && <Button size="sm" variant="outline" onClick={() => cancel([a], 'Annuler cet ajustement')}><Undo2 />Annuler</Button>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminPage>
  )
}
