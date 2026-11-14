// Billboard de l'accueil : écran de stade qui alterne joueurs et équipes mis en avant.
// Séquence : apparition du logo MBL → panneaux. Entre deux panneaux, un ballon traverse l'écran
// et « balaie » l'ancien panneau pendant que le nouveau se révèle ; projecteurs de stade, flash, texte qui glisse.
// Animations CSS (transform / opacity / clip-path) → 60 fps ; tout est coupé avec prefers-reduced-motion
// (pas de défilement automatique, changements instantanés). Pause : bouton, survol, focus, onglet masqué.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Tagline } from '@/components/league/Tagline'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, ListOrdered, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MBL_LOGO, OrganizedBy } from '@/components/layout/Logo'
import { isBrandLogo } from '@/lib/logos'
import { cn } from '@/lib/utils'

export type BillboardKind = 'player' | 'team' | 'match' | 'info'
export interface BillboardSlide {
  key: string
  kind?: BillboardKind
  eyebrow: string
  title: ReactNode
  value?: ReactNode
  unit?: string
  sub?: ReactNode
  href?: string
  tone?: 'orange' | 'sky' | 'white' | 'red'
  /** logo d'équipe (équipe, ou club du joueur) */
  image?: string
  /** couleur principale de l'équipe (halo, anneau) */
  color?: string
  /** joueur : photo ou initiales */
  photo?: string
  initials?: string
  /** match : logos des deux équipes */
  images?: [string | undefined, string | undefined]
}

const TONE = { orange: '#FF7A2E', sky: '#8FD0E6', white: '#FFFFFF', red: '#FF5A5A' }
const DURATION = 6500
const BRAND_DURATION = 3400
const POSTER_DURATION = 8000
const TRANSITION = 950

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

/** Ballon de foot (SVG) */
function Ball({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="bb-ball-shade" cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" /><stop offset=".65" stopColor="#e9eef6" /><stop offset="1" stopColor="#9aa8bd" /></radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#bb-ball-shade)" stroke="#0b1a3a" strokeWidth="2" />
      <polygon points="50,33 66,45 60,64 40,64 34,45" fill="#0b1a3a" />
      {[0, 72, 144, 216, 288].map((r) => (
        <g key={r} transform={`rotate(${r} 50 50)`}><polygon points="44,5 56,5 60,15 50,21 40,15" fill="#0b1a3a" /><line x1="50" y1="21" x2="50" y2="33" stroke="#0b1a3a" strokeWidth="2" /></g>
      ))}
      <circle cx="50" cy="50" r="47" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
    </svg>
  )
}

function Visual({ s, tone }: { s: BillboardSlide; tone: string }) {
  const ring = s.color ?? tone
  if (s.kind === 'player') {
    return (
      <div className="bb-pop relative size-28 shrink-0 sm:size-40">
        <div className="absolute -inset-3 rounded-full opacity-70 blur-xl" style={{ background: ring }} />
        <div className="relative size-full overflow-hidden rounded-full" style={{ boxShadow: `0 0 0 4px ${ring}, 0 0 0 7px rgb(255 255 255 / .12), 0 18px 40px rgb(0 0 0 / .55)` }}>
          {s.photo
            ? <img src={s.photo} alt="" className="size-full object-cover" />
            : <div className="flex size-full items-center justify-center font-display text-5xl font-black text-white sm:text-6xl" style={{ background: `radial-gradient(circle at 30% 25%, ${ring}, #04163D 78%)` }}>{s.initials}</div>}
        </div>
        {s.image && <img src={s.image} alt="" className={cn('absolute -bottom-1 -right-1 size-11 object-contain sm:size-14', isBrandLogo(s.image) ? 'rounded-[22%] bg-white p-0.5 shadow-lg' : 'drop-shadow-lg')} />}
      </div>
    )
  }
  if (s.kind === 'team' && s.image) {
    return (
      <div className="bb-pop relative shrink-0">
        <div className="absolute -inset-6 rounded-full opacity-60 blur-2xl" style={{ background: ring }} />
        <img src={s.image} alt="" className={cn('relative size-28 object-contain sm:size-40', isBrandLogo(s.image) ? 'rounded-[22%] bg-white p-1 shadow-[0_18px_40px_rgb(0_0_0/.55)]' : 'drop-shadow-[0_18px_30px_rgb(0_0_0/.6)]')} />
      </div>
    )
  }
  if (s.kind === 'match' && s.images) {
    return (
      <div className="bb-pop flex shrink-0 items-center gap-3">
        {s.images.map((src, i) => src && <img key={i} src={src} alt="" className={cn('size-16 object-contain sm:size-24', isBrandLogo(src) ? 'rounded-[22%] bg-white p-0.5' : 'drop-shadow-lg')} />)}
      </div>
    )
  }
  return null
}

