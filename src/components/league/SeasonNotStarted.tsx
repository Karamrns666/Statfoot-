// État vide d'une saison sans données (début de saison) : message + raccourci vers la dernière saison jouée.
import { CalendarClock } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { isPlayed } from '@/lib/standings'
import { Button } from '@/components/ui/button'
import { EmptyState } from './Bits'

export function SeasonNotStarted({ what }: { what: string }) {
  const { db } = useData()
  const { season, setSeasonId } = useSeason()
  const prev = [...db.Season].filter((s) => s.id !== season?.id && !s.hidden && db.Match.some((m) => m.season_id === s.id && isPlayed(m))).sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
  return (
    <EmptyState title={`${what} ${season?.name.replace('Saison ', '') ?? ''} arrivent bientôt`} icon={<CalendarClock />}>
      <p>Ils seront publiés ici dès qu’ils seront disponibles.</p>
      {prev && <Button className="mt-4" variant="outline" onClick={() => setSeasonId(prev.id)}>Voir la {prev.name.toLowerCase()}</Button>}
    </EmptyState>
  )
}
