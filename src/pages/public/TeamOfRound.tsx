import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, Share2 } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useEffectiveSeason, useTeamOfWeek } from '@/hooks/useStats'
import { PageHeader } from '@/components/league/Bits'
import { CompetitionTabs } from '@/components/league/CompetitionTabs'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { Button } from '@/components/ui/button'
import { TeamOfWeekPitch, fmtRating, ratingColor } from '@/components/teamweek/TeamOfWeekPitch'
import { TeamOfWeekShare } from '@/components/teamweek/TeamOfWeekShare'
import { RewardsList } from '@/components/teamweek/RewardsList'
import { seasonRounds } from '@/lib/rewards'
import { fmtDate, playerName } from '@/lib/format'

export default function TeamOfWeekPage() {
  const { db, league } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const sid = season?.id
  const [sp, setSp] = useSearchParams()
  const comp = sp.get('competition') ?? ''
  const comps = db.Competition.filter((c) => c.season_id === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const rounds = useMemo(() => (sid ? seasonRounds(league, sid, comp || null) : []), [league, sid, comp])
  // uniquement l'équipe type de la dernière journée jouée (pas d'historique)
  const round = rounds.at(-1)
  const result = useTeamOfWeek(sid, round, comp || null)
  const [share, setShare] = useState(false)
  const roundDate = db.Match.find((m) => m.season_id === sid && m.round === round)?.date

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

      {comps.length > 1 && <CompetitionTabs comps={comps} value={comp} onChange={(v) => { const n = new URLSearchParams(sp); if (v) n.set('competition', v); else n.delete('competition'); setSp(n, { replace: true }) }} />}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-3 font-display text-2xl font-black">Journée {round}{roundDate && <span className="ml-2 text-base font-semibold text-muted-foreground first-letter:uppercase inline-block">{fmtDate(roundDate, 'EEEE d MMMM yyyy')}</span>}</h2>
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
                      <RoleBadge position={s.position} />
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

      {share && <TeamOfWeekShare open={share} onOpenChange={setShare} result={result} title={title} />}
    </div>
  )
}