function SlideView({ s, phase }: { s: BillboardSlide; phase: 'in' | 'out' }) {
  const tone = TONE[s.tone ?? 'orange']
  return (
    <div className={cn('bb-slide grid items-center gap-5 sm:grid-cols-[1fr_auto] sm:gap-8', phase === 'in' ? 'bb-wipe-in' : 'bb-wipe-out')} aria-hidden={phase === 'out'}>
      <div className="min-w-0">
        <div className="bb-text bb-d1 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[.14em] sm:text-base" style={{ color: TONE.sky }}>
          <span className="h-0.5 w-6 rounded-full" style={{ background: tone }} />{s.eyebrow}
        </div>
        <div className="bb-text bb-d2 bb-sheen mt-1.5 font-display text-[clamp(2.3rem,7.4vw,5.6rem)] font-black uppercase leading-[.86] text-white">{s.title}</div>
        {s.sub && <div className="bb-text bb-d3 mt-3 max-w-xl text-sm text-sky-soft sm:text-base">{s.sub}</div>}
        {s.href && <Link to={s.href} tabIndex={phase === 'out' ? -1 : undefined} className="bb-text bb-d3 mt-4 inline-block text-sm font-bold underline decoration-2 underline-offset-4 transition hover:text-white" style={{ color: tone }}>Voir le détail</Link>}
      </div>
      <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-3">
        <Visual s={s} tone={tone} />
        {s.value != null && (
          <div className="bb-value text-right font-display font-black leading-none" style={{ color: tone, textShadow: `0 0 28px ${tone}66` }}>
            <span className="text-[clamp(3rem,9vw,6.5rem)]">{s.value}</span>
            {s.unit && <span className="ml-2 text-xl sm:text-2xl">{s.unit}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function BrandView({ logo, leagueName, seasonLabel, phase }: { logo: string; leagueName: string; seasonLabel: string; phase: 'in' | 'out' }) {
  return (
    <div className={cn('bb-slide flex flex-col items-center justify-center text-center', phase === 'in' ? 'bb-brand-in' : 'bb-wipe-out')} aria-hidden={phase === 'out'}>
      <div className="relative">
        <div className="bb-ring absolute -inset-8 rounded-full" />
        <img src={logo} alt="" className="bb-logo relative h-28 w-auto sm:h-36" />
      </div>
      <div className="bb-text bb-d2 mt-4 font-display text-[clamp(1.8rem,5vw,3.4rem)] font-black uppercase leading-none tracking-wide text-white">{leagueName}</div>
      <div className="bb-text bb-d3 mt-2 text-sm font-semibold uppercase tracking-[.2em] text-sky-soft">{seasonLabel}</div>
    </div>
  )
}

export interface BillboardPoster { src: string; srcSet?: string; alt: string }

/** Affiche de la saison : image ENTIÈRE toujours visible (aucun recadrage), fond flouté de la même image autour */
function PosterView({ poster, phase }: { poster: BillboardPoster; phase: 'in' | 'out' }) {
  return (
    <div className={cn('bb-slide relative -mx-5 -my-7 flex items-center justify-center overflow-hidden sm:-mx-10 sm:-my-9', phase === 'in' ? 'bb-wipe-in' : 'bb-wipe-out')} aria-hidden={phase === 'out'}>
      <img src={poster.src} srcSet={poster.srcSet} sizes="(min-width: 1280px) 1200px, 100vw" alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-45 blur-2xl" />
      <img src={poster.src} srcSet={poster.srcSet} sizes="(min-width: 1280px) 1200px, 100vw" alt={poster.alt} className="relative block max-h-[min(72vh,560px)] w-full object-contain drop-shadow-[0_12px_30px_rgb(0_0_0/.5)]" decoding="async" />
    </div>
  )
}

export function Billboard({ slides: content, leagueName, seasonLabel, logoUrl, poster }: { slides: BillboardSlide[]; leagueName: string; seasonLabel: string; logoUrl?: string; poster?: BillboardPoster | null }) {
  const reduced = useReducedMotion()
  const logo = logoUrl || MBL_LOGO
  // le logo MBL ouvre chaque tour du billboard
  // 1 : logo de la ligue · 2 : affiche de la saison (remplaçable dans l'admin) · puis les panneaux de données
  type Special = { key: 'brand'; brand: true; eyebrow: string } | { key: 'poster'; poster: BillboardPoster; eyebrow: string }
  const slides: (BillboardSlide | Special)[] = [{ key: 'brand', brand: true, eyebrow: leagueName }, ...(poster ? [{ key: 'poster' as const, poster, eyebrow: 'Affiche de la saison' }] : []), ...content]
  const n = slides.length
  const [cur, setCur] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [tk, setTk] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [hidden, setHidden] = useState(false)
  const idx = n ? cur % n : 0
  const curRef = useRef(idx)
  curRef.current = idx
  const go = useCallback((to: number) => {
    const from = curRef.current, next = ((to % n) + n) % n
    if (!n || from === next) return
    setPrev(reduced ? null : from)
    setCur(next)
    setTk((t) => t + 1)
  }, [n, reduced])
  useEffect(() => { if (prev === null) return; const t = setTimeout(() => setPrev(null), TRANSITION); return () => clearTimeout(t) }, [tk, prev])
  useEffect(() => {
    const on = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  const stopped = paused || hover || hidden || reduced || n < 2
  const isBrand = 'brand' in slides[idx]
  const duration = isBrand ? BRAND_DURATION : 'poster' in slides[idx] ? POSTER_DURATION : DURATION
  useEffect(() => {
    if (stopped) return
    const t = setTimeout(() => go(idx + 1), duration)
    return () => clearTimeout(t)
  }, [idx, stopped, duration, go, tk])

  const render = (k: number, phase: 'in' | 'out') => {
    const s = slides[k]
    return 'brand' in s
      ? <BrandView key={`${s.key}-${phase}-${tk}`} logo={logo} leagueName={leagueName} seasonLabel={seasonLabel} phase={phase} />
      : 'poster' in s ? <PosterView key={`${s.key}-${phase}-${tk}`} poster={s.poster} phase={phase} />
      : <SlideView key={`${s.key}-${phase}-${tk}`} s={s} phase={phase} />
  }

  return (
    <section aria-roledescription="carrousel" aria-label="Billboard de la ligue" className="relative"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="bb-stadium relative overflow-hidden rounded-[22px] border border-sky/20">
        {/* décor : projecteurs, gradins, pelouse */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="bb-beam bb-beam-l" /><div className="bb-beam bb-beam-r" />
          <div className="bb-pitch" />
          {prev !== null && <div key={`flash-${tk}`} className="bb-flash" />}
        </div>

        {/* rail haut */}
        <div className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-night-950/60 px-4 py-2.5 sm:px-6">
          <img src={logo} alt="" className="h-9 w-auto sm:h-10" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-lg font-black uppercase text-white sm:text-2xl">{leagueName}</div>
            <div className="text-xs font-semibold capitalize text-sky-soft">{seasonLabel}</div>
          </div>
          <OrganizedBy size="sm" className="ml-auto hidden md:inline-flex" />
        </div>
        {/* accroche sous le titre : français puis arabe, une ligne chacune */}
        <div className="relative z-10 border-b border-white/10 bg-night-950/40 px-4 py-2 sm:px-6"><Tagline className="mx-auto max-w-3xl" /></div>

        {/* panneau */}
        <div className="bb-panel relative z-10 grid min-h-[300px] px-5 py-7 sm:min-h-[330px] sm:px-10 sm:py-9" aria-live={hover || paused ? 'polite' : 'off'}>
          {prev !== null && render(prev, 'out')}
          {n > 0 && render(idx, 'in')}
          {prev !== null && (
            <div key={`ball-${tk}`} className="bb-ball-track" aria-hidden>
              <div className="bb-ball"><span className="bb-trail" /><Ball className="bb-ball-spin size-full" /></div>
            </div>
          )}
        </div>

        {/* rail bas : navigation, progression, pause */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-white/10 bg-night-950/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5">
            <button onClick={() => go(idx - 1)} className="cursor-pointer rounded-md p-1 text-white/60 hover:text-white" aria-label="Panneau précédent"><ChevronLeft className="size-4" /></button>
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Panneaux">
              {slides.map((x, k) => (
                <button key={x.key} role="tab" aria-selected={k === idx} aria-label={'brand' in x ? 'Logo de la ligue' : x.eyebrow} onClick={() => go(k)}
                  className={cn('relative h-2 cursor-pointer overflow-hidden rounded-full bg-white/15 transition-all', k === idx ? 'w-10' : 'w-2 hover:bg-white/40')}>
                  {k === idx && <span key={tk} className="absolute inset-0 origin-left rounded-full bg-neon" style={{ animation: stopped ? 'none' : `board-progress ${duration}ms linear forwards`, transform: stopped ? 'scaleX(1)' : undefined }} />}
                </button>
              ))}
            </div>
            <button onClick={() => go(idx + 1)} className="cursor-pointer rounded-md p-1 text-white/60 hover:text-white" aria-label="Panneau suivant"><ChevronRight className="size-4" /></button>
            {n > 1 && !reduced && (
              <button onClick={() => setPaused((p) => !p)} className="ml-1 cursor-pointer rounded-md p-1 text-white/60 hover:text-white" aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause'} aria-pressed={paused}>
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
