import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrimmedImage } from '@/hooks/useTrimmedImage'
import { isBleedSquare, isSmallLogo, LOGO_SIZES, logoLargeSrc, logoPlate, logoSize, logoSquareSrc, logoSrc, teamShortName, WIDE_FOR_TILE, type LogoSize } from '@/lib/logoPlate'
import { useImageRatio } from '@/hooks/useImageRatio'
import type { Player, Position, Team } from '@/types/entities'
import { cn } from '@/lib/utils'
import { initials, playerName } from '@/lib/format'
import { teamLogoSvg } from '@/lib/logos'

/**
 * LE logo d'équipe du site (seul composant autorisé) : tuile CARRÉE aux coins arrondis, identique pour toutes les
 * équipes (même fond réglé dans l'admin, même bordure, même marge interne), logo centré en object-fit: contain.
 * Tailles normalisées uniquement : xs 24 · sm 32 · md 40 · lg 64 · xl 96 · hero 160 (une valeur en px est ramenée
 * à la plus proche). xs à md : logo carré / icône ; lg et plus : logo principal (HD).
 * `fluid` : la tuile remplit son parent carré (mode TV, projection du tirage).
 */
export function TeamLogo(p: { team?: Team | null; size?: LogoSize | number; className?: string; fluid?: boolean; /** « banner » : bandeau horizontal des cartes joueurs (remplit son parent) */ variant?: 'tile' | 'banner' }) {
  return p.variant === 'banner' ? <TeamLogoBanner team={p.team} className={p.className} /> : <TeamLogoTile {...p} />
}

function TeamLogoTile({ team, size = 'sm', className, fluid = false }: { team?: Team | null; size?: LogoSize | number; className?: string; fluid?: boolean }) {
  const s = logoSize(size), px = LOGO_SIZES[s]
  const small = isSmallLogo(s) && !fluid
  const plate = logoPlate(team)
  const square = small ? logoSquareSrc(team) : undefined
  const bleed = isBleedSquare(square)
  const main = (small ? logoSrc(team) : logoLargeSrc(team)) || teamLogoSvg(team?.short_name ?? '?', team?.primary_color, team?.secondary_color)
  const trimmed = useTrimmedImage(!square && team?.logo_url ? main : null) ?? main
  const src = square ?? trimmed
  // logo large (plus de 2 × plus large que haut) : marge latérale réduite pour qu'il occupe ~86 % de la largeur
  const ratio = useImageRatio(src)
  const wide = (ratio ?? 1) > 2
  const radius = fluid ? '22%' : Math.round(px * 0.22)
  const pad = Math.max(2, Math.round(px * 0.12)), padX = wide ? Math.max(2, Math.round(px * 0.07)) : pad
  // logo carré « pleine tuile » (fond et marge de ~5 % compris dans le fichier, ex. Parebrise Express) : sans marge
  const box = fluid ? { position: 'absolute' as const, inset: 0, padding: bleed ? 0 : wide ? '12% 7%' : '12%' } : { width: px, height: px, minWidth: px, padding: bleed ? 0 : `${pad}px ${padX}px` }
  return (
    <span role="img" aria-label={team?.name ?? ''} title={team?.name} data-team-logo={team?.id ?? ''} data-logo-size={fluid ? 'fluid' : s} data-logo-kind={square ? 'square' : 'main'}
      style={{ ...box, background: plate.bg, borderRadius: radius }}
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,.28)] ring-1 ring-inset ring-black/10', className)}>
      <img src={src} alt="" className="block size-full max-w-none object-contain" loading="lazy" decoding="async" draggable={false} />
    </span>
  )
}

/**
 * Bandeau du logo des cartes joueurs (variante dédiée) : rectangle horizontal aux coins arrondis qui remplit son
 * parent, fond réglé dans l'admin (« Fond de la tuile »), LOGO PRINCIPAL complet (version fond sombre sur noir),
 * marges vides retirées, object-fit: contain, aussi grand que le bandeau le permet.
 */
export function TeamLogoBanner({ team, className }: { team?: Team | null; className?: string }) {
  const plate = logoPlate(team)
  const main = logoLargeSrc(team) || teamLogoSvg(team?.short_name ?? '?', team?.primary_color, team?.secondary_color)
  const src = useTrimmedImage(team?.logo_url ? main : null) ?? main
  return (
    <span role="img" aria-label={team?.name ?? ''} title={team?.name} data-team-banner={team?.id ?? ''}
      className={cn('flex size-full items-center justify-center overflow-hidden rounded-[.7em] px-[5%] py-[3%] shadow-[0_.25em_.8em_rgb(0_0_0/.3)] ring-1 ring-black/5', className)}
      style={{ background: plate.bg }}>
      <img src={src} alt="" className="block h-full w-full max-w-none object-contain" decoding="async" draggable={false} />
    </span>
  )
}

/** Grand logo en filigrane (décor de fond de la page équipe) : sans tuile, opacité faible, jamais par-dessus un texte. */
export function TeamLogoWatermark({ team, className }: { team?: Team | null; className?: string }) {
  const p = logoPlate(team)
  // filigrane sur fond sombre : version claire du logo si elle existe
  const src = team?.logo_dark_url || logoLargeSrc(team)
  if (!src) return null
  return <img src={src} alt="" aria-hidden className={cn('pointer-events-none select-none object-contain', !team?.logo_dark_url && !p.dark && 'brightness-0 invert', className)} draggable={false} />
}

/** Équipe sans logo carré dont le logo principal est trop large pour une petite tuile (signalé dans l'admin). */
export function useMissingSquareLogo(team?: Team | null): boolean {
  const has = !!logoSquareSrc(team)
  const main = !has && team?.logo_url ? logoSrc(team) ?? null : null
  const trimmed = useTrimmedImage(main) ?? null
  const ratio = useImageRatio(trimmed)
  return !has && !!team?.logo_url && (ratio ?? 1) > WIDE_FOR_TILE
}

/**
 * Nom d'équipe qui n'est jamais coupé par « … » : nom complet sur une ligne s'il tient ; sinon le nom court
 * (Admin équipe → « Nom court ») ; sinon le nom passe sur 2 lignes. Nom complet toujours dans title / aria-label.
 */
export function FitName({ team, className, twoLines = true }: { team?: Team | null; className?: string; twoLines?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const full = team?.name ?? 'À déterminer', short = teamShortName(team)
  const [mode, setMode] = useState<'full' | 'short' | 'wrap'>('full')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const span = el
      // mesure du nom complet puis du nom court sur une ligne, sans modifier l'affichage tant que rien ne change
      const measure = (t: string) => { const c = document.createElement('span'); c.textContent = t; c.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit;text-transform:inherit'; span.appendChild(c); const w = c.getBoundingClientRect().width; c.remove(); return w }
      const avail = span.getBoundingClientRect().width
      if (!avail) return
      const next = measure(full) <= avail + 0.5 ? 'full' : short !== full && measure(short) <= avail + 0.5 ? 'short' : 'wrap'
      setMode((m) => (m === next ? m : next))
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(el)
    return () => ro.disconnect()
  }, [full, short])
  return (
    <span ref={ref} title={full} aria-label={full} data-team-name={team?.id ?? ''} data-name-mode={mode}
      className={cn('relative block min-w-0 max-w-full', mode === 'wrap' ? cn('break-words leading-tight', twoLines && 'line-clamp-2') : 'whitespace-nowrap', className)}>
      <span aria-hidden>{mode === 'short' ? short : full}</span>
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
