import { Link } from 'react-router-dom'
import type { Player, Position, Team } from '@/types/entities'
import { cn } from '@/lib/utils'
import { initials, POSITION_COLOR, POSITION_LABEL, playerName } from '@/lib/format'
import { teamLogoSvg } from '@/lib/logos'

export function TeamLogo({ team, size = 32, className }: { team?: Team | null; size?: number; className?: string }) {
  const src = team?.logo_url || teamLogoSvg(team?.short_name ?? '?', team?.primary_color, team?.secondary_color)
  return <img src={src} alt={team?.name ?? ''} width={size} height={size} style={{ width: size, height: size }} className={cn('shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]', className)} loading="lazy" />
}

export function TeamName({ team, link = true, short = false, className }: { team?: Team | null; link?: boolean; short?: boolean; className?: string }) {
  if (!team) return <span className={className}>À déterminer</span>
  const label = short ? team.short_name : team.name
  return link ? <Link to={`/equipes/${team.id}`} className={cn('hover:text-neon transition-colors', className)}>{label}</Link> : <span className={className}>{label}</span>
}

export function PlayerAvatar({ player, team, size = 40, className }: { player?: Player | null; team?: Team | null; size?: number; className?: string }) {
  const color = team?.primary_color ?? '#F85A00'
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-full', className)} style={{ width: size, height: size, boxShadow: `0 0 0 2px ${color}, 0 0 16px -2px ${color}88` }}>
      {player?.photo_url
        ? <img src={player.photo_url} alt={playerName(player)} className="size-full object-cover" />
        : <div className="flex size-full items-center justify-center font-display font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${color}55, #04163D)`, fontSize: size * 0.38 }}>{initials(player)}</div>}
    </div>
  )
}

export function PositionBadge({ position, className }: { position: Position; className?: string }) {
  const c = POSITION_COLOR[position]
  return <span className={cn('inline-flex h-5 min-w-9 items-center justify-center rounded px-1.5 font-display text-[11px] font-extrabold tracking-wider', className)} style={{ color: c, background: `${c}22`, boxShadow: `inset 0 0 0 1px ${c}55` }}>{POSITION_LABEL[position]}</span>
}

export function PlayerLink({ player, className, short }: { player?: Player | null; className?: string; short?: boolean }) {
  if (!player) return <span className={className}>—</span>
  return <Link to={`/joueurs/${player.id}`} className={cn('hover:text-neon transition-colors', className)}>{short ? `${player.first_name.charAt(0)}. ${player.last_name}` : playerName(player)}</Link>
}
