// Médaille de badge : écusson hexagonal à la couleur du rang (commun → légendaire), grisé tant qu'il est verrouillé.
import { CircleDot, Crosshair, Crown, Flame, Footprints, Gem, Hand, Link2, Lock, Medal, Shield, Star, Zap } from 'lucide-react'
import { TIER_COLOR, TIER_LABEL, type BadgeIcon, type BadgeState } from '@/lib/badges'
import { cn } from '@/lib/utils'

const ICONS: Record<BadgeIcon, typeof Star> = { ball: CircleDot, boot: Footprints, target: Crosshair, flame: Flame, star: Star, shield: Shield, hand: Hand, crown: Crown, bolt: Zap, medal: Medal, gem: Gem, link: Link2 }
const HEX = 'polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'

export function BadgeMedal({ b, size = 64 }: { b: BadgeState; size?: number }) {
  const color = TIER_COLOR[b.def.tier]
  const hidden = b.def.secret && !b.unlocked
  const Icon = hidden ? Lock : ICONS[b.def.icon]
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 1.08 }} aria-hidden>
      <div className="absolute inset-0" style={{ clipPath: HEX, background: b.unlocked ? `linear-gradient(160deg, ${color}, ${color}66)` : 'rgb(169 214 229 / .16)' }} />
      <div className="absolute inset-[3px] flex items-center justify-center" style={{ clipPath: HEX, background: b.unlocked ? `radial-gradient(circle at 35% 25%, ${color}55, #06194A 70%)` : '#071D48' }}>
        <Icon className={cn(b.unlocked ? 'text-white' : 'text-white/25')} style={{ width: size * 0.42, height: size * 0.42, filter: b.unlocked ? `drop-shadow(0 0 8px ${color})` : undefined }} />
      </div>
    </div>
  )
}

export function BadgeTile({ b }: { b: BadgeState }) {
  const hidden = b.def.secret && !b.unlocked
  const color = TIER_COLOR[b.def.tier]
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border p-3 text-center transition', b.unlocked ? 'border-white/10 bg-white/[.04]' : 'border-white/5 bg-transparent')} title={hidden ? 'Badge secret' : b.def.description}>
      <BadgeMedal b={b} />
      <div className={cn('mt-2 font-display text-[17px] font-extrabold leading-tight', !b.unlocked && 'text-white/55')}>{hidden ? '???' : b.def.name}</div>
      <div className="text-[11px] font-semibold" style={{ color: b.unlocked ? color : 'rgb(157 184 222 / .7)' }}>{TIER_LABEL[b.def.tier]}</div>
      {!hidden && <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.def.description}</div>}
      {b.unlocked
        ? <div className="mt-1 text-[11px] text-muted-foreground">Débloqué en J{b.unlocked_round}</div>
        : hidden ? <div className="mt-1 text-[11px] text-muted-foreground">Badge secret</div>
          : (
            <div className="mt-1.5 w-full">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: color }} /></div>
              <div className="mt-1 text-[11px] text-muted-foreground">{b.value} / {b.def.target}</div>
            </div>
          )}
    </div>
  )
}
