// Badge FORFAIT + motif officiel (lien vers l'article du règlement) — résultats, fiche du match, match centre, TV.
import type { Match } from '@/types/entities'
import { forfeitReason, isForfeitMatch } from '@/lib/forfeit'
import { ArtLink } from '@/components/reglement/ArtLink'
import { useLookup } from '@/hooks/useData'
import { cn } from '@/lib/utils'

export function ForfeitBadge({ match, detailed = false, link = true, className }: { match: Match; detailed?: boolean; link?: boolean; className?: string }) {
  const L = useLookup()
  if (!isForfeitMatch(match)) return null
  const r = forfeitReason(match.forfeit_reason)
  const team = L.team.get(match.forfeit_team_id!)
  return (
    <span className={cn('inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center', className)}>
      <span className="rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Forfait</span>
      <span className="text-[11px] font-semibold text-red-200">{detailed && team ? `${team.short_name ?? team.name} : ` : ''}{r?.short ?? 'Décision Ardentia'}{detailed && match.forfeit_note ? ` — ${match.forfeit_note}` : ''}</span>
      {r?.art && (link ? <ArtLink art={r.art} className="text-[11px]" /> : <span className="text-[11px] text-white/60">Art. {r.art}</span>)}
    </span>
  )
}
