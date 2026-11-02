// Billboard LED de stade : panneaux qui défilent (champion, buteur, passeur, gardien, direct…).
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ListOrdered, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MBL_LOGO, OrganizedBy } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'

export interface BillboardSlide {
  key: string
  eyebrow: string
  title: ReactNode
  value?: ReactNode
  unit?: string
  sub?: ReactNode
  image?: string
  href?: string
  tone?: 'orange' | 'sky' | 'white' | 'red'
}

const TONE = { orange: '#FF7A2E', sky: '#8FD0E6', white: '#FFFFFF', red: '#FF5A5A' }
const DURATION = 6500

export function Billboard({ slides, leagueName, seasonLabel, logoUrl }: { slides: BillboardSlide[]; leagueName: string; seasonLabel: string; logoUrl?: string }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const n = slides.length
  const idx = n ? i % n : 0
  useEffect(() => {
    if (paused || reduced || n < 2) return
    const t = setTimeout(() => setI((x) => (x + 1) % n), DURATION)
    return () => clearTimeout(t)
  }, [i, paused, reduced, n])
  const s = slides[idx]
  const tone = TONE[s?.tone ?? 'orange']
  return (
    <section aria-roledescription="carrousel" aria-label="Billboard de la ligue" className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {/* poteaux */}
      <div className="led-board led-scan relative overflow-hidden rounded-[22px] border-[3px] border-[#13306A]">
        {/* rail haut */}
        <div className="relative z-10 flex items-center gap-3 border-b border-sky/15 bg-[#06194A]/80 px-4 py-2.5 sm:px-6">
          <img src={logoUrl || MBL_LOGO} alt="" className="h-9 w-auto sm:h-11" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-lg font-black uppercase text-white sm:text-2xl">{leagueName}</div>
            <div className="text-xs font-semibold text-sky-soft">Ligue de football inter-entreprises · {seasonLabel}</div>
          </div>
          <OrganizedBy size="sm" className="ml-auto hidden md:inline-flex" />
        </div>

        {/* panneau animé */}
        <div className="relative z-10 min-h-[260px] px-5 py-7 sm:min-h-[300px] sm:px-10 sm:py-9" aria-live={paused ? 'polite' : 'off'}>
          {s && (
            <div key={s.key + idx} className="board-in grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="led-glow font-display text-base font-extrabold uppercase tracking-[.08em] sm:text-lg" style={{ color: TONE.sky }}>{s.eyebrow}</div>
                <div className="led-glow mt-1 font-display text-[clamp(2.6rem,8vw,6.2rem)] font-black uppercase leading-[.86] text-white">{s.title}</div>
                {s.sub && <div className="mt-3 text-sm text-sky-soft sm:text-base">{s.sub}</div>}
                {s.href && <Link to={s.href} className="mt-4 inline-block text-sm font-bold underline decoration-2 underline-offset-4 transition hover:text-neon" style={{ color: tone }}>Voir le détail</Link>}
              </div>
              <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
                {s.image && <img src={s.image} alt="" className="size-20 object-contain drop-shadow-[0_0_24px_rgba(108,180,204,.35)] sm:size-28" />}
                {s.value != null && (
                  <div className="led-glow text-right font-display font-black leading-none" style={{ color: tone }}>
                    <span className="text-[clamp(3.4rem,11vw,8rem)]">{s.value}</span>
                    {s.unit && <span className="ml-2 text-2xl sm:text-3xl">{s.unit}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* rail bas : progression + actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-sky/15 bg-[#06194A]/80 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Panneaux">
            {slides.map((x, k) => (
              <button key={x.key} role="tab" aria-selected={k === idx} aria-label={x.eyebrow} onClick={() => setI(k)} className={cn('relative h-2 cursor-pointer overflow-hidden rounded-full bg-white/15 transition-all', k === idx ? 'w-10' : 'w-2 hover:bg-white/40')}>
                {k === idx && <span className="absolute inset-0 origin-left rounded-full bg-neon" style={{ animation: paused || reduced ? 'none' : `board-progress ${DURATION}ms linear forwards`, transform: paused || reduced ? 'scaleX(1)' : undefined }} />}
              </button>
            ))}
            {n > 1 && !reduced && (
              <button onClick={() => setPaused((p) => !p)} className="ml-1 cursor-pointer rounded-md p-1 text-white/60 hover:text-white" aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause'}>
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild size="sm"><Link to="/matchs"><CalendarDays />Calendrier</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/classement"><ListOrdered />Classement</Link></Button>
          </div>
        </div>
      </div>
      <OrganizedBy size="sm" className="mt-3 md:hidden" />
    </section>
  )
}
