// Admin — Match des capitaines : équipes ORANGE / BLEUE (nom, logo, couleur, effectif choisi parmi les
// joueurs inscrits) et matchs mensuels saisis comme un match normal (6 contre 6) : A joué, buts, CSC, passes,
// cartons, arrêts, gardien, tirs au but, homme du match. Données séparées : rien ne compte dans la ligue.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { newId } from '@/api/localStore'
import { useData, useLookup } from '@/hooks/useData'
import { useCaptains } from '@/hooks/useCaptains'
import { AdminPage } from '@/components/admin/AdminLayout'
import { ImageInput } from '@/components/admin/EntityCrud'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterSelect } from '@/components/league/FilterSelect'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { CaptainCrest, CaptainScoreLine } from '@/components/captains/CaptainBits'
import { CAPTAIN_COLORS, CAPTAIN_SIDES, captainScore, emptyLine, sheetWarnings } from '@/lib/captains'
import { fmtDate, playerName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CaptainLine, CaptainMatch, CaptainSide, CaptainTeam } from '@/types/entities'

export default function CaptainsAdmin() {
  const { teams, matches } = useCaptains()
  const nav = useNavigate()
  const create = async () => {
    const d = new Date(); d.setMonth(d.getMonth() + 1, 1); d.setHours(18, 0, 0, 0)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1) // 1er samedi du mois suivant
    const row = await base44.entities.CaptainMatch.create({ id: newId(), date: fmtLocal(d), status: 'scheduled', lines: [] } as never)
    base44.logActivity('create', 'CaptainMatch', { id: row.id, name: 'Match des capitaines' } as never, { date: row.date })
    nav(`/admin/capitaines/${row.id}`)
  }
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <AdminPage title="Match des capitaines" subtitle="Mini-tournoi mensuel Orange contre Bleue. Hors championnat : il ne compte nulle part dans la ligue (classements, XP, IPG, statistiques, cartons et suspensions).">
      <div className="grid gap-4 lg:grid-cols-2">{CAPTAIN_SIDES.map((s) => <TeamEditor key={s} team={teams[s]} />)}</div>
      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Matchs</CardTitle><Button onClick={create}><Plus />Nouveau match</Button></CardHeader>
        <CardContent>
          {sorted.length ? (
            <ul className="divide-y divide-white/10">
              {sorted.map((m) => { const s = captainScore(m); return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-44 text-sm capitalize text-muted-foreground">{fmtDate(m.date, "EEE d MMM yyyy · HH:mm")}</span>
                  <span className="font-semibold">{teams.orange.name} <span className="num">{m.status === 'finished' ? `${s.orange} - ${s.bleue}` : 'vs'}</span> {teams.bleue.name}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', m.status === 'finished' ? 'bg-win/15 text-win' : m.status === 'cancelled' ? 'bg-white/10 text-muted-foreground' : 'bg-neon/15 text-neon')}>{m.status === 'finished' ? 'Terminé' : m.status === 'cancelled' ? 'Annulé' : 'À venir'}</span>
                  <Button asChild size="sm" variant="outline" className="ml-auto"><Link to={`/admin/capitaines/${m.id}`}>Feuille de match</Link></Button>
                </li>
              ) })}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucun match. Créez le premier avec « Nouveau match ».</p>}
        </CardContent>
      </Card>
    </AdminPage>
  )
}

const fmtLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

