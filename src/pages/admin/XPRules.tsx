import { useMemo, useState } from 'react'
import { RefreshCw, RotateCcw, Save, Gavel, CalendarHeart, Trash2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FilterSelect } from '@/components/league/FilterSelect'
import { toast } from '@/components/ui/toast'
import { computePlayerXP, isPlayed, teamRankBefore, xpConfig, XP_DEFAULTS, XP_KEYS, XP_LABELS, MULTIPLIER_KEYS } from '@/lib/stats'
import { fmtMinute } from '@/lib/matchEngine'
import { fmtDate, playerName } from '@/lib/format'
import type { XPKey } from '@/types/entities'

const GROUPS: { title: string; keys: XPKey[] }[] = [
  { title: 'Actions offensives', keys: ['goal', 'assist', 'mult_top3', 'mult_4_6', 'mult_7plus'] },
  { title: 'Résultat', keys: ['win', 'loss'] },
  { title: 'Discipline', keys: ['yellow', 'double_yellow_total', 'red_direct', 'per_suspension_match'] },
  { title: 'Gardien', keys: ['clean_sheet_gk', 'importance_league_phase', 'importance_gold', 'importance_silver', 'importance_knockout', 'save', 'penalty_saved', 'shootout_saved', 'goal_conceded_gk'] },
  { title: 'Homme du match', keys: ['motm'] },
  { title: 'Bonus mensuels & trophées', keys: ['player_of_month', 'team_of_month', 'goal_of_month', 'min_matches_awards'] },
]

