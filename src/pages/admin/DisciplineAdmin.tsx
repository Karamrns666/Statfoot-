// Admin — Conseil de discipline (règlement v8, Art. 11.5, 11.6, 17.7, 19).
// Pas de cumul de jaunes, pas de suspension automatique : seul le conseil suspend. Une affaire suit le règlement :
// sanctions fixées avant le vote (19.4) → lien de vote publié, 8 h (19.5) → voix Ardentia, Sifflé d'Or, capitaines (19.2, 19.7)
// → décision (19.8) → PV envoyé dans le groupe WhatsApp des capitaines (17.7, 19.9). Seule la sanction retenue est publiée.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ClipboardCopy, FileDown, FilePlus2, Gavel, Paperclip, Plus, Send, Timer, Users } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useSeasonDiscipline, useSeasonRules } from '@/hooks/useDiscipline'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { ArtLink } from '@/components/reglement/ArtLink'
import { TeamLogo } from '@/components/league/Identity'
import { DivisionMark } from '@/components/preseason/PreseasonTable'
import { COUNCIL, captainsVoice, councilDecision, sanctionLabel, voteClosesAt, type Sanction } from '@/lib/reglement'
import { PV_KIND_LABEL, blankPvText, captainOf, councilPvText, councilVoters, plainPv, pvNumber } from '@/lib/council'
import { exportPvPdf } from '@/lib/pdf'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DisciplineCase, MatchEvent, ProcesVerbal } from '@/types/entities'

const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const copyText = async (t: string, what = 'Texte') => { try { await navigator.clipboard.writeText(t); toast.success(`${what} copié — à coller dans WhatsApp`) } catch { toast.error('Copie impossible : sélectionnez le texte') } }

