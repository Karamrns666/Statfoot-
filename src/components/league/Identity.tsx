import { Link } from 'react-router-dom'
import type { Player, Position, Team } from '@/types/entities'
import { cn } from '@/lib/utils'
import { initials, playerName } from '@/lib/format'
import { isBrandLogo, teamLogoSvg } from '@/lib/logos'

export function TeamLogo({ team, size = 32, className }: { team?: Team | null; size?: number; className?: string }) {
  const src = team?.logo_url || teamLogoSvg(team?.short_name ?? '?', team?.primary_color, team?.secondary_color)
  const brand = isBrandLogo(team?.logo_url)
  return <img src={src} alt={team?.name ?? ''} width={size} height={size} style={{ width: size, height: size }} className={cn('shrink-0 object-contain', brand ? 'rounded-[22%] bg-white shadow-[0_2px_10px_rgba(0,0,0,.35)] ring-1 ring-black/5' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]', className)} loading="lazy" />
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

/**
 * Rôles d'un joueur (6 contre 6, pas de postes) : seuls « Gardien » et « Capitaine » existent.
 * Un joueur de champ non capitaine n'affiche rien.
 */
export function RoleBadge({ position, captain, long = false, className }: { position?: Position; captain?: boolean; long?: boolean; className?: string }) {
  const roles = [
    position === 'GK' && { key: 'gk', short: 'GB', label: 'Gardien', color: '#3b82f6' },
    captain && { key: 'c', short: 'C', label: 'Capitaine', color: '#facc15' },
  ].filter(Boolean) as { key: string; short: string; label: string; color: string }[]
  if (!roles.length) return null
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {roles.map((r) => (
        <span key={r.key} title={r.label} className="inline-flex h-5 min-w-6 items-center justify-center rounded px-1.5 font-display text-[11px] font-extrabold tracking-wider" style={{ color: r.color, background: `${r.color}22`, boxShadow: `inset 0 0 0 1px ${r.color}55` }}>{long ? r.label : r.short}</span>
      ))}
    </span>
  )
}

export function PlayerLink({ player, className, short }: { player?: Player | null; className?: string; short?: boolean }) {
  if (!player) return <span className={className}>—</span>
  return <Link to={`/joueurs/${player.id}`} className={cn('hover:text-neon transition-colors', className)}>{short ? `${player.first_name.charAt(0)}. ${player.last_name}` : playerName(player)}</Link>
}
