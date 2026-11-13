import { PITCHES } from '@/config/pitches'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, FileText, Plus, Radio, Trash2, Wand2, Network, Eye, EyeOff, Pencil, ListChecks } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { AdminPage } from '@/components/admin/AdminLayout'
import { EntityForm, type Field } from '@/components/admin/EntityCrud'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { STATUS_LABEL, fmtDate } from '@/lib/format'
import { fmtScore } from '@/lib/matchEngine'
import { buildBracket, STAGE_LABELS, sourceLabel, addDays } from '@/lib/schedule'
import { competitionStandings, isKnockout } from '@/lib/stats'
import type { Competition, Match, MatchStatus } from '@/types/entities'

const STATUS_V: Record<MatchStatus, 'outline' | 'live' | 'secondary' | 'warning' | 'destructive'> = { scheduled: 'outline', live: 'live', finished: 'secondary', postponed: 'warning', cancelled: 'destructive' }

export default function MatchesAdmin() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId, competitionId } = useAdminScope()
  const [round, setRound] = useState('')
  const [status, setStatus] = useState('')
  const [team, setTeam] = useState('')
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [bracketFor, setBracketFor] = useState<Competition | null>(null)
  const comps = db.Competition.filter((c) => c.season_id === seasonId)
  const rows = useMemo(() => db.Match.filter((m) => m.season_id === seasonId && (!competitionId || m.competition_id === competitionId) && (!round || String(m.round) === round) && (!status || m.status === status) && (!team || m.home_team_id === team || m.away_team_id === team))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')), [db.Match, seasonId, competitionId, round, status, team])
  const rounds = [...new Set(db.Match.filter((m) => m.season_id === seasonId).map((m) => m.round!))].sort((a, b) => a - b)
  const lp = comps.find((c) => c.phase === 'league_phase')
  const lpDone = lp && db.Match.filter((m) => m.competition_id === lp.id).every((m) => m.status === 'finished' || m.status === 'cancelled') && db.Match.some((m) => m.competition_id === lp.id)
  const hasCups = comps.some((c) => c.phase === 'gold')

  const fields: Field[] = [
    { key: 'competition_id', label: 'Compétition', type: 'select', required: true, options: comps.map((c) => ({ value: c.id, label: c.name })) },
    { key: 'round', label: 'Journée', type: 'number', required: true },
    { key: 'stage', label: 'Phase', type: 'select', options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'status', label: 'Statut', type: 'select', options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'home_team_id', label: 'Équipe domicile', type: 'select', required: true, options: db.Team.map((t) => ({ value: t.id, label: t.name })) },
    { key: 'away_team_id', label: 'Équipe extérieur', type: 'select', required: true, options: db.Team.map((t) => ({ value: t.id, label: t.name })) },
    { key: 'number', label: 'N° de match (PS-…)' }, { key: 'date', label: 'Date & heure (heure du Maroc)', type: 'datetime' }, { key: 'pitch', label: 'Terrain', type: 'select', options: PITCHES.map((p) => ({ value: p, label: p })) },
    { key: 'referee', label: 'Arbitre' }, { key: 'half_duration_min', label: 'Durée mi-temps (min)', type: 'number' },
    { key: 'operator_user_id', label: 'Opérateur de saisie', type: 'select', options: db.AdminUser.filter((u) => u.status !== 'disabled').map((u) => ({ value: u.id, label: `${u.full_name ?? u.email}` })) },
    { key: 'forfeit_team_id', label: 'Forfait — tapis vert (équipe forfait)', type: 'select', options: [edit?.home_team_id, edit?.away_team_id].filter(Boolean).map((t) => ({ value: t as string, label: db.Team.find((x) => x.id === t)?.name ?? '' })) },
    { key: 'published', label: 'Publié', type: 'boolean' },
  ]
  const save = async () => {
    if (!edit) return
    if (!edit.home_team_id || !edit.away_team_id || edit.home_team_id === edit.away_team_id) { toast.error('Choisissez deux équipes différentes'); return }
    const { id, created_date: _c, updated_date: _u, ...rest } = edit
    void _c; void _u
    const data = { ...rest, season_id: seasonId, date: rest.date ? new Date(rest.date as string).toISOString() : undefined } as Partial<Match>
    // forfait (Art. 14.1) : défaite 3-0 sur tapis vert, match terminé ; buts attribués à aucun joueur
    if (data.forfeit_team_id !== data.home_team_id && data.forfeit_team_id !== data.away_team_id) data.forfeit_team_id = undefined
    if (data.forfeit_team_id) {
      const homeLost = data.forfeit_team_id === data.home_team_id
      Object.assign(data, { status: 'finished', home_score: homeLost ? 0 : 3, away_score: homeLost ? 3 : 0, validated: true, validated_at: data.validated_at ?? new Date().toISOString() })
    }
    if (id) await base44.entities.Match.update(id as string, data); else await base44.entities.Match.create(data as Match)
    toast.success('Match enregistré'); setEdit(null)
  }

  return (
    <AdminPage title="Matchs" subtitle={`${rows.length} match(s)`}
      actions={<>
        {lpDone && !hasCups && <Button asChild variant="gold"><Link to="/admin/tirage"><Wand2 />Constituer les divisions</Link></Button>}
        <Button variant="outline" onClick={() => setBracketFor(comps.find((c) => c.id === competitionId) ?? comps.find((c) => c.phase === 'gold') ?? comps[0])}><Network />Automatiser le tableau</Button>
        <Button onClick={() => setEdit({ competition_id: competitionId || comps[0]?.id, status: 'scheduled', stage: 'cup', published: true, half_duration_min: 15, round: rounds.at(-1) ?? 1 })}><Plus />Créer match</Button>
      </>}>
      <div className="glass mb-3 flex flex-wrap gap-2 rounded-2xl p-3">
        <FilterSelect value={round} onChange={setRound} allLabel="Toutes journées" options={rounds.map((r) => ({ value: String(r), label: `Journée ${r}` }))} />
        <FilterSelect value={status} onChange={setStatus} allLabel="Tous statuts" options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect value={team} onChange={setTeam} allLabel="Toutes équipes" options={db.Team.map((t) => ({ value: t.id, label: t.name }))} />
      </div>
      <div className="glass rounded-2xl p-1 sm:p-2">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Rencontre</TableHead><TableHead className="text-center">Score</TableHead><TableHead className="hidden md:table-cell">Phase</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((m) => {
              const c = L.competition.get(m.competition_id)
              const groupName = (id: string) => L.group.get(id)?.name ?? L.competition.get(id)?.name ?? id
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-xs"><div>{fmtDate(m.date, 'EEE d MMM')}</div><div className="text-muted-foreground">{fmtDate(m.date, 'HH:mm')} · {m.pitch}</div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm"><TeamLogo team={L.team.get(m.home_team_id)} size={18} /><span className="font-semibold">{L.team.get(m.home_team_id)?.short_name ?? sourceLabel(m.home_source, groupName)}</span><span className="text-muted-foreground">vs</span><span className="font-semibold">{L.team.get(m.away_team_id)?.short_name ?? sourceLabel(m.away_source, groupName)}</span><TeamLogo team={L.team.get(m.away_team_id)} size={18} /></div>
                  </TableCell>
                  <TableCell className="num text-center text-base">{m.status === 'finished' || m.status === 'live' ? fmtScore(m) : '—'}</TableCell>
                  <TableCell className="hidden text-xs md:table-cell">{c?.name} · {isKnockout(m) ? STAGE_LABELS[m.stage!] : `J${m.round}`}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1"><Badge variant={STATUS_V[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                      <button onClick={() => base44.entities.Match.update(m.id, { published: m.published === false })} title={m.published === false ? 'Brouillon — publier' : 'Publié — dépublier'} className="text-muted-foreground hover:text-white">{m.published === false ? <EyeOff className="size-4" /> : <Eye className="size-4 text-win" />}</button></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2" title="Saisie rapide"><Link to={`/admin/matchs/${m.id}/saisie`}><ListChecks />Saisie</Link></Button>
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2" title="Match Center"><Link to={`/admin/match-center/${m.id}`}><Radio />Live</Link></Button>
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2" title="Feuille de match"><Link to={`/admin/matchs/${m.id}/feuille`}><ClipboardList />Feuille</Link></Button>
                      <Button asChild size="icon" variant="ghost" className="size-8" title="PDF"><Link to={`/admin/matchs/${m.id}/feuille?print=1`}><FileText /></Link></Button>
                      <Button size="icon" variant="ghost" className="size-8" title="Modifier" onClick={() => setEdit({ ...m, date: m.date ? toLocalInput(m.date) : '' })}><Pencil /></Button>
                      {confirmDel === m.id
                        ? <Button size="sm" variant="destructive" className="h-8" onClick={async () => { for (const e of db.MatchEvent.filter((x) => x.match_id === m.id)) await base44.entities.MatchEvent.delete(e.id); await base44.entities.Match.delete(m.id); setConfirmDel(null); toast.success('Match supprimé') }}>Confirmer</Button>
                        : <Button size="icon" variant="ghost" className="size-8 text-red-400" title="Supprimer" onClick={() => setConfirmDel(m.id)}><Trash2 /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {!rows.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Aucun match</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{edit?.id ? 'Modifier le match' : 'Créer un match'}</DialogTitle></DialogHeader>
          {edit && <EntityForm fields={fields} value={edit} onChange={setEdit} />}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {bracketFor && <BracketDialog comp={bracketFor} onClose={() => setBracketFor(null)} />}
    </AdminPage>
  )
}

function toLocalInput(iso: string) { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

/** « Automatiser le tableau » : génère quarts/demies → petite finale → finale à partir du classement de la compétition. */
function BracketDialog({ comp, onClose }: { comp: Competition; onClose: () => void }) {
  const { db, league } = useData()
  const L = useLookup()
  const [cid, setCid] = useState(comp.id)
  const [q, setQ] = useState('4')
  const [third, setThird] = useState(true)
  const c = db.Competition.find((x) => x.id === cid)!
  const table = competitionStandings(league, cid)
  const draft = buildBracket({ leagueRef: cid, qualifiers: +q, thirdPlace: third })
  const exists = db.Match.some((m) => m.competition_id === cid && isKnockout(m))
  const lastDate = db.Match.filter((m) => m.competition_id === cid).map((m) => m.date ?? '').sort().at(-1)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const lastRound = Math.max(0, ...db.Match.filter((m) => m.competition_id === cid).map((m) => m.round ?? 0))
  const create = async () => {
    const stages = [...new Set(draft.map((d) => d.stage))]
    await base44.entities.Match.bulkCreate(draft.map((d) => {
      const si = stages.indexOf(d.stage === 'third_place' ? 'final' : d.stage)
      const team = (src: typeof d.home_source) => (src.type === 'rank' ? table[(src.rank ?? 1) - 1]?.team_id ?? '' : '')
      return { season_id: c.season_id, competition_id: cid, round: lastRound + 1 + si, stage: d.stage, bracket_slot: d.bracket_slot, home_source: d.home_source, away_source: d.away_source, home_team_id: team(d.home_source), away_team_id: team(d.away_source), date: new Date(`${addDays(lastDate, 7 * (si + 1))}T${d.stage === 'final' ? '21:00' : d.stage === 'third_place' ? '19:30' : '18:00'}:00`).toISOString(), pitch: c.default_pitch ?? 'Terrain 1', status: 'scheduled' as const, published: true, half_duration_min: c.half_duration_min ?? 15 }
    }))
    toast.success(`${draft.length} matchs de phase finale créés — les vainqueurs se qualifient automatiquement`)
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Automatiser le tableau</DialogTitle><DialogDescription>Génère la phase finale depuis le classement ; les tours suivants se remplissent à la clôture de chaque match (tirs au but compris).</DialogDescription></DialogHeader>
        <div className="flex flex-wrap gap-2">
          <FilterSelect value={cid} onChange={(v) => v && setCid(v)} allLabel={null} options={db.Competition.filter((x) => x.season_id === comp.season_id && x.phase !== 'knockout').map((x) => ({ value: x.id, label: x.name }))} />
          <FilterSelect value={q} onChange={(v) => v && setQ(v)} allLabel={null} options={[{ value: '2', label: 'Finale directe (top 2)' }, { value: '4', label: 'Demi-finales (top 4)' }, { value: '8', label: 'Quarts (top 8)' }]} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={third} onChange={(e) => setThird(e.target.checked)} />Petite finale</label>
        </div>
        <div className="space-y-1 rounded-xl bg-white/5 p-3 text-sm">
          {draft.map((d) => {
            const name = (src: typeof d.home_source) => src.type === 'rank' ? `${src.rank}. ${L.team.get(table[(src.rank ?? 1) - 1]?.team_id ?? '')?.name ?? '?'}` : sourceLabel(src, (id) => id)
            return <div key={d.bracket_slot} className="flex justify-between gap-2"><Badge variant="secondary">{STAGE_LABELS[d.stage]}</Badge><span className="flex-1 truncate text-right">{name(d.home_source)} – {name(d.away_source)}</span></div>
          })}
        </div>
        {exists && <p className="text-xs text-amber-300">Une phase finale existe déjà pour cette compétition.</p>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={create} disabled={exists}>Générer le tableau</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
