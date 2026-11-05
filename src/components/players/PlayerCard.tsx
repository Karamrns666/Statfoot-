// Carte joueur à collectionner façon « Ultimate Team » : photo détourée en grand posée sur la carte,
// note (XP ou IPG), rôle, logo du club, nom et stats principales. La couleur suit la matière du meilleur
// badge (bronze → black), bleu MBL sans badge. Verso blanc, retournement 3D au clic (ou Entrée / Espace).
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import type { Position, Team } from '@/types/entities'
import { isBrandLogo, teamLogoSvg } from '@/lib/logos'
import { cn } from '@/lib/utils'
import { RankDelta } from '@/components/league/Bits'
import { BADGE_ICONS } from './BadgeMedal'
import { TIER_LABEL, TIER_STYLE, type BadgeState, type BadgeTier } from '@/lib/badges'

export interface CardStat { label: string; value: ReactNode; hint?: string }

export interface PlayerCardProps {
  firstName: string
  lastName: string
  /** 6 contre 6 : seul le rôle de gardien est affiché (pas de postes) */
  position?: Position
  captain?: boolean
  team?: Team | null
  /** nom d'équipe affiché quand l'équipe n'existe pas dans la base (ex. classement IPG) */
  teamName?: string
  /** photo originale : secours recadré si pas de version détourée (ou choix « photo originale » dans l'admin) */
  photoUrl?: string
  /** photo détourée (PNG transparent) : affichée en grand, posée sur la carte */
  cutoutUrl?: string
  /** indice de performance (IPG), affiché en pastille s'il existe */
  ipg?: number
  rating: ReactNode
  ratingLabel: string
  rank?: number
  delta?: number | null
  badge?: ReactNode
  front: CardStat[]
  backTitle: string
  back: CardStat[]
  backNote?: ReactNode
  href?: string
  /** matière de la carte = meilleur badge débloqué ; null/undefined = carte bleue MBL */
  material?: BadgeTier | null
  /** badges débloqués, du plus rare au plus courant */
  medals?: BadgeState[]
  badgeTotal?: number
  className?: string
}

interface Theme { frame: string; edge: string; glow: string; text: string; bg: string; chip: string; chipText: string }
function themeFor(m?: BadgeTier | null): Theme {
  if (!m) return { frame: 'linear-gradient(160deg, #6CB4CC, #6CB4CC55 40%, #6CB4CC)', edge: '#6CB4CC', glow: 'rgb(108 180 204 / .35)', text: '#BFE3EF', bg: 'linear-gradient(180deg, #0D3380 0%, #061A47 55%, #031033 100%)', chip: '#6CB4CC', chipText: '#0A0F33' }
  const t = TIER_STYLE[m]
  return {
    frame: `linear-gradient(155deg, ${t.light} 0%, ${t.edge} 30%, ${t.dark} 55%, ${t.edge} 80%, ${t.light} 100%)`,
    edge: t.edge, glow: `${t.edge}80`, text: t.text,
    bg: `radial-gradient(110% 60% at 50% 0%, ${t.light}40, transparent 62%), linear-gradient(180deg, ${t.dark} 0%, ${t.deep} 78%)`,
    chip: `linear-gradient(180deg, ${t.light}, ${t.edge})`, chipText: m === 'black' ? '#FFFFFF' : '#0A0F33',
  }
}
const HEX = 'polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'

function MiniMedal({ b }: { b: BadgeState }) {
  const t = TIER_STYLE[b.def.tier]
  const Icon = BADGE_ICONS[b.def.icon]
  return (
    <span className="relative inline-block h-[2.15em] w-[2em] shrink-0" title={`${b.def.name} · ${TIER_LABEL[b.def.tier]}`}>
      <span className="absolute inset-0" style={{ clipPath: HEX, background: `linear-gradient(160deg, ${t.light}, ${t.edge} 45%, ${t.dark})` }} />
      <span className="absolute inset-[1.5px] flex items-center justify-center" style={{ clipPath: HEX, background: `radial-gradient(circle at 35% 25%, ${t.edge}, ${t.deep} 80%)` }}>
        <Icon className="size-[1em] text-white" />
      </span>
    </span>
  )
}

/**
 * Photo de la carte (style Ultimate Team) :
 *  - version détourée en GRAND (~60 % de la hauteur de la carte), posée sur le fond, tête qui mord sur le
 *    bandeau du haut, ombre portée sous le joueur ;
 *  - sinon photo originale recadrée proprement dans une fenêtre arrondie (secours) ;
 *  - sinon silhouette aux couleurs du club.
 */
