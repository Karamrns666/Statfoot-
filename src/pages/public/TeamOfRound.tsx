import { useMemo, useState } from 'react'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { Link } from 'react-router-dom'
import { useData, useLookup } from '@/hooks/useData'
import { useEffectiveSeason } from '@/hooks/useStats'
import { PageHeader } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { PlayerAvatar } from '@/components/league/Identity'
import { teamOfRound, isPlayed } from '@/lib/stats'
import { POSITION_LABEL } from '@/lib/format'

const XY = [{ x: 50, y: 86 }, { x: 28, y: 64 }, { x: 72, y: 64 }, { x: 28, y: 40 }, { x: 72, y: 40 }, { x: 50, y: 17 }]

export default function TeamOfRoundPage() {
  const { db, league } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const rounds = useMemo(() => [...new Set(db.Match.filter((m) => m.season_id === season?.id && isPlayed(m)).map((m) => m.round!))].sort((a, b) => a - b), [db.Match, season])
  const [round, setRound] = useState('')
  const r = round ? +round : rounds.at(-1)
  const slots = useMemo(() => (season && r ? teamOfRound(league, season.id, r) : []), [league, season, r])
  return (
    <div>
      <PageHeader title="Équipe type" subtitle={`Les meilleurs XP de la journée · ${season?.name ?? ''}`}>
        <FilterSelect value={round || String(r ?? '')} onChange={setRound} allLabel={null} options={rounds.map((x) => ({ value: String(x), label: `Journée ${x}` }))} />
      </PageHeader>
      {!slots.length ? <SeasonNotStarted what="Les équipes types" /> : (
        <div className="mx-auto max-w-xl">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10" style={{ background: 'repeating-linear-gradient(180deg,#0f3d2e 0 12.5%,#0d3528 12.5% 25%)' }}>
            <svg className="absolute inset-0 size-full opacity-40" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden><g fill="none" stroke="#fff" strokeWidth="2"><rect x="10" y="10" width="280" height="380" /><line x1="10" y1="200" x2="290" y2="200" /><circle cx="150" cy="200" r="40" /><rect x="80" y="330" width="140" height="60" /><rect x="80" y="10" width="140" height="60" /></g></svg>
            {slots.map((s, i) => {
              const p = L.player.get(s.player_id), t = L.team.get(s.team_id)
              return (
                <Link key={s.player_id} to={`/joueurs/${s.player_id}`} className="absolute flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center" style={{ left: `${XY[i].x}%`, top: `${XY[i].y}%` }}>
                  <PlayerAvatar player={p} team={t} size={58} />
                  <span className="mt-1 rounded bg-night-950/80 px-2 text-xs font-bold">{p?.last_name}</span>
                  <span className="text-[10px] text-white/80">{POSITION_LABEL[s.position]} · {t?.short_name} · <b className="text-neon">{s.xp} XP</b></span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
