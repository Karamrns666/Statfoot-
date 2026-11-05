import { describe, expect, it } from 'vitest'
import { alphaBox, bustFrame, cleanEdges, mainSubject } from './cutoutProcess'

/** image W×H avec des rectangles opaques */
function img(w: number, h: number, rects: [number, number, number, number][]) {
  const a = new Uint8Array(w * h)
  for (const [x0, y0, x1, y1] of rects) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) a[y * w + x] = 255
  return a
}

describe('post-traitement du détourage', () => {
  it('garde seulement le joueur au premier plan (grand, centré), pas les personnes en arrière-plan', () => {
    const w = 400, h = 600
    // joueur au centre (grand), deux petites silhouettes au fond sur les côtés
    const a = img(w, h, [[150, 100, 250, 599], [10, 300, 50, 420], [340, 280, 390, 400]])
    const s = mainSubject((i) => a[i], w, h)!
    expect(s.components).toBe(3)
    expect(s.upright).toBe(true)
    expect(s.areaFraction).toBeGreaterThan(0.1)
    expect(s.keep(200, 300)).toBe(true)
    expect(s.keep(30, 350)).toBe(false)
    expect(s.keep(360, 350)).toBe(false)
  })
  it('filet ou grillage devant / derrière le joueur : les fils fins sont supprimés, le joueur reste', () => {
    const w = 600, h = 600
    const rects: [number, number, number, number][] = []
    for (let x = 0; x < w; x += 40) rects.push([x, 0, x + 2, h - 1]) // fils verticaux
    for (let y = 0; y < h; y += 40) rects.push([0, y, w - 1, y + 2]) // fils horizontaux
    rects.push([250, 150, 350, 599]) // joueur
    const a = img(w, h, rects)
    const s = mainSubject((i) => a[i], w, h)!
    expect(s.keep(300, 400)).toBe(true) // le joueur
    expect(s.keep(41, 500)).toBe(false) // fil loin du joueur
    expect(s.keep(560, 81)).toBe(false)
  })
  it('photo inadaptée (barre horizontale, joueur minuscule) : signalée', () => {
    const a = img(600, 400, [[0, 20, 599, 60], [300, 300, 306, 320]])
    const s = mainSubject((i) => a[i], 600, 400)!
    expect(s.upright && s.areaFraction >= 0.02).toBe(false)
  })
  it('cadre en buste un joueur en pied, centré sur la tête', () => {
    const w = 400, h = 900
    // tête (x 170–230) + corps décalé à droite, en pied
    const a = img(w, h, [[170, 50, 230, 130], [140, 131, 300, 880]])
    const box = alphaBox((i) => a[i], w, h)!
    expect(box).toEqual({ x0: 140, y0: 50, x1: 300, y1: 880 })
    const f = bustFrame((i) => a[i], w, h, box)
    const headX = 200
    expect(Math.abs((f.x0 + f.x1) / 2 - headX)).toBeLessThanOrEqual(1) // tête centrée
    expect(f.y1 - f.y0).toBeLessThan(880 - 50) // mi-corps, pas en pied
    expect(f.y0).toBeLessThanOrEqual(50) // tête en haut, avec marge
  })
  it('bords : voile presque transparent supprimé, pas de halo clair sur le contour', () => {
    const w = 5, h = 1
    // [blanc presque transparent | bord blanc semi-transparent | intérieur rouge opaque ×3]
    const px = new Uint8ClampedArray([255, 255, 255, 30, 255, 255, 255, 160, 200, 0, 0, 255, 200, 0, 0, 255, 200, 0, 0, 255])
    cleanEdges(px, w, h)
    expect(px[3]).toBe(0) // voile supprimé
    expect(px[7]).toBeGreaterThan(0) // bord conservé…
    expect([px[4], px[5], px[6]]).toEqual([200, 0, 0]) // …mais teinté comme l'intérieur (plus de blanc)
  })
})
