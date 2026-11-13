import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { phaseName } from '@/lib/competitionNames'
import { toPng } from 'html-to-image'
import { CheckCircle2, Download, FileSpreadsheet, Lock, Send, Sparkles, Tv, Upload, ImageDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SortableTable } from '@/components/league/SortableTable'
import { shotColumns } from '@/components/league/shotColumns'
import { fmtAccuracy, fmtShots, fmtShotsPerGoal } from '@/lib/shots'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { StatTile } from '@/components/league/Bits'
import { QrCode, pitchSlug } from '@/components/league/QrCode'
import { AWARD_STYLE, TrophyBadge } from '@/components/awards/TrophyBadge'
import { VisualFrame } from '@/components/share/VisualFrame'
import { toast } from '@/components/ui/toast'
import { AWARD_LABELS, computeAwards, computePlayerXP, computeTeamStats, isPlayed, kpis, type PhaseFilter, type PlayerXP, type TeamStats } from '@/lib/stats'
import { fmtScore } from '@/lib/matchEngine'
import { fmtDate, playerName, roleLabels, toRole } from '@/lib/format'
import { teamLogoSvg as teamLogoSvgFn } from '@/lib/logos'
import { teamSeasonId } from '@/lib/clubs'
import type { Award } from '@/types/entities'