export default function DisciplineAdmin() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const rules = useSeasonRules(seasonId)
  const discipline = useSeasonDiscipline(seasonId)
  const [newCase, setNewCase] = useState<Partial<DisciplineCase> | null>(null)
  const [pvEdit, setPvEdit] = useState<Partial<ProcesVerbal> | null>(null)
  const seasonMatches = useMemo(() => new Set(db.Match.filter((m) => m.season_id === seasonId).map((m) => m.id)), [db.Match, seasonId])
  const cases = db.DisciplineCase.filter((c) => c.season_id === seasonId).sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? ''))
  const open = cases.filter((c) => c.status === 'open'), decided = cases.filter((c) => c.status === 'decided')
  const pvs = db.ProcesVerbal.filter((p) => p.season_id === seasonId)
  const reds = db.MatchEvent.filter((e) => (e.type === 'red_card' || e.type === 'second_yellow') && e.player_id && e.card_target !== 'official' && seasonMatches.has(e.match_id))
    .sort((a, b) => (L.match.get(b.match_id)?.date ?? '').localeCompare(L.match.get(a.match_id)?.date ?? ''))
  const pendingReds = reds.filter((e) => !db.DisciplineCase.some((c) => c.event_id === e.id))
  const violations = [...discipline.values()].flatMap((d) => d.violations.map((mid) => ({ d, mid })))
  const legacy = db.Suspension.filter((s) => s.season_id === seasonId)

  const fromRed = (e: MatchEvent): Partial<DisciplineCase> => {
    const m = L.match.get(e.match_id)
    const vs = m ? `${L.team.get(m.home_team_id)?.short_name} – ${L.team.get(m.away_team_id)?.short_name}` : 'le match'
    return { player_id: e.player_id, team_id: L.player.get(e.player_id ?? '')?.team_id ?? e.team_id, match_id: e.match_id, event_id: e.id, proposed_matches: 1, incident: `${e.type === 'second_yellow' ? 'Expulsion (2e avertissement)' : 'Carton rouge direct'}${e.minute ? ` à la ${e.minute}e minute` : ''} lors de ${vs}.` }
  }

  if (!rules.council) return (
    <AdminPage title="Discipline" subtitle="Ancienne saison : suspensions saisies à la main.">
      <Card><CardContent className="space-y-3 pt-5 text-sm">
        <p className="text-muted-foreground">Cette saison suit un ancien règlement : les suspensions se saisissent dans <Link to="/admin/xp" className="text-neon">Règles XP → Suspensions</Link>. Le conseil de discipline s’applique à partir du règlement v8 (saison 2026-2027).</p>
        {legacy.length > 0 && <ul className="divide-y divide-white/5">{legacy.map((s) => { const p = L.player.get(s.player_id); const d = discipline.get(s.player_id); const r = d?.suspensions.find((x) => x.id === s.id); return <li key={s.id} className="flex items-center gap-2 py-2"><b>{p?.first_name} {p?.last_name}</b><span className="text-muted-foreground">{L.team.get(p?.team_id ?? '')?.short_name} · {s.matches} match(s)</span><span className="ml-auto text-xs">{r && r.served.length >= r.matches ? 'purgée' : <b className="text-red-300">{r ? r.matches - r.served.length : s.matches} à purger</b>}</span></li> })}</ul>}
      </CardContent></Card>
    </AdminPage>
  )

  return (
    <AdminPage title="Conseil de discipline" subtitle="Règlement v8 : pas de cumul de jaunes, pas de suspension automatique. Seul le conseil de discipline suspend un joueur." actions={<Button onClick={() => setNewCase({ proposed_matches: 1, incident: '' })}><Plus />Nouvelle affaire</Button>}>
      <div className="space-y-4">
        {violations.length > 0 && (
          <div role="alert" className="space-y-1 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            {violations.map(({ d, mid }) => { const p = L.player.get(d.player_id), m = L.match.get(mid); return <p key={`${d.player_id}:${mid}`} className="flex items-center gap-2"><AlertTriangle className="size-4 shrink-0" />{p?.first_name} {p?.last_name} était suspendu mais figure sur la feuille de {m ? <Link className="underline" to={`/admin/matchs/${m.id}/feuille`}>{L.team.get(m.home_team_id)?.short_name}–{L.team.get(m.away_team_id)?.short_name} ({fmtDate(m.date, 'd MMM')})</Link> : 'un match'}.</p> })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="inline-block h-4 w-3 rounded-sm bg-red-500" aria-hidden />Expulsions à examiner</CardTitle>
            <CardDescription>Un rouge n’entraîne pas de suspension automatique : le joueur peut jouer le match suivant, sauf si le conseil le suspend. <ArtLink art="11.6" /></CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReds.length ? <ul className="divide-y divide-white/5">{pendingReds.map((e) => {
              const p = L.player.get(e.player_id ?? ''), m = L.match.get(e.match_id)
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="min-w-0 flex-1"><b>{p?.first_name} {p?.last_name}</b> <span className="text-muted-foreground">· {L.team.get(p?.team_id ?? '')?.short_name} · {m ? `${L.team.get(m.home_team_id)?.short_name}–${L.team.get(m.away_team_id)?.short_name}, ${fmtDate(m.date, 'd MMM')}` : ''} · {e.type === 'second_yellow' ? '2e avertissement' : 'rouge direct'}{e.minute ? ` (${e.minute}')` : ''}</span></span>
                  <Button size="sm" variant="secondary" onClick={() => setNewCase(fromRed(e))}><Gavel />Saisir le conseil</Button>
                </li>
              )
            })}</ul> : <p className="text-sm text-muted-foreground">Aucune expulsion en attente : chacune a une affaire au conseil.</p>}
          </CardContent>
        </Card>

        <section aria-labelledby="open-title" className="space-y-3">
          <h2 id="open-title" className="title-caps text-xl">Affaires en cours <span className="text-muted-foreground">({open.length})</span></h2>
          {open.length ? open.map((c) => <CaseCard key={c.id} c={c} seasonId={seasonId} />) : <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground">Aucune affaire en cours.</p>}
        </section>

        <Card>
          <CardHeader><CardTitle>Décisions rendues</CardTitle><CardDescription>Seule la sanction retenue est communiquée — c’est aussi la seule information publiée sur le site. <ArtLink art={COUNCIL.artCommunication} /></CardDescription></CardHeader>
          <CardContent>
            {decided.length ? <ul className="divide-y divide-white/5">{decided.map((c) => {
              const p = L.player.get(c.player_id), d = discipline.get(c.player_id), r = d?.suspensions.find((x) => x.case_id === c.id)
              const pv = pvs.find((x) => x.id === c.pv_id)
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm">
                  <TeamLogo team={L.team.get(c.team_id)} size={26} />
                  <span className="min-w-0 flex-1"><b>{p?.first_name} {p?.last_name}</b> <span className="text-muted-foreground">· {fmtDate(c.decided_at, 'd MMM')}</span><span className="block text-xs text-muted-foreground">{c.incident}</span></span>
                  <Badge variant={c.decision === 'suspension' ? 'destructive' : 'secondary'}>{sanctionLabel(c.decision ?? 'warning', c.decision_matches ?? 0)}</Badge>
                  {c.decision === 'suspension' && r && <span className={cn('text-xs font-semibold', r.served.length >= r.matches ? 'text-win' : 'text-red-300')}>{r.served.length >= r.matches ? 'purgée' : `${r.matches - r.served.length} à purger`}</span>}
                  {pv && <PvActions pv={pv} all={pvs} onEdit={() => setPvEdit(pv)} />}
                </li>
              )
            })}</ul> : <p className="text-sm text-muted-foreground">Aucune décision pour l’instant.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
            <div><CardTitle>Procès-verbaux</CardTitle><CardDescription>Toutes les décisions (sanctions, réclamations, forfaits…) sont consignées dans un PV envoyé dans le groupe WhatsApp des capitaines. <ArtLink art={COUNCIL.artPv} /></CardDescription></div>
            <Button size="sm" variant="secondary" onClick={() => { const date = new Date().toISOString().slice(0, 10); setPvEdit({ kind: 'reclamation', date, title: '', text: blankPvText('reclamation', seasonName(db, seasonId), date, '…') }) }}><FilePlus2 />Nouveau PV</Button>
          </CardHeader>
          <CardContent>
            {pvs.length ? <ul className="divide-y divide-white/5">{[...pvs].sort((a, b) => b.date.localeCompare(a.date)).map((pv) => (
              <li key={pv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm">
                <span className="num w-20 shrink-0 text-xs font-bold text-muted-foreground">{pvNumber(pv, pvs, seasonYear(db, seasonId))}</span>
                <span className="min-w-0 flex-1"><b>{pv.title}</b><span className="block text-xs text-muted-foreground">{PV_KIND_LABEL[pv.kind]} · {fmtDate(pv.date, 'd MMM yyyy')}</span></span>
                <PvActions pv={pv} all={pvs} onEdit={() => setPvEdit(pv)} />
              </li>
            ))}</ul> : <p className="text-sm text-muted-foreground">Aucun PV pour l’instant.</p>}
          </CardContent>
        </Card>
      </div>
      {newCase && <NewCaseDialog init={newCase} seasonId={seasonId} onClose={() => setNewCase(null)} />}
      {pvEdit && <PvDialog init={pvEdit} seasonId={seasonId} onClose={() => setPvEdit(null)} />}
    </AdminPage>
  )
}

const seasonName = (db: ReturnType<typeof useData>['db'], id: string) => db.Season.find((s) => s.id === id)?.name ?? ''
const seasonYear = (db: ReturnType<typeof useData>['db'], id: string) => (db.Season.find((s) => s.id === id)?.start_date ?? '').slice(0, 4)

/** Affaire en cours : sanctions fixées, capitaines votants, ouverture du vote (8 h), voix, décision. */
function CaseCard({ c, seasonId }: { c: DisciplineCase; seasonId: string }) {
  const { db } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const p = L.player.get(c.player_id), t = L.team.get(c.team_id), m = L.match.get(c.match_id ?? '')
  const [v, setV] = useState({ ardentia: c.voices?.ardentia ?? '', siffle_or: c.voices?.siffle_or ?? '', cw: c.voices?.captains_warning ?? 0, cs: c.voices?.captains_suspension ?? 0 })
  const [proposed, setProposed] = useState(c.proposed_matches)
  const seasonTeams = [...new Set(db.Competition.filter((x) => x.season_id === seasonId).flatMap((x) => x.team_ids ?? []))]
  const voters = councilVoters(c.team_id, seasonTeams, db.Competition, seasonId)
  const captains = voters.teams.map((id) => { const team = L.team.get(id); return { team, cap: team ? captainOf(team, db.Player) : undefined } }).filter((x) => x.team).sort((a, b) => (a.team!.name).localeCompare(b.team!.name))
  const closes = c.vote_opened_at ? voteClosesAt(c.vote_opened_at) : undefined
  const closed = !!closes && Date.now() >= new Date(closes).getTime()
  const voices = { ardentia: v.ardentia || undefined, siffle_or: v.siffle_or || undefined, captains_warning: v.cw, captains_suspension: v.cs } as const
  const result = councilDecision(voices as never)
  const save = (patch: Partial<DisciplineCase>) => base44.entities.DisciplineCase.update(c.id, patch)
  const announce = [
    `*CONSEIL DE DISCIPLINE — VOTE*`,
    `Affaire : ${p?.first_name} ${p?.last_name} (${t?.name})${m ? `, ${L.team.get(m.home_team_id)?.short_name}–${L.team.get(m.away_team_id)?.short_name} du ${fmtDate(m.date, 'd MMMM')}` : ''}`,
    `Faits : ${c.incident}`,
    '',
    `Sanctions possibles (Art. 19.4) :`,
    `1. Avertissement`,
    `2. Suspension de ${proposed} match${proposed > 1 ? 's' : ''}`,
    '',
    `Le vote est ouvert pendant ${COUNCIL.voteHours} heures à partir de ce message. Les votes reçus après ce délai ne sont pas comptés. Vote anonyme (Art. 19.6).`,
    `Lien de vote : `,
  ].join('\n')

  const decide = async () => {
    if (!closed && !window.confirm(`Le vote n’est pas clos (fin à ${closes ? new Date(closes).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}). Arrêter la décision quand même ?`)) return
    const decided_at = nowLocal()
    const decision: Sanction = result.decision
    const patch: Partial<DisciplineCase> = { status: 'decided', decision, decision_matches: decision === 'suspension' ? proposed : 0, decided_at, voices: voices as never }
    let suspension_id: string | undefined
    if (decision === 'suspension') suspension_id = (await base44.entities.Suspension.create({ kind: 'council', case_id: c.id, season_id: seasonId, player_id: c.player_id, team_id: c.team_id, origin_match_id: c.match_id, origin_event_id: c.event_id, date: decided_at, matches: proposed, reason: c.incident, created_by: user?.email })).id
    const full = { ...c, ...patch }
    const text = councilPvText(full, { season: seasonName(db, seasonId), player: p, team: t, match: m ? { date: m.date, label: `${L.team.get(m.home_team_id)?.name} – ${L.team.get(m.away_team_id)?.name}` } : undefined })
    const pv = await base44.entities.ProcesVerbal.create({ season_id: seasonId, kind: 'discipline', title: `${p?.first_name} ${p?.last_name} (${t?.short_name}) — ${sanctionLabel(decision, proposed)}`, date: decided_at.slice(0, 10), text, case_id: c.id, match_id: c.match_id, created_by: user?.email })
    await save({ ...patch, suspension_id, pv_id: pv.id })
    base44.logActivity('council_decision', 'DisciplineCase', { id: c.id, name: `${p?.first_name} ${p?.last_name}` } as never, { decision: sanctionLabel(decision, proposed) })
    toast.success(`Décision retenue : ${sanctionLabel(decision, proposed)} — PV créé`)
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-night-900/50 p-4">
      <header className="flex flex-wrap items-start gap-3">
        <TeamLogo team={t} size={36} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-black uppercase leading-tight">{p?.first_name} {p?.last_name} <span className="text-sm font-semibold normal-case text-muted-foreground">· {t?.name}</span></h3>
          <p className="text-sm text-muted-foreground">{m ? <Link to={`/admin/matchs/${m.id}`} className="hover:text-neon">{L.team.get(m.home_team_id)?.short_name}–{L.team.get(m.away_team_id)?.short_name}, {fmtDate(m.date, 'd MMM')}</Link> : 'Hors match'} · {c.incident}</p>
        </div>
        <Badge variant="outline">{c.vote_opened_at ? (closed ? 'Vote clos' : 'Vote en cours') : 'À lancer'}</Badge>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="rounded-xl bg-white/[.04] p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">1 · Sanctions soumises au vote <ArtLink art={COUNCIL.artSanctions} /></p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-lg border border-white/15 px-2.5 py-1">Avertissement</span><span className="text-muted-foreground">ou</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2 py-0.5">Suspension de
                <Input aria-label="Nombre de matchs de suspension soumis au vote" type="number" min={1} max={20} value={proposed} disabled={!!c.vote_opened_at} onChange={(e) => setProposed(Math.max(1, +e.target.value || 1))} onBlur={() => proposed !== c.proposed_matches && save({ proposed_matches: proposed })} className="h-7 w-14 px-1.5 text-center" />match{proposed > 1 ? 's' : ''}</span>
            </div>
            {c.vote_opened_at && <p className="mt-1 text-[11px] text-muted-foreground">Fixé avant le vote : ne peut plus changer.</p>}
          </div>
          <div className="rounded-xl bg-white/[.04] p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">2 · Vote dans le groupe WhatsApp du conseil <ArtLink art={COUNCIL.artVote} /></p>
            {c.vote_opened_at ? (
              <p className="mt-2 flex items-center gap-2 text-sm"><Timer className="size-4 text-neon" />Ouvert le {new Date(c.vote_opened_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {closed ? <b>clos</b> : <>clôture à <b>{new Date(closes!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</b></>}</p>
            ) : <p className="mt-2 text-sm text-muted-foreground">Copiez l’annonce, collez-la dans le groupe avec le lien du formulaire, puis indiquez l’heure de publication.</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => copyText(announce, 'Annonce du vote')}><ClipboardCopy />Copier l’annonce</Button>
              {!c.vote_opened_at && <Button size="sm" onClick={async () => { await save({ vote_opened_at: new Date().toISOString(), proposed_matches: proposed }); toast.success(`Vote ouvert pour ${COUNCIL.voteHours} h`) }}><Send />Lien publié maintenant</Button>}
            </div>
          </div>
          <div className="rounded-xl bg-white/[.04] p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Users className="size-3.5" />Capitaines qui votent <ArtLink art={COUNCIL.artVoters} /></p>
            <p className="mt-1 text-sm">{voters.voters ? <>Équipe en <DivisionMark div={voters.division!} size={16} className="text-xs" /> : votent les capitaines <DivisionMark div={voters.voters} size={16} className="text-xs" /> ({captains.length}).</> : <span className="text-amber-200">Les divisions ne sont pas encore formées (pré-saison) : à défaut, tous les autres capitaines ({captains.length}).</span>}</p>
            <ul className="mt-2 grid max-h-48 gap-x-3 gap-y-1 overflow-auto text-sm sm:grid-cols-2">
              {captains.map(({ team, cap }) => <li key={team!.id} className="flex min-w-0 items-center gap-1.5"><TeamLogo team={team} size={18} /><span className="truncate">{cap ? `${cap.first_name} ${cap.last_name}` : <span className="text-amber-300">capitaine non désigné</span>}</span><span className="shrink-0 text-xs text-muted-foreground">{team!.short_name}</span></li>)}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-white/15 p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">3 · Voix du conseil <ArtLink art="19.2" /> <span className="ml-1 normal-case text-amber-200">— interne, jamais publié</span></p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['ardentia', 'siffle_or'] as const).map((k) => (
                <div key={k}><Label className="text-xs">{k === 'ardentia' ? 'Ardentia (1 voix)' : 'Association Sifflé d’Or (1 voix)'}</Label>
                  <Select value={v[k] || 'none'} onValueChange={(x) => setV({ ...v, [k]: x === 'none' ? '' : x })}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Pas encore</SelectItem><SelectItem value="warning">Avertissement</SelectItem><SelectItem value="suspension">Suspension</SelectItem></SelectContent>
                  </Select>
                </div>
              ))}
              <div className="sm:col-span-2"><Label className="text-xs">Capitaines — votes reçus dans le délai <ArtLink art="19.7" /></Label>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <Input aria-label="Votes des capitaines pour l’avertissement" type="number" min={0} value={v.cw} onChange={(e) => setV({ ...v, cw: Math.max(0, +e.target.value || 0) })} className="h-9 w-16 text-center" />avertissement
                  <Input aria-label="Votes des capitaines pour la suspension" type="number" min={0} value={v.cs} onChange={(e) => setV({ ...v, cs: Math.max(0, +e.target.value || 0) })} className="ml-2 h-9 w-16 text-center" />suspension
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Voix des capitaines : <b>{captainsVoice({ captains_warning: v.cw, captains_suspension: v.cs }) === 'suspension' ? 'suspension' : 'avertissement'}</b> (égalité ou aucun vote → avertissement).</p>
              </div>
            </div>
          </div>
          <div className={cn('rounded-xl p-3', result.decision === 'suspension' ? 'bg-red-500/10' : 'bg-white/[.06]')}>
            <p className="text-xs font-bold uppercase text-muted-foreground">4 · Décision <ArtLink art={COUNCIL.artDecision} /></p>
            <p className="mt-1 font-display text-xl font-black uppercase">{sanctionLabel(result.decision, proposed)}</p>
            <p className="text-xs text-muted-foreground">{result.voices.suspension} voix pour la suspension, {result.voices.warning} pour l’avertissement ; égalité → avertissement.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={async () => { await save({ voices: voices as never }); toast.success('Voix enregistrées') }}>Enregistrer</Button>
              <Button size="sm" disabled={!c.vote_opened_at} onClick={decide}><Check />Arrêter la décision et créer le PV</Button>
            </div>
            {!c.vote_opened_at && <p className="mt-1 text-[11px] text-muted-foreground">Le vote doit d’abord être lancé.</p>}
          </div>
          <button className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-red-300 hover:underline" onClick={async () => { if (window.confirm('Supprimer cette affaire ?')) { await base44.entities.DisciplineCase.delete(c.id); toast.success('Affaire supprimée') } }}>Supprimer l’affaire</button>
        </div>
      </div>
    </article>
  )
}

function NewCaseDialog({ init, seasonId, onClose }: { init: Partial<DisciplineCase>; seasonId: string; onClose: () => void }) {
  const { db } = useData()
  const { user } = useAuth()
  const [v, setV] = useState(init)
  const teams = [...new Set(db.Competition.filter((x) => x.season_id === seasonId).flatMap((x) => x.team_ids ?? []))].map((id) => db.Team.find((t) => t.id === id)).filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name))
  const players = db.Player.filter((p) => p.team_id === v.team_id).sort((a, b) => a.last_name.localeCompare(b.last_name))
  const matches = db.Match.filter((m) => m.season_id === seasonId && (m.home_team_id === v.team_id || m.away_team_id === v.team_id) && m.status === 'finished').sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const ok = v.team_id && v.player_id && v.incident?.trim() && (v.proposed_matches ?? 0) >= 1
  const create = async () => {
    const row = await base44.entities.DisciplineCase.create({ season_id: seasonId, player_id: v.player_id!, team_id: v.team_id!, match_id: v.match_id, event_id: v.event_id, incident: v.incident!.trim(), proposed_matches: v.proposed_matches ?? 1, status: 'open', created_by: user?.email })
    base44.logActivity('council_case', 'DisciplineCase', { id: row.id, name: v.incident } as never, {})
    toast.success('Affaire ouverte au conseil de discipline'); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Saisir le conseil de discipline</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Équipe</Label><Select value={v.team_id ?? ''} onValueChange={(x) => setV({ ...v, team_id: x, player_id: undefined, match_id: undefined })} disabled={!!init.event_id}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{teams.map((t) => <SelectItem key={t!.id} value={t!.id}>{t!.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Joueur</Label><Select value={v.player_id ?? ''} onValueChange={(x) => setV({ ...v, player_id: x })} disabled={!!init.event_id || !v.team_id}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{players.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Match (facultatif)</Label><Select value={v.match_id ?? 'none'} onValueChange={(x) => setV({ ...v, match_id: x === 'none' ? undefined : x })} disabled={!!init.event_id || !v.team_id}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Hors match</SelectItem>{matches.map((m) => <SelectItem key={m.id} value={m.id}>{db.Team.find((t) => t.id === m.home_team_id)?.short_name}–{db.Team.find((t) => t.id === m.away_team_id)?.short_name} · {fmtDate(m.date, 'd MMM')}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="cc-inc">Faits</Label><Textarea id="cc-inc" value={v.incident ?? ''} onChange={(e) => setV({ ...v, incident: e.target.value })} className="mt-1 min-h-20" placeholder="Ce qui s’est passé, selon le rapport de l’arbitre" /></div>
          <div><Label htmlFor="cc-n">Suspension soumise au vote (matchs)</Label><Input id="cc-n" type="number" min={1} value={v.proposed_matches ?? 1} onChange={(e) => setV({ ...v, proposed_matches: Math.max(1, +e.target.value || 1) })} className="mt-1 w-24" /><p className="mt-1 text-xs text-muted-foreground">Le vote oppose un avertissement à cette suspension ; le nombre est fixé avant le vote (Art. 19.4).</p></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Annuler</Button><Button disabled={!ok} onClick={create}><Gavel />Ouvrir l’affaire</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Copier pour WhatsApp, télécharger en PDF, PDF joint. */
function PvActions({ pv, all, onEdit }: { pv: ProcesVerbal; all: ProcesVerbal[]; onEdit: () => void }) {
  const { db } = useData()
  const num = pvNumber(pv, all, seasonYear(db, pv.season_id))
  return (
    <span className="flex flex-wrap gap-1.5">
      {pv.text && <Button size="sm" variant="secondary" onClick={() => copyText(`${num}\n${pv.text}`, 'PV')}><ClipboardCopy />Copier pour WhatsApp</Button>}
      {pv.text && <Button size="sm" variant="outline" onClick={() => exportPvPdf(num, pv.title, plainPv(pv.text!))}><FileDown />PDF</Button>}
      {pv.pdf_url && <Button size="sm" variant="outline" asChild><a href={pv.pdf_url} target="_blank" rel="noreferrer"><Paperclip />PDF joint</a></Button>}
      <Button size="sm" variant="ghost" onClick={onEdit}>Modifier</Button>
    </span>
  )
}

function PvDialog({ init, seasonId, onClose }: { init: Partial<ProcesVerbal>; seasonId: string; onClose: () => void }) {
  const { db } = useData()
  const { user } = useAuth()
  const [v, setV] = useState(init)
  const [busy, setBusy] = useState(false)
  const ok = v.title?.trim() && v.date && (v.text?.trim() || v.pdf_url)
  const save = async () => {
    const data = { kind: v.kind ?? 'autre', title: v.title!.trim(), date: v.date!, text: v.text?.trim() || undefined, pdf_url: v.pdf_url || undefined }
    if (v.id) await base44.entities.ProcesVerbal.update(v.id, data)
    else await base44.entities.ProcesVerbal.create({ ...data, season_id: seasonId, created_by: user?.email })
    toast.success('PV enregistré'); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{v.id ? 'Modifier le PV' : 'Nouveau procès-verbal'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_150px]">
            <div><Label>Type</Label><Select value={v.kind ?? 'autre'} onValueChange={(x) => setV({ ...v, kind: x as ProcesVerbal['kind'], text: v.id || v.text !== blankPvText(v.kind ?? 'autre', seasonName(db, seasonId), v.date ?? '', '…') ? v.text : blankPvText(x as ProcesVerbal['kind'], seasonName(db, seasonId), v.date ?? '', '…') })} disabled={v.kind === 'discipline' && !!v.id}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(PV_KIND_LABEL) as ProcesVerbal['kind'][]).map((k) => <SelectItem key={k} value={k} disabled={k === 'discipline' && !v.id}>{PV_KIND_LABEL[k]}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="pv-t">Objet</Label><Input id="pv-t" value={v.title ?? ''} onChange={(e) => setV({ ...v, title: e.target.value })} className="mt-1" placeholder="Réclamation de BMCI sur le match du 12 sept." /></div>
            <div><Label htmlFor="pv-d">Date</Label><Input id="pv-d" type="date" value={v.date ?? ''} onChange={(e) => setV({ ...v, date: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label htmlFor="pv-x">Texte du PV <span className="font-normal text-muted-foreground">(*gras* pour WhatsApp)</span></Label><Textarea id="pv-x" value={v.text ?? ''} onChange={(e) => setV({ ...v, text: e.target.value })} className="mt-1 min-h-64 font-mono text-[13px]" /></div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/5"><Paperclip className="size-4" />{v.pdf_url ? 'Remplacer le PDF' : 'Joindre un PDF signé'}
              <input type="file" accept="application/pdf" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { setV({ ...v, pdf_url: (await base44.integrations.Core.UploadFile({ file: f, hint: 'pv' })).file_url }) } finally { setBusy(false) } }} />
            </label>
            {v.pdf_url && <a href={v.pdf_url} target="_blank" rel="noreferrer" className="text-neon underline">PDF joint</a>}
            {busy && <span className="text-muted-foreground">Envoi…</span>}
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Annuler</Button><Button disabled={!ok || busy} onClick={save}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

