import { describe, expect, it } from 'vitest'
import { DEFAULT_COLORS, colorDistance, matchColors, readableOn } from './teamColors'

describe('couleurs des équipes', () => {
  it('texte lisible sur la couleur de l’équipe', () => {
    expect(readableOn('#04163D')).toBe('#FFFFFF')
    expect(readableOn('#FFE600')).toBe('#04163D')
  })
  it('deux couleurs trop proches : la seconde passe sur sa couleur secondaire, sinon un contour', () => {
    const c = matchColors({ primary_color: '#D32F2F' }, { primary_color: '#C62828', secondary_color: '#FFFFFF' })
    expect(c.away.bg).toBe('#FFFFFF')
    const o = matchColors({ primary_color: '#D32F2F' }, { primary_color: '#C62828', secondary_color: '#B71C1C' })
    expect(o.away.outline).toBe(true)
  })
  it('couleur manquante : couleur par défaut différente pour chaque côté, signalée', () => {
    const c = matchColors({}, {})
    expect(c.home.bg).toBe(DEFAULT_COLORS.home)
    expect(c.away.bg).toBe(DEFAULT_COLORS.away)
    expect(c.home.missing && c.away.missing).toBe(true)
    expect(colorDistance(c.home.bg, c.away.bg)).toBeGreaterThan(120)
  })
})
