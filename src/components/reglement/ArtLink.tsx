// Lien contextuel vers un article du règlement (/reglement#art-17-3).
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { artHref, artLabel } from '@/lib/reglement'
import { cn } from '@/lib/utils'

export function ArtLink({ art, children, className }: { art: string; children?: React.ReactNode; className?: string }) {
  return (
    <Link to={artHref(art)} className={cn('inline-flex items-center gap-1 text-xs font-semibold text-neon/90 underline-offset-2 hover:text-neon hover:underline', className)} title={`Lire l’${artLabel(art).replace('Art.', 'article')} du règlement`}>
      <BookOpen className="size-3.5" aria-hidden />{children ?? artLabel(art)}
    </Link>
  )
}
