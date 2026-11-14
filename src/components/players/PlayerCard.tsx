// Carte joueur à collectionner façon « Ultimate Team » : photo détourée en grand posée sur la carte,
// note (XP ou IPG), rôle, logo du club, nom et stats principales. La couleur suit le badge d'ancienneté
// du club (Platinum nacré · Gold · Silver) ; en haut à droite, jusqu'à 3 badges de performance, du plus
// rare au plus courant. Verso blanc, retournement 3D au clic (ou Entrée / Espace).
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import type { Position, Team } from '@/types/entities'
import { isBrandLogo, teamLogoSvg } from '@/lib/logos'
import { cn } from '@/lib/utils'
import { RankDelta } from '@/components/league/Bits'
import { BadgeEmblem } from '@/components/badges/BadgeEmblem'
import { useBadgeMeta, useSortByRarity } from '@/hooks/useBadgeMeta'
import { RARITY_LABEL } from '@/lib/badgeCatalog'
import type { BadgeState } from '@/lib/badges'
import { SENIORITY_STYLE, type SeniorityTier } from '@/lib/seniority'
import { TierRibbon, TierSurface } from '@/components/cards/TierSurface'
import { useCardShine } from '@/hooks/useCardShine'

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
  /** IPG : nombre, ou « – » tant qu'il n'est pas calculé */
  ipg?: number | string
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
  /** couleur de la carte = ancienneté du club (Platinum / Gold / Silver) ; Silver par défaut */
  tier?: SeniorityTier | null
  /** badges débloqués, du plus rare au plus courant */
  medals?: BadgeState[]
  badgeTotal?: number
  className?: string
  /** recto seul, sans retournement (export PNG) */
  faceOnly?: boolean
}


