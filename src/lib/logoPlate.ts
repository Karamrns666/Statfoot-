// Logo d'équipe : UNE tuile identique pour toutes les équipes (carré aux coins arrondis, même bordure, même marge),
// fond réglé dans l'admin (« Fond de la tuile » : blanc, noir ou couleur de l'équipe).
// Deux versions de logo : « Logo principal » (complet, souvent large) et « Logo carré / icône » (lisible en petit).
import type { Team } from '@/types/entities'
import { isBrandLogo } from './logos'

export type LogoBg = 'auto' | 'white' | 'black' | 'transparent' | 'team'
/** choix proposés dans l'admin (« auto » et l'ancien « transparent » donnent une tuile blanche) */
export const LOGO_BG_LABEL: Partial<Record<LogoBg, string>> = { auto: 'Blanc (par défaut)', white: 'Blanc', black: 'Noir', team: 'Couleur de l’équipe' }

/** Tailles normalisées (px) — aucune autre taille n'est permise. */
export const LOGO_SIZES = { xs: 24, sm: 32, md: 40, lg: 64, xl: 96, hero: 160 } as const
export type LogoSize = keyof typeof LOGO_SIZES
/** taille demandée (nom ou px) → taille normalisée la plus proche */
export function logoSize(s: LogoSize | number | undefined): LogoSize {
  if (s == null) return 'sm'
  if (typeof s === 'string') return s
  if (s <= 27) return 'xs'
  if (s <= 35) return 'sm'
  if (s <= 52) return 'md'
  if (s <= 80) return 'lg'
  if (s <= 128) return 'xl'
  return 'hero'
}
/** xs à md : logo carré ; lg et plus : logo principal */
export const isSmallLogo = (s: LogoSize) => s === 'xs' || s === 'sm' || s === 'md'

export function logoPlate(team?: Pick<Team, 'logo_url' | 'logo_bg' | 'primary_color'> | null): { bg: string; dark: boolean } {
  const mode = (team?.logo_bg ?? 'auto') as LogoBg
  if (mode === 'black') return { bg: '#0A0A0A', dark: true }
  if (mode === 'team') return { bg: team?.primary_color ?? '#0B2E73', dark: true }
  return { bg: '#FFFFFF', dark: false }
}

/** Version du logo principal selon le fond de la tuile : claire (texte blanc) sur tuile noire / couleur. */
export function logoSrc(team?: Pick<Team, 'logo_url' | 'logo_dark_url' | 'logo_bg' | 'primary_color'> | null): string | undefined {
  if (!team?.logo_url) return undefined
  return logoPlate(team).dark && team.logo_dark_url ? team.logo_dark_url : team.logo_url
}

/** Logo principal en grand : fichier HD officiel du dépôt (/logos/…-full.png, 1000 px et plus) si la tuile est claire. */
export function logoLargeSrc(team?: Pick<Team, 'logo_url' | 'logo_dark_url' | 'logo_bg' | 'primary_color' | 'company_logo_url'> | null): string | undefined {
  const s = logoSrc(team)
  if (!s || s === team?.logo_dark_url || /\.svg(\?|#|$)/i.test(s)) return s
  return isBrandLogo(s) && isBrandLogo(team?.company_logo_url) ? team!.company_logo_url : s
}

/** Symboles recadrés du logo officiel (fichiers du dépôt) : utilisés en petit UNIQUEMENT si l'admin choisit
 *  « Recadrage du logo en petit : Symbole seul ». Par défaut : logo complet. */
export const BUILTIN_ICONS: Record<string, string> = {
  cac: '/logos/cac-icone.png', pbe: '/logos/pbe-icone.png', mid: '/logos/mid-icone.png', g3c: '/logos/g3c-icone.png',
}
/** Logos carrés COMPLETS officiels (logo entier centré, fond compris) : Parebrise Express, carré fond noir 1024 px. */
export const BUILTIN_SQUARES: Record<string, string> = { pbe: '/logos/pbe-carre-noir-1024.png' }
/** logo carré « pleine tuile » (fond et marge de ~5 % compris dans le fichier) : affiché sans marge dans la tuile */
export const isBleedSquare = (u?: string) => !!u && /\/logos\/[a-z0-9]+-carre-noir-1024\.png/.test(u)
export type LogoSmall = 'full' | 'symbol'
export const LOGO_SMALL_LABEL: Record<LogoSmall, string> = { full: 'Logo complet', symbol: 'Symbole seul' }
const officialCode = (u?: string) => u?.match(/^\/logos\/([a-z0-9]+)(?:[-.?]|$)/)?.[1]

/** Logo carré / icône : celui de l'admin ; sinon le symbole recadré si « Symbole seul » est choisi ; sinon le logo
 *  carré complet officiel ; sinon rien (→ logo principal entier dans la tuile). */
export function logoSquareSrc(team?: Pick<Team, 'logo_url' | 'logo_square_url' | 'logo_small'> | null): string | undefined {
  if (!team) return undefined
  if (team.logo_square_url) return team.logo_square_url
  const c = officialCode(team.logo_url)
  if (!c) return undefined
  if (team.logo_small === 'symbol' && BUILTIN_ICONS[c]) return BUILTIN_ICONS[c]
  return BUILTIN_SQUARES[c]
}

/** Image de la tuile pour les visuels dessinés (canvas) : petite tuile → logo carré, sinon logo principal HD. */
export function tileLogo(team: Parameters<typeof logoLargeSrc>[0] & Pick<Team, 'logo_square_url' | 'logo_small'> | null | undefined, small: boolean): string | undefined {
  // petite tuile : logo carré, sinon le logo de l'équipe (fichier carré officiel, symbole lisible), marges retirées au dessin
  return small ? logoSquareSrc(team) ?? logoSrc(team) ?? logoLargeSrc(team) : logoLargeSrc(team)
}

/** Logo principal trop large pour une petite tuile (largeur > 1,6 × hauteur une fois les marges retirées) */
export const WIDE_FOR_TILE = 1.6

/** Noms courts par défaut des équipes officielles (modifiables : Admin équipe → « Nom court »). */
export const DEFAULT_SHORT_NAMES: Record<string, string> = {
  PBE: 'Parebrise Exp.', AVR: 'AV Rabat', AVC: 'AV Casa', MPT: 'Mega PT', ATW: 'Attijariwafa', ALD: 'ALD Auto',
  MID: 'Taqeef', LHJ: 'Heure Joyeuse', CAM: 'Crédit Agricole', MJM: 'Marjane',
}
/** Nom court affiché quand la place manque */
export function teamShortName(team?: Pick<Team, 'name' | 'short_name' | 'display_short'> | null): string {
  if (!team) return 'À déterminer'
  return team.display_short?.trim() || DEFAULT_SHORT_NAMES[team.short_name] || team.name
}