// ---------------------------------------------------------------------------
//  Statistiques (admin) : filtres + KPIs + onglets Matchs / Joueurs / Équipes + export CSV
// ---------------------------------------------------------------------------
function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob(['﻿' + Papa.unparse(rows, { delimiter: ';' })], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}
export function StatsAdmin() {
  const { db, league } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const [division, setDivision] = useState('')
  const [group, setGroup] = useState('')
  const [team, setTeam] = useState('')
  const [player, setPlayer] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const inDates = (d?: string) => (!from || (d ?? '') >= from) && (!to || (d ?? '').slice(0, 10) <= to)
  const groupTeams = group ? db.Group.find((g) => g.id === group)?.team_ids ?? [] : null
  const divTeams = division ? db.Team.filter((t) => t.division_id === division).map((t) => t.id) : null
  const teamOk = (t: string) => (!team || t === team) && (!groupTeams || groupTeams.includes(t)) && (!divTeams || divTeams.includes(t))
  const data = useMemo(() => ({ ...league, matches: league.matches.filter((m) => inDates(m.date) && (teamOk(m.home_team_id) || teamOk(m.away_team_id))) }), [league, from, to, team, group, division]) // eslint-disable-line react-hooks/exhaustive-deps
  const scope = { seasonId, phase }
  const k = kpis(data, scope)
  const px = [...computePlayerXP(data, scope).values()].filter((s) => s.matches > 0 && teamOk(s.team_id) && (!player || s.player_id === player)).sort((a, b) => b.xp - a.xp)
  const tx = [...computeTeamStats(data, scope).values()].filter((t) => teamOk(t.team_id)).sort((a, b) => b.points - a.points)
  const mx = data.matches.filter((m) => m.season_id === seasonId && isPlayed(m)).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  return (
    <AdminPage title="Statistiques" subtitle="Calculées par le même moteur que le site public">
      <div className="glass mb-4 flex flex-wrap gap-2 rounded-2xl p-3">
        <FilterSelect value={phase === 'all' ? '' : phase} onChange={(v) => setPhase((v || 'all') as PhaseFilter)} allLabel="Toute la saison" options={[{ value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: phaseName('gold') }, { value: 'silver', label: phaseName('silver') }, { value: 'knockout', label: 'Phase finale' }]} />
        <FilterSelect value={division} onChange={setDivision} allLabel="Toutes séries" options={db.Division.map((d) => ({ value: d.id, label: d.name }))} />
        <FilterSelect value={group} onChange={setGroup} allLabel="Tous groupes" options={db.Group.map((g) => ({ value: g.id, label: g.name }))} />
        <FilterSelect value={team} onChange={setTeam} allLabel="Toutes équipes" options={db.Team.map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect value={player} onChange={setPlayer} allLabel="Tous joueurs" options={db.Player.filter((p) => !team || p.team_id === team).map((p) => ({ value: p.id, label: playerName(p) }))} />
        <Input type="date" className="h-9 w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Du" /><Input type="date" className="h-9 w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Au" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Matchs" value={k.matches} color="#e6edf8" /><StatTile label="Buts" value={k.goals} /><StatTile label="Moyenne" value={k.goals_avg} color="#e6edf8" sub="buts / match" />
        <StatTile label="Cartons J/R" value={`${k.yellow}/${k.red}`} color="#facc15" /><StatTile label="Passes" value={k.assists} color="#f97316" /><StatTile label="Arrêts" value={k.saves} color="#3b82f6" />
      </div>
      <Tabs defaultValue="players" className="mt-4">
        <TabsList><TabsTrigger value="matches">Matchs</TabsTrigger><TabsTrigger value="players">Joueurs</TabsTrigger><TabsTrigger value="teams">Équipes</TabsTrigger></TabsList>
        <TabsContent value="matches">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => downloadCsv('matchs.csv', mx.map((m) => ({ date: m.date, journee: m.round, domicile: L.team.get(m.home_team_id)?.name, exterieur: L.team.get(m.away_team_id)?.name, score: fmtScore(m), terrain: m.pitch })))}><Download />Export CSV</Button>
          <div className="glass rounded-2xl p-2"><SortableTable rows={mx.slice(0, 120)} rowKey={(m) => m.id} initial={{ key: 'date', dir: 'desc' }} columns={[
            { key: 'date', label: 'Date', className: 'text-xs', sort: (m) => m.date ?? '', render: (m) => fmtDate(m.date, 'd MMM') },
            { key: 'round', label: 'J', title: 'Journée', sort: (m) => m.round, render: (m) => m.round },
            { key: 'match', label: 'Rencontre', sort: (m) => L.team.get(m.home_team_id)?.name, render: (m) => `${L.team.get(m.home_team_id)?.name} – ${L.team.get(m.away_team_id)?.name}` },
            { key: 'goals', label: 'Score', title: 'Trié par nombre de buts', className: 'num', sort: (m) => (m.home_score ?? 0) + (m.away_score ?? 0), render: (m) => fmtScore(m) },
          ]} /></div>
        </TabsContent>
        <TabsContent value="players">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => downloadCsv('joueurs.csv', px.map((s) => ({ joueur: playerName(L.player.get(s.player_id)), equipe: L.team.get(s.team_id)?.name, gardien: s.position === 'GK' ? 'oui' : 'non', mj: s.matches, buts: s.goals, passes: s.assists, jaunes: s.yellow, rouges: s.red, arrets: s.saves, clean_sheets: s.clean_sheets, tirs: fmtShots(s.shot, 'shots'), tirs_cadres: fmtShots(s.shot, 'on_target'), precision: fmtAccuracy(s.shot), tirs_par_but: fmtShotsPerGoal(s.shot), xp: s.xp })))}><Download />Export CSV</Button>
          <div className="glass rounded-2xl p-2"><SortableTable rows={px.slice(0, 150)} rowKey={(x) => x.player_id} initial={{ key: 'xp', dir: 'desc' }} columns={[
            { key: 'name', label: 'Joueur', sort: (x) => playerName(L.player.get(x.player_id)), render: (x) => playerName(L.player.get(x.player_id)) },
            { key: 'team', label: 'Équipe', className: 'text-xs', sort: (x) => L.team.get(x.team_id)?.short_name, render: (x) => L.team.get(x.team_id)?.short_name },
            { key: 'mj', label: 'MJ', headClassName: 'text-center', className: 'num text-center', sort: (x) => x.matches, render: (x) => x.matches },
            { key: 'goals', label: 'Buts', headClassName: 'text-center', className: 'num text-center', sort: (x) => x.goals, render: (x) => x.goals },
            { key: 'assists', label: 'Passes', headClassName: 'text-center', className: 'num text-center', sort: (x) => x.assists, render: (x) => x.assists },
            ...shotColumns<PlayerXP>((x) => x.shot),
            { key: 'cards', label: 'CJ/CR', headClassName: 'text-center', className: 'num text-center', first: 'desc', sort: (x) => x.yellow + x.red * 3, render: (x) => `${x.yellow}/${x.red}` },
            { key: 'saves', label: 'Arrêts', headClassName: 'text-center', className: 'num text-center', sort: (x) => x.saves, render: (x) => x.saves },
            { key: 'xp', label: 'XP', headClassName: 'text-center', className: 'num text-center text-neon', sort: (x) => x.xp, render: (x) => x.xp },
          ]} /></div>
        </TabsContent>
        <TabsContent value="teams">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => downloadCsv('equipes.csv', tx.map((t) => ({ equipe: L.team.get(t.team_id)?.name, mj: t.played, v: t.won, n: t.drawn, d: t.lost, bp: t.gf, bc: t.ga, diff: t.gd, pts: t.points, tirs: fmtShots(t.shot, 'shots'), tirs_cadres: fmtShots(t.shot, 'on_target'), precision: fmtAccuracy(t.shot), tirs_par_but: fmtShotsPerGoal(t.shot) })))}><Download />Export CSV</Button>
          <div className="glass rounded-2xl p-2"><SortableTable rows={tx} rowKey={(t) => t.team_id} initial={{ key: 'points', dir: 'desc' }} columns={[
            { key: 'team', label: 'Équipe', sort: (t) => L.team.get(t.team_id)?.name, render: (t) => <span className="flex items-center gap-2"><TeamLogo team={L.team.get(t.team_id)} size={18} />{L.team.get(t.team_id)?.name}</span> },
            { key: 'mj', label: 'MJ', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.played, render: (t) => t.played },
            { key: 'vnd', label: 'V-N-D', title: 'Trié par victoires', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.won, render: (t) => `${t.won}-${t.drawn}-${t.lost}` },
            { key: 'gf', label: 'BP', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.gf, render: (t) => t.gf },
            { key: 'ga', label: 'BC', headClassName: 'text-center', className: 'num text-center', first: 'asc', sort: (t) => t.ga, render: (t) => t.ga },
            ...shotColumns<TeamStats>((t) => t.shot),
            { key: 'cards', label: 'Cartons', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.yellow + t.red * 3, render: (t) => `${t.yellow}/${t.red}` },
            { key: 'points', label: 'Pts', headClassName: 'text-center', className: 'num text-center text-neon', sort: (t) => t.points, render: (t) => t.points },
          ]} /></div>
        </TabsContent>
      </Tabs>
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
//  Awards de fin de saison : Généré → Vérifié → Publié, verrouillage, poster
// ---------------------------------------------------------------------------
const STATUS: Record<NonNullable<Award['status']>, { l: string; v: 'outline' | 'warning' | 'success' }> = { generated: { l: 'Généré', v: 'outline' }, verified: { l: 'Vérifié', v: 'warning' }, published: { l: 'Publié', v: 'success' } }
export function AwardsAdmin() {
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const { seasonId } = useAdminScope()
  const [scope, setScope] = useState<'season' | 'league_phase' | 'gold' | 'silver'>('season')
  const [poster, setPoster] = useState<Award | null>(null)
  const awards = db.Award.filter((a) => a.season_id === seasonId && (a.scope ?? 'season') === scope)
  const generate = async () => {
    const res = computeAwards(league, { seasonId, phase: scope === 'season' ? 'all' : scope })
    for (const a of res) {
      const cur = awards.find((x) => x.category === a.category)
      if (cur?.locked) continue
      const data = { season_id: seasonId, scope, category: a.category, player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded, status: 'generated' as const }
      if (cur) await base44.entities.Award.update(cur.id, data); else await base44.entities.Award.create(data)
    }
    toast.success('Awards générés depuis les statistiques (privés jusqu’à publication)')
  }
  return (
    <AdminPage title="Awards de fin de saison" subtitle="Génération automatique → vérification → publication (privé jusqu’à publication)"
      actions={<><FilterSelect value={scope} onChange={(v) => setScope((v || 'season') as typeof scope)} allLabel={null} options={[{ value: 'season', label: 'Toute la saison' }, { value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: phaseName('gold') }, { value: 'silver', label: phaseName('silver') }]} /><Button onClick={generate}><Sparkles />Générer / régénérer</Button></>}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {awards.sort((a, b) => Object.keys(AWARD_LABELS).indexOf(a.category) - Object.keys(AWARD_LABELS).indexOf(b.category)).map((a) => {
          const p = a.player_id ? L.player.get(a.player_id) : undefined, t = L.team.get(a.team_id ?? '')
          const st = STATUS[a.status ?? 'generated']
          return (
            <Card key={a.id}><CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <TrophyBadge category={a.category} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="title-caps" style={{ color: AWARD_STYLE[a.category].color }}>{AWARD_LABELS[a.category]}</div>
                  <div className="truncate font-semibold">{a.not_awarded ? 'Non attribué' : p ? playerName(p) : t?.name}</div>
                  <div className="text-xs text-muted-foreground">{p ? [t?.name, ...roleLabels(p)].join(' · ') : t?.company} {a.value != null && `· ${a.value}`}</div>
                </div>
                <div className="flex flex-col items-end gap-1"><Badge variant={st.v}>{st.l}</Badge>{a.locked && <Badge variant="secondary"><Lock className="size-3" />Verrouillé</Badge>}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.status === 'generated' && <Button size="sm" variant="outline" onClick={() => base44.entities.Award.update(a.id, { status: 'verified' })}><CheckCircle2 />Vérifié</Button>}
                {a.status !== 'published' && <Button size="sm" onClick={() => base44.entities.Award.update(a.id, { status: 'published', locked: true })}><Send />Valider et verrouiller</Button>}
                {a.locked && <Button size="sm" variant="ghost" onClick={() => base44.entities.Award.update(a.id, { locked: false, status: 'verified' })}>Déverrouiller</Button>}
                {!a.not_awarded && <Button size="sm" variant="ghost" onClick={() => setPoster(a)}><ImageDown />Poster</Button>}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">Par {user?.email ? 'l’organisation' : ''} · aperçu public uniquement une fois publié</div>
            </CardContent></Card>
          )
        })}
        {!awards.length && <Card className="md:col-span-3"><CardContent className="py-10 text-center text-muted-foreground">Aucun award pour ce périmètre — cliquez sur « Générer ».</CardContent></Card>}
      </div>
      {poster && <AwardPoster award={poster} onClose={() => setPoster(null)} />}
    </AdminPage>
  )
}

