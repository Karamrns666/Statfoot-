// Admin — équipe type : sélection automatique, ajustable joueur par joueur, puis enregistrée pour la journée.
import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Save, Wand2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { seasonLogs, useTeamOfWeek } from '@/hooks/useStats'
import { AdminPage } from '@/components/admin/AdminLayout'
import { FilterSelect } from '@/components/league/FilterSelect'
import { CompetitionTabs } from '@/components/league/CompetitionTabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { TeamOfWeekPitch, fmtRating } from '@/components/teamweek/TeamOfWeekPitch'
import { FORMATIONS, formationFor, formationXY, periodMatches, seasonRounds } from '@/lib/rewards'
import { POSITION_LABEL, playerName } from '@/lib/format'
import type { Position } from '@/types/entities'

export default function TeamOfWeekAdmin() {
  const { db, league, settings } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const { seasonId } = useAdminScope()
  const comps = db.Competition.filter((c) => c.season_id === seasonId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const [comp, setComp] = useState('')
  const rounds = useMemo(() => seasonRounds(league, seasonId, comp || null), [league, seasonId, comp])
  const [round, setRound] = useState<number | undefined>()
  const r = round && rounds.includes(round) ? round : rounds.at(-1)
  const current = useTeamOfWeek(seasonId, r, comp || null)
  const saved = db.TeamOfWeek.find((t) => t.season_id === seasonId && t.round === r && (t.competition_id ?? '') === comp)
  const [formation, setFormation] = useState(formationFor(settings.starters_count ?? 6).label)
  const [slots, setSlots] = useState<{ position: Position; player_id: string }[]>([])
  useEffect(() => {
    if (!current) return
    setFormation(current.formation.label)
    setSlots(current.slots.map((s) => ({ position: s.position, player_id: s.player_id })))
  }, [current])

  // joueurs ayant joué la journée, avec leur note
  const pool = useMemo(() => {
    if (!r) return []
    const ids = new Set(periodMatches(league, seasonId, { type: 'round', round: r }, comp || null).map((m) => m.id))
    const out: { id: string; label: string; rating: number }[] = []
    for (const [pid, lines] of seasonLogs(league, seasonId)) {
      const l = lines.find((x) => ids.has(x.match.id)); if (!l) continue
      const p = L.player.get(pid)
      out.push({ id: pid, label: `${playerName(p)} · ${L.team.get(l.team_id)?.short_name ?? ''} · ${POSITION_LABEL[p?.position ?? 'MID']} · ${fmtRating(l.rating)}`, rating: l.rating })
    }
    return out.sort((a, b) => b.rating - a.rating)
  }, [league, seasonId, r, comp, L])

  const f = Object.values(FORMATIONS).find((x) => x.label === formation) ?? formationFor(settings.starters_count ?? 6)
  const positions = f.lines.flat()
  const setSlot = (i: number, player_id: string) => setSlots((s) => { const n = positions.map((position, j) => ({ position, player_id: s[j]?.player_id ?? '' })); n[i] = { position: positions[i], player_id }; return n })
  const xy = formationXY(f)
  const preview = current ? {
    ...current, formation: f, manual: true,
    slots: positions.map((position, i) => {
      const id = slots[i]?.player_id ?? ''
      const auto = current.slots.find((x) => x.player_id === id)
      const base = auto ?? { player_id: id, team_id: L.player.get(id)?.team_id ?? '', rating: 0, xp: 0, goals: 0, assists: 0, saves: 0, clean_sheet: false }
      return { ...base, position, x: xy[i].x, y: xy[i].y }
    }).filter((x) => x.player_id),
  } : null

  const save = async () => {
    const clean = positions.map((position, i) => ({ position, player_id: slots[i]?.player_id ?? '' }))
    if (clean.some((s) => !s.player_id)) { toast.error('Choisissez un joueur pour chaque poste.'); return }
    if (new Set(clean.map((s) => s.player_id)).size !== clean.length) { toast.error('Un joueur ne peut apparaître qu’une fois.'); return }
    const row = { season_id: seasonId, round: r!, competition_id: comp || null, formation, slots: clean, chosen_by: user?.email }
    if (saved) await base44.entities.TeamOfWeek.update(saved.id, row); else await base44.entities.TeamOfWeek.create(row)
    toast.success(`Équipe type de la journée ${r} enregistrée`)
  }
  const reset = async () => { if (saved) { await base44.entities.TeamOfWeek.delete(saved.id); toast.success('Retour à la sélection automatique') } }

  return (
    <AdminPage title="Équipe type" subtitle="Proposée automatiquement d’après la note des matchs. Modifiez un poste puis enregistrez : la sélection remplace la proposition sur le site." actions={<>{saved && <Button variant="outline" onClick={reset}><RotateCcw />Revenir à l’automatique</Button>}<Button onClick={save} disabled={!r}><Save />Enregistrer</Button></>}>
      {!rounds.length ? <p className="text-muted-foreground">Aucune journée jouée sur cette saison.</p> : (
        <div className="space-y-4">
          {comps.length > 1 && <CompetitionTabs comps={comps} value={comp} onChange={setComp} />}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Journée" value={String(r)} onChange={(v) => setRound(Number(v))} allLabel={null} options={rounds.map((x) => ({ value: String(x), label: `Journée ${x}` }))} />
            <FilterSelect label="Formation" value={formation} onChange={setFormation} allLabel={null} options={Object.values(FORMATIONS).map((x) => ({ value: x.label, label: `Formation ${x.label}` }))} />
            <span className="text-sm text-muted-foreground">{saved ? <><Wand2 className="mr-1 inline size-4" />Sélection manuelle enregistrée{saved.chosen_by ? ` par ${saved.chosen_by}` : ''}</> : 'Sélection automatique'}</span>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <Card><CardHeader><CardTitle>Postes</CardTitle></CardHeader><CardContent className="space-y-2">
              {positions.map((pos, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-10 font-display text-lg font-black text-neon">{POSITION_LABEL[pos]}</span>
                  <FilterSelect label={`Poste ${i + 1}`} value={slots[i]?.player_id ?? ''} onChange={(v) => setSlot(i, v)} allLabel={null} className="sm:w-full" options={pool.map((p) => ({ value: p.id, label: p.label }))} />
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">La liste ne contient que les joueurs ayant joué la journée, du mieux noté au moins bien noté.</p>
            </CardContent></Card>
            {preview && <TeamOfWeekPitch result={preview} size="sm" link={false} />}
          </div>
        </div>
      )}
    </AdminPage>
  )
}
