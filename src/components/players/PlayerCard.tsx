// Carte joueur à collectionner : recto bleu MBL, verso blanc, retournement 3D au clic (ou Entrée / Espace).
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import type { Position, Team } from '@/types/entities'
import { POSITION_LABEL, POSITION_LONG } from '@/lib/format'
import { teamLogoSvg } from '@/lib/logos'
import { cn } from '@/lib/utils'
import { RankDelta } from '@/components/league/Bits'

export interface CardStat { label: string; value: ReactNode; hint?: string }
export type CardTier = 'gold' | 'orange' | 'sky'

export interface PlayerCardProps {
  firstName: string
  lastName: string
  position?: Position
  team?: Team | null
  /** nom d'équipe affiché quand l'équipe n'existe pas dans la base (ex. classement IPG) */
  teamName?: string
  photoUrl?: string
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
  tier?: CardTier
  className?: string
}

const TIER: Record<CardTier, { edge: string; glow: string; text: string }> = {
  gold: { edge: '#F5C842', glow: 'rgb(245 200 66 / .45)', text: '#FFE08A' },
  orange: { edge: '#F85A00', glow: 'rgb(248 90 0 / .45)', text: '#FFB27F' },
  sky: { edge: '#6CB4CC', glow: 'rgb(108 180 204 / .35)', text: '#BFE3EF' },
}

export const tierForRank = (rank?: number): CardTier => (!rank ? 'sky' : rank <= 3 ? 'gold' : rank <= 10 ? 'orange' : 'sky')

export function PlayerCard(p: PlayerCardProps) {
  const [flipped, setFlipped] = useState(false)
  const tier = TIER[p.tier ?? tierForRank(p.rank)]
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
        <div className="pcard-face pcard-shape overflow-hidden rounded-b-2xl group-focus-visible:outline-2 group-focus-visible:outline-neon" style={{ background: `linear-gradient(160deg, ${tier.edge}, ${tier.edge}55 40%, ${tier.edge})`, padding: 2, filter: `drop-shadow(0 14px 22px ${tier.glow})` }}>
          <div className="pcard-shape relative flex h-full flex-col overflow-hidden rounded-b-[14px]" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${color}40, transparent 60%), linear-gradient(180deg, #0D3380 0%, #061A47 55%, #031033 100%)` }}>
            <div className="pcard-sheen pointer-events-none absolute inset-0" />
            <div className="relative flex items-start justify-between px-[8%] pt-[13%]">
              <div className="leading-none">
                <div className="font-display text-[4.1em] font-black leading-[.85] text-white" style={{ textShadow: `0 0 18px ${tier.glow}` }}>{p.rating}</div>
                <div className="mt-[.3em] text-[.85em] font-bold tracking-wide" style={{ color: tier.text }}>{p.ratingLabel}</div>
                {p.position && <div className="mt-[.4em] font-display text-[1.55em] font-extrabold leading-none text-white/90" title={POSITION_LONG[p.position]}>{POSITION_LABEL[p.position]}</div>}
              </div>
              {logo && <img src={logo} alt="" className="size-[4em] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.5)]" />}
            </div>
            {/* portrait */}
            <div className="relative mx-auto -mt-[4%] flex aspect-square w-[46%] items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 210deg, ${color}, ${tier.edge}, ${color})`, padding: 3 }}>
                <div className="size-full overflow-hidden rounded-full bg-[#082358]">
                  {p.photoUrl
                    ? <img src={p.photoUrl} alt="" className="size-full object-cover" />
                    : <div className="flex size-full items-center justify-center font-display text-[3em] font-black text-white/90" style={{ background: `radial-gradient(circle at 30% 25%, ${color}66, transparent 65%)` }}>{(p.firstName.replace('.', '')[0] ?? '') + (p.lastName[0] ?? '')}</div>}
                </div>
              </div>
              {p.rank != null && <div className="absolute -bottom-[.7em] left-1/2 -translate-x-1/2 rounded-full px-[.7em] py-[.1em] font-display text-[1.2em] font-black text-ink shadow-lg" style={{ background: tier.edge }}>N°{p.rank}</div>}
            </div>
            <div className="relative mt-[1.3em] px-[6%] text-center">
              <div className="truncate text-[.95em] font-semibold text-sky-soft">{p.firstName}</div>
              <div className="truncate font-display text-[2.1em] font-black uppercase leading-[.95] text-white">{p.lastName}</div>
              <div className="mt-[.2em] flex items-center justify-center gap-1.5 text-[.95em] text-white/70"><span className="truncate">{teamLabel}</span>{p.delta !== undefined && <RankDelta delta={p.delta} />}</div>
              {p.badge && <div className="mt-[.3em] flex justify-center">{p.badge}</div>}
            </div>
            <div className="relative mt-auto grid grid-cols-4 border-t border-white/10 bg-black/20">
              {p.front.slice(0, 4).map((s) => (
                <div key={s.label} className="py-[.6em] text-center" title={s.hint}>
                  <div className="font-display text-[1.85em] font-extrabold leading-none text-white">{s.value}</div>
                  <div className="mt-[.15em] text-[.75em] font-bold text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
            <RotateCw className="absolute bottom-[19%] right-[5%] size-[1.2em] text-white/30 transition group-hover:text-white/70" aria-hidden />
          </div>
        </div>
        {/* ---------- VERSO ---------- */}
        <div className="pcard-face pcard-back pcard-shape overflow-hidden rounded-b-2xl" style={{ background: tier.edge, padding: 2 }}>
          <div className="pcard-shape flex h-full flex-col rounded-b-[14px] bg-white px-[8%] pb-[6%] pt-[12%] text-ink">
            <div className="flex items-center gap-[.6em]">
              {logo && <img src={logo} alt="" className="size-[2.8em] object-contain" />}
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
