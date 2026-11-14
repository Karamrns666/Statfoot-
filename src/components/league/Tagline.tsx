// Accroche de la ligue : phrase en français + ligne en arabe (dir="rtl", police Tajawal embarquée).
// Chaque phrase tient sur UNE ligne quelle que soit la largeur (dès 320 px) : taille de base en clamp() (unités cqi),
// puis ajustée à la largeur réelle si la police chargée est plus large que prévu.
import { useLayoutEffect, useRef } from 'react'
import { useLeague } from '@/hooks/useLeague'
import { cn } from '@/lib/utils'

function FitLine({ className, children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      const over = el.scrollWidth - el.clientWidth
      if (over > 1) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * el.clientWidth / el.scrollWidth) * 0.98}px`
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => ro?.disconnect()
  }, [children])
  return <p ref={ref} className={className} {...rest}>{children}</p>
}

export function Tagline({ className, align = 'center' }: { className?: string; align?: 'center' | 'start' }) {
  const L = useLeague()
  return (
    <div className={cn('tagline', align === 'center' ? 'text-center' : 'text-start', className)}>
      <FitLine className="tagline-fr">{L.tagline}</FitLine>
      <FitLine className="tagline-ar" dir="rtl" lang="ar">{L.taglineAr}</FitLine>
    </div>
  )
}
