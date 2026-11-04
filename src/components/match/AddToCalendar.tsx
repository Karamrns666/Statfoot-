import { CalendarPlus } from 'lucide-react'
import type { Match } from '@/types/entities'
import { useLookup } from '@/hooks/useData'
import { useLeague } from '@/hooks/useLeague'
import { Button } from '@/components/ui/button'
import { downloadIcs, matchesToIcs } from '@/lib/ics'

/** Bouton « Ajouter à l'agenda » : un fichier .ics avec un ou plusieurs matchs (Google Agenda, Outlook, iPhone) */
export function AddToCalendar({ matches, label = 'Ajouter à mon agenda', filename = 'mbl-match.ics', size = 'sm', variant = 'outline' }: { matches: Match[]; label?: string; filename?: string; size?: 'sm' | 'default'; variant?: 'outline' | 'default' | 'ghost' }) {
  const L = useLookup()
  const league = useLeague()
  if (!matches.some((m) => m.date)) return null
  const go = () => downloadIcs(filename, matchesToIcs(matches, { team: (id) => L.team.get(id), competition: (id) => L.competition.get(id)?.name, leagueName: league.name, address: 'Casablanca', url: typeof location !== 'undefined' ? location.origin : undefined }))
  return <Button size={size} variant={variant} onClick={go}><CalendarPlus />{label}</Button>
}
