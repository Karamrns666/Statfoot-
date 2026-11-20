import { Link } from 'react-router-dom'
import { useTrimmedImage } from '@/hooks/useTrimmedImage'
import { logoPlate, logoSrc } from '@/lib/logoPlate'
import { useImageRatio, WIDE_LOGO } from '@/hooks/useImageRatio'
import type { Player, Position, Team } from '@/types/entities'
import { cn } from '@/lib/utils'
import { initials, playerName } from '@/lib/format'
import { teamLogoSvg } from '@/lib/logos'

export function TeamLogo({ team, size = 32, className, fluid = false }: { team?: Team | null; size?: number; className?: string; /** remplit son conteneur carré (mode TV) : pas de taille minimale, marge interne en % */ fluid?: boolean }) {
  const raw = logoSrc(team) || teamLogoSvg(team?.short_name ?? '?', team?.primary_color, team?.secondary_color)
  // marges vides retirées (les logos larges remplissent leur cadre) ; fond choisi dans l'admin équipe ;
  // version claire du logo sur fond sombre (Admin équipe → « Logo pour fond sombre »)
  const src = useTrimmedImage(team?.logo_url ? raw : null) ?? raw
  const plate = logoPlate(team)
  const brand = !!plate.bg
  // logo large (largeur > 2 × hauteur) : cadre en pilule plus large au lieu d'un carré, le logo y remplit ~88 % de la largeur
  const ratio = useImageRatio(team?.logo_url ? src : null)
  const wide = (ratio ?? 1) > WIDE_LOGO
  // cadre CARRÉ identique pour toutes les équipes : taille fixe (jamais écrasée par la largeur disponible),
  // logo entier visible (object-fit: contain) avec une marge interne, sans déformation
  if (fluid) {
    // mode TV : remplit un parent CARRÉ en position relative ; tailles en position absolue (définies sur Safari iOS,
    // contrairement à height: 100 % + aspect-ratio qui donnait une barre blanche étirée)
    const pad = wide ? '6%' : brand ? '10%' : '0%'
    return (
      <span role="img" aria-label={team?.name ?? ''} style={{ position: 'absolute', inset: wide ? '24% 0' : 0, background: plate.bg ?? undefined }}
        className={cn('block overflow-hidden', wide && brand ? 'rounded-full shadow-[0_2px_10px_rgba(0,0,0,.35)] ring-1 ring-black/5' : brand ? 'rounded-[22%] shadow-[0_2px_10px_rgba(0,0,0,.35)] ring-1 ring-black/5' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]', className)}>
        <img src={src} alt="" className="absolute max-w-none object-contain" style={{ left: pad, top: pad, width: `calc(100% - 2 * ${pad})`, height: `calc(100% - 2 * ${pad})` }} loading="lazy" draggable={false} />
      </span>
    )
  }
  const w = wide ? Math.round(size * 2) : size
  return (
    <span role="img" aria-label={team?.name ?? ''} style={{ width: w, height: size, minWidth: w, padding: wide ? `${Math.round(size * 0.14)}px ${Math.round(w * 0.06)}px` : brand ? Math.max(2, Math.round(size * 0.1)) : 0, background: plate.bg ?? undefined }}
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden', wide && brand ? 'rounded-full shadow-[0_2px_10px_rgba(0,0,0,.35)] ring-1 ring-black/5' : brand ? 'rounded-[22%] shadow-[0_2px_10px_rgba(0,0,0,.35)] ring-1 ring-black/5' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]', className)}>
      <img src={src} alt="" className="block size-full max-w-none object-contain" loading="lazy" draggable={false} />
    </span>
  )
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
        ? <img src={player.photo_url} alt={playerName(player)} className="size-full object-cover object-[50%_18%]" />
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