function AwardPoster({ award, onClose }: { award: Award; onClose: () => void }) {
  const L = useLookup()
  const { db } = useData()
  const ref = useRef<HTMLDivElement>(null)
  const p = award.player_id ? L.player.get(award.player_id) : undefined, t = L.team.get(award.team_id ?? '')
  const st = AWARD_STYLE[award.category]
  const season = db.Season.find((s) => s.id === award.season_id)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 324, height: 405, overflow: 'hidden' }} className="rounded-xl">
          <div style={{ transform: 'scale(.3)', transformOrigin: 'top left' }}>
            <div ref={ref}>
              <VisualFrame accent={st.color} subtitle={season?.name}>
                <TrophyBadge category={award.category} size={300} />
                <div className="title-caps mt-12" style={{ fontSize: 96, color: st.color }}>{st.label}</div>
                <div className="title-caps mt-6 text-white" style={{ fontSize: 110 }}>{p ? `${p.first_name} ${p.last_name}` : t?.name}</div>
                <div className="mt-4 font-display font-bold text-white/70" style={{ fontSize: 48 }}>{p ? t?.name : t?.company}</div>
              </VisualFrame>
            </div>
          </div>
        </div>
        <Button className="w-full" onClick={async () => { if (ref.current) { const a = document.createElement('a'); a.href = await toPng(ref.current, { width: 1080, height: 1350 }); a.download = `award-${award.category}.png`; a.click() } }}><Download />Télécharger (1080×1350)</Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Import CSV (équipes, joueurs) : glisser-déposer, aperçu, validation, modèles
