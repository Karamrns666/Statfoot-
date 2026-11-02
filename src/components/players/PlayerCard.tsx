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
      <div className="pcard-inner transition-transform group-focus-visible:[&>div]:ring-2 group-focus-visible:[&>div]:ring-neon">
        {/* ---------- RECTO ---------- */}
        <div className="pcard-face pcard-shape overflow-hidden rounded-b-2xl" style={{ background: `linear-gradient(160deg, ${tier.edge}, ${tier.edge}55 40%, ${tier.edge})`, padding: 2, filter: `drop-shadow(0 14px 22px ${tier.glow})` }}>
          <div className="pcard-shape relative flex h-full flex-col overflow-hidden rounded-b-[14px]" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${color}40, transparent 60%), linear-gradient(180deg, #0D3380 0%, #061A47 55%, #031033 100%)` }}>
            {/* filigrane terrain */}
            <svg className="pointer-events-none absolute inset-x-0 bottom-[22%] h-1/2 w-full opacity-[.07]" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
              <g fill="none" stroke="#fff" strokeWidth=".8"><rect x="4" y="4" width="92" height="52" /><line x1="50" y1="4" x2="50" y2="56" /><circle cx="50" cy="30" r="10" /></g>
            </svg>
            <div className="pcard-sheen pointer-events-none absolute inset-0" />
            <div className="relative flex items-start justify-between px-[8%] pt-[14%]">
              <div className="leading-none">
                <div className="font-display text-[clamp(1.6rem,19cqw,3.2rem)] font-black leading-[.85] text-white" style={{ textShadow: `0 0 18px ${tier.glow}` }}>{p.rating}</div>
                <div className="mt-1 text-[10px] font-bold tracking-wide" style={{ color: tier.text }}>{p.ratingLabel}</div>
                {p.position && <div className="mt-2 font-display text-lg font-extrabold leading-none text-white/90" title={POSITION_LONG[p.position]}>{POSITION_LABEL[p.position]}</div>}
              </div>
              {logo && <img src={logo} alt="" className="size-11 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.5)]" />}
            </div>
            {/* portrait */}
            <div className="relative mx-auto -mt-2 flex aspect-square w-[52%] items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 210deg, ${color}, ${tier.edge}, ${color})`, padding: 3 }}>
                <div className="size-full overflow-hidden rounded-full bg-[#082358]">
                  {p.photoUrl
                    ? <img src={p.photoUrl} alt="" className="size-full object-cover" />
                    : <div className="flex size-full items-center justify-center font-display font-black text-white/90" style={{ fontSize: 'clamp(1.4rem, 15cqw, 2.8rem)', background: `radial-gradient(circle at 30% 25%, ${color}66, transparent 65%)` }}>{(p.firstName.replace('.', '')[0] ?? '') + (p.lastName[0] ?? '')}</div>}
                </div>
              </div>
              {p.rank != null && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 font-display text-sm font-black text-ink shadow-lg" style={{ background: tier.edge }}>N°{p.rank}</div>}
            </div>
            <div className="relative mt-4 px-3 text-center">
              <div className="truncate text-[11px] font-semibold text-sky-soft">{p.firstName}</div>
              <div className="truncate font-display text-[clamp(1.05rem,10.5cqw,1.8rem)] font-black uppercase leading-[.95] text-white">{p.lastName}</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-white/70"><span className="truncate">{teamLabel}</span>{p.delta !== undefined && <RankDelta delta={p.delta} />}</div>
              {p.badge && <div className="mt-1.5 flex justify-center">{p.badge}</div>}
            </div>
            <div className="relative mt-auto grid grid-cols-4 border-t border-white/10 bg-black/20">
              {p.front.slice(0, 4).map((s) => (
                <div key={s.label} className="py-2 text-center" title={s.hint}>
                  <div className="font-display text-xl font-extrabold leading-none text-white">{s.value}</div>
                  <div className="mt-0.5 text-[9px] font-bold text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
            <RotateCw className="absolute bottom-[19%] right-2.5 size-3.5 text-white/30 transition group-hover:text-white/70" aria-hidden />
          </div>
        </div>
        {/* ---------- VERSO ---------- */}
        <div className="pcard-face pcard-back pcard-shape overflow-hidden rounded-b-2xl" style={{ background: tier.edge, padding: 2 }}>
          <div className="pcard-shape flex h-full flex-col rounded-b-[14px] bg-white px-[8%] pb-4 pt-[15%] text-ink">
            <div className="flex items-center gap-2">
              {logo && <img src={logo} alt="" className="size-8 object-contain" />}
              <div className="min-w-0">
                <div className="truncate font-display text-xl font-black uppercase leading-none">{p.lastName}</div>
                <div className="truncate text-[11px] text-ink/60">{p.firstName} · {teamLabel}</div>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-b-2 pb-1" style={{ borderColor: tier.edge }}>
              <span className="text-[11px] font-bold text-ink/70">{p.backTitle}</span>
              <span className="font-display text-2xl font-black leading-none" style={{ color: '#0B2E73' }}>{p.rating}<span className="ml-1 text-xs text-ink/50">{p.ratingLabel}</span></span>
            </div>
            <dl className="mt-1 flex-1 divide-y divide-ink/10 overflow-hidden">
              {p.back.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-[5px] text-[12px]" title={s.hint}>
                  <dt className="text-ink/70">{s.label}</dt>
                  <dd className="font-display text-base font-extrabold leading-none">{s.value}</dd>
                </div>
              ))}
            </dl>
            {p.backNote && <p className="mt-1 text-[10px] leading-snug text-ink/55">{p.backNote}</p>}
            {p.href && (
              <Link to={p.href} onClick={(e) => e.stopPropagation()} className="mt-2 rounded-lg bg-[#0B2E73] py-2 text-center text-xs font-bold text-white transition hover:bg-neon">
                Voir la fiche du joueur
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
