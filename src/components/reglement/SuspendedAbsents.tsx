// Fiche match : « Absents (suspendus) : … » sous chaque équipe (état à la veille du match).
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { useSuspendedFor } from '@/hooks/useDiscipline'
import { REGLEMENT, SUSPENSION_LABEL } from '@/lib/reglement'
import type { Match } from '@/types/entities'
import { ArtLink } from './ArtLink'

export function SuspendedAbsents({ match, teamId }: { match: Match; teamId: string }) {
  const L = useLookup()
  const sus = useSuspendedFor(match)
  const list = [...sus.entries()].filter(([pid]) => L.player.get(pid)?.team_id === teamId)
  if (!list.length) return null
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-red-500/10 px-3 py-2 text-sm">
      <Ban className="size-4 text-red-300" aria-hidden /><span className="font-semibold text-red-200">Absents (suspendus) :</span>
      {list.map(([pid, s], i) => {
        const p = L.player.get(pid)
        const kinds = s.discipline?.suspensions.filter((x) => x.served.length < x.matches).map((x) => SUSPENSION_LABEL[x.kind].toLowerCase()).join(', ')
        return <span key={pid}><Link to={`/joueurs/${pid}`} className="hover:text-neon">{p?.first_name} {p?.last_name}</Link>{kinds ? <span className="text-xs text-muted-foreground"> ({kinds})</span> : null}{i < list.length - 1 ? ',' : ''}</span>
      })}
      <span className="ml-auto flex gap-2"><ArtLink art={REGLEMENT.cards.artYellow} /><ArtLink art={REGLEMENT.cards.artRed} /></span>
    </p>
  )
}