function CardPhoto({ cutout, photo, initials, color }: { cutout?: string; photo?: string; initials: string; color: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const fade = 'linear-gradient(to bottom, #000 80%, transparent 100%)'
  if (cutout && failed !== cutout) {
    return (
      <>
        {/* ombre au sol sous le joueur */}
        <div className="pointer-events-none absolute bottom-[1%] right-[4%] h-[9%] w-[56%] rounded-[50%] bg-black/55 blur-[6px]" aria-hidden />
        <img src={cutout} alt="" onError={() => setFailed(cutout)} draggable={false}
          className="absolute bottom-0 right-[-4%] h-[104%] w-[72%] object-contain object-bottom [filter:drop-shadow(0_8px_10px_rgb(0_0_0/.45))_drop-shadow(0_0_1px_rgb(0_0_0/.4))]"
          style={{ maskImage: fade, WebkitMaskImage: fade }} />
      </>
    )
  }
  if (photo && failed !== photo) {
    const m = 'linear-gradient(to bottom, #000 70%, transparent 100%)'
    return (
      <div className="absolute bottom-0 right-[5%] h-[90%] w-[60%] overflow-hidden rounded-t-[999px] shadow-[0_10px_24px_rgb(0_0_0/.45)] ring-2 ring-white/15" style={{ maskImage: m, WebkitMaskImage: m }}>
        <img src={photo} alt="" onError={() => setFailed(photo)} draggable={false} className="size-full object-cover object-[50%_18%]" />
      </div>
    )
  }
  return (
    <div className="absolute bottom-0 right-[2%] flex h-[80%] w-[60%] items-end justify-center" aria-hidden>
      <svg viewBox="0 0 100 110" className="h-full w-full" style={{ color }}>
        <defs><linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".75" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        <circle cx="50" cy="34" r="19" fill="url(#sil)" /><path d="M10 110c2-30 18-46 40-46s38 16 40 46z" fill="url(#sil)" />
      </svg>
      <span className="absolute top-[22%] font-display text-[2.4em] font-black text-white/85">{initials}</span>
    </div>
  )
}

export function PlayerCard(p: PlayerCardProps) {
  const [flipped, setFlipped] = useState(false)
  const tier = themeFor(p.material)
  const medals = p.medals ?? []
  const color = p.team?.primary_color ?? '#6CB4CC'
  const logo = p.team?.logo_url || (p.teamName ? teamLogoSvg(p.teamName.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase(), '#6CB4CC', '#0B2E73') : undefined)
  const teamLabel = p.team?.name ?? p.teamName ?? ''
  const toggle = () => setFlipped((f) => !f)
  return (
    <div
      className={cn('pcard group aspect-[63/92] w-full cursor-pointer select-none outline-none', p.className)}
      data-flipped={flipped}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${p.firstName} ${p.lastName} — ${flipped ? 'afficher le recto' : 'retourner la carte'}`}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
    >
      <div className="pcard-inner text-[clamp(8.5px,4.6cqw,13px)]">
        {/* ---------- RECTO ---------- */}
        <div className="pcard-face pcard-shape overflow-hidden rounded-b-2xl group-focus-visible:outline-2 group-focus-visible:outline-neon" style={{ background: tier.frame, padding: 2, filter: `drop-shadow(0 14px 22px ${tier.glow})` }}>
          <div className="pcard-shape relative flex h-full flex-col overflow-hidden rounded-b-[14px]" style={{ background: tier.bg }}>
            <div className="pcard-sheen pointer-events-none absolute inset-0" />
            {p.material && <div className="absolute inset-x-0 top-[2.6%] text-center text-[.7em] font-extrabold tracking-[.2em]" style={{ color: tier.text }}>{TIER_LABEL[p.material].toUpperCase()}</div>}
            {/* zone photo : le joueur détouré est posé sur le fond de la carte */}
            <div className="relative h-[60%] shrink-0">
              <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 55% at 62% 58%, ${color}55, transparent 70%)` }} />
              <div className="pointer-events-none absolute right-[-6%] top-[14%] font-display text-[9em] font-black leading-none opacity-[.07]" aria-hidden>{(p.lastName[0] ?? '').toUpperCase()}</div>
              <CardPhoto cutout={p.cutoutUrl} photo={p.photoUrl} initials={(p.firstName.replace('.', '')[0] ?? '') + (p.lastName[0] ?? '')} color={color} />
              {/* colonne gauche : note, rôle, club, IPG */}
              <div className="absolute left-[7%] top-[13%] z-10 flex flex-col items-center leading-none">
                <div className={cn('font-display font-black leading-[.85] text-white', String(p.rating).length > 3 ? 'text-[2.7em]' : 'text-[3.6em]')} style={{ textShadow: `0 2px 0 rgb(0 0 0 / .35), 0 0 18px ${tier.glow}` }}>{p.rating}</div>
                <div className="mt-[.25em] text-[.85em] font-extrabold tracking-wider" style={{ color: tier.text }}>{p.ratingLabel}</div>
                {(p.position === 'GK' || p.captain) && <div className="mt-[.35em] font-display text-[1.35em] font-extrabold leading-none text-white/90" title={[p.position === 'GK' && 'Gardien', p.captain && 'Capitaine'].filter(Boolean).join(' · ')}>{[p.position === 'GK' && 'GB', p.captain && 'C'].filter(Boolean).join(' · ')}</div>}
                <div className="my-[.45em] h-px w-[2.2em] bg-white/25" />
                {logo && <img src={logo} alt="" className={cn('size-[2.6em] object-contain', isBrandLogo(logo) ? 'rounded-[22%] bg-white shadow-[0_3px_10px_rgba(0,0,0,.45)]' : 'drop-shadow-[0_3px_6px_rgba(0,0,0,.5)]')} />}
                {p.ipg != null && <div className="mt-[.45em] rounded-md px-[.4em] py-[.15em] text-center font-display text-[.95em] font-black leading-none" style={{ background: tier.chip, color: tier.chipText }} title="Indice de performance globale">{Math.round(p.ipg)}<span className="block text-[.6em] font-extrabold tracking-wider">IPG</span></div>}
              </div>
              {p.rank != null && <div className="absolute right-[6%] top-[10%] z-10 rounded-full px-[.6em] py-[.1em] font-display text-[1.05em] font-black shadow-lg" style={{ background: tier.chip, color: tier.chipText }}>N°{p.rank}</div>}
            </div>
            <div className="relative z-10 -mt-[1.6em] px-[6%] text-center">
              <div className="truncate text-[.9em] font-semibold text-sky-soft">{p.firstName}</div>
              <div className="truncate font-display text-[2.15em] font-black uppercase leading-[.92] text-white" style={{ textShadow: '0 2px 8px rgb(0 0 0 / .6)' }}>{p.lastName}</div>
              <div className="mt-[.15em] flex items-center justify-center gap-1.5 text-[.9em] text-white/70"><span className="truncate">{teamLabel}</span>{p.delta !== undefined && <RankDelta delta={p.delta} />}</div>
              {medals.length > 0
                ? <div className="mt-[.35em] flex items-center justify-center gap-[.2em]" aria-label={`${medals.length} badges débloqués`}>{medals.slice(0, 5).map((b) => <MiniMedal key={b.def.id} b={b} />)}{medals.length > 5 && <span className="ml-[.2em] text-[.85em] font-bold text-white/70">+{medals.length - 5}</span>}</div>
                : p.badge && <div className="mt-[.3em] flex justify-center">{p.badge}</div>}
            </div>
            <div className="relative mt-auto grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 bg-black/25">
              {p.front.slice(0, 4).map((s) => (
                <div key={s.label} className="py-[.6em] text-center" title={s.hint}>
                  <div className="font-display text-[1.85em] font-extrabold leading-none text-white">{s.value}</div>
                  <div className="mt-[.15em] text-[.75em] font-bold text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
            <RotateCw className="absolute bottom-[17%] right-[5%] size-[1.1em] text-white/30 transition group-hover:text-white/70" aria-hidden />
          </div>
        </div>
        {/* ---------- VERSO ---------- */}
        <div className="pcard-face pcard-back pcard-shape overflow-hidden rounded-b-2xl" style={{ background: tier.frame, padding: 2 }}>
          <div className="pcard-shape flex h-full flex-col rounded-b-[14px] bg-white px-[8%] pb-[6%] pt-[12%] text-ink">
            <div className="flex items-center gap-[.6em]">
              {logo && <img src={logo} alt="" className={cn('size-[2.8em] object-contain', isBrandLogo(logo) && 'rounded-[22%] ring-1 ring-black/10')} />}
              <div className="min-w-0">
                <div className="truncate font-display text-[1.8em] font-black uppercase leading-none">{p.lastName}</div>
                <div className="truncate text-[.95em] text-ink/60">{p.firstName} · {teamLabel}</div>
              </div>
            </div>
            <div className="mt-[.8em] flex items-end justify-between gap-2 border-b-2 pb-[.4em]" style={{ borderColor: tier.edge }}>
              <span className="min-w-0 text-[.95em] font-bold leading-tight text-ink/65">{p.backTitle}</span>
              <span className="shrink-0 font-display text-[2.2em] font-black leading-none text-mbl">{p.rating}<span className="ml-0.5 text-[.4em] text-ink/50">{p.ratingLabel}</span></span>
            </div>
            <dl className="mt-[.2em] min-h-0 flex-1 divide-y divide-ink/10 overflow-hidden">
              {p.back.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-2 py-[.32em] text-[.98em] leading-tight" title={s.hint}>
                  <dt className="truncate text-ink/70">{s.label}</dt>
                  <dd className="shrink-0 font-display text-[1.35em] font-extrabold leading-none">{s.value}</dd>
                </div>
              ))}
            </dl>
            {medals.length > 0 && (
              <div className="mt-[.4em] flex flex-wrap items-center gap-[.2em]" aria-label="Badges débloqués">
                {medals.slice(0, 8).map((b) => <MiniMedal key={b.def.id} b={b} />)}
                <span className="ml-auto text-[.9em] font-bold text-ink/60">{medals.length}{p.badgeTotal ? ` / ${p.badgeTotal}` : ''} badges</span>
              </div>
            )}
            {p.backNote && <p className="mt-[.3em] text-[.85em] leading-snug text-ink/55">{p.backNote}</p>}
            {p.href && (
              <Link to={p.href} onClick={(e) => e.stopPropagation()} className="mt-[.6em] rounded-lg bg-[#0B2E73] py-[.65em] text-center text-[1em] font-bold text-white transition hover:bg-neon">
                Voir la fiche
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
