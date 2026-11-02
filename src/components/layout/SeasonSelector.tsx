import { CalendarRange } from 'lucide-react'
import { useSeason } from '@/hooks/useSeason'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function SeasonSelector({ className }: { className?: string }) {
  const { seasonId, setSeasonId, seasons } = useSeason()
  if (!seasonId) return null
  return (
    <Select value={seasonId} onValueChange={setSeasonId}>
      <SelectTrigger className={cn('h-9 w-auto min-w-40 gap-2 border-neon/30 bg-neon/5 text-xs font-semibold', className)} aria-label="Saison">
        <CalendarRange className="size-4 text-neon" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes saisons</SelectItem>
        {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active && s.status !== 'closed' ? ' (en cours)' : ''}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
