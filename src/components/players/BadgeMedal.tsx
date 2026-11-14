// Médaille de badge : écusson hexagonal à la couleur du rang (commun → légendaire), grisé tant qu'il est verrouillé.
import { CircleDot, Crosshair, Crown, Flame, Footprints, Gem, Hand, Link2, Lock, Medal, Shield, Star, Zap } from 'lucide-react'
import { TIER_COLOR, TIER_LABEL, type BadgeIcon, type BadgeState } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { BadgeEmblem } from '@/components/badges/BadgeEmblem'
import { useBadgeMeta } from '@/hooks/useBadgeMeta'

export const BADGE_ICONS: Record<BadgeIcon, typeof Star> = { ball: CircleDot, boot: Footprints, target: Crosshair, flame: Flame, star: Star, shield: Shield, hand: Hand, crown: Crown, bolt: Zap, medal: Medal, gem: Gem, link: Link2, lock: Lock }

export function BadgeMedal({ b, size = 64 }: { b: BadgeState; size?: number }) {
  const meta = useBadgeMeta()(b.def.id)
  const hidden = b.def.secret && !b.unlocked
  return <BadgeEmblem pictogram={hidden ? 'lock_net' : meta.pictogram} rarity={meta.rarity} level={meta.level} locked={!b.unlocked} size={size} title={hidden ? 'Badge secret' : b.def.name} />
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