function TeamEditor({ team }: { team: CaptainTeam }) {
  const { db } = useData()
  const L = useLookup()
  const { teams } = useCaptains()
  const [v, setV] = useState<CaptainTeam>(team)
  const [q, setQ] = useState('')
  const otherIds = new Set(teams[team.side === 'orange' ? 'bleue' : 'orange'].player_ids)
  const dirty = JSON.stringify(v) !== JSON.stringify(team)
  const candidates = useMemo(() => {
    const n = q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return db.Player.filter((p) => !v.player_ids.includes(p.id) && !otherIds.has(p.id) && p.status !== 'inactive')
      .filter((p) => !n || `${p.first_name} ${p.last_name} ${L.team.get(p.team_id)?.name ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(n))
      .slice(0, 12)
  }, [db.Player, v.player_ids, q, L, otherIds])
  const save = async () => {
    const exists = db.CaptainTeam.some((t) => t.id === v.id)
    if (exists) await base44.entities.CaptainTeam.update(v.id, v); else await base44.entities.CaptainTeam.create(v as never)
    base44.logActivity('update', 'CaptainTeam', { id: v.id, name: v.name } as never, { effectif: v.player_ids.length })
    toast.success(`${v.name} enregistrée`)
  }
  const c = v.color ?? CAPTAIN_COLORS[v.side]
  return (
    <Card style={{ borderTop: `3px solid ${c}` }}>
      <CardHeader className="flex-row items-center gap-3"><CaptainCrest team={v} size={44} /><CardTitle className="flex-1" style={{ color: c }}>Équipe {v.side === 'orange' ? 'Orange' : 'Bleue'}</CardTitle><Button size="sm" onClick={save} disabled={!dirty || !v.name.trim()}><Save />Enregistrer</Button></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5"><Label htmlFor={`cn-${v.side}`}>Nom</Label><Input id={`cn-${v.side}`} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Couleur</Label><input type="color" value={c} onChange={(e) => setV({ ...v, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent" aria-label="Couleur" /></div>
        </div>
        <div className="space-y-1.5"><Label>Logo</Label><ImageInput value={v.logo_url} onChange={(x) => setV({ ...v, logo_url: x || undefined })} /></div>
        <div className="space-y-1.5">
          <Label>Effectif ({v.player_ids.length}) — joueurs inscrits</Label>
          <div className="flex flex-wrap gap-1.5">
            {v.player_ids.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pl-2.5 pr-1 text-xs">
                <button type="button" title="Capitaine" onClick={() => setV({ ...v, captain_id: v.captain_id === id ? undefined : id })} className={cn('cursor-pointer', v.captain_id === id && 'font-bold text-neon')}>{playerName(L.player.get(id))}{v.captain_id === id && ' (C)'}</button>
                <button type="button" aria-label="Retirer" onClick={() => setV({ ...v, player_ids: v.player_ids.filter((x) => x !== id), captain_id: v.captain_id === id ? undefined : v.captain_id })} className="cursor-pointer rounded-full p-0.5 hover:bg-white/15"><X className="size-3" /></button>
              </span>
            ))}
            {!v.player_ids.length && <span className="text-xs text-muted-foreground">Aucun joueur. Recherchez ci-dessous pour en ajouter.</span>}
          </div>
          <div className="relative"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un joueur ou une équipe…" className="pl-8" aria-label={`Ajouter un joueur à l’équipe ${v.side}`} /></div>
          {q && <div className="flex flex-wrap gap-1.5">{candidates.map((p) => <button type="button" key={p.id} onClick={() => setV({ ...v, player_ids: [...v.player_ids, p.id] })} className="cursor-pointer rounded-full bg-white/5 px-2.5 py-1 text-xs hover:bg-neon/20"><Plus className="mr-0.5 inline size-3" />{playerName(p)} <span className="text-muted-foreground">· {L.team.get(p.team_id)?.short_name}</span></button>)}{!candidates.length && <span className="text-xs text-muted-foreground">Aucun joueur trouvé.</span>}</div>}
          <p className="text-[11px] text-muted-foreground">Cliquez sur un nom pour le désigner capitaine. Un joueur ne peut être que dans une des deux équipes.</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
//  Feuille de match (même saisie qu'un match normal)
// ---------------------------------------------------------------------------
type NumKey = 'goals' | 'og' | 'assists' | 'yc' | 'rc' | 'saves'
const COLS: { k: NumKey; l: string; title: string }[] = [{ k: 'goals', l: 'Buts', title: 'Buts' }, { k: 'og', l: 'CSC', title: 'Buts contre son camp' }, { k: 'assists', l: 'Passes', title: 'Passes décisives' }, { k: 'yc', l: 'CJ', title: 'Cartons jaunes' }, { k: 'rc', l: 'CR', title: 'Cartons rouges' }, { k: 'saves', l: 'Arrêts', title: 'Arrêts (gardien)' }]

export function CaptainMatchEditor() {
  const { id } = useParams()
  const { db } = useData()
  const L = useLookup()
  const { teams } = useCaptains()
  const nav = useNavigate()
  const stored = db.CaptainMatch.find((m) => m.id === id)
  const [m, setM] = useState<CaptainMatch | null>(null)
  const cur = m ?? (stored ? withRoster(stored, teams) : null)
  if (!cur) return <AdminPage title="Match introuvable"><Link to="/admin/capitaines" className="text-neon">Retour</Link></AdminPage>
  const set = (p: Partial<CaptainMatch>) => setM({ ...cur, ...p })
  const setLine = (side: CaptainSide, pid: string, p: Partial<CaptainLine>) => set({ lines: cur.lines.map((l) => (l.side === side && l.player_id === pid ? { ...l, ...p, played: p.played ?? (l.played || Object.values(p).some((x) => typeof x === 'number' && x > 0) || !!p.gk) } : p.gk && l.side === side ? { ...l, gk: false } : l)) })
  const score = captainScore(cur)
  const warnings = sheetWarnings(cur)
  const persist = async (status?: CaptainMatch['status']) => {
    const row = { ...cur, status: status ?? cur.status, lines: cur.lines.filter((l) => l.played || l.goals || l.og || l.assists || l.yc || l.rc || l.saves || l.gk) }
    if (row.orange_pens == null || row.bleue_pens == null || score.orange !== score.bleue) { row.orange_pens = null; row.bleue_pens = null }
    await base44.entities.CaptainMatch.update(row.id, row)
    base44.logActivity(status === 'finished' ? 'finish' : 'update', 'CaptainMatch', { id: row.id, name: `${teams.orange.name} ${score.orange}-${score.bleue} ${teams.bleue.name}` } as never, { statut: row.status })
    setM(null)
    toast.success(status === 'finished' ? `Match terminé : ${score.orange} - ${score.bleue}` : 'Feuille enregistrée')
  }
  const remove = async () => {
    if (!window.confirm('Supprimer ce match des capitaines ?')) return
    await base44.entities.CaptainMatch.delete(cur.id)
    base44.logActivity('delete', 'CaptainMatch', { id: cur.id, name: 'Match des capitaines' } as never, {})
    nav('/admin/capitaines')
  }
  const played = cur.lines.filter((l) => l.played)
  return (
    <AdminPage title="Feuille — Match des capitaines" subtitle="Saisie identique à un match normal (6 contre 6). Le score se calcule à partir des buts et des CSC.">
      <Link to="/admin/capitaines" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-neon"><ArrowLeft className="size-4" />Tous les matchs</Link>
      <Card><CardContent className="space-y-4 pt-5">
        <CaptainScoreLine m={{ ...cur, status: 'finished' }} teams={teams} big />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="cm-date">Date et heure</Label><Input id="cm-date" type="datetime-local" value={cur.date.slice(0, 16)} onChange={(e) => set({ date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="cm-pitch">Terrain</Label><Input id="cm-pitch" value={cur.pitch ?? ''} onChange={(e) => set({ pitch: e.target.value || undefined })} placeholder="Terrain 1" /></div>
          <div className="space-y-1.5"><Label>Statut</Label><FilterSelect className="sm:w-full" value={cur.status} onChange={(x) => set({ status: (x || 'scheduled') as CaptainMatch['status'] })} allLabel="À venir" options={[{ value: 'scheduled', label: 'À venir' }, { value: 'finished', label: 'Terminé' }, { value: 'cancelled', label: 'Annulé' }]} /></div>
        </div>
      </CardContent></Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {CAPTAIN_SIDES.map((side) => {
          const lines = cur.lines.filter((l) => l.side === side)
          const c = teams[side].color ?? CAPTAIN_COLORS[side]
          return (
            <Card key={side} style={{ borderTop: `3px solid ${c}` }}>
              <CardHeader className="flex-row items-center gap-2"><CaptainCrest team={teams[side]} size={32} /><CardTitle style={{ color: c }}>{teams[side].name}</CardTitle><span className="num ml-auto text-3xl font-black">{score[side]}</span></CardHeader>
              <CardContent className="overflow-x-auto">
                {lines.length ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Joueur</TableHead><TableHead className="text-center" title="A joué">Joué</TableHead><TableHead className="text-center" title="Gardien">GB</TableHead>{COLS.map((col) => <TableHead key={col.k} className="text-center" title={col.title}>{col.l}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {lines.map((l) => (
                        <TableRow key={l.player_id} className={cn(!l.played && 'opacity-60')}>
                          <TableCell className="max-w-[9rem] truncate font-medium">{playerName(L.player.get(l.player_id))}</TableCell>
                          <TableCell className="text-center"><input type="checkbox" checked={l.played} onChange={(e) => setLine(side, l.player_id, { played: e.target.checked })} aria-label={`${playerName(L.player.get(l.player_id))} a joué`} className="size-4 cursor-pointer accent-[#F05A22]" /></TableCell>
                          <TableCell className="text-center"><input type="radio" name={`gk-${side}`} checked={!!l.gk} onChange={() => setLine(side, l.player_id, { gk: true })} aria-label="Gardien" className="size-4 cursor-pointer accent-[#F05A22]" /></TableCell>
                          {COLS.map((col) => (
                            <TableCell key={col.k} className="px-1 text-center">
                              <Input type="number" min={0} inputMode="numeric" value={l[col.k] || ''} placeholder="0" aria-label={`${col.title} — ${playerName(L.player.get(l.player_id))}`}
                                onChange={(e) => setLine(side, l.player_id, { [col.k]: Math.max(0, Math.floor(+e.target.value || 0)) })} className="h-8 w-12 px-1 text-center" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">Effectif vide : ajoutez des joueurs à l’équipe sur la page Match des capitaines.</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-4"><CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Homme du match</Label><FilterSelect className="sm:w-full" value={cur.motm_player_id ?? ''} onChange={(x) => set({ motm_player_id: x || undefined })} allLabel="— Aucun —" options={played.map((l) => ({ value: l.player_id, label: `${playerName(L.player.get(l.player_id))} · ${teams[l.side].name}` }))} /></div>
        <div className="space-y-1.5"><Label>Tirs au but (si égalité)</Label>
          <div className="flex items-center gap-2"><Input type="number" min={0} disabled={score.orange !== score.bleue} value={cur.orange_pens ?? ''} onChange={(e) => set({ orange_pens: e.target.value === '' ? null : +e.target.value })} className="w-20 text-center" aria-label={`Tirs au but ${teams.orange.name}`} /><span>-</span><Input type="number" min={0} disabled={score.orange !== score.bleue} value={cur.bleue_pens ?? ''} onChange={(e) => set({ bleue_pens: e.target.value === '' ? null : +e.target.value })} className="w-20 text-center" aria-label={`Tirs au but ${teams.bleue.name}`} /></div>
        </div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cm-notes">Notes</Label><Input id="cm-notes" value={cur.notes ?? ''} onChange={(e) => set({ notes: e.target.value || undefined })} /></div>
        {warnings.length > 0 && <ul className="space-y-1 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200 sm:col-span-2">{warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button onClick={() => persist()}><Save />Enregistrer</Button>
          {cur.status !== 'finished' && <Button variant="contrast" onClick={() => persist('finished')}><Flag />Terminer le match</Button>}
          <Button variant="ghost" className="ml-auto text-red-300" onClick={remove}><Trash2 />Supprimer</Button>
        </div>
      </CardContent></Card>
    </AdminPage>
  )
}

/** Ajoute à la feuille les joueurs de l'effectif qui n'y figurent pas encore. */
function withRoster(m: CaptainMatch, teams: Record<CaptainSide, CaptainTeam>): CaptainMatch {
  const lines = [...m.lines]
  for (const side of CAPTAIN_SIDES) for (const pid of teams[side].player_ids) if (!lines.some((l) => l.player_id === pid)) lines.push(emptyLine(side, pid))
  return { ...m, lines }
}
