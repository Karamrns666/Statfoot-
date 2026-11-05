// Saisie rapide (tableau MBL d'origine, gardée en secours du Match Center) :
// A joué · Buts · CSC · Passes · Tirs · Tirs cadrés · CJ · CR · Arrêts · Pén. arr. · TAB arr. + Homme du match + Terminer le match.
// Tirs et tirs cadrés comptent les buts (un but est un tir cadré) ; laissés vides, les tirs du joueur ne sont pas saisis.
// Les compteurs sont convertis en MatchEvent : un seul modèle de données pour tout le calcul.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Radio } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { newId } from '@/api/localStore'
import { closeMatch, reopenMatch } from '@/api/matchOps'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/league/FilterSelect'
import { RoleBadge, TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { playerName } from '@/lib/format'
import type { MatchEvent } from '@/types/entities'

type Row = { played: boolean; goals: number; og: number; assists: number; shots: number; on: number; yc: number; rc: number; saves: number; pens: number; tab: number }
const COLS: { k: keyof Omit<Row, 'played'>; l: string }[] = [{ k: 'goals', l: 'Buts' }, { k: 'og', l: 'CSC' }, { k: 'assists', l: 'Passes' }, { k: 'shots', l: 'Tirs' }, { k: 'on', l: 'Cadrés' }, { k: 'yc', l: 'CJ' }, { k: 'rc', l: 'CR' }, { k: 'saves', l: 'Arrêts' }, { k: 'pens', l: 'Pén. arr.' }, { k: 'tab', l: 'TAB arr.' }]

export default function QuickEntry() {
  const { id } = useParams()
  const { db, league, settings } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const nav = useNavigate()
  const m = db.Match.find((x) => x.id === id)
  const evs = db.MatchEvent.filter((e) => e.match_id === id)
  // tirs déjà saisis (Match Center ou saisie précédente) : un but est un tir cadré
  const shotInit = (pid: string) => {
    const mine = evs.filter((e) => e.player_id === pid && e.period !== 'PENS')
    const manual = mine.some((e) => (e.type === 'shot_on_target' && !e.auto) || e.type === 'shot_off_target' || e.type === 'penalty_missed')
    if (!manual) return { shots: 0, on: 0 }
    const on = mine.filter((e) => e.type === 'goal' || (e.type === 'shot_on_target' && !e.auto)).length
    return { shots: on + mine.filter((e) => e.type === 'shot_off_target' || e.type === 'penalty_missed').length, on }
  }
  const init = useMemo(() => {
    const out: Record<string, Row> = {}
    if (!m) return out
    for (const tid of [m.home_team_id, m.away_team_id]) {
      const lu = db.Lineup.find((l) => l.match_id === m.id && l.team_id === tid)
      for (const p of db.Player.filter((x) => x.team_id === tid && x.season_ids?.includes(m.season_id))) {
        const c = (t: MatchEvent['type']) => evs.filter((e) => e.type === t && e.player_id === p.id).length
        out[p.id] = { played: !!lu?.starter_ids?.includes(p.id) || evs.some((e) => e.type === 'substitution' && e.player_id === p.id), goals: c('goal'), og: c('own_goal'), assists: evs.filter((e) => e.type === 'goal' && e.related_player_id === p.id).length, ...shotInit(p.id), yc: c('yellow_card') + c('second_yellow'), rc: c('red_card'), saves: c('save'), pens: c('penalty_saved'), tab: evs.filter((e) => e.type === 'shootout_saved' && e.related_player_id === p.id).length }
      }
    }
    return out
  }, [m?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [rows, setRows] = useState(init)
  const [motm, setMotm] = useState(m?.motm_player_id ?? '')
  if (!m) return <AdminPage title="Match introuvable"><Link to="/admin/matchs">Retour</Link></AdminPage>
  const set = (pid: string, patch: Partial<Row>) => setRows({ ...rows, [pid]: { ...rows[pid], ...patch, ...(Object.values(patch).some((v) => typeof v === 'number' && v > 0) ? { played: true } : {}) } })
  const score = (tid: string) => {
    const opp = tid === m.home_team_id ? m.away_team_id : m.home_team_id
    const mine = db.Player.filter((p) => p.team_id === tid).reduce((a, p) => a + (rows[p.id]?.goals ?? 0), 0)
    return mine + db.Player.filter((p) => p.team_id === opp).reduce((a, p) => a + (rows[p.id]?.og ?? 0), 0)
  }
  const finish = async (close: boolean) => {
    // validation : passes ≤ buts par équipe
    for (const tid of [m.home_team_id, m.away_team_id]) {
      const ps = db.Player.filter((p) => p.team_id === tid)
      const g = ps.reduce((a, p) => a + (rows[p.id]?.goals ?? 0), 0), a = ps.reduce((x, p) => x + (rows[p.id]?.assists ?? 0), 0)
      if (a > g) { toast.error(`${L.team.get(tid)?.name} : plus de passes (${a}) que de buts (${g})`); return }
    }
    // tirs : cadrés ≥ buts et tirs ≥ cadrés (si des tirs sont saisis pour le joueur)
    for (const p of db.Player.filter((x) => x.team_id === m.home_team_id || x.team_id === m.away_team_id)) {
      const r = rows[p.id]; if (!r || (!r.shots && !r.on)) continue
      if (r.on > r.shots) { toast.error(`${playerName(p)} : plus de tirs cadrés (${r.on}) que de tirs (${r.shots})`); return }
      if (r.goals > r.on) { toast.error(`${playerName(p)} : ${r.goals} but(s) mais ${r.on} tir(s) cadré(s) — un but compte comme un tir cadré`); return }
    }
    // tirs par joueur saisis ici : on remplace ceux qui existent (les tirs d'équipe sans joueur sont conservés)
    for (const e of evs.filter((x) => x.player_id && ((x.type === 'shot_on_target' && !x.auto) || x.type === 'shot_off_target'))) await base44.entities.MatchEvent.delete(e.id)
    // remplace les événements "comptés" (on garde ceux du Match Center type corner, tir, faute…)
    const COUNTED: MatchEvent['type'][] = ['goal', 'own_goal', 'yellow_card', 'second_yellow', 'red_card', 'save', 'penalty_saved', 'shootout_saved', 'shot_on_target']
    for (const e of evs.filter((x) => COUNTED.includes(x.type) && (x.type !== 'shot_on_target' || x.auto))) await base44.entities.MatchEvent.delete(e.id)
    const created: Omit<MatchEvent, 'id'>[] = []
    const ts = new Date().toISOString()
    for (const tid of [m.home_team_id, m.away_team_id]) {
      const opp = tid === m.home_team_id ? m.away_team_id : m.home_team_id
      const ps = db.Player.filter((p) => p.team_id === tid)
      const assistQueue = ps.flatMap((p) => Array(rows[p.id]?.assists ?? 0).fill(p.id) as string[])
      for (const p of ps) {
        const r = rows[p.id]; if (!r) continue
        const ev = (type: MatchEvent['type'], extra: Partial<MatchEvent> = {}) => created.push({ match_id: m.id, team_id: tid, type, player_id: p.id, client_ts: ts, operator: 'Saisie rapide', ...extra })
        for (let i = 0; i < r.goals; i++) { const gid = newId(); const a = assistQueue.find((x) => x !== p.id); if (a) assistQueue.splice(assistQueue.indexOf(a), 1); created.push({ id: gid, match_id: m.id, team_id: tid, type: 'goal', player_id: p.id, related_player_id: a, client_ts: ts, operator: 'Saisie rapide' } as MatchEvent); created.push({ match_id: m.id, team_id: tid, type: 'shot_on_target', auto: true, parent_event_id: gid, client_ts: ts }) }
        for (let i = 0; i < r.og; i++) ev('own_goal')
        if (r.shots || r.on) {
          const missed = evs.filter((e) => e.type === 'penalty_missed' && e.player_id === p.id).length // conservés, comptent comme tirs
          for (let i = 0; i < r.on - r.goals; i++) ev('shot_on_target')
          for (let i = 0; i < r.shots - r.on - missed; i++) ev('shot_off_target')
        }
        if (r.yc >= 1) ev('yellow_card')
        if (r.yc >= 2) ev('second_yellow')
        for (let i = 0; i < r.rc; i++) ev('red_card')
        for (let i = 0; i < r.saves; i++) ev('save')
        for (let i = 0; i < r.pens; i++) ev('penalty_saved')
        for (let i = 0; i < r.tab; i++) created.push({ match_id: m.id, team_id: opp, type: 'shootout_saved', related_player_id: p.id, client_ts: ts, operator: 'Saisie rapide' })
      }
      const played = ps.filter((p) => rows[p.id]?.played).map((p) => p.id)
      const lu = db.Lineup.find((l) => l.match_id === m.id && l.team_id === tid)
      const gk = played.find((pid) => db.Player.find((p) => p.id === pid)?.position === 'GK')
      if (lu) await base44.entities.Lineup.update(lu.id, { starter_ids: played, goalkeeper_id: lu.goalkeeper_id && played.includes(lu.goalkeeper_id) ? lu.goalkeeper_id : gk, validated: true })
      else await base44.entities.Lineup.create({ match_id: m.id, team_id: tid, starter_ids: played, goalkeeper_id: gk, validated: true, validated_by: user?.email })
    }
    if (created.length) await base44.entities.MatchEvent.bulkCreate(created as MatchEvent[])
    await base44.entities.Match.update(m.id, { motm_player_id: motm || undefined, source: m.source ?? 'quick_entry', home_score: score(m.home_team_id), away_score: score(m.away_team_id) })
    if (close) {
      const fresh = { ...league, events: [...league.events.filter((e) => e.match_id !== m.id || !COUNTED.includes(e.type)), ...(created as MatchEvent[])] }
      await closeMatch(fresh, { ...m, motm_player_id: motm }, user, { voteMinutes: settings.motm_vote_minutes_after })
      toast.success('Match terminé — XP, classements et trophées recalculés'); nav('/admin/matchs')
    } else toast.success('Saisie enregistrée')
  }
  return (
    <AdminPage title="Saisie du match" subtitle={`${L.competition.get(m.competition_id)?.name} · J${m.round} · ${m.pitch ?? ''}`}
      actions={<>
        <Button asChild variant="ghost"><Link to="/admin/matchs"><ArrowLeft />Matchs</Link></Button>
        <Button asChild variant="outline"><Link to={`/admin/match-center/${m.id}`}><Radio />Ouvrir le Match Center</Link></Button>
        {m.status === 'finished' && <Button variant="outline" onClick={async () => { await reopenMatch(m, user); toast.info('Match rouvert') }}>Rouvrir le match</Button>}
      </>}>
      <div className="mb-4 flex items-center justify-center gap-4">
        <TeamLogo team={L.team.get(m.home_team_id)} size={48} /><span className="num text-5xl">{score(m.home_team_id)} - {score(m.away_team_id)}</span><TeamLogo team={L.team.get(m.away_team_id)} size={48} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[m.home_team_id, m.away_team_id].map((tid) => (
          <Card key={tid}><CardHeader><CardTitle className="flex items-center gap-2"><TeamLogo team={L.team.get(tid)} size={24} />{L.team.get(tid)?.name}</CardTitle></CardHeader>
            <CardContent className="px-1 sm:px-3">
              <Table>
                <TableHeader><TableRow><TableHead>Joueur</TableHead><TableHead className="text-center">A joué</TableHead>{COLS.map((c) => <TableHead key={c.k} className="text-center">{c.l}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {db.Player.filter((p) => p.team_id === tid && p.season_ids?.includes(m.season_id)).sort((a, b) => (a.number ?? 0) - (b.number ?? 0)).map((p) => {
                    const r = rows[p.id] ?? { played: false, goals: 0, og: 0, assists: 0, shots: 0, on: 0, yc: 0, rc: 0, saves: 0, pens: 0, tab: 0 }
                    return (
                      <TableRow key={p.id} className={r.played ? '' : 'opacity-60'}>
                        <TableCell className="text-xs"><span className="num mr-1 text-muted-foreground">{p.number}</span>{playerName(p)} <RoleBadge position={p.position} captain={p.is_captain} /></TableCell>
                        <TableCell className="text-center"><input type="checkbox" className="size-4 accent-[#F85A00]" checked={r.played} onChange={(e) => set(p.id, { played: e.target.checked })} aria-label="A joué" /></TableCell>
                        {COLS.map((c) => (c.k === 'saves' || c.k === 'pens' || c.k === 'tab') && p.position !== 'GK'
                          ? <TableCell key={c.k} />
                          : <TableCell key={c.k} className="p-1"><Input type="number" min={0} max={c.k === 'yc' ? 2 : c.k === 'rc' ? 1 : c.k === 'shots' || c.k === 'on' ? 60 : 20} value={r[c.k] || ''} placeholder="0" onChange={(e) => set(p.id, { [c.k]: Math.max(0, +e.target.value || 0) })} className="h-8 w-12 px-1 text-center" aria-label={c.l} /></TableCell>)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-4"><CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
        <span className="font-semibold">Homme du match</span>
        <FilterSelect className="sm:w-72" value={motm} onChange={setMotm} allLabel="—" options={Object.entries(rows).filter(([, r]) => r.played).map(([pid]) => ({ value: pid, label: playerName(L.player.get(pid)) }))} />
        <div className="flex gap-2 sm:ml-auto"><Button variant="outline" onClick={() => finish(false)}>Enregistrer</Button><Button onClick={() => finish(true)}><Flag />Terminer le match</Button></div>
      </CardContent></Card>
    </AdminPage>
  )
}
