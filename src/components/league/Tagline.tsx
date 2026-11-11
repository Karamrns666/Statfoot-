// Accroche de la ligue : phrase en français + ligne en arabe (dir="rtl", police Tajawal embarquée).
// Chaque phrase tient sur UNE ligne : la taille suit la largeur du bloc (unités cqi), sans retour à la ligne, dès 320 px.
import { useLeague } from '@/hooks/useLeague'
import { cn } from '@/lib/utils'

export function Tagline({ className, align = 'center' }: { className?: string; align?: 'center' | 'start' }) {
  const L = useLeague()
  return (
    <div className={cn('tagline', align === 'center' ? 'text-center' : 'text-start', className)}>
      <p className="tagline-fr">{L.tagline}</p>
      <p className="tagline-ar" dir="rtl" lang="ar">{L.taglineAr}</p>
    </div>
  )
}
