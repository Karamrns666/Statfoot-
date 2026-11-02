// Tirage phase de ligue — « Système suisse par chapeaux » : 5 chapeaux × 4 équipes → 50 affiches J1–J5.
import { useEffect, useMemo, useState } from 'react'
import { Lock, Maximize2, Shuffle, Sparkles, X, Send, RotateCcw } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { seededRng, swissPotsFixtures } from '@/lib/draw'
import { generalStandings } from '@/lib/stats'
import { addDays } from '@/lib/schedule'
import { fmtDateTime } from '@/lib/format'
import type { Draw } from '@/types/entities'

const POTS = 5, PER_POT = 4
const SLOTS = ['18:00', '18:45', '19:30', '20:15', '21:00']

export default function DrawSwiss() {
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const { seasonId } = useAdminScope()
  const season = db.Season.find((s) => s.id === seasonId)
  const lp = db.Competition.find((c) => c.season_id === seasonId && c.phase === 'league_phase')
  const draws = db.Draw.filter((d) => d.season_id === seasonId && d.type === 'swiss_pots').sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? ''))
  const current = draws.find((d) => d.competition_id === lp?.id) ?? draws[0]
  const [ceremony, setCeremony] = useState(false)

  // Chapeaux par défaut : classement général de la saison précédente (têtes de série), sinon ordre alphabétique
  const defaultPots = useMemo(() => {
    const prev = [...db.Season].filter((s) => s.start_date < (season?.start_date ?? '')).sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
    const ranked = prev ? generalStandings(league, prev.id).map((r) => r.team_id) : []
    const all = (lp?.team_ids?.length ? lp.team_ids : db.Team.filter((t) => t.status !== 'inactive').map((t) => t.id))
    const ordered = [...ranked.filter((t) => all.includes(t)), ...all.filter((t) => !ranked.includes(t)).sort((a, b) => (L.team.get(a)?.name ?? '').localeCompare(L.team.get(b)?.name ?? ''))]
    return Array.from({ length: POTS }, (_, i) => ordered.slice(i * PER_POT, i * PER_POT + PER_POT))
  }, [db.Season, db.Team, season, league, lp, L.team])
  const [pots, setPots] = useState<string[][] | null>(null)
  const editPots = pots ?? current?.pots?.map((p) => p.team_ids) ?? defaultPots
  const locked = current?.status === 'locked' || current?.status === 'published'
  const valid = editPots.length === POTS && editPots.every((p) => p.length === PER_POT) && new Set(editPots.flat()).size === POTS * PER_POT

  const generate = async () => {
    if (!valid) { toast.error('Il faut 5 chapeaux de 4 équipes distinctes'); return }
    const seed = Math.floor(Math.random() * 1e9)
    const fixtures = swissPotsFixtures(editPots, seededRng(seed)).map((f) => ({ ...f, revealed: false }))
    let compId = lp?.id
    if (!compId) compId = (await base44.entities.Competition.create({ season_id: seasonId, name: 'Phase de ligue', phase: 'league_phase', format: 'swiss', status: 'draft', team_ids: editPots.flat(), rounds: [1, 2, 3, 4, 5], half_duration_min: 15, color: '#F26B1D', order: 1 })).id
    await base44.entities.Draw.create({ season_id: seasonId, competition_id: compId, type: 'swiss_pots', pots: editPots.map((t, i) => ({ pot: i + 1, team_ids: t })), fixtures, revealed_count: 0, status: 'revealing', performed_by: user?.email, seed })
    setPots(null)
    toast.success('50 affiches générées — lancez la cérémonie de révélation')
  }
  const publish = async (d: Draw) => {
    const compId = d.competition_id!
    if (db.Match.some((m) => m.competition_id === compId)) { toast.error('Des matchs existent déjà pour la phase de ligue'); return }
    const start = season?.start_date ? addDays(season.start_date, 7) : new Date().toISOString().slice(0, 10)
    await base44.entities.Match.bulkCreate((d.fixtures ?? []).map((f) => {
      const idx = d.fixtures!.filter((x) => x.round === f.round).indexOf(f)
      return { season_id: seasonId, competition_id: compId, round: f.round, stage: 'league_phase' as const, date: new Date(`${addDays(start, (f.round - 1) * 7)}T${SLOTS[Math.floor(idx / 2) % SLOTS.length]}:00`).toISOString(), pitch: idx % 2 === 0 ? 'Terrain 1' : 'Terrain 2', home_team_id: f.home_team_id, away_team_id: f.away_team_id, status: 'scheduled' as const, published: true, half_duration_min: 15 }
    }))
    await base44.entities.Draw.update(d.id, { status: 'published', revealed_count: d.fixtures?.length })
    await base44.entities.Competition.update(compId, { status: 'active', team_ids: d.pots?.flatMap((p) => p.team_ids) })
    toast.success('Tirage verrouillé et publié — 50 matchs créés au calendrier')
  }
  const move = (team: string, to: number) => {
    const p = editPots.map((x) => x.filter((t) => t !== team))
    p[to] = [...p[to], team]
    setPots(p)
  }
  return (
    <AdminPage title="Tirage phase de ligue" subtitle="Système suisse par chapeaux · 20 équipes · 5 chapeaux · J1–J5 · 50 matchs"
      actions={<>
        {current && <Button variant="outline" onClick={() => setCeremony(true)}><Maximize2 />Voir la cérémonie</Button>}
        {!locked && <Button onClick={generate} disabled={!valid}><Shuffle />Générer les 50 affiches</Button>}
      </>}>
      {current && (
        <Card className="mb-4"><CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <Badge variant={locked ? 'success' : 'warning'}>{locked ? <><Lock className="size-3" />Tirage verrouillé et publié</> : 'Révélation en cours'}</Badge>
          <span className="num text-2xl">{current.revealed_count ?? 0} / {current.fixtures?.length ?? 50}</span><span className="text-sm text-muted-foreground">affiches révélées</span>
          <div className="ml-auto flex gap-2">
            {!locked && <Button onClick={() => publish(current)} disabled={(current.revealed_count ?? 0) < (current.fixtures?.length ?? 50)}><Send />Verrouiller et publier</Button>}
            {!locked && <Button variant="ghost" onClick={async () => { await base44.entities.Draw.update(current.id, { status: 'draft' }); toast.info('Tirage annulé — vous pouvez recommencer') }}><RotateCcw />Recommencer</Button>}
          </div>
        </CardContent></Card>
      )}
      <div className="grid gap-3 md:grid-cols-5">
        {editPots.map((pot, i) => (
          <Card key={i}>
            <CardHeader className="pb-1"><CardTitle className="flex items-center justify-between">Chapeau {i + 1}<span className="text-xs text-muted-foreground">{pot.length}/4</span></CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {pot.map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm">
                  <TeamLogo team={L.team.get(t)} size={22} /><span className="flex-1 truncate">{L.team.get(t)?.name}</span>
                  {!locked && <select value={i} onChange={(e) => move(t, +e.target.value)} className="rounded bg-night-950 text-xs" aria-label="Changer de chapeau">{editPots.map((_, j) => <option key={j} value={j}>C{j + 1}</option>)}</select>}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Chapeau 1 = têtes de série (classement général de la saison précédente). Chaque équipe affronte une équipe de chaque chapeau (y compris le sien), jamais deux fois la même ; domicile/extérieur équilibré.</p>
      <Card className="mt-6"><CardHeader><CardTitle>Historique des tirages</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Admin</TableHead><TableHead>Type</TableHead><TableHead>Résultat</TableHead></TableRow></TableHeader>
          <TableBody>{db.Draw.filter((d) => d.season_id === seasonId).sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? '')).map((d) => (
            <TableRow key={d.id}><TableCell className="text-xs">{fmtDateTime(d.created_date)}</TableCell><TableCell className="text-xs">{d.performed_by}</TableCell><TableCell>{d.type === 'swiss_pots' ? `Système suisse · ${L.competition.get(d.competition_id ?? '')?.name ?? ''}` : 'Groupes'}</TableCell><TableCell><Badge variant={d.status === 'published' ? 'success' : d.status === 'draft' ? 'outline' : 'warning'}>{d.status === 'published' ? `${d.fixtures?.length ?? 0} affiches publiées` : d.status === 'draft' ? 'Annulé' : 'En cours'}</Badge></TableCell></TableRow>
          ))}</TableBody></Table>
      </CardContent></Card>
      {ceremony && current && <Ceremony draw={current} onClose={() => setCeremony(false)} />}
    </AdminPage>
  )
}

/** Cérémonie plein écran : révélation affiche par affiche */
function Ceremony({ draw, onClose }: { draw: Draw; onClose: () => void }) {
  const L = useLookup()
  const { db } = useData()
  const live = db.Draw.find((d) => d.id === draw.id) ?? draw
  const fixtures = live.fixtures ?? []
  const n = live.revealed_count ?? 0
  const locked = live.status === 'published' || live.status === 'locked'
  const [auto, setAuto] = useState(false)
  const revealNext = async () => { if (n < fixtures.length && !locked) await base44.entities.Draw.update(live.id, { revealed_count: n + 1, fixtures: fixtures.map((f, i) => (i === n ? { ...f, revealed: true } : f)) }) }
  useEffect(() => { if (!auto) return; const t = setInterval(revealNext, 1200); return () => clearInterval(t) })
  useEffect(() => { if (n >= fixtures.length) setAuto(false) }, [n, fixtures.length])
  const last = n > 0 ? fixtures[n - 1] : undefined
  const shown = locked ? fixtures.length : n
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-night-950 p-4 sm:p-8" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(242,107,29,.25), transparent 70%), #0b1426' }}>
      <div className="flex items-center justify-between">
        <div className="title-caps text-2xl sm:text-4xl">Tirage <span className="text-neon">phase de ligue</span></div>
        <div className="num text-2xl sm:text-4xl">{shown} / {fixtures.length} <span className="font-sans text-sm font-normal text-muted-foreground">affiches révélées</span></div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X /></button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        {last && !locked ? (
          <div key={n} className="flex animate-[fadein_.6s_ease] flex-col items-center">
            <div className="mb-6 rounded-full bg-neon/20 px-4 py-1 font-display text-xl font-bold uppercase text-neon">Journée {last.round}</div>
            <div className="flex items-center gap-6 sm:gap-16">
              <div className="flex flex-col items-center gap-3"><TeamLogo team={L.team.get(last.home_team_id)} size={160} className="size-28 sm:size-40" /><div className="title-caps text-2xl sm:text-4xl">{L.team.get(last.home_team_id)?.name}</div></div>
              <div className="title-caps text-4xl text-neon sm:text-7xl">VS</div>
              <div className="flex flex-col items-center gap-3"><TeamLogo team={L.team.get(last.away_team_id)} size={160} className="size-28 sm:size-40" /><div className="title-caps text-2xl sm:text-4xl">{L.team.get(last.away_team_id)?.name}</div></div>
            </div>
          </div>
        ) : locked ? <div className="title-caps text-4xl text-win">Tirage verrouillé et publié</div> : <div className="title-caps text-4xl text-muted-foreground">Prêt pour la révélation</div>}
      </div>
      {!locked && <div className="mb-4 flex justify-center gap-3"><Button size="xl" onClick={revealNext} disabled={n >= fixtures.length}><Sparkles />Révéler l'affiche suivante</Button><Button size="xl" variant="outline" onClick={() => setAuto(!auto)}>{auto ? 'Pause' : 'Révélation auto'}</Button></div>}
      <div className="grid max-h-[30vh] grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((r) => (
          <div key={r} className="space-y-1">
            <div className="text-center text-xs font-bold uppercase text-muted-foreground">J{r}</div>
            {fixtures.map((f, i) => ({ f, i })).filter(({ f }) => f.round === r).map(({ f, i }) => (
              <div key={i} className={`flex items-center justify-center gap-1 rounded px-1 py-0.5 text-[11px] ${i < shown ? 'bg-white/10' : 'bg-white/[.02] text-transparent'}`}>
                {i < shown ? <><span className="font-bold">{L.team.get(f.home_team_id)?.short_name}</span>–<span className="font-bold">{L.team.get(f.away_team_id)?.short_name}</span></> : '???'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
