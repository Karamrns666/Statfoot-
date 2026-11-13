// Admin — PRÉ-SAISON (système suisse) :
//  1. Paramètres (journées, taille MASTER) et contrôle du format (46 matchs, 4 par équipe…).
//  2. J1 : tirage officiel saisi à la main (2026-2027) — ou « Tirer au sort la journée 1 » (graine, journalisé) → projection.
//  3. J2…J4 puis rattrapage : générés AUTOMATIQUEMENT quand la journée précédente est entièrement validée ; aperçu avec
//     « Pts avant » et « Pourquoi ce match ? », échange manuel de deux équipes (motif, journalisé, rematch interdit),
//     puis « Créer les matchs » : numéros PS-12, PS-13…, statut « Horaire à définir ».
//  3bis. Horaires et terrains fixés par l'admin (ici ou dans le Planning) → « Publier la journée » quand tout est complet.
//  4. Classement en cours avec zone MASTER / CHALLENGER provisoire ; ordre du tirage au sort Ardentia (critère 5).
//  5. Clôture (classement figé) puis Répartition : top N → MASTER, le reste → CHALLENGER.
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Lock, MonitorPlay, RotateCcw, Shuffle, Sparkles, Split, Wand2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { newId } from '@/api/localStore'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { usePreseason, type PreseasonView } from '@/hooks/usePreseason'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { DivisionMark, PreseasonTable } from '@/components/preseason/PreseasonTable'
import { DrawProjection } from '@/components/preseason/DrawProjection'
import { CRITERION_LABEL, divisionSplit, drawRound1, generateNextRound, preseasonFormat, preseasonRanking, validateRound, type PMatch } from '@/lib/preseason'
import { competitionNames } from '@/lib/competitionNames'
import { TBD, nextNumbers, numberValue } from '@/lib/matchTime'
import { roundMatches } from '@/lib/preseasonRounds'
import { RoundScheduleCard } from '@/components/preseason/RoundScheduleCard'
import { cn } from '@/lib/utils'
import type { Competition, PreseasonData } from '@/types/entities'

const save = (comp: Competition, patch: Partial<PreseasonData>) => base44.entities.Competition.update(comp.id, { preseason: { ...(comp.preseason ?? {}), ...patch } })