export default function XPRules() {
  const { db, league } = useData()
  const { seasonId } = useAdminScope()
  const season = db.Season.find((s) => s.id === seasonId)
  const cfg = xpConfig(db.XPRule, seasonId)
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(XP_KEYS.map((k) => [k, String(cfg[k])])))
  const [seasonSeen, setSeasonSeen] = useState(seasonId)
  if (seasonSeen !== seasonId) { setSeasonSeen(seasonId); setVals(Object.fromEntries(XP_KEYS.map((k) => [k, String(cfg[k])]))) }
  const save = async () => {
    for (const k of XP_KEYS) {
      const value = Number(vals[k])
      if (Number.isNaN(value)) { toast.error(`Valeur invalide : ${XP_LABELS[k]}`); return }
      const row = db.XPRule.find((r) => r.season_id === seasonId && r.key === k)
      if (row) { if (row.value !== value) await base44.entities.XPRule.update(row.id, { value }) }
      else await base44.entities.XPRule.create({ season_id: seasonId, key: k, value })
    }
    toast.success('Barème enregistré — XP recalculé partout')
  }
  const recalc = async () => {
    // L'XP est toujours recalculé depuis les événements ; ici on refige le rang des adversaires (multiplicateur) des matchs validés.
    const ms = db.Match.filter((m) => m.season_id === seasonId && isPlayed(m))
    const cache = new Map()
    const unfrozen = { ...league, matches: league.matches.map((m) => ({ ...m, validated: false })) }
    let n = 0
    for (const m of ms.sort((a, b) => (a.round ?? 0) - (b.round ?? 0))) {
      const snap = { home_rank: teamRankBefore(unfrozen, m, m.home_team_id, cache), away_rank: teamRankBefore(unfrozen, m, m.away_team_id, cache) }
      if (JSON.stringify(snap) !== JSON.stringify(m.opponent_rank_snapshot)) { await base44.entities.Match.update(m.id, { opponent_rank_snapshot: snap }); n++ }
    }
    const total = [...computePlayerXP(league, { seasonId }).values()].reduce((a, s) => a + s.xp, 0)
    toast.success(`Saison recalculée : ${ms.length} matchs, ${n} classement(s) adversaire mis à jour, ${total.toLocaleString('fr-FR')} XP au total`)
  }
  return (
    <AdminPage title="Règles XP" subtitle={`Barème, suspensions et bonus mensuels · ${season?.name ?? ''}`}
      actions={<>
        <Button variant="outline" onClick={recalc}><RefreshCw />Recalculer toute la saison</Button>
        <Button variant="outline" onClick={() => setVals(Object.fromEntries(XP_KEYS.map((k) => [k, String(XP_DEFAULTS[k])])))}><RotateCcw />Valeurs par défaut</Button>
        <Button onClick={save}><Save />Enregistrer le barème</Button>
      </>}>
      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title}>
            <CardHeader><CardTitle>{g.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {g.keys.map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <label htmlFor={`xp-${k}`} className="flex-1 text-sm">{XP_LABELS[k]}{k.startsWith('importance') && <Badge variant="warning" className="ml-2">à confirmer</Badge>}</label>
                  <div className="relative w-28">
                    {MULTIPLIER_KEYS.includes(k) && k !== 'min_matches_awards' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">×</span>}
                    <Input id={`xp-${k}`} type="number" step="any" value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className={`h-9 text-right num text-base ${Number(vals[k]) < 0 ? 'text-sky-400' : Number(vals[k]) > 0 && !MULTIPLIER_KEYS.includes(k) ? 'text-neon' : ''}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-4"><CardContent className="pt-4 text-xs text-muted-foreground">
        <b className="text-white">Ordre d'application :</b> but et passe = valeur × multiplicateur selon le rang de l'adversaire avant la journée (rang figé à la clôture du match ; ×1 en J1 de phase de ligue ; ordre d'entrée en début de cup) · clean sheet = valeur × importance du match · autres actions = valeur · arrondi à l'entier sur chaque ligne. Un match gagné aux tirs au but compte comme un nul.
      </CardContent></Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SuspensionsSection seasonId={seasonId} perMatch={cfg.per_suspension_match} />
        <MonthlySection seasonId={seasonId} />
      </div>
    </AdminPage>
  )
}

function SuspensionsSection({ seasonId, perMatch }: { seasonId: string; perMatch: number }) {
  const { db } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const exclusions = useMemo(() => db.MatchEvent.filter((e) => (e.type === 'red_card' || e.type === 'second_yellow') && db.Match.some((m) => m.id === e.match_id && m.season_id === seasonId)), [db.MatchEvent, db.Match, seasonId])
  const [vals, setVals] = useState<Record<string, string>>({})
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="size-5 text-red-400" />Suspensions</CardTitle><CardDescription>Joueurs exclus · {perMatch} XP par match de suspension</CardDescription></CardHeader>
      <CardContent className="space-y-2">
        {exclusions.map((e) => {
          const m = db.Match.find((x) => x.id === e.match_id)!
          const s = db.Suspension.find((x) => x.origin_event_id === e.id)
          const v = vals[e.id] ?? String(s?.matches ?? 1)
          return (
            <div key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="flex-1"><b>{playerName(L.player.get(e.player_id ?? ''))}</b> <span className="text-muted-foreground">· {fmtDate(m.date, 'd MMM')} · {e.type === 'second_yellow' ? '2 jaunes' : 'rouge direct'} · {L.team.get(m.home_team_id)?.short_name}-{L.team.get(m.away_team_id)?.short_name}</span></span>
              <Input type="number" min={0} className="h-8 w-16 text-right" value={v} onChange={(x) => setVals({ ...vals, [e.id]: x.target.value })} aria-label="Nombre de matchs" />
              <span className="text-xs text-muted-foreground">match(s)</span>
              <Button size="sm" className="h-8" onClick={async () => {
                const matches = Math.max(0, +v)
                if (s) await base44.entities.Suspension.update(s.id, { matches })
                else await base44.entities.Suspension.create({ season_id: seasonId, player_id: e.player_id!, origin_match_id: m.id, origin_event_id: e.id, date: m.date?.slice(0, 10), matches, created_by: user?.email })
                toast.success(`Suspension enregistrée (${matches * perMatch} XP)`)
              }}>Enregistrer</Button>
            </div>
          )
        })}
        {!exclusions.length && <p className="text-sm text-muted-foreground">Aucun joueur exclu cette saison.</p>}
      </CardContent>
    </Card>
  )
}

function MonthlySection({ seasonId }: { seasonId: string }) {
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const months = [...new Set(db.Match.filter((m) => m.season_id === seasonId && isPlayed(m)).map((m) => m.date!.slice(0, 7)))].sort()
  const [month, setMonth] = useState(months.at(-1) ?? '')
  const inMonth = db.Match.filter((m) => m.season_id === seasonId && isPlayed(m) && m.date?.startsWith(month))
  const goals = db.MatchEvent.filter((e) => e.type === 'goal' && inMonth.some((m) => m.id === e.match_id))
  const monthXP = useMemo(() => [...computePlayerXP({ ...league, matches: inMonth, suspensions: [], monthlyAwards: [] }, { seasonId }).values()].filter((s) => s.matches > 0).sort((a, b) => b.xp - a.xp), [league, inMonth, seasonId])
  const [goal, setGoal] = useState('')
  const [player, setPlayer] = useState('')
  const [team, setTeam] = useState('')
  const current = (type: 'player' | 'team' | 'goal') => db.MonthlyAward.find((a) => a.season_id === seasonId && a.month === month && a.type === type)
  const designate = async (type: 'player' | 'team' | 'goal', data: { player_id?: string; team_id?: string; event_id?: string }) => {
    const cur = current(type)
    if (cur) await base44.entities.MonthlyAward.update(cur.id, { ...data, designated_by: user?.email })
    else await base44.entities.MonthlyAward.create({ season_id: seasonId, month, type, ...data, designated_by: user?.email })
    toast.success('Désignation enregistrée')
  }
  const label = (type: 'player' | 'team' | 'goal') => {
    const c = current(type); if (!c) return <span className="text-muted-foreground">Non désigné</span>
    const ev = c.event_id ? db.MatchEvent.find((e) => e.id === c.event_id) : undefined
    return <span className="flex items-center gap-2"><b>{type === 'team' ? L.team.get(c.team_id!)?.name : playerName(L.player.get(c.player_id ?? ev?.player_id ?? ''))}</b><button onClick={() => base44.entities.MonthlyAward.delete(c.id)} className="text-red-400" title="Retirer"><Trash2 className="size-3.5" /></button></span>
  }
  const monthLabel = (m: string) => fmtDate(`${m}-01`, 'MMMM yyyy')
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarHeart className="size-5 text-neon" />Bonus mensuels</CardTitle><CardDescription>But du mois, joueur du mois, équipe du mois</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <FilterSelect className="sm:w-full" value={month} onChange={setMonth} allLabel={null} options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
        <div className="space-y-2 rounded-xl bg-white/5 p-3">
          <div className="flex justify-between text-sm"><span className="font-semibold">But du mois</span>{label('goal')}</div>
          <FilterSelect className="sm:w-full" value={goal} onChange={setGoal} allLabel="Choisir un but…" options={goals.map((g) => { const m = inMonth.find((x) => x.id === g.match_id)!; return { value: g.id, label: `${fmtDate(m.date, 'd MMM')} · ${playerName(L.player.get(g.player_id ?? ''))} · ${fmtMinute(g.minute, g.added_minute)}` } })} />
          <Button size="sm" disabled={!goal} onClick={() => designate('goal', { event_id: goal, player_id: goals.find((g) => g.id === goal)?.player_id })}>Désigner le but du mois</Button>
        </div>
        <div className="space-y-2 rounded-xl bg-white/5 p-3">
          <div className="flex justify-between text-sm"><span className="font-semibold">Joueur du mois</span>{label('player')}</div>
          <FilterSelect className="sm:w-full" value={player} onChange={setPlayer} allLabel="Choisir un joueur…" options={monthXP.slice(0, 30).map((s) => ({ value: s.player_id, label: `${playerName(L.player.get(s.player_id))} · ${s.xp} XP ce mois` }))} />
          <Button size="sm" disabled={!player} onClick={() => designate('player', { player_id: player })}>Désigner le joueur du mois</Button>
        </div>
        <div className="space-y-2 rounded-xl bg-white/5 p-3">
          <div className="flex justify-between text-sm"><span className="font-semibold">Équipe du mois</span>{label('team')}</div>
          <FilterSelect className="sm:w-full" value={team} onChange={setTeam} allLabel="Choisir une équipe…" options={[...new Set(inMonth.flatMap((m) => [m.home_team_id, m.away_team_id]))].map((t) => ({ value: t, label: L.team.get(t)?.name ?? t }))} />
          <Button size="sm" disabled={!team} onClick={() => designate('team', { team_id: team })}>Désigner l'équipe du mois</Button>
        </div>
      </CardContent>
    </Card>
  )
}
