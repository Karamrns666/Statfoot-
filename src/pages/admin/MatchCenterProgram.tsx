// Match Center — programme : matchs par jour puis par créneau (heure · terrain · phase), filtres, top buteurs/passeurs en direct.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, User } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { useNow } from '@/hooks/useNow'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamLogo } from '@/components/league/Identity'
import { durationsFor, fmtScore, liveLabel, possession } from '@/lib/matchEngine'
import { computePlayerXP, isKnockout, race } from '@/lib/stats'
import { STAGE_LABELS } from '@/lib/schedule'
import { fmtDate, fmtTime, playerShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/entities'

const FILTERS = [{ v: 'all', l: 'Tous' }, { v: 'league_phase', l: 'Phase de ligue' }, { v: 'gold', l: 'Gold Cup' }, { v: 'silver', l: 'Silver Cup' }, { v: 'knockout', l: 'Phase finale' }] as const

export default function MatchCenterProgram() {
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const { seasonId } = useAdminScope()
  const [f, setF] = useState<(typeof FILTERS)[number]['v']>('all')
  const [mine, setMine] = useState(user?.role === 'operator')
  const ms = db.Match.filter((m) => m.season_id === seasonId && (f === 'all' || (f === 'knockout' ? isKnockout(m) : !isKnockout(m) && L.competition.get(m.competition_id)?.phase === f)) && (!mine || m.operator_user_id === user?.id))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const byDay = useMemo(() => {
    const g = new Map<string, Map<string, Match[]>>()
    for (const m of ms) {
      const day = (m.date ?? '').slice(0, 10)
      const slot = fmtTime(m.date)
      if (!g.has(day)) g.set(day, new Map())
      const d = g.get(day)!
      if (!d.has(slot)) d.set(slot, [])
      d.get(slot)!.push(m)
    }
    return [...g.entries()]
  }, [ms])
  const today = new Date().toISOString().slice(0, 10)
  const firstUseful = byDay.findIndex(([d]) => d >= today)
  const [showPast, setShowPast] = useState(false)
  const shown = showPast ? byDay : byDay.slice(Math.max(0, firstUseful === -1 ? byDay.length - 1 : firstUseful))
  const x = useMemo(() => [...computePlayerXP(league, { seasonId }).values()], [league, seasonId])
  return (
    <AdminPage title="Match Center" subtitle="Saisie en direct au bord du terrain"
      actions={<>
        {user?.role !== 'operator' && <Button asChild variant="outline"><Link to="/admin/matchs"><Plus />Créer un match hors calendrier</Link></Button>}
        <Button variant={mine ? 'default' : 'outline'} onClick={() => setMine(!mine)}><User />Mes matchs</Button>
      </>}>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => <button key={x.v} onClick={() => setF(x.v)} className={cn('rounded-full border px-4 py-1.5 font-display text-sm font-bold uppercase cursor-pointer', f === x.v ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground')}>{x.l}</button>)}
        <button onClick={() => setShowPast(!showPast)} className="ml-auto text-xs text-muted-foreground underline cursor-pointer">{showPast ? 'Masquer les journées passées' : 'Afficher les journées passées'}</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {shown.map(([day, slots]) => (
            <section key={day}>
              <h2 className="title-caps mb-2 text-xl capitalize">{day === today ? "Aujourd'hui" : fmtDate(day, 'EEEE d MMMM')}</h2>
              <div className="space-y-3">
                {[...slots.entries()].map(([slot, list]) => (
                  <div key={slot}>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{slot} · {[...new Set(list.map((m) => m.pitch))].join(' / ')} · {[...new Set(list.map((m) => (isKnockout(m) ? STAGE_LABELS[m.stage!] : L.competition.get(m.competition_id)?.name)))].join(' / ')}</div>
                    <div className="grid gap-2 sm:grid-cols-2">{list.map((m) => <ProgramCard key={m.id} m={m} />)}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!shown.length && <p className="text-muted-foreground">Aucun match.</p>}
        </div>
        <div className="space-y-4">
          {(['top_scorer', 'top_assist'] as const).map((k) => (
            <Card key={k}><CardHeader><CardTitle>{k === 'top_scorer' ? 'Top 10 buteurs' : 'Top 10 passeurs'}</CardTitle></CardHeader>
              <CardContent className="space-y-1">{race(league, x, k, seasonId).slice(0, 10).map((r) => (
                <div key={r.item.player_id} className="flex items-center gap-2 text-sm"><span className="num w-5 text-muted-foreground">{r.rank}</span><TeamLogo team={L.team.get(r.item.team_id)} size={16} /><span className="flex-1 truncate">{playerShort(L.player.get(r.item.player_id))}</span><span className="num text-lg text-neon">{k === 'top_scorer' ? r.item.goals : r.item.assists}</span></div>
              ))}</CardContent></Card>
          ))}
        </div>
      </div>
    </AdminPage>
  )
}

function ProgramCard({ m }: { m: Match }) {
  const L = useLookup()
  const { db } = useData()
  const now = useNow(1000)
  const ls = L.live.get(m.id)
  const comp = L.competition.get(m.competition_id)
  const label = m.status === 'finished' ? 'Terminé' : m.status === 'postponed' ? 'Reporté' : m.status === 'cancelled' ? 'Annulé' : liveLabel(ls, durationsFor(m, comp), now)
  const pos = possession(ls, now)
  const op = db.AdminUser.find((u) => u.id === m.operator_user_id)
  const isLive = m.status === 'live' && ls?.running
  return (
    <Link to={`/admin/match-center/${m.id}`} className={cn('glass block rounded-2xl p-3 transition hover:ring-1 hover:ring-neon', m.status === 'live' && 'ring-1 ring-red-500/50')}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{fmtTime(m.date)} · {m.pitch}</span>
        <span className={cn('rounded-full px-2 py-0.5 font-bold uppercase', isLive ? 'bg-red-500 text-white animate-pulse' : m.status === 'live' ? 'bg-amber-400/20 text-amber-200' : m.status === 'finished' ? 'bg-white/10' : 'bg-neon/10 text-neon')}>{label}</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 truncate"><TeamLogo team={L.team.get(m.home_team_id)} size={28} /><span className="truncate font-semibold">{L.team.get(m.home_team_id)?.short_name ?? '?'}</span></div>
        <span className="num text-3xl">{m.status === 'scheduled' ? 'vs' : fmtScore(m)}</span>
        <div className="flex items-center justify-end gap-2 truncate"><span className="truncate font-semibold">{L.team.get(m.away_team_id)?.short_name ?? '?'}</span><TeamLogo team={L.team.get(m.away_team_id)} size={28} /></div>
      </div>
      {ls && (pos.home_ms + pos.away_ms) > 0 && <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${pos.home_pct}%`, background: L.team.get(m.home_team_id)?.primary_color }} /><div style={{ width: `${pos.away_pct}%`, background: L.team.get(m.away_team_id)?.primary_color }} /></div>}
      <div className="mt-1.5 text-[11px] text-muted-foreground">Opérateur : {ls?.lock_user_name ?? op?.full_name ?? '—'}</div>
    </Link>
  )
}