export default function PreseasonAdmin() {
  const { seasonId } = useAdminScope()
  const { db } = useData()
  const v = usePreseason(seasonId)
  const season = db.Season.find((s) => s.id === seasonId)
  if (!v) {
    return (
      <AdminPage title="Pré-saison" subtitle="Système suisse : J1 tirée au sort, puis appariement par points sans rematch, équipe au repos, rattrapage.">
        <Card><CardContent className="pt-5 text-sm text-muted-foreground">Aucune pré-saison dans {season?.name ?? 'cette saison'}. Créez une compétition « phase de ligue » au format « suisse » (Admin → Compétitions) avec ses équipes.</CardContent></Card>
      </AdminPage>
    )
  }
  return (
    <AdminPage title="Pré-saison" subtitle={`${season?.name ?? ''} · ${v.comp.name} — système suisse, ${v.teamIds.length} équipes, ${v.cfg.rounds} journées${v.state.format.catchup ? ' + rattrapage' : ''}.`}>
      <div className="space-y-5">
        <FormatCard v={v} />
        <RoundsTimeline v={v} />
        <ActionCard v={v} seasonName={season?.name ?? ''} />
        <RoundScheduleCard v={v} />
        <RankingCard v={v} />
        <SplitCard v={v} />
      </div>
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
function FormatCard({ v }: { v: PreseasonView }) {
  const [rounds, setRounds] = useState(v.cfg.rounds)
  const [master, setMaster] = useState(v.cfg.masterSize)
  const f = preseasonFormat(v.teamIds.length, rounds)
  const started = v.matches.length > 0 || !!v.ps.pending
  const dirty = rounds !== v.cfg.rounds || master !== v.cfg.masterSize
  const apply = async () => {
    await save(v.comp, { config: { ...(v.ps.config ?? {}), rounds, masterSize: master } })
    base44.logActivity('preseason_config', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journees: rounds, master: master })
    toast.success('Paramètres enregistrés')
  }
  return (
    <Card>
      <CardHeader><CardTitle>Format</CardTitle></CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-wrap items-end gap-3">
          <div><Label htmlFor="ps-r">Journées</Label><Input id="ps-r" type="number" min={1} max={12} value={rounds} disabled={started} onChange={(e) => setRounds(Math.max(1, +e.target.value || 1))} className="w-24" /></div>
          <div><Label htmlFor="ps-m">Équipes en {competitionNames().gold}</Label><Input id="ps-m" type="number" min={2} max={v.teamIds.length - 2} value={master} onChange={(e) => setMaster(Math.max(2, +e.target.value || 2))} className="w-24" /></div>
          <Button onClick={apply} disabled={!dirty}>Enregistrer</Button>
        </div>
        <div className="text-sm">
          <p><b>{f.teams}</b> équipes · <b>{f.rounds}</b> journées de <b>{f.perRound}</b> matchs{f.catchup ? <> + rattrapage de <b>{f.catchup}</b> match{f.catchup > 1 ? 's' : ''}</> : ''} = <b>{f.total}</b> matchs · <b>{f.matchesPerTeam}</b> matchs par équipe{f.resting ? ' · 1 équipe au repos par journée' : ''}.</p>
          <p className="mt-1 text-muted-foreground">Départage pendant les journées : {v.cfg.intermediateOrder.map((c) => CRITERION_LABEL[c]).join(' › ')}. Classement final : {v.cfg.finalOrder.map((c) => CRITERION_LABEL[c]).join(' › ')}. Points : victoire {v.cfg.points.win}, nul {v.cfg.points.draw}, défaite {v.cfg.points.loss} (forfait = 3-0).</p>
          {f.warnings.map((w) => <p key={w} className="mt-1 text-amber-300">⚠ {w}</p>)}
          {started && <p className="mt-1 text-xs text-muted-foreground">Le nombre de journées est figé une fois la pré-saison commencée.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function RoundsTimeline({ v }: { v: PreseasonView }) {
  const rounds = Array.from({ length: v.totalRounds }, (_, i) => i + 1)
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {rounds.map((r) => {
        const ms = v.matches.filter((m) => m.round === r)
        const played = v.pm.filter((m) => m.round === r && m.played).length
        const pending = v.ps.pending?.round === r
        const pub = ms.length > 0 && ms.every((m) => m.published !== false)
        const status = ms.length ? (played === ms.length ? 'Jouée' : pub ? `Publiée · ${played}/${ms.length} résultats` : `Créée · ${ms.filter((m) => m.date && m.pitch).length}/${ms.length} horaires fixés`) : pending ? 'Aperçu (non publiée)' : 'À venir'
        const tone = ms.length && played === ms.length ? 'border-win/40 bg-win/10' : ms.length ? 'border-neon/40 bg-neon/10' : pending ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10'
        const rest = v.rests[r] ?? (pending ? v.ps.pending?.rest : undefined)
        return (
          <div key={r} className={cn('rounded-xl border p-3', tone)}>
            <div className="font-display text-lg font-black">{v.roundLabel(r)}</div>
            <div className="text-xs text-muted-foreground">{status}</div>
            {rest && r <= v.cfg.rounds && <div className="mt-1 truncate text-xs">Au repos : <b>{v.teamName(rest)}</b></div>}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
function ActionCard({ v, seasonName }: { v: PreseasonView; seasonName: string }) {
  const { user } = useAuth()
  const { db } = useData()
  const L = useLookup()
  const [seed, setSeed] = useState('')
  const [projection, setProjection] = useState(false)
  const [swap, setSwap] = useState(false)
  const pending = v.ps.pending
  const name = (id?: string) => (id ? L.team.get(id)?.name ?? id : '—')

  // classement avant la journée en préparation → « Pts avant »
  const before = useMemo(() => (pending ? new Map(preseasonRanking(v.teamIds, v.pm.filter((m) => m.round < pending.round), { order: v.cfg.intermediateOrder, drawOrder: v.drawOrder, points: v.cfg.points }).map((r) => [r.team_id, r.points])) : new Map<string, number>()), [pending, v])
  const errors = pending ? validateRound({ round: pending.round, rest: pending.rest, pairs: pending.pairs.map((p) => ({ ...p, round: pending.round, played: false })) }, v.pm, pending.round > v.cfg.rounds ? Object.values(v.rests).filter(Boolean) as string[] : v.teamIds) : []

  const draw = async () => {
    const s = seed.trim() ? Number(seed.trim()) : Math.floor(Math.random() * 1e9)
    if (!Number.isFinite(s)) { toast.error('Graine invalide'); return }
    const r1 = drawRound1(v.teamIds, s)
    await save(v.comp, { seed: s, draw_order: r1.order, drawn_at: new Date().toISOString(), drawn_by: user?.email, revealed: 0, pending: { round: 1, rest: r1.rest, pairs: r1.pairs.map((p) => ({ home: p.home, away: p.away, reason: 'Tirage au sort' })) } })
    base44.logActivity('preseason_draw', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journee: 1, graine: s, ordre: r1.order.map(name).join(', '), repos: name(r1.rest) })
    toast.success(`Tirage effectué (graine ${s}) — lancez la projection ou publiez`)
  }
  const cancelDraw = async () => {
    if (!confirm('Annuler ce tirage ? Il sera journalisé ; un nouveau tirage pourra être fait.')) return
    base44.logActivity('preseason_draw_cancel', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { graine: v.ps.seed })
    await save(v.comp, { pending: undefined, seed: undefined, draw_order: undefined, revealed: 0 })
  }
  const generate = async () => {
    try {
      const plan = generateNextRound(v.teamIds, v.pm, v.rests, v.cfg, v.drawOrder)
      await save(v.comp, { pending: { round: plan.round, rest: plan.rest, pairs: plan.pairs.map((p) => ({ home: p.home, away: p.away, reason: p.reason ?? '' })) } })
      base44.logActivity('preseason_generate', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journee: v.shortLabel(plan.round), repos: plan.rest ? name(plan.rest) : '—' })
      toast.success(`${v.roundLabel(plan.round)} générée — vérifiez l’aperçu puis publiez`)
    } catch (e) { toast.error((e as Error).message) }
  }
  /** Crée les matchs de la journée (numéros PS-n, « Horaire à définir », non publiés) : l'admin fixe ensuite date, heure et terrain. */
  const createMatches = async () => {
    if (!pending || errors.length) return
    const rows = roundMatches(pending, v.comp, db.Match)
    await base44.entities.Match.bulkCreate(rows.map((r) => ({ ...r, id: newId() })) as never)
    const rests = { ...(v.ps.rests ?? {}) }; if (pending.rest && pending.round <= v.cfg.rounds) rests[String(pending.round)] = pending.rest
    await save(v.comp, { pending: undefined, rests, created_rounds: [...new Set([...(v.ps.created_rounds ?? []), pending.round])], number_counter: numberValue(rows.at(-1)?.number) || v.ps.number_counter })
    await base44.entities.Competition.update(v.comp.id, { status: 'active', rounds: [...new Set([...(v.comp.rounds ?? []), pending.round])].sort((a, b) => a - b) })
    base44.logActivity('preseason_create_round', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journee: v.shortLabel(pending.round), matchs: rows.map((r) => `${r.number} ${name(r.home_team_id)}–${name(r.away_team_id)}`).join(' · '), repos: pending.rest ? name(pending.rest) : '—' })
    toast.success(`${v.roundLabel(pending.round)} : ${rows.length} matchs créés (${rows[0]?.number} à ${rows.at(-1)?.number}) — fixez les horaires et terrains, puis publiez`)
  }
  const close = async () => {
    await save(v.comp, { closed_at: new Date().toISOString(), final_ranking: v.state.ranking.map((r) => r.team_id) })
    await base44.entities.Competition.update(v.comp.id, { status: 'finished' })
    base44.logActivity('preseason_close', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { classement: v.state.ranking.map((r) => `${r.rank}. ${name(r.team_id)}`).join(' · ') })
    toast.success('Pré-saison clôturée — classement final figé')
  }

  const roundPlayed = (r: number) => v.state.completedRounds.includes(r)
  const next = v.state.nextRound
  const blocked = next != null && next > 1 && !Array.from({ length: next - 1 }, (_, i) => i + 1).every(roundPlayed)
  return (
    <Card>
      <CardHeader><CardTitle className="flex flex-wrap items-center gap-2">{pending ? `Aperçu · ${v.roundLabel(pending.round)}` : v.ps.closed_at ? 'Pré-saison clôturée' : next ? v.roundLabel(next) : 'Toutes les journées sont publiées'}{pending && <Badge variant="warning">Non publiée</Badge>}{v.ps.closed_at && <Badge variant="success"><Lock className="size-3" />Classement figé</Badge>}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!pending && next === 1 && (
          <div className="flex flex-wrap items-end gap-3">
            <Button size="lg" onClick={draw} disabled={v.teamIds.length < 4}><Shuffle />Tirer au sort la journée 1</Button>
            <div><Label htmlFor="ps-seed" className="text-xs">Graine (facultatif, pour rejouer un tirage)</Label><Input id="ps-seed" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))} placeholder="aléatoire" className="w-40" /></div>
            <p className="text-sm text-muted-foreground">Tirage intégral des {v.teamIds.length} équipes : les {v.teamIds.length - (v.teamIds.length % 2)} premières tirées jouent ensemble (1re contre 2e, 3e contre 4e…){v.teamIds.length % 2 ? ', la dernière est au repos' : ''}. La graine est enregistrée et le tirage journalisé.</p>
          </div>
        )}
        {!pending && next != null && next > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={generate} disabled={blocked}><Wand2 />Générer {v.roundLabel(next).toLowerCase()}</Button>
            <p className="text-sm text-muted-foreground">{blocked ? 'Disponible quand tous les résultats des journées précédentes sont validés.' : next > v.cfg.rounds ? 'Les équipes au repos se rencontrent entre elles (1re contre 2e, 3e contre 4e, sans rematch).' : 'Appariement automatique selon le classement de pré-saison, sans rematch.'}</p>
          </div>
        )}
        {!pending && next == null && !v.ps.closed_at && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={close} disabled={!v.state.finished}><Lock />Clôturer la pré-saison</Button>
            <p className="text-sm text-muted-foreground">{v.state.finished ? 'Tous les matchs sont joués : le classement final (avec la force des adversaires) sera figé.' : 'Disponible quand tous les résultats sont validés.'}</p>
          </div>
        )}

        {pending && (
          <>
            {pending.round === 1 && v.ps.seed != null && v.ps.draw_source !== 'manual' && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm">
                <Sparkles className="size-4 text-neon" />Tirage du {v.ps.drawn_at ? new Date(v.ps.drawn_at).toLocaleString('fr-FR') : '—'} par {v.ps.drawn_by ?? '—'} · graine <b className="num">{v.ps.seed}</b> · {v.ps.revealed ?? 0}/{v.ps.draw_order?.length} équipes dévoilées
                <div className="ml-auto flex gap-2">
                  <Button onClick={() => setProjection(true)}><MonitorPlay />Projection du tirage</Button>
                  <Button variant="ghost" onClick={cancelDraw}><RotateCcw />Annuler le tirage</Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Match</th><th>Équipe A</th><th className="text-center">Pts avant</th><th /><th>Équipe B</th><th className="text-center">Pts avant</th><th>Pourquoi ce match ?</th></tr></thead>
                <tbody>
                  {pending.pairs.map((p, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="num py-1.5">{i + 1}</td>
                      <td><span className="flex items-center gap-2"><TeamLogo team={L.team.get(p.home)} size={22} />{name(p.home)}</span></td>
                      <td className="num text-center">{before.get(p.home) ?? 0}</td>
                      <td className="text-center text-muted-foreground">–</td>
                      <td><span className="flex items-center gap-2"><TeamLogo team={L.team.get(p.away)} size={22} />{name(p.away)}</span></td>
                      <td className="num text-center">{before.get(p.away) ?? 0}</td>
                      <td className="text-muted-foreground">{p.reason}{p.manual && <span className="ml-1 text-amber-300">· modifié : {p.manual.motif}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pending.rest && <p className="text-sm">Au repos : <b>{name(pending.rest)}</b>{pending.round <= v.cfg.rounds ? ' → jouera au rattrapage' : ''}</p>}
            {errors.map((e) => <p key={e} className="text-sm text-red-300">⚠ {e}</p>)}
            <p className="text-sm text-muted-foreground">Les matchs seront créés avec les numéros {nextNumbers(db.Match.map((m) => m.number), v.ps.number_counter, pending.pairs.length).join(', ')} et le statut « {TBD} ». Vous fixerez ensuite la date, l’heure et le terrain de chacun, puis publierez la journée.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={createMatches} disabled={!!errors.length}><Check />Créer les matchs</Button>
              <Button size="lg" variant="contrast" onClick={() => setSwap(true)}><Shuffle />Modifier un match</Button>
              {pending.round > 1 && <Button variant="ghost" onClick={async () => { await save(v.comp, { pending: undefined }); toast.info('Aperçu supprimé') }}><RotateCcw />Régénérer</Button>}
            </div>
          </>
        )}
        {swap && pending && <SwapDialog v={v} onClose={() => setSwap(false)} />}
        {projection && <DrawProjection comp={v.comp} seasonName={seasonName} onClose={() => setProjection(false)} />}
      </CardContent>
    </Card>
  )
}

/** Échange de deux équipes entre deux matchs (ou avec l'équipe au repos) — motif obligatoire, rematch refusé. */
function SwapDialog({ v, onClose }: { v: PreseasonView; onClose: () => void }) {
  const { user } = useAuth()
  const L = useLookup()
  const pending = v.ps.pending!
  const [a, setA] = useState(''), [b, setB] = useState(''), [motif, setMotif] = useState('')
  const inRound = [...pending.pairs.flatMap((p) => [p.home, p.away]), ...(pending.rest ? [pending.rest] : [])]
  const opts = inRound.map((id) => ({ value: id, label: `${L.team.get(id)?.name ?? id}${id === pending.rest ? ' (au repos)' : ''}` }))
  const swapIn = (id: string) => (id === a ? b : id === b ? a : id)
  const now = new Date().toISOString()
  type Manual = { motif: string; by?: string; at: string }
  const candidate: { round: number; rest?: string; pairs: (PMatch & { manual?: Manual })[] } = {
    round: pending.round, rest: pending.rest ? swapIn(pending.rest) : undefined,
    pairs: pending.pairs.map((p) => {
      const h = swapIn(p.home), w = swapIn(p.away), changed = h !== p.home || w !== p.away
      return { round: pending.round, played: false, home: h, away: w, reason: changed ? 'Modifié par Ardentia' : p.reason, manual: changed ? { motif, by: user?.email, at: now } : p.manual }
    }),
  }
  const errs = a && b && a !== b ? validateRound(candidate, v.pm, pending.round > v.cfg.rounds ? Object.values(v.rests).filter(Boolean) as string[] : v.teamIds) : []
  const ok = a && b && a !== b && motif.trim().length >= 3 && !errs.length
  const apply = async () => {
    await save(v.comp, { pending: { round: pending.round, rest: candidate.rest, pairs: candidate.pairs.map(({ home, away, reason, manual }) => ({ home, away, reason: reason ?? '', manual })) } })
    base44.logActivity('preseason_manual', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journee: v.shortLabel(pending.round), echange: `${L.team.get(a)?.name} ↔ ${L.team.get(b)?.name}`, motif })
    toast.success('Match modifié (journalisé)'); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Modifier un match · {v.roundLabel(pending.round)}</DialogTitle><DialogDescription>Échangez deux équipes de la journée (ou une équipe avec l’équipe au repos). Un rematch est refusé ; le motif est obligatoire et journalisé.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Équipe 1</Label><FilterSelect className="sm:w-full" value={a} onChange={setA} allLabel="— Choisir —" options={opts} /></div>
          <div><Label>Équipe 2</Label><FilterSelect className="sm:w-full" value={b} onChange={setB} allLabel="— Choisir —" options={opts.filter((o) => o.value !== a)} /></div>
        </div>
        <div><Label htmlFor="sw-motif">Motif</Label><Input id="sw-motif" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. : indisponibilité du terrain, demande des deux capitaines…" /></div>
        {errs.map((e) => <p key={e} className="text-sm text-red-300">⚠ {e}</p>)}
        {a && b && !errs.length && <ul className="space-y-0.5 text-sm text-muted-foreground">{candidate.pairs.filter((p) => p.manual?.at === now).map((p) => <li key={p.home}>→ {L.team.get(p.home)?.name} – {L.team.get(p.away)?.name}</li>)}{candidate.rest !== pending.rest && <li>→ Au repos : {L.team.get(candidate.rest ?? '')?.name}</li>}</ul>}
        <Button onClick={apply} disabled={!ok}><Check />Appliquer l’échange</Button>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
function RankingCard({ v }: { v: PreseasonView }) {
  const [order, setOrder] = useState(false)
  const rows = v.ps.final_ranking ? v.ps.final_ranking.map((id) => v.state.ranking.find((r) => r.team_id === id)!).filter(Boolean).map((r, i) => ({ ...r, rank: i + 1 })) : v.state.ranking
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><CardTitle>{v.ps.final_ranking ? 'Classement final (figé)' : v.state.finished ? 'Classement final' : 'Classement en cours'}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOrder(true)} disabled={!!v.ps.final_ranking}>Tirage au sort Ardentia (critère 5)</Button></CardHeader>
      <CardContent><PreseasonTable rows={rows} masterSize={v.ps.split?.master_size ?? v.cfg.masterSize} final={!!v.ps.final_ranking} /></CardContent>
      {order && <TiebreakDialog v={v} onClose={() => setOrder(false)} />}
    </Card>
  )
}

function TiebreakDialog({ v, onClose }: { v: PreseasonView; onClose: () => void }) {
  const L = useLookup()
  const [list, setList] = useState<string[]>(v.drawOrder.filter((id) => v.teamIds.includes(id)).concat(v.teamIds.filter((id) => !v.drawOrder.includes(id))))
  const move = (i: number, d: number) => setList((x) => { const y = [...x]; const j = i + d; if (j < 0 || j >= y.length) return x; [y[i], y[j]] = [y[j], y[i]]; return y })
  const saveOrder = async () => {
    await save(v.comp, { tiebreak_order: list })
    base44.logActivity('preseason_tiebreak', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { ordre: list.map((id) => L.team.get(id)?.name).join(', ') })
    toast.success('Ordre du tirage au sort enregistré'); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Tirage au sort par Ardentia</DialogTitle><DialogDescription>Dernier critère de départage (égalité parfaite). Par défaut : l’ordre du tirage de la journée 1. Modification journalisée.</DialogDescription></DialogHeader>
        <ol className="max-h-[50dvh] space-y-1 overflow-y-auto pr-1">
          {list.map((id, i) => (
            <li key={id} className="flex items-center gap-2 rounded-lg bg-white/[.03] px-2 py-1 text-sm">
              <span className="num w-6 text-right text-muted-foreground">{i + 1}</span><TeamLogo team={L.team.get(id)} size={20} /><span className="flex-1 truncate">{L.team.get(id)?.name}</span>
              <button onClick={() => move(i, -1)} className="cursor-pointer rounded p-1 hover:bg-white/10" aria-label="Monter"><ArrowUp className="size-4" /></button>
              <button onClick={() => move(i, 1)} className="cursor-pointer rounded p-1 hover:bg-white/10" aria-label="Descendre"><ArrowDown className="size-4" /></button>
            </li>
          ))}
        </ol>
        <Button onClick={saveOrder}><Check />Enregistrer l’ordre</Button>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
function SplitCard({ v }: { v: PreseasonView }) {
  const { db } = useData()
  const names = competitionNames()
  const [n, setN] = useState(v.ps.split?.master_size ?? v.cfg.masterSize)
  const ranking = v.ps.final_ranking ?? []
  const done = v.ps.split?.master_id && db.Competition.some((c) => c.id === v.ps.split?.master_id)
  if (!v.ps.closed_at) return null
  const rows = ranking.map((id, i) => ({ team_id: id, rank: i + 1 }))
  const { master, challenger } = divisionSplit(rows as never, n)
  const create = async () => {
    const base = { season_id: v.comp.season_id, format: 'league' as const, status: 'active' as const, half_duration_min: v.comp.half_duration_min ?? 15, foul_alert_threshold: v.comp.foul_alert_threshold ?? 5, parent_id: v.comp.id }
    const m = await base44.entities.Competition.create({ ...base, name: names.gold, phase: 'gold', team_ids: master, color: '#E8B931', order: 2, logo_url: '/brand/logo-master.png', description: `Places 1 à ${n} de la pré-saison` } as never)
    const c = await base44.entities.Competition.create({ ...base, name: names.silver, phase: 'silver', team_ids: challenger, color: '#7FB2E5', order: 3, logo_url: '/brand/logo-challenger.png', description: `Places ${n + 1} à ${ranking.length} de la pré-saison` } as never)
    await save(v.comp, { split: { master_size: n, master_id: m.id, challenger_id: c.id, at: new Date().toISOString() } })
    await base44.entities.Competition.update(v.comp.id, { split: { gold_to: n, silver_from: n + 1, gold_name: names.gold, silver_name: names.silver } })
    base44.logActivity('preseason_split', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { master: master.length, challenger: challenger.length })
    toast.success(`${names.gold} (${master.length}) et ${names.silver} (${challenger.length}) créés`)
  }
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Split className="size-5 text-neon" />Répartition</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {done ? <p className="text-sm">Répartition faite : <DivisionMark div="master" /> {master.length} équipes · <DivisionMark div="challenger" /> {challenger.length} équipes. Les matchs de chaque division se créent ensuite dans Admin → Tirage & divisions.</p> : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div><Label htmlFor="sp-n">Rangs 1 à N → {names.gold}</Label><Input id="sp-n" type="number" min={2} max={ranking.length - 2} value={n} onChange={(e) => setN(Math.max(2, Math.min(ranking.length - 2, +e.target.value || 2)))} className="w-24" /></div>
              <p className="text-sm text-muted-foreground">{names.gold} : rangs 1 à {n} ({master.length} équipes) · {names.silver} : rangs {n + 1} à {ranking.length} ({challenger.length} équipes)</p>
              <Button onClick={create}><Split />Créer {names.gold} et {names.silver}</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