export const medalTip = (b: BadgeState, rarity?: string) => `${b.def.name}${rarity ? ` · ${rarity}` : ''} — ${b.def.description}`
function MiniMedal({ b, big }: { b: BadgeState; big?: boolean }) {
  const meta = useBadgeMeta()(b.def.id)
  const tip = medalTip(b, RARITY_LABEL[meta.rarity])
  return (
    <span className={cn('relative inline-block shrink-0 drop-shadow-[0_2px_3px_rgb(0_0_0/.4)]', big ? 'w-[2.7em]' : 'w-[2.1em]')} title={tip}>
      <BadgeEmblem fluid simple pictogram={meta.pictogram} rarity={meta.rarity} title={tip} />
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
  const toggle = () => setFlipped((f) => !f)
  const shine = useCardShine<HTMLDivElement>()
  if (p.faceOnly) return <div className={cn('pcard aspect-[63/92] w-full', p.className)}><div className="pcard-inner text-[clamp(8.5px,4.6cqw,40px)]"><CardFront p={p} /></div></div>
  return (
    <div
      className={cn('pcard group aspect-[63/92] w-full cursor-pointer select-none outline-none', p.className)}
      data-flipped={flipped}
      {...shine}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${p.firstName} ${p.lastName} — ${flipped ? 'afficher le recto' : 'retourner la carte'}`}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
    >
      <div className="pcard-inner text-[clamp(8.5px,4.6cqw,13px)]">
        <CardFront p={p} />
        <CardBack p={p} />
      </div>
    </div>
  )
}

function cardLogo(p: PlayerCardProps) {
  return p.team?.logo_url || (p.teamName ? teamLogoSvg(p.teamName.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase(), '#6CB4CC', '#0B2E73') : undefined)
}

function CardFront({ p }: { p: PlayerCardProps }) {
  const sortByRarity = useSortByRarity()
  const tier = p.tier ?? 'silver'
  const st = SENIORITY_STYLE[tier]
  const medals = sortByRarity(p.medals ?? []).slice(0, 3)
  const color = p.team?.primary_color ?? '#0B2E73'
  const logo = cardLogo(p)
  const teamLabel = p.team?.name ?? p.teamName ?? ''
  return (
    <TierSurface tier={tier} className="group-focus-visible:outline-2 group-focus-visible:outline-neon">
        <TierRibbon tier={tier} extra={p.rank != null && <span className="ml-[.2em] rounded-full px-[.5em] py-[.12em] tracking-normal" style={{ background: st.bar, color: st.barText }}>N°{p.rank}</span>} />
        {/* zone photo : le joueur détouré est posé sur le fond de la carte */}
        <div className="relative h-[61%] shrink-0">
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(58% 52% at 60% 60%, ${color}44, transparent 70%)` }} />
          <div className="pointer-events-none absolute right-[-6%] top-[14%] font-display text-[9em] font-black leading-none opacity-[.08]" aria-hidden>{(p.lastName[0] ?? '').toUpperCase()}</div>
          <CardPhoto cutout={p.cutoutUrl} photo={p.photoUrl} initials={(p.firstName.replace('.', '')[0] ?? '') + (p.lastName[0] ?? '')} color={color} />
          {/* colonne gauche : note, rôle, club, IPG */}
          <div className="absolute left-[7%] top-[13%] z-10 flex flex-col items-center leading-none">
            <div className={cn('font-display font-black leading-[.85]', String(p.rating).length > 3 ? 'text-[2.7em]' : 'text-[3.6em]')} style={{ textShadow: st.textShadow }}>{p.rating}</div>
            <div className="mt-[.25em] text-[.85em] font-extrabold tracking-wider" style={{ color: st.fgSoft }}>{p.ratingLabel}</div>
            {(p.position === 'GK' || p.captain) && <div className="mt-[.35em] font-display text-[1.35em] font-extrabold leading-none" title={[p.position === 'GK' && 'Gardien', p.captain && 'Capitaine'].filter(Boolean).join(' · ')}>{[p.position === 'GK' && 'GB', p.captain && 'C'].filter(Boolean).join(' · ')}</div>}
            <div className="my-[.45em] h-[2px] w-[2.2em] rounded-full bg-[#F05A22]" />
            {logo && <img src={logo} alt="" className={cn('size-[2.6em] object-contain', isBrandLogo(logo) ? 'rounded-[22%] bg-white shadow-[0_3px_10px_rgba(0,0,0,.3)] ring-1 ring-black/5' : 'drop-shadow-[0_3px_6px_rgba(0,0,0,.35)]')} />}
            {p.ipg != null && <div className="mt-[.45em] rounded-md px-[.4em] py-[.15em] text-center font-display text-[.95em] font-black leading-none" style={{ background: st.chip, color: st.chipText }} title={typeof p.ipg === 'number' ? 'Indice de performance globale' : 'Indice calculé après le premier match'}>{typeof p.ipg === 'number' ? Math.round(p.ipg) : p.ipg}<span className="block text-[.6em] font-extrabold tracking-wider">IPG</span></div>}
          </div>
          {/* coin haut droit : 3 meilleurs badges de performance (plus rare d'abord) */}
          {medals.length > 0 && (
            <div className="absolute right-[5.5%] top-[11%] z-10 flex flex-col items-center gap-[.25em]" aria-label={`Meilleurs badges : ${medals.map((b) => b.def.name).join(', ')}`}>
              {medals.map((b) => <MiniMedal key={b.def.id} b={b} big />)}
            </div>
          )}
        </div>
        <div className="relative z-10 -mt-[1.5em] px-[6%] text-center">
          <div className="truncate text-[.9em] font-bold" style={{ color: st.fgSoft }}>{p.firstName}</div>
          <div className="truncate font-display text-[2.15em] font-black uppercase leading-[.92]" style={{ textShadow: st.textShadow }}>{p.lastName}</div>
          <div className="mt-[.15em] flex items-center justify-center gap-1.5 text-[.9em] font-semibold" style={{ color: st.fgSoft }}><span className="truncate">{teamLabel}</span>{p.delta !== undefined && <RankDelta delta={p.delta} />}</div>
          {!medals.length && p.badge && <div className="mt-[.3em] flex justify-center">{p.badge}</div>}
        </div>
        <div className="relative mt-auto grid grid-cols-4 divide-x divide-white/15 border-t-[.22em] border-[#F05A22]" style={{ background: st.bar, color: st.barText }}>
          {p.front.slice(0, 4).map((s) => (
            <div key={s.label} className="py-[.6em] text-center" title={s.hint}>
              <div className="font-display text-[1.85em] font-extrabold leading-none">{s.value}</div>
              <div className="mt-[.15em] text-[.75em] font-bold" style={{ color: st.barLabel }}>{s.label}</div>
            </div>
          ))}
        </div>
        {!p.faceOnly && <RotateCw className="absolute bottom-[17%] right-[5%] size-[1.1em] opacity-40 transition group-hover:opacity-80" aria-hidden />}
    </TierSurface>
  )
}

function CardBack({ p }: { p: PlayerCardProps }) {
  const st = SENIORITY_STYLE[p.tier ?? 'silver']
  const medals = p.medals ?? []
  const logo = cardLogo(p)
  const teamLabel = p.team?.name ?? p.teamName ?? ''
  return (
    <div className="pcard-face pcard-back pcard-shape overflow-hidden rounded-b-2xl" style={{ background: st.frame, padding: 3 }}>
      <div className="pcard-shape flex h-full flex-col rounded-b-[13px] bg-white px-[8%] pb-[6%] pt-[12%] text-ink">
        <div className="flex items-center gap-[.6em]">
          {logo && <img src={logo} alt="" className={cn('size-[2.8em] object-contain', isBrandLogo(logo) && 'rounded-[22%] ring-1 ring-black/10')} />}
          <div className="min-w-0">
            <div className="truncate font-display text-[1.8em] font-black uppercase leading-none">{p.lastName}</div>
            <div className="truncate text-[.95em] text-ink/60">{p.firstName} · {teamLabel}</div>
          </div>
        </div>
        <div className="mt-[.8em] flex items-end justify-between gap-2 border-b-2 border-[#F05A22] pb-[.4em]">
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
  )
}
