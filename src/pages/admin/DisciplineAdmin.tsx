// Admin — Discipline (Art. 11.5, 11.6, 2.5) : suspensions automatiques calculées depuis les cartons,
// décision d'Ardentia après chaque expulsion (suspension supplémentaire, motif, rapport de l'arbitre, date de notification
// au capitaine), alertes (joueur suspendu aligné quand même, décision non notifiée).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Gavel, Save } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useSeasonDiscipline, useSeasonRules } from '@/hooks/useDiscipline'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { ArtLink } from '@/components/reglement/ArtLink'
import { YellowCounter } from '@/components/reglement/YellowCounter'
import { REGLEMENT, SUSPENSION_LABEL, isThreatened } from '@/lib/reglement'
import { phaseLabel } from '@/lib/disciplineLabels'
import { fmtDate } from '@/lib/format'
import type { MatchEvent, Suspension } from '@/types/entities'

export default function DisciplineAdmin() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const rules = useSeasonRules(seasonId)
  const all = useSeasonDiscipline(seasonId)
  const players = all.flatMap((c) => [...c.players.values()].map((d) => ({ d, comp: c.competition })))
  const violations = players.flatMap(({ d }) => d.violations.map((mid) => ({ d, mid })))
  const compIds = new Set(all.map((c) => c.competition.id))
  const reds = db.MatchEvent.filter((e) => (e.type === 'red_card' || e.type === 'second_yellow') && e.player_id && e.card_target !== 'official' && compIds.has(L.match.get(e.match_id)?.competition_id ?? ''))
    .sort((a, b) => (L.match.get(b.match_id)?.date ?? '').localeCompare(L.match.get(a.match_id)?.date ?? ''))
  const decisionOf = (e: MatchEvent) => db.Suspension.find((s) => s.kind === 'extra' && s.origin_event_id === e.id)
  const unnotified = reds.filter((e) => !decisionOf(e)?.notified_at)

  return (
    <AdminPage title="Discipline" subtitle="Cumul des jaunes et suspensions calculés automatiquement depuis les cartons saisis. Une correction de carton recalcule tout.">
      {!rules.cumulativeCards ? (
        <Card><CardContent className="pt-5 text-sm text-muted-foreground">Cette saison n’est pas rattachée au règlement v4 : les suspensions se saisissent à la main dans <Link to="/admin/xp" className="text-neon">Règles XP → Suspensions</Link>.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {(violations.length > 0 || unnotified.length > 0) && (
            <div role="alert" className="space-y-1 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
              {violations.map(({ d, mid }) => { const p = L.player.get(d.player_id), m = L.match.get(mid); return <p key={`${d.player_id}:${mid}`} className="flex items-center gap-2"><AlertTriangle className="size-4 shrink-0" />{p?.first_name} {p?.last_name} était suspendu mais figure sur la feuille de {m ? <Link className="underline" to={`/admin/matchs/${m.id}/feuille`}>{L.team.get(m.home_team_id)?.short_name}–{L.team.get(m.away_team_id)?.short_name} ({fmtDate(m.date, 'd MMM')})</Link> : 'un match'}.</p> })}
              {unnotified.length > 0 && <p className="flex items-center gap-2"><AlertTriangle className="size-4 shrink-0" />{unnotified.length} expulsion(s) sans date de notification de la décision au capitaine.</p>}
            </div>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="size-5 text-red-400" />Expulsions — décision d’Ardentia</CardTitle>
              <CardDescription>1 match de suspension automatique par rouge. Ardentia peut ajouter des matchs selon la gravité, sur rapport de l’arbitre, et doit notifier le capitaine avant le match suivant. <ArtLink art={REGLEMENT.cards.artRed} /></CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {reds.length ? reds.map((e) => <RedDecision key={e.id} e={e} decision={decisionOf(e)} seasonId={seasonId} />) : <p className="text-sm text-muted-foreground">Aucune expulsion pour l’instant.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Joueurs avec cartons</CardTitle><CardDescription>Compteur de cumul par compétition (3 jaunes = 1 match). <ArtLink art={REGLEMENT.cards.artYellow} /></CardDescription></CardHeader>
            <CardContent>
              {players.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground"><th className="py-1 text-left">Joueur</th><th className="hidden text-left sm:table-cell">Compétition</th><th className="text-left">Cumul</th><th className="text-center">J / R</th><th className="text-left">Suspensions</th></tr></thead>
                  <tbody>{players.sort((a, b) => b.d.remaining - a.d.remaining || b.d.counter - a.d.counter).map(({ d, comp }) => {
                    const p = L.player.get(d.player_id)
                    return (
                      <tr key={`${comp.id}:${d.player_id}`} className="border-t border-white/5 align-top">
                        <td className="py-2"><Link to={`/joueurs/${d.player_id}`} className="font-semibold hover:text-neon">{p?.first_name} {p?.last_name}</Link><span className="block text-xs text-muted-foreground">{L.team.get(d.team_id)?.short_name}</span></td>
                        <td className="hidden sm:table-cell">{phaseLabel(comp)}</td>
                        <td><YellowCounter d={d} />{isThreatened(d) && <span className="block text-[11px] text-amber-300">menacé</span>}</td>
                        <td className="num text-center">{d.yellowsTotal} / {d.redsTotal}</td>
                        <td className="text-xs">{d.suspensions.length ? d.suspensions.map((s) => <span key={s.id} className="block">{SUSPENSION_LABEL[s.kind]} · {s.matches} m. · {s.served.length >= s.matches ? 'purgée' : <b className="text-red-300">{s.matches - s.served.length} à purger</b>}</span>) : '—'}</td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              ) : <p className="text-sm text-muted-foreground">Aucun carton cette saison.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPage>
  )
}

function RedDecision({ e, decision, seasonId }: { e: MatchEvent; decision?: Suspension; seasonId: string }) {
  const L = useLookup()
  const { user } = useAuth()
  const p = L.player.get(e.player_id ?? ''), m = L.match.get(e.match_id)
  const [v, setV] = useState({ matches: decision?.matches ?? 0, reason: decision?.reason ?? '', report: decision?.referee_report ?? '', notified: decision?.notified_at ?? '' })
  const dirty = v.matches !== (decision?.matches ?? 0) || v.reason !== (decision?.reason ?? '') || v.report !== (decision?.referee_report ?? '') || v.notified !== (decision?.notified_at ?? '')
  const save = async () => {
    const data = { matches: v.matches, reason: v.reason || undefined, referee_report: v.report || undefined, notified_at: v.notified || undefined }
    if (decision) await base44.entities.Suspension.update(decision.id, data)
    else await base44.entities.Suspension.create({ kind: 'extra', season_id: seasonId, player_id: e.player_id!, team_id: p?.team_id, origin_match_id: e.match_id, origin_event_id: e.id, date: m?.date?.slice(0, 10), created_by: user?.email, ...data })
    toast.success(`Décision enregistrée : ${1 + v.matches} match(s) de suspension au total`)
  }
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="inline-block h-4 w-3 rounded-sm bg-red-500" aria-hidden />
        <b>{p?.first_name} {p?.last_name}</b><span className="text-muted-foreground">{L.team.get(p?.team_id ?? '')?.short_name} · {m ? `${L.team.get(m.home_team_id)?.short_name}–${L.team.get(m.away_team_id)?.short_name}, ${fmtDate(m.date, 'd MMM')}` : ''} · {e.type === 'second_yellow' ? '2e avertissement' : 'rouge direct'}{e.minute ? ` (${e.minute}')` : ''}</span>
        <span className="ml-auto text-xs">Total : <b>{1 + v.matches}</b> match(s)</span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[110px_1fr_170px]">
        <label className="text-xs text-muted-foreground">Matchs en plus<Input type="number" min={0} value={v.matches} onChange={(x) => setV({ ...v, matches: Math.max(0, +x.target.value) })} className="mt-1 h-9" /></label>
        <label className="text-xs text-muted-foreground">Motif<Input value={v.reason} onChange={(x) => setV({ ...v, reason: x.target.value })} placeholder="Violence, insultes, menaces, refus de sortir…" className="mt-1 h-9" /></label>
        <label className="text-xs text-muted-foreground">Notifiée au capitaine le<Input type="date" value={v.notified} onChange={(x) => setV({ ...v, notified: x.target.value })} className="mt-1 h-9" /></label>
      </div>
      <Textarea value={v.report} onChange={(x) => setV({ ...v, report: x.target.value })} placeholder="Rapport de l’arbitre" className="mt-2 min-h-14 text-sm" aria-label="Rapport de l’arbitre" />
      <div className="mt-2 flex justify-end"><Button size="sm" disabled={!dirty || (v.matches > 0 && !v.reason.trim())} onClick={save}><Save />Enregistrer</Button></div>
    </div>
  )
}
