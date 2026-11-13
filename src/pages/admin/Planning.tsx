// Admin — PLANNING : grille par jour (une ligne par créneau, une colonne par terrain), matchs déplaçables par
// glisser-déposer. Contrôles : terrain déjà pris → refusé, 2 matchs max par créneau, alerte si une équipe joue deux fois
// le même jour. Modifier un match déjà publié est journalisé ; le site et le mode TV se mettent à jour aussitôt.
// Sur mobile (pas de glisser-déposer), un clic sur un match ouvre la fenêtre de modification.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Undo2 } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useReschedule } from '@/hooks/useReschedule'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TeamLogo } from '@/components/league/Identity'
import { DEFAULT_SLOTS, PITCHES } from '@/config/pitches'
import { TBD, checkPlacement, fmtDay, fmtWhen, wallDay, wallTime, wallToISO } from '@/lib/matchTime'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/entities'

const todayWall = () => wallDay(new Date().toISOString())
const sel = 'h-9 w-full rounded-lg border border-input bg-night-950/40 px-2 text-sm'

export default function Planning() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const reschedule = useReschedule()
  const name = (id: string) => L.team.get(id)?.name ?? id
  const ms = useMemo(() => db.Match.filter((m) => m.season_id === seasonId && m.status !== 'cancelled'), [db.Match, seasonId])
  const days = useMemo(() => [...new Set(ms.map((m) => wallDay(m.date)).filter(Boolean))].sort(), [ms])
  const [day, setDay] = useState(() => days.find((d) => d >= todayWall()) ?? days.at(-1) ?? todayWall())
  const [extra, setExtra] = useState<string[]>([])
  const [newSlot, setNewSlot] = useState('')
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [edit, setEdit] = useState<Match | null>(null)
  const ofDay = ms.filter((m) => m.date && wallDay(m.date) === day)
  const slots = [...new Set([...DEFAULT_SLOTS, ...extra, ...ofDay.map((m) => wallTime(m.date))])].sort()
  const tbd = ms.filter((m) => !m.date || !m.pitch).sort((a, b) => (a.number ?? '').localeCompare(b.number ?? '', 'fr', { numeric: true }))
  const at = (slot: string, pitch: string) => ofDay.find((m) => wallTime(m.date) === slot && m.pitch === pitch)
  const noPitch = ofDay.filter((m) => !m.pitch)
  const movable = (m: Match) => m.status === 'scheduled' || m.status === 'postponed'

  const drop = async (slot: string | null, pitch: string | null) => {
    const m = ms.find((x) => x.id === drag)
    setDrag(null); setOver(null)
    if (!m) return
    if (!slot || !pitch) { if (m.published === false) await reschedule(m, {}); return } // retour dans « Horaire à définir »
    await reschedule(m, { date: wallToISO(day, slot), pitch })
  }

  const card = (m: Match) => <PlanCard key={m.id} m={m} name={name} dragging={drag === m.id} movable={movable(m)} onStart={() => setDrag(m.id)} onEnd={() => { setDrag(null); setOver(null) }} onOpen={() => setEdit(m)} />
  const dropZone = (id: string, slot: string | null, pitch: string | null) => ({
    onDragOver: (e: React.DragEvent) => { if (drag) { e.preventDefault(); setOver(id) } },
    onDragLeave: () => setOver((o) => (o === id ? null : o)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); drop(slot, pitch) },
  })
  // aperçu du contrôle pendant le glisser-déposer
  const preview = (slot: string, pitch: string) => {
    const m = ms.find((x) => x.id === drag)
    if (!m) return null
    return checkPlacement({ ...m, date: wallToISO(day, slot), pitch }, ms.filter((x) => x.id !== m.id), name)
  }

  return (
    <AdminPage title="Planning" subtitle="Glissez un match sur un créneau et un terrain. Un clic sur un match permet aussi de le modifier (pratique sur mobile).">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Jour">
            {days.map((d) => <button key={d} role="tab" aria-selected={d === day} onClick={() => setDay(d)} className={cn('cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-semibold', d === day ? 'border-neon bg-neon text-white' : 'border-white/15 text-muted-foreground hover:text-white')}>{fmtDay(`${d}T12:00:00Z`)}</button>)}
          </div>
          <div className="ml-auto flex items-end gap-2">
            <div><Label htmlFor="pl-day" className="text-xs">Autre jour</Label><Input id="pl-day" type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} className="h-9 w-40" /></div>
            <div><Label htmlFor="pl-slot" className="text-xs">Ajouter un créneau</Label><div className="flex gap-1"><Input id="pl-slot" type="time" step={900} value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="h-9 w-28" /><Button size="sm" variant="secondary" disabled={!newSlot} onClick={() => { setExtra((x) => [...new Set([...x, newSlot])]); setNewSlot('') }}><Plus />Ajouter</Button></div></div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card><CardContent className="overflow-x-auto pt-4">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-black uppercase"><CalendarDays className="size-5 text-neon" />{fmtDay(`${day}T12:00:00Z`)}</h2>
            <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-2 text-sm">
              <thead><tr><th className="w-20 text-left text-xs uppercase text-muted-foreground">Créneau</th>{PITCHES.map((p) => <th key={p} className="text-left text-xs uppercase text-muted-foreground">{p}</th>)}</tr></thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot}>
                    <th scope="row" className="num align-top pt-3 text-left text-lg font-black">{slot.replace(':', 'h')}</th>
                    {PITCHES.map((p) => {
                      const id = `${slot}|${p}`, m = at(slot, p), pv = over === id ? preview(slot, p) : null
                      return (
                        <td key={p} {...dropZone(id, slot, p)} className={cn('h-28 rounded-xl border border-dashed align-top p-1.5 transition', over === id ? (pv?.errors.length ? 'border-red-400 bg-red-500/10' : pv?.warnings.length ? 'border-amber-300 bg-amber-300/10' : 'border-neon bg-neon/10') : 'border-white/10')}>
                          {m ? card(m) : <span className="block pt-8 text-center text-xs text-muted-foreground/60">Libre</span>}
                          {pv && (pv.errors[0] || pv.warnings[0]) && <p className={cn('mt-1 text-[11px]', pv.errors.length ? 'text-red-300' : 'text-amber-200')}>{pv.errors[0] ?? pv.warnings[0]}</p>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {noPitch.length > 0 && <p className="mt-2 text-sm text-amber-200">Sans terrain ce jour : {noPitch.map((m) => m.number ?? `${name(m.home_team_id)}–${name(m.away_team_id)}`).join(', ')}</p>}
          </CardContent></Card>

          <Card {...dropZone('tbd', null, null)} className={cn(over === 'tbd' && 'border-neon')}><CardContent className="space-y-2 pt-4">
            <h2 className="font-display text-lg font-black uppercase">{TBD} <span className="text-muted-foreground">({tbd.length})</span></h2>
            <p className="text-xs text-muted-foreground">Glissez ces matchs dans la grille. Un match non publié peut revenir ici. <Link to="/admin/pre-saison" className="text-neon">Publier une journée</Link> quand tous ses matchs sont placés.</p>
            {tbd.length ? tbd.map(card) : <p className="py-4 text-center text-sm text-muted-foreground">Tous les matchs ont un horaire.</p>}
          </CardContent></Card>
        </div>
      </div>
      {edit && <EditDialog m={edit} onClose={() => setEdit(null)} />}
    </AdminPage>
  )
}

/** Carte de match du planning (composant stable : il ne doit pas être recréé pendant un glisser-déposer). */
function PlanCard({ m, name, dragging, movable, onStart, onEnd, onOpen }: { m: Match; name: (id: string) => string; dragging: boolean; movable: boolean; onStart: () => void; onEnd: () => void; onOpen: () => void }) {
  const L = useLookup()
  const comp = L.competition.get(m.competition_id)
  return (
    <button
      type="button" draggable={movable} onDragStart={(e) => { e.dataTransfer.setData('text/plain', m.id); e.dataTransfer.effectAllowed = 'move'; onStart() }} onDragEnd={onEnd}
      onClick={onOpen} aria-label={`${m.number ?? ''} ${name(m.home_team_id)} contre ${name(m.away_team_id)} — modifier l’horaire`}
      className={cn('w-full cursor-grab rounded-xl border bg-night-900/80 p-2 text-left text-sm shadow-sm transition hover:border-neon/60 active:cursor-grabbing', m.published === false ? 'border-dashed border-amber-300/50' : 'border-white/15', dragging && 'opacity-40', !movable && 'cursor-not-allowed opacity-70')}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><b className="num text-foreground">{m.number ?? '—'}</b>{comp?.name} · {m.round && m.round > 4 && comp?.format === 'swiss' ? 'Rattrapage' : `J${m.round}`}{m.published === false && <Badge variant="warning" className="ml-auto px-1.5 py-0 text-[10px]">Non publié</Badge>}</div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 font-semibold"><TeamLogo team={L.team.get(m.home_team_id)} size={18} /><span className="truncate">{name(m.home_team_id)}</span></div>
      <div className="flex min-w-0 items-center gap-1.5 font-semibold"><TeamLogo team={L.team.get(m.away_team_id)} size={18} /><span className="truncate">{name(m.away_team_id)}</span></div>
    </button>
  )
}

function EditDialog({ m, onClose }: { m: Match; onClose: () => void }) {
  const L = useLookup()
  const { db } = useData()
  const reschedule = useReschedule()
  const [day, setDay] = useState(wallDay(m.date))
  const [time, setTime] = useState(wallTime(m.date) || DEFAULT_SLOTS[0])
  const [pitch, setPitch] = useState(m.pitch ?? '')
  const name = (id: string) => L.team.get(id)?.name ?? id
  const cand = { ...m, date: day && time ? wallToISO(day, time) : undefined, pitch: pitch || undefined }
  const chk = checkPlacement(cand, db.Match.filter((x) => x.id !== m.id), name)
  const times = [...new Set([...DEFAULT_SLOTS, time])].filter(Boolean).sort()
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{m.number ? `${m.number} · ` : ''}{name(m.home_team_id)} – {name(m.away_team_id)}</DialogTitle>
          <DialogDescription>Actuellement : {fmtWhen(m)}{m.published !== false ? ' · publié (la modification sera journalisée et visible aussitôt sur le site)' : ' · non publié'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label htmlFor="ed-day">Date</Label><Input id="ed-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="mt-1" /></div>
          <div><Label htmlFor="ed-time">Heure</Label><Input id="ed-time" type="time" step={900} list="ed-times" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" /><datalist id="ed-times">{times.map((t) => <option key={t} value={t} />)}</datalist></div>
          <div><Label htmlFor="ed-pitch">Terrain</Label><select id="ed-pitch" className={cn(sel, 'mt-1')} value={pitch} onChange={(e) => setPitch(e.target.value)}><option value="">—</option>{PITCHES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
        </div>
        {chk.errors.map((e) => <p key={e} className="text-sm text-red-300">⚠ {e}</p>)}
        {chk.warnings.map((w) => <p key={w} className="text-sm text-amber-200">ⓘ {w}</p>)}
        <DialogFooter className="gap-2">
          {m.published === false && (m.date || m.pitch) && <Button variant="ghost" onClick={async () => { if (await reschedule(m, {})) onClose() }}><Undo2 />{TBD}</Button>}
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button disabled={!!chk.errors.length || !day || !time || !pitch} onClick={async () => { if (await reschedule(m, { date: cand.date, pitch: cand.pitch })) onClose() }}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
