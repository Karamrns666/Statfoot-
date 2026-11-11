// Historique du club : saisons MBL (liens approuvés par l'admin), chaque saison mène à l'équipe de cette saison.
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { clubTeams } from '@/lib/clubs'
import type { Team } from '@/types/entities'
import { cn } from '@/lib/utils'

export function ClubHistory({ team }: { team: Team }) {
  const { db } = useData()
  const list = clubTeams(team, db.Team, db.Competition, db.Season)
  if (list.length < 2) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-white/85">
      <History className="size-3.5" aria-hidden /><span className="font-semibold">Saisons MBL :</span>
      {list.map(({ team: t, seasonId }) => (
        <Link key={t.id} to={`/equipes/${t.id}`} className={cn('rounded-full border px-2 py-0.5', t.id === team.id ? 'border-white/60 bg-white/15 font-bold' : 'border-white/20 hover:border-white/60')}>{db.Season.find((s) => s.id === seasonId)?.name.replace(/^Saison /, '') ?? '—'}</Link>
      ))}
    </div>
  )
}
