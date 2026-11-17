// Couleurs des équipes dans le match centre et le mode TV : couleur principale de l'équipe, texte lisible calculé
// automatiquement, et si les deux équipes se ressemblent trop, la seconde passe sur sa couleur secondaire ou sur un contour.
import type { CSSProperties } from 'react'
import type { Team } from '@/types/entities'

export const DEFAULT_COLORS = { home: '#1565C0', away: '#C62828' } as const

const rgb = (hex?: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex ?? '').trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
const lum = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/** Texte blanc ou bleu nuit, celui qui contraste le plus avec la couleur de fond */
export function readableOn(hex: string): string {
  const c = rgb(hex); if (!c) return '#FFFFFF'
  const L = lum(c)
  return contrast(L, 1) >= contrast(L, lum([4, 22, 61])) ? '#FFFFFF' : '#04163D'
}

/** Écart perçu entre deux couleurs (0 = identiques) — distance « redmean » */
export function colorDistance(a?: string, b?: string): number {
  const x = rgb(a), y = rgb(b); if (!x || !y) return 999
  const rm = (x[0] + y[0]) / 2, dr = x[0] - y[0], dg = x[1] - y[1], db = x[2] - y[2]
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}
const TOO_CLOSE = 120

export interface SideColor { bg: string; fg: string; outline: boolean; missing: boolean }

export function matchColors(home?: Pick<Team, 'primary_color' | 'secondary_color'> | null, away?: Pick<Team, 'primary_color' | 'secondary_color'> | null): { home: SideColor; away: SideColor } {
  const hBg = rgb(home?.primary_color) ? home!.primary_color! : DEFAULT_COLORS.home
  const h: SideColor = { bg: hBg, fg: readableOn(hBg), outline: false, missing: !rgb(home?.primary_color) }
  let aBg = rgb(away?.primary_color) ? away!.primary_color! : DEFAULT_COLORS.away
  const aMissing = !rgb(away?.primary_color)
  if (aMissing && colorDistance(aBg, hBg) < TOO_CLOSE) aBg = DEFAULT_COLORS.home === hBg ? DEFAULT_COLORS.away : DEFAULT_COLORS.home
  let outline = false
  if (colorDistance(aBg, hBg) < TOO_CLOSE) {
    if (rgb(away?.secondary_color) && colorDistance(away!.secondary_color, hBg) >= TOO_CLOSE) aBg = away!.secondary_color!
    else outline = true
  }
  const a: SideColor = outline ? { bg: 'transparent', fg: '#FFFFFF', outline: true, missing: aMissing } : { bg: aBg, fg: readableOn(aBg), outline: false, missing: aMissing }
  return { home: h, away: a }
}

/** Style d'un bouton / bandeau aux couleurs de l'équipe */
export function sideStyle(c: SideColor, opts: { dim?: boolean } = {}): CSSProperties {
  if (c.outline) return { background: opts.dim ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)', color: c.fg, boxShadow: 'inset 0 0 0 3px #FFFFFF' }
  return { background: c.bg, color: c.fg, opacity: opts.dim ? 0.55 : 1 }
}
