// Admin pré-saison : journées dont les matchs sont créés mais pas encore publiés (« Horaire à définir »).
// L'admin fixe date, heure et terrain (2 terrains fixes) ; « Publier la journée » n'est possible que quand tout est complet.
import { Link } from 'react-router-dom'
import { CalendarClock, Send, Sparkles } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useLookup } from '@/hooks/useData'
import { useReschedule } from '@/hooks/useReschedule'
import type { PreseasonView } from '@/hooks/usePreseason'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { TeamLogo } from '@/components/league/Identity'
import { DEFAULT_SLOTS, PITCHES } from '@/config/pitches'
import { TBD, checkRound, fmtWhen, wallDay, wallTime, wallToISO } from '@/lib/matchTime'
import { OFFICIAL_J1_LABEL } from '@/api/seed/preseasonJ1'
import type { Match } from '@/types/entities'

const sel = 'h-9 rounded-lg border border-input bg-night-950/40 px-2 text-sm'

export function RoundScheduleCard({ v }: { v: PreseasonView }) {
  const L = useLookup()
  const reschedule = useReschedule()
  const name = (id: string) => L.team.get(id)?.name ?? id
  const rounds = [...new Set(v.matches.map((m) => m.round ?? 0))].filter(Boolean).sort((a, b) => a - b)
  const open = rounds.filter((r) => v.matches.some((m) => m.round === r && m.published === false))
  const manualJ1 = v.ps.draw_source === 'manual'
  if (!open.length && !manualJ1) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2"><CalendarClock className="size-5 text-neon" />Horaires et terrains</CardTitle>
        <CardDescription>Deux terrains ({PITCHES.join(' et ')}), deux matchs au plus par créneau. Le <Link to="/admin/planning" className="text-neon underline-offset-2 hover:underline">Planning</Link> permet aussi de déplacer les matchs par glisser-déposer, y compris ceux déjà publiés.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {manualJ1 && <p className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-neon" />Journée 1 : <b>{OFFICIAL_J1_LABEL}</b> · au repos : <b>{name(v.rests[1] ?? '')}</b></p>}
        {open.map((r) => {
          const ms = v.matches.filter((m) => m.round === r).sort((a, b) => (a.number ?? '').localeCompare(b.number ?? '', 'fr', { numeric: true }))
          const chk = checkRound(ms, v.matches.concat(), name)
          const publish = async () => {
            if (chk.errors.length) return
            for (const m of ms) await base44.entities.Match.update(m.id, { published: true })
            await base44.entities.Competition.update(v.comp.id, { preseason: { ...(v.comp.preseason ?? {}), published_rounds: [...new Set([...(v.ps.published_rounds ?? []), r])] } })
            base44.logActivity('preseason_publish', 'Competition', { id: v.comp.id, name: v.comp.name } as never, { journee: v.shortLabel(r), matchs: ms.map((m) => `${m.number} ${fmtWhen(m)}`).join(' · ') })
            toast.success(`${v.roundLabel(r)} publiée sur le site`)
          }
          return (
            <section key={r} aria-label={v.roundLabel(r)} className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-2 font-display text-lg font-black uppercase">{v.roundLabel(r)}<Badge variant="warning">Non publiée</Badge>{v.rests[r] && r <= v.cfg.rounds && <span className="text-sm font-normal normal-case text-muted-foreground">Au repos : {name(v.rests[r]!)}</span>}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">N°</th><th>Match</th><th>Date</th><th>Heure</th><th>Terrain</th><th>Statut</th></tr></thead>
                  <tbody>{ms.map((m) => <Row key={m.id} m={m} />)}</tbody>
                </table>
              </div>
              {chk.errors.map((e) => <p key={e} className="text-sm text-red-300">⚠ {e}</p>)}
              {chk.warnings.map((w) => <p key={w} className="text-sm text-amber-200">ⓘ {w}</p>)}
              <Button onClick={publish} disabled={!!chk.errors.length}><Send />Publier {r > v.cfg.rounds ? 'le rattrapage' : 'la journée'}</Button>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )

  function Row({ m }: { m: Match }) {
    const day = wallDay(m.date), time = wallTime(m.date)
    const set = (d: string, t: string, p?: string) => reschedule(m, { date: d && t ? wallToISO(d, t) : undefined, pitch: p || undefined })
    return (
      <tr className="border-t border-white/5">
        <td className="num py-1.5 font-bold">{m.number ?? '—'}</td>
        <td><span className="flex items-center gap-1.5"><TeamLogo team={L.team.get(m.home_team_id)} size={20} />{name(m.home_team_id)}<span className="text-muted-foreground">–</span>{name(m.away_team_id)}<TeamLogo team={L.team.get(m.away_team_id)} size={20} /></span></td>
        <td><Input aria-label={`Date ${m.number}`} type="date" value={day} onChange={(e) => set(e.target.value, time || DEFAULT_SLOTS[0], m.pitch)} className="h-9 w-40" /></td>
        <td><select aria-label={`Heure ${m.number}`} className={sel} value={time} disabled={!day} onChange={(e) => set(day, e.target.value, m.pitch)}>
          {!time && <option value="">—</option>}
          {[...new Set([...DEFAULT_SLOTS, ...(time ? [time] : [])])].sort().map((t) => <option key={t} value={t}>{t.replace(':', 'h')}</option>)}
        </select></td>
        <td><select aria-label={`Terrain ${m.number}`} className={sel} value={m.pitch ?? ''} onChange={(e) => set(day, time, e.target.value)}>
          <option value="">—</option>{PITCHES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select></td>
        <td className="text-xs">{m.date && m.pitch ? <span className="text-win">{fmtWhen(m)}</span> : <span className="text-amber-200">{TBD}</span>}</td>
      </tr>
    )
  }
}
