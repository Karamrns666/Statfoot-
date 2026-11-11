// Tirage & divisions :
//  1. Phase de sélection : choix des équipes (autant que voulu), du nombre de matchs par équipe (3 à 6), tirage, révélation, publication.
//  2. Après la sélection : constitution des deux divisions (1re → Xe place, Ye place → dernier), noms modifiables.
//  3. Le même tirage sert ensuite à créer les matchs de chaque division.
import { useEffect, useMemo, useState } from 'react'
import { phaseName } from '@/lib/competitionNames'
import { Check, Lock, Maximize2, RotateCcw, Search, Send, Shuffle, Sparkles, Split, X } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TeamLogo } from '@/components/league/Identity'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { toast } from '@/components/ui/toast'
import { maxRoundsFor, seededRng, selectionFixtures } from '@/lib/draw'
import { competitionStandings, isPlayed } from '@/lib/stats'
import { addDays } from '@/lib/schedule'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Competition, Draw } from '@/types/entities'

const PER_TEAM = [3, 4, 5, 6]

export default function DrawSwiss() {
  const { db } = useData()
  const { seasonId } = useAdminScope()
  const comps = db.Competition.filter((c) => c.season_id === seasonId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const [compId, setCompId] = useState('')
  const comp = comps.find((c) => c.id === compId) ?? comps.find((c) => c.phase === 'league_phase') ?? comps[0]
  useEffect(() => { if (comp && comp.id !== compId) setCompId(comp.id) }, [comp, compId])
  const selection = comps.find((c) => c.phase === 'league_phase')
  return (
    <AdminPage title="Tirage & divisions" subtitle="Phase de sélection (un seul groupe) → tirage des matchs → constitution des deux divisions à partir du classement.">
      {!comps.length ? <p className="text-muted-foreground">Créez d’abord une compétition pour cette saison (Admin → Compétitions).</p> : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Compétition">
            {comps.map((c) => (
              <button key={c.id} role="tab" aria-selected={c.id === comp?.id} onClick={() => setCompId(c.id)} className={cn('cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold transition', c.id === comp?.id ? 'border-neon bg-neon text-white' : 'border-white/15 text-muted-foreground hover:text-white')}>
                {c.name} <span className="ml-1 text-xs opacity-75">{c.team_ids?.length ?? 0} équipes</span>
              </button>
            ))}
          </div>
          {comp && <DrawPanel key={comp.id} comp={comp} />}
          {selection && <DivisionsPanel selection={selection} />}
          <DrawHistory />
        </div>
      )}
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
//  1. Tirage d'une compétition
// ---------------------------------------------------------------------------
function DrawPanel({ comp }: { comp: Competition }) {
  const { db } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const draws = db.Draw.filter((d) => d.competition_id === comp.id && d.status !== 'draft').sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? ''))
  const current = draws[0]
  const locked = current?.status === 'published' || current?.status === 'locked'
  const existing = db.Match.filter((m) => m.competition_id === comp.id)
  const [teams, setTeams] = useState<string[]>(comp.team_ids ?? [])
  const [perTeam, setPerTeam] = useState(5)
  const [q, setQ] = useState('')
  const season = db.Season.find((s) => s.id === comp.season_id)
  const lastSeasonRound = Math.max(0, ...db.Match.filter((m) => m.season_id === comp.season_id && m.competition_id !== comp.id).map((m) => m.round ?? 0))
  const lastDate = db.Match.filter((m) => m.season_id === comp.season_id).map((m) => m.date ?? '').sort().at(-1)?.slice(0, 10)
  const [start, setStart] = useState(() => (lastDate ? addDays(lastDate, 7) : season?.start_date ?? new Date().toISOString().slice(0, 10)))
  const [firstTime, setFirstTime] = useState('18:00')
  const [slotMin, setSlotMin] = useState(45)
  const [pitches, setPitches] = useState(comp.default_pitch ? comp.default_pitch : 'Terrain 1, Terrain 2')
  const [ceremony, setCeremony] = useState(false)
  const max = maxRoundsFor(teams.length)
  const all = useMemo(() => db.Team.filter((t) => t.status !== 'inactive').sort((a, b) => a.name.localeCompare(b.name)), [db.Team])
  const shown = all.filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()))
  const toggle = (id: string) => setTeams((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))

  const generate = async () => {
    if (teams.length < 2) { toast.error('Sélectionnez au moins 2 équipes'); return }
    if (perTeam > max) { toast.error(`Avec ${teams.length} équipes, ${max} matchs par équipe au maximum`); return }
    if (existing.length) { toast.error('Des matchs existent déjà pour cette compétition : supprimez-les dans Admin → Matchs avant un nouveau tirage'); return }
    const seed = Math.floor(Math.random() * 1e9)
    const fixtures = selectionFixtures(teams, perTeam, seededRng(seed), lastSeasonRound + 1).map((f) => ({ ...f, revealed: false }))
    await base44.entities.Competition.update(comp.id, { team_ids: teams, rounds: [...new Set(fixtures.map((f) => f.round))] })
    await base44.entities.Draw.create({ season_id: comp.season_id, competition_id: comp.id, type: 'selection', pots: [{ pot: 1, team_ids: teams }], matches_per_team: perTeam, fixtures, revealed_count: 0, status: 'revealing', performed_by: user?.email, seed })
    toast.success(`${fixtures.length} affiches tirées au sort — lancez la cérémonie ou publiez directement`)
  }
  const publish = async (d: Draw) => {
    if (db.Match.some((m) => m.competition_id === comp.id)) { toast.error('Des matchs existent déjà pour cette compétition'); return }
    const pitchList = pitches.split(',').map((p) => p.trim()).filter(Boolean)
    const fx = d.fixtures ?? []
    const rounds = [...new Set(fx.map((f) => f.round))].sort((a, b) => a - b)
    const [hh, mm] = firstTime.split(':').map(Number)
    await base44.entities.Match.bulkCreate(fx.map((f) => {
      const idx = fx.filter((x) => x.round === f.round).indexOf(f)
      const slot = Math.floor(idx / Math.max(1, pitchList.length))
      const day = addDays(start, rounds.indexOf(f.round) * 7)
      const minutes = hh * 60 + mm + slot * slotMin
      const date = new Date(`${day}T${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`).toISOString()
      return { season_id: comp.season_id, competition_id: comp.id, round: f.round, stage: comp.phase === 'league_phase' ? 'league_phase' as const : 'cup' as const, date, pitch: pitchList[idx % Math.max(1, pitchList.length)] ?? comp.default_pitch, home_team_id: f.home_team_id, away_team_id: f.away_team_id, status: 'scheduled' as const, published: true, half_duration_min: comp.half_duration_min ?? 15 }
    }))
    await base44.entities.Draw.update(d.id, { status: 'published', revealed_count: fx.length, fixtures: fx.map((f) => ({ ...f, revealed: true })) })
    await base44.entities.Competition.update(comp.id, { status: 'active' })
    toast.success(`Tirage publié — ${fx.length} matchs ajoutés au calendrier`)
  }
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const f of current?.fixtures ?? []) for (const t of [f.home_team_id, f.away_team_id]) m.set(t, (m.get(t) ?? 0) + 1)
    return m
  }, [current])

  return (
    <Card>
      <CardHeader><CardTitle className="flex flex-wrap items-center gap-2">1 · Tirage — {comp.name}{locked && <Badge variant="success"><Lock className="size-3" />Publié</Badge>}{current && !locked && <Badge variant="warning">Révélation en cours</Badge>}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {!current || current.status === 'draft' ? (
          <>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Label>Équipes participantes <span className="num ml-1 text-neon">{teams.length}</span></Label>
                <div className="relative ml-auto w-full sm:w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une équipe" className="h-9 pl-9" /></div>
                <Button size="sm" variant="ghost" onClick={() => setTeams(all.map((t) => t.id))}>Tout cocher</Button>
                <Button size="sm" variant="ghost" onClick={() => setTeams([])}>Tout décocher</Button>
              </div>
              <div className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
                {shown.map((t) => {
                  const on = teams.includes(t.id)
                  return (
                    <button key={t.id} type="button" onClick={() => toggle(t.id)} aria-pressed={on} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition', on ? 'border-neon/60 bg-neon/10' : 'border-white/10 hover:bg-white/5')}>
                      <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border', on ? 'border-neon bg-neon' : 'border-white/30')}>{on && <Check className="size-3 text-white" />}</span>
                      <TeamLogo team={t} size={20} /><span className="truncate">{t.name}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Pour ajouter une nouvelle entreprise : Admin → Équipes, puis cochez-la ici.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <Label>Matchs par équipe</Label>
                <div className="mt-1.5 flex gap-2">
                  {PER_TEAM.map((n) => <Button key={n} type="button" variant={perTeam === n ? 'default' : 'outline'} disabled={n > max} onClick={() => setPerTeam(n)} className="w-14 font-display text-lg">{n}</Button>)}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{teams.length % 2 ? `Nombre impair d’équipes : une équipe est exemptée à chaque journée (elle joue ${perTeam - 1} ou ${perTeam} matchs).` : `${(teams.length / 2) * perTeam} matchs au total, ${teams.length / 2} par journée, ${perTeam} journées.`} Jamais deux fois la même affiche, domicile/extérieur équilibré.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="d-start">1re journée</Label><Input id="d-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                <div><Label htmlFor="d-time">1er coup d’envoi</Label><Input id="d-time" type="time" value={firstTime} onChange={(e) => setFirstTime(e.target.value)} /></div>
                <div><Label htmlFor="d-slot">Minutes entre deux créneaux</Label><Input id="d-slot" type="number" min={15} step={5} value={slotMin} onChange={(e) => setSlotMin(+e.target.value || 45)} /></div>
                <div><Label htmlFor="d-pitch">Terrains (séparés par des virgules)</Label><Input id="d-pitch" value={pitches} onChange={(e) => setPitches(e.target.value)} /></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={generate} disabled={teams.length < 2 || perTeam > max}><Shuffle />Lancer le tirage</Button>
              {existing.length > 0 && <span className="text-sm text-amber-300">{existing.length} match(s) existent déjà pour cette compétition.</span>}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="num text-3xl">{locked ? current.fixtures?.length : current.revealed_count ?? 0} / {current.fixtures?.length}</span><span className="text-sm text-muted-foreground">affiches {locked ? 'publiées' : 'révélées'} · {current.matches_per_team ?? '—'} matchs par équipe</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setCeremony(true)}><Maximize2 />Cérémonie plein écran</Button>
                {!locked && <Button onClick={() => publish(current)}><Send />Verrouiller et publier</Button>}
                {!locked && <Button variant="ghost" onClick={async () => { await base44.entities.Draw.update(current.id, { status: 'draft' }); toast.info('Tirage annulé — vous pouvez recommencer') }}><RotateCcw />Recommencer</Button>}
              </div>
            </div>
            {!locked && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="p-start">1re journée</Label><Input id="p-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                <div><Label htmlFor="p-time">1er coup d’envoi</Label><Input id="p-time" type="time" value={firstTime} onChange={(e) => setFirstTime(e.target.value)} /></div>
              </div>
            )}
            <FixturesGrid draw={current} revealAll={locked} />
            <p className="text-xs text-muted-foreground">Matchs par équipe : {[...counts.entries()].map(([t, n]) => `${L.team.get(t)?.short_name ?? '?'} ${n}`).join(' · ')}</p>
          </>
        )}
        {ceremony && current && <Ceremony draw={current} title={comp.name} onClose={() => setCeremony(false)} />}
      </CardContent>
    </Card>
  )
}

function FixturesGrid({ draw, revealAll }: { draw: Draw; revealAll?: boolean }) {
  const L = useLookup()
  const fx = draw.fixtures ?? []
  const rounds = [...new Set(fx.map((f) => f.round))].sort((a, b) => a - b)
  const shown = revealAll ? fx.length : draw.revealed_count ?? 0
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {rounds.map((r) => (
        <div key={r} className="rounded-xl bg-white/[.03] p-2">
          <div className="mb-1 text-center font-display text-lg font-black text-neon">J{r}</div>
          {fx.map((f, i) => ({ f, i })).filter(({ f }) => f.round === r).map(({ f, i }) => (
            <div key={i} className={cn('flex items-center gap-1 rounded px-1.5 py-1 text-xs', i < shown ? 'bg-white/5' : 'text-transparent')}>
              {i < shown ? <><TeamLogo team={L.team.get(f.home_team_id)} size={14} /><span className="truncate">{L.team.get(f.home_team_id)?.short_name}</span><span className="text-muted-foreground">–</span><span className="truncate">{L.team.get(f.away_team_id)?.short_name}</span><TeamLogo team={L.team.get(f.away_team_id)} size={14} /></> : '???'}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
//  2. Constitution des divisions
// ---------------------------------------------------------------------------
function DivisionsPanel({ selection }: { selection: Competition }) {
  const { db, league } = useData()
  const table = useMemo(() => competitionStandings(league, selection.id), [league, selection.id])
  const n = table.length
  const ms = db.Match.filter((m) => m.competition_id === selection.id)
  const remaining = ms.filter((m) => !isPlayed(m) && m.status !== 'cancelled').length
  const children = db.Competition.filter((c) => c.parent_id === selection.id)
  const [goldTo, setGoldTo] = useState(selection.split?.gold_to ?? Math.ceil(n / 2))
  const [silverFrom, setSilverFrom] = useState(selection.split?.silver_from ?? Math.ceil(n / 2) + 1)
  const [goldName, setGoldName] = useState(selection.split?.gold_name ?? phaseName('gold'))
  const [silverName, setSilverName] = useState(selection.split?.silver_name ?? phaseName('silver'))
  const [goldPitch, setGoldPitch] = useState('Terrain 1')
  const [silverPitch, setSilverPitch] = useState('Terrain 2')
  const valid = goldTo >= 2 && silverFrom > goldTo && silverFrom <= n - 1
  const preview = { ...selection, split: { gold_to: goldTo, silver_from: silverFrom, gold_name: goldName, silver_name: silverName } }
  const create = async () => {
    if (!valid) { toast.error('Vérifiez les places : la 2e division doit commencer après la 1re et compter au moins 2 équipes'); return }
    if (remaining && !confirm(`${remaining} match(s) de la phase de sélection ne sont pas encore joués. Constituer les divisions quand même ?`)) return
    const goldIds = table.slice(0, goldTo).map((r) => r.team_id), silverIds = table.slice(silverFrom - 1).map((r) => r.team_id)
    const base = { season_id: selection.season_id, format: 'league' as const, status: 'active' as const, half_duration_min: selection.half_duration_min ?? 15, foul_alert_threshold: selection.foul_alert_threshold ?? 5, parent_id: selection.id }
    await base44.entities.Competition.create({ ...base, name: goldName, phase: 'gold', team_ids: goldIds, default_pitch: goldPitch, color: '#E8B931', order: 2, description: `Places 1 à ${goldTo} de la phase de sélection` })
    await base44.entities.Competition.create({ ...base, name: silverName, phase: 'silver', team_ids: silverIds, default_pitch: silverPitch, color: '#C9D3DD', order: 3, description: `Places ${silverFrom} à ${n} de la phase de sélection` })
    await base44.entities.Competition.update(selection.id, { split: preview.split, status: remaining ? 'active' : 'finished' })
    for (const [ids, div] of [[goldIds, 'div_gold'], [silverIds, 'div_silver']] as const) for (const id of ids) await base44.entities.Team.update(id, { division_id: div })
    toast.success(`${goldName} (${goldIds.length} équipes) et ${silverName} (${silverIds.length} équipes) constituées — faites maintenant leur tirage ci-dessus`)
  }
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Split className="size-5 text-neon" />2 · Constituer les divisions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {children.length ? (
          <div className="space-y-2 text-sm">
            <p>Divisions constituées à partir de « {selection.name} » :</p>
            <ul className="space-y-1">{children.map((c) => <li key={c.id} className="flex items-center gap-2"><Badge variant="success">{c.name}</Badge>{c.team_ids?.length} équipes · {c.description}</li>)}</ul>
            <p className="text-xs text-muted-foreground">Pour les renommer : Admin → Compétitions. Pour créer leurs matchs : sélectionnez la division en haut de cette page puis lancez son tirage.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{ms.length ? (remaining ? `${remaining} match(s) de sélection restent à jouer. Vous pourrez constituer les divisions dès qu’ils seront terminés.` : 'Tous les matchs de sélection sont joués : choisissez les places qui mènent à chaque division.') : 'Faites d’abord le tirage de la phase de sélection.'}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label htmlFor="g-name">Nom de la 1re division</Label><Input id="g-name" value={goldName} onChange={(e) => setGoldName(e.target.value)} /></div>
              <div><Label htmlFor="g-to">De la 1re à la place…</Label><Input id="g-to" type="number" min={2} max={n} value={goldTo} onChange={(e) => setGoldTo(+e.target.value)} /></div>
              <div><Label htmlFor="s-name">Nom de la 2e division</Label><Input id="s-name" value={silverName} onChange={(e) => setSilverName(e.target.value)} /></div>
              <div><Label htmlFor="s-from">De la place… à la dernière ({n}e)</Label><Input id="s-from" type="number" min={goldTo + 1} max={n} value={silverFrom} onChange={(e) => setSilverFrom(+e.target.value)} /></div>
              <div><Label htmlFor="g-pitch">Terrain {goldName}</Label><Input id="g-pitch" value={goldPitch} onChange={(e) => setGoldPitch(e.target.value)} /></div>
              <div><Label htmlFor="s-pitch">Terrain {silverName}</Label><Input id="s-pitch" value={silverPitch} onChange={(e) => setSilverPitch(e.target.value)} /></div>
            </div>
            <p className="text-sm">{valid ? <>{goldName} : places 1 à {goldTo} ({goldTo} équipes) · {silverName} : places {silverFrom} à {n} ({n - silverFrom + 1} équipes){silverFrom > goldTo + 1 ? ` · places ${goldTo + 1} à ${silverFrom - 1} non qualifiées` : ''}</> : <span className="text-amber-300">Places incohérentes.</span>}</p>
            <StandingsTable rows={table} compact zones={valid ? [{ from: 1, to: goldTo, color: '#E8B931', label: goldName }, { from: silverFrom, to: n, color: '#C9D3DD', label: silverName }] : []} />
            <Button onClick={create} disabled={!valid || !ms.length}><Split />Constituer {goldName} et {silverName}</Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function DrawHistory() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const rows = db.Draw.filter((d) => d.season_id === seasonId).sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? ''))
  if (!rows.length) return null
  return (
    <Card><CardHeader><CardTitle>Historique des tirages</CardTitle></CardHeader><CardContent>
      <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Admin</TableHead><TableHead>Compétition</TableHead><TableHead>Résultat</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((d) => (
          <TableRow key={d.id}><TableCell className="text-xs">{fmtDateTime(d.created_date)}</TableCell><TableCell className="text-xs">{d.performed_by}</TableCell><TableCell>{L.competition.get(d.competition_id ?? '')?.name ?? '—'}{d.matches_per_team ? ` · ${d.matches_per_team} matchs/équipe` : ''}</TableCell><TableCell><Badge variant={d.status === 'published' ? 'success' : d.status === 'draft' ? 'outline' : 'warning'}>{d.status === 'published' ? `${d.fixtures?.length ?? 0} affiches publiées` : d.status === 'draft' ? 'Annulé' : 'En cours'}</Badge></TableCell></TableRow>
        ))}</TableBody></Table>
    </CardContent></Card>
  )
}

/** Cérémonie plein écran : révélation affiche par affiche (à projeter pendant le tirage) */
function Ceremony({ draw, title, onClose }: { draw: Draw; title: string; onClose: () => void }) {
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
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden p-4 sm:p-8" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(248,90,0,.25), transparent 70%), #04163D' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="title-caps text-2xl sm:text-4xl">Tirage · <span className="text-neon">{title}</span></div>
        <div className="num text-2xl sm:text-4xl">{shown} / {fixtures.length}</div>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-2 hover:bg-white/10" aria-label="Fermer"><X /></button>
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
        ) : locked ? <div className="title-caps text-4xl text-win">Tirage publié</div> : <div className="title-caps text-4xl text-muted-foreground">Prêt pour la révélation</div>}
      </div>
      {!locked && <div className="mb-4 flex justify-center gap-3"><Button size="xl" onClick={revealNext} disabled={n >= fixtures.length}><Sparkles />Révéler l’affiche suivante</Button><Button size="xl" variant="outline" onClick={() => setAuto(!auto)}>{auto ? 'Pause' : 'Révélation auto'}</Button></div>}
      <div className="max-h-[32vh] overflow-y-auto"><FixturesGrid draw={live} revealAll={locked} /></div>
    </div>
  )
}
