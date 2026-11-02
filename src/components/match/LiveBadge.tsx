import type { Match } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { durationsFor, liveLabel } from '@/lib/matchEngine'
import { LiveDot } from '@/components/league/Bits'

/** Pastille de statut en direct (minute qui clignote / Pause / Mi-temps) — même moteur partout. */
export function useLiveLabel(m: Match) {
  const L = useLookup()
  const now = useNow(1000)
  const ls = L.live.get(m.id)
  return liveLabel(ls, durationsFor(m, L.competition.get(m.competition_id)), now)
}
export function LiveBadge({ match }: { match: Match }) {
  const label = useLiveLabel(match)
  return <LiveDot label={label} />
}