// ---------------------------------------------------------------------------
const TEMPLATES = {
  teams: 'nom;nom_court;entreprise;couleur_principale\nAtlas Digital FC;ATD;Atlas Digital;#F85A00',
  players: 'prenom;nom;numero;gardien;capitaine;equipe_nom_court;date_naissance;email\nYassine;Benali;9;non;oui;ATD;1995-04-12;yassine.benali@exemple.ma\nKarim;Alaoui;1;oui;non;ATD;1992-09-03;',
}
// 6 contre 6 : pas de postes. Colonnes « gardien » et « capitaine » (oui / non) ; une ancienne colonne « poste » reste acceptée (GB = gardien).
const YES = /^(oui|o|yes|y|x|1|true|vrai)$/i
const NO = /^(non|n|no|0|false|faux)?$/i
const isGk = (r: Record<string, string>) => (r.gardien != null ? YES.test(r.gardien.trim()) : toRole(r.poste) === 'GK')
export function ImportCsv() {
  const { db } = useData()
  const { seasonId } = useAdminScope()
  const [kind, setKind] = useState<'teams' | 'players'>('teams')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [drag, setDrag] = useState(false)
  // équipe de la saison sélectionnée (le même nom court existe pour chaque saison : ARW 2025, ARW 2026…)
  const teamOf = (code?: string) => {
    const c = (code ?? '').trim().toUpperCase()
    const same = db.Team.filter((t) => t.short_name === c)
    return same.find((t) => teamSeasonId(t, db.Competition) === seasonId) ?? (seasonId ? undefined : same[0])
  }
  const parse = (f: File) => Papa.parse<Record<string, string>>(f, { header: true, skipEmptyLines: true, delimiter: '', complete: (r) => setRows(r.data) })
  const check = (r: Record<string, string>) => {
    if (kind === 'teams') return !r.nom ? 'nom manquant' : !r.nom_court || r.nom_court.length > 3 ? 'nom_court (3 lettres)' : db.Team.some((t) => t.short_name === r.nom_court.toUpperCase()) ? 'existe déjà' : ''
    if (!r.prenom || !r.nom) return 'prénom/nom manquant'
    if (r.gardien != null && !YES.test(r.gardien.trim()) && !NO.test(r.gardien.trim())) return 'gardien : oui ou non'
    if (r.capitaine != null && !YES.test(r.capitaine.trim()) && !NO.test(r.capitaine.trim())) return 'capitaine : oui ou non'
    if (!teamOf(r.equipe_nom_court)) return `équipe inconnue pour la saison ${seasonId ?? ''}`.trim()
    return ''
  }
  const ok = rows.filter((r) => !check(r))
  const run = async () => {
    if (kind === 'teams') await base44.entities.Team.bulkCreate(ok.map((r) => ({ name: r.nom, short_name: r.nom_court.toUpperCase(), company: r.entreprise, primary_color: r.couleur_principale || '#F85A00', secondary_color: '#04163D', logo_url: teamLogoSvgFn(r.nom_court.toUpperCase(), r.couleur_principale), status: 'active' as const })))
    else await base44.entities.Player.bulkCreate(ok.map((r) => ({ first_name: r.prenom, last_name: r.nom, number: r.numero ? +r.numero : undefined, position: isGk(r) ? 'GK' as const : 'FIELD' as const, is_captain: r.capitaine != null && YES.test(r.capitaine.trim()), team_id: teamOf(r.equipe_nom_court)!.id, birth_date: r.date_naissance || undefined, email: r.email || undefined, status: 'active' as const, season_ids: [seasonId], documents: {} })))
    toast.success(`${ok.length} ligne(s) importée(s)`); setRows([])
  }
  return (
    <AdminPage title="Import CSV" subtitle="Équipes et joueurs — glisser-déposer, aperçu et validation avant import">
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterSelect value={kind} onChange={(v) => { setKind((v || 'teams') as typeof kind); setRows([]) }} allLabel={null} options={[{ value: 'teams', label: 'Équipes' }, { value: 'players', label: 'Joueurs' }]} />
        <Button variant="outline" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + TEMPLATES[kind]], { type: 'text/csv' })); a.download = `modele-${kind}.csv`; a.click() }}><FileSpreadsheet />Télécharger le modèle</Button>
      </div>
      <label onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) parse(f) }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center ${drag ? 'border-neon bg-neon/10' : 'border-white/15'}`}>
        <Upload className="size-8 text-neon" /><span className="font-semibold">Glissez votre fichier CSV ici</span><span className="text-xs text-muted-foreground">ou cliquez pour choisir (séparateur ; ou ,)</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) parse(f) }} />
      </label>
      {rows.length > 0 && (
        <Card className="mt-4"><CardHeader className="flex-row items-center justify-between"><CardTitle>Aperçu · {ok.length}/{rows.length} valides</CardTitle><Button onClick={run} disabled={!ok.length}>Importer {ok.length} ligne(s)</Button></CardHeader>
          <CardContent><Table><TableHeader><TableRow>{Object.keys(rows[0]).map((k) => <TableHead key={k}>{k}</TableHead>)}<TableHead>Contrôle</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r, i) => { const err = check(r); return <TableRow key={i}>{Object.keys(rows[0]).map((k) => <TableCell key={k} className="text-xs">{r[k]}</TableCell>)}<TableCell>{err ? <Badge variant="destructive">{err}</Badge> : <Badge variant="success">OK</Badge>}</TableCell></TableRow> })}</TableBody></Table></CardContent></Card>
      )}
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
//  Diffusion : mode TV et QR codes par terrain
// ---------------------------------------------------------------------------
export function Broadcast() {
  const { db } = useData()
  const pitches = [...new Set([...db.Venue.flatMap((v) => v.pitches ?? []), ...db.Match.map((m) => m.pitch).filter(Boolean) as string[]])]
  const cards = useRef<HTMLDivElement>(null)
  return (
    <AdminPage title="Mode TV & QR codes" subtitle="Écran géant par terrain et QR code pour les spectateurs">
      <div ref={cards} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...pitches, 'tous'].map((p) => {
          const slug = p === 'tous' ? 'tous' : pitchSlug(p)
          const url = `${location.origin}/live/${slug}`
          return (
            <Card key={p}><CardHeader><CardTitle>{p === 'tous' ? 'Tous les terrains' : p}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <div className="rounded-xl bg-white p-3"><QrCode value={url} size={170} /></div>
                <code className="text-xs text-muted-foreground">{url}</code>
                <div className="flex gap-2"><Button asChild size="sm"><Link to={`/live/${slug}`} target="_blank"><Tv />Ouvrir le mode TV</Link></Button></div>
              </CardContent></Card>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Imprimez la page (Ctrl+P) pour afficher les QR codes au bord des terrains. Le mode TV fait défiler automatiquement les matchs en cours du terrain.</p>
    </AdminPage>
  )
}

