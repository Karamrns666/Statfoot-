import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, Share2 } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useEffectiveSeason, seasonLogs, useTeamOfWeek } from '@/hooks/useStats'
import { PageHeader } from '@/components/league/Bits'
import { CompetitionTabs } from '@/components/league/CompetitionTabs'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { PlayerAvatar, PositionBadge, TeamLogo } from '@/components/league/Identity'
import { Button } from '@/components/ui/button'
import { TeamOfWeekPitch, fmtRating, ratingColor } from '@/components/teamweek/TeamOfWeekPitch'
import { TeamOfWeekShare } from '@/components/teamweek/TeamOfWeekShare'
import { RewardsList } from '@/components/teamweek/RewardsList'
import { seasonRounds, teamOfWeek } from '@/lib/rewards'
import { fmtDate, playerName } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function TeamOfWeekPage() {
  const { db, league, settings } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const sid = season?.id
  const [sp, setSp] = useSearchParams()
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }) }
  const comp = sp.get('competition') ?? ''
  const comps = db.Competition.filter((c) => c.season_id === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const rounds = useMemo(() => (sid ? seasonRounds(league, sid, comp || null) : []), [league, sid, comp])
  const round = sp.get('journee') ? Number(sp.get('journee')) : rounds.at(-1)
  const result = useTeamOfWeek(sid, round, comp || null)
  const [share, setShare] = useState(false)
  const roundDate = db.Match.find((m) => m.season_id === sid && m.round === round)?.date

  // historique : joueur de la journée pour chaque journée
  const history = useMemo(() => {
    if (!sid) return []
    const logs = seasonLogs(league, sid)
    return rounds.map((r) => {
      const ov = db.TeamOfWeek.find((t) => t.season_id === sid && t.round === r && (t.competition_id ?? '') === comp)
      const res = teamOfWeek(league, sid, r, { competitionId: comp || null, players: settings.starters_count ?? 6, override: ov, logs })
      return { round: r, best: res.player_of_round, top: [...res.slots].sort((a, b) => b.rating - a.rating).slice(0, 4) }
    }).reverse()
  }, [league, sid, rounds, comp, db.TeamOfWeek, settings.starters_count])

  if (!sid || !rounds.length || !result) {
    return <div><PageHeader title="Équipe type" subtitle={season?.name} /><SeasonNotStarted what="Les équipes types" /></div>
  }
  const title = `${season?.name ?? ''}${comp ? ` · ${L.competition.get(comp)?.name}` : ''} · Journée ${round}`
  const best = result.player_of_round
  return (
    <div className="space-y-8">
      <PageHeader title="Équipe type" subtitle={`La meilleure équipe de la journée, choisie d’après la note de chaque match · ${season?.name}`}>
        <Button variant="outline" onClick={() => setShare(true)}><Share2 />Partager en image</Button>
      </PageHeader>

      {comps.length > 1 && <CompetitionTabs comps={comps} value={comp} onChange={(v) => { const n = new URLSearchParams(sp); if (v) n.set('competition', v); else n.delete('competition'); n.delete('journee'); setSp(n, { replace: true }) }} />}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Journées">
        {rounds.map((r) => (
          <button key={r} role="tab" aria-selected={r === round} onClick={() => set('journee', String(r))} className={cn('shrink-0 cursor-pointer rounded-xl border px-4 py-2 font-display text-lg font-black transition', r === round ? 'border-neon bg-neon text-white' : 'border-white/10 bg-white/[.03] text-muted-foreground hover:text-white')}>J{r}</button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-3 font-display text-2xl font-black">Journée {round}{roundDate && <span className="ml-2 text-base font-semibold capitalize text-muted-foreground">{fmtDate(roundDate, 'EEEE d MMMM yyyy')}</span>}</h2>
          <TeamOfWeekPitch result={result} size="lg" className="mx-auto max-w-[560px]" />
        </div>
        <div className="space-y-5">
          {best && (() => {
            const p = L.player.get(best.player_id), t = L.team.get(best.team_id)
            return (
              <Link to={`/joueurs/${best.player_id}`} className="glass flex items-center gap-4 rounded-2xl border-award-gold/40 p-4 transition hover:border-award-gold">
                <PlayerAvatar player={p} team={t} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-award-gold"><Crown className="size-4 fill-award-gold" />Joueur de la journée</div>
                  <div className="truncate font-display text-2xl font-black">{playerName(p)}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TeamLogo team={t} size={16} />{t?.name} · {best.goals} but{best.goals > 1 ? 's' : ''}, {best.assists} passe{best.assists > 1 ? 's' : ''}</div>
                </div>
                <div className="rounded-lg px-2.5 py-1 font-display text-3xl font-black text-ink" style={{ background: ratingColor(best.rating) }}>{fmtRating(best.rating)}</div>
              </Link>
            )
          })()}
          <div className="glass rounded-2xl p-2">
            <ul className="divide-y divide-white/5">
              {result.slots.map((s) => {
                const p = L.player.get(s.player_id), t = L.team.get(s.team_id)
                return (
                  <li key={s.player_id}>
                    <Link to={`/joueurs/${s.player_id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                      <PositionBadge position={s.position} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{playerName(p)}</span>
                      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><TeamLogo team={t} size={16} />{t?.short_name}</span>
                      <span className="w-20 text-right text-xs text-muted-foreground">{s.position === 'GK' ? `${s.saves} arr.${s.clean_sheet ? ' · CS' : ''}` : `${s.goals} B · ${s.assists} PD`}</span>
                      <span className="w-12 rounded-md text-center font-display text-lg font-black text-ink" style={{ background: ratingColor(s.rating) }}>{fmtRating(s.rating)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-display text-xl font-black">Récompenses de la journée</h3>
            <RewardsList seasonId={sid} period={{ type: 'round', round: round! }} competitionId={comp || null} compact />
          </div>
          <p className="text-xs text-muted-foreground">Note sur 10 calculée à partir des actions du match (buts, passes, arrêts, clean sheet, victoire, homme du match). La ligue peut ajuster la sélection dans l’espace admin.</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-2xl font-black">Historique</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((h) => {
            const p = h.best ? L.player.get(h.best.player_id) : undefined
            return (
              <button key={h.round} onClick={() => { set('journee', String(h.round)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className={cn('glass flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition hover:border-neon/40', h.round === round && 'border-neon/60')}>
                <span className="w-10 font-display text-2xl font-black text-neon">J{h.round}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold"><Crown className="mr-1 inline size-3.5 fill-award-gold text-award-gold" />{playerName(p)}</div>
                  <div className="mt-1 flex -space-x-2">{h.top.map((s) => <PlayerAvatar key={s.player_id} player={L.player.get(s.player_id)} team={L.team.get(s.team_id)} size={24} />)}</div>
                </div>
                {h.best && <span className="rounded-md px-1.5 font-display text-lg font-black text-ink" style={{ background: ratingColor(h.best.rating) }}>{fmtRating(h.best.rating)}</span>}
              </button>
            )
          })}
        </div>
      </section>
      {share && <TeamOfWeekShare open={share} onOpenChange={setShare} result={result} title={title} />}
    </div>
  )
}
