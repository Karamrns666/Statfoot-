import { describe, expect, it } from 'vitest'
import { bustCrop, keepMainSubject, refineEdges, subjectBox, type Rgba } from './matte'

/** image RGBA de test : rectangles opaques (couleur, alpha) sur fond transparent */
function make(W: number, H: number, rects: [x0: number, y0: number, x1: number, y1: number, rgb: [number, number, number], a?: number][]): Rgba {
  const data = new Uint8ClampedArray(W * H * 4)
  for (const [x0, y0, x1, y1, [r, g, b], a = 255] of rects) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a }
  return { data, width: W, height: H }
}
const alphaAt = (img: Rgba, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3]

describe('post-traitement du détourage', () => {
  it('ne garde que le joueur au premier plan (les personnes en arrière-plan sont effacées)', () => {
    // joueur (grand) + deux silhouettes plus petites détachées sur les côtés + ballon tenu dans le cadre du joueur
    const img = make(400, 400, [[150, 40, 250, 400, [200, 50, 30]], [10, 200, 50, 300, [20, 20, 20]], [330, 220, 380, 330, [20, 20, 20]], [200, 300, 215, 315, [255, 255, 255]]])
    img.data.fill(0, (310 * 400 + 200) * 4, (310 * 400 + 200) * 4) // (aucun effet, lisibilité)
    const r = keepMainSubject(img)
    expect(r.removed).toBeGreaterThan(0)
    expect(alphaAt(img, 200, 100)).toBe(255) // joueur gardé
    expect(alphaAt(img, 30, 250)).toBe(0) // personne à gauche effacée
    expect(alphaAt(img, 350, 250)).toBe(0) // personne à droite effacée
  })
  it('bords : liseré d’ancien fond retiré et couleurs de bord reprises du joueur (pas de halo)', () => {
    // joueur rouge, entouré d'un liseré semi-transparent blanc (reste du fond)
    const img = make(60, 60, [[18, 18, 42, 42, [255, 255, 255], 120], [20, 20, 40, 40, [200, 0, 0]]])
    refineEdges(img)
    const i = (19 * 60 + 30) * 4 // ancien liseré blanc
    expect(img.data[i + 3]).toBeLessThan(120)
    const j = (20 * 60 + 30) * 4 // bord du joueur : adouci, couleur rouge (pas blanche)
    expect(img.data[j + 3]).toBeGreaterThan(0)
    expect(img.data[j + 3]).toBeLessThan(255)
    expect(img.data[j]).toBeGreaterThan(150)
    expect(img.data[j + 1]).toBeLessThan(60)
    expect(alphaAt(img, 30, 30)).toBe(255) // intérieur intact
  })
  it('cadrage buste : tête en haut, centré sur la tête, coupé vers le haut des cuisses pour une photo en pied', () => {
    const img = make(600, 1000, [[270, 100, 330, 170, [200, 160, 130]], [220, 170, 380, 950, [248, 90, 0]]])
    const s = subjectBox(img)!
    expect(s.box).toEqual({ x0: 220, y0: 100, x1: 379, y1: 949 })
    expect(Math.round(s.head.x)).toBe(300)
    const c = bustCrop(s.box, s.head.x, 1000)
    expect(c.full).toBe(true)
    expect(c.y).toBeLessThanOrEqual(100)
    expect(c.y + c.h).toBeLessThan(700) // coupé avant les genoux
    expect(Math.abs(c.x + c.w / 2 - 300)).toBeLessThanOrEqual(1)
    expect(c.w / c.h).toBeCloseTo(0.8, 1)
  })
})
