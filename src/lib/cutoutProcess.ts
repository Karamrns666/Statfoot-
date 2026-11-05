// Post-traitement d'une photo détourée (fonctions PURES sur des pixels RGBA, testables sans navigateur) :
//  1. ne garder que le joueur au premier plan (plus grande silhouette, proche du centre) — supprime les
//     restes d'autres personnes, de filets ou d'objets que le modèle aurait laissés ;
//  2. cadrer en buste / mi-corps, tête en haut, centrée sur la tête ;
//  3. bords propres : contour resserré et légèrement adouci, couleur des bords reprise de l'intérieur
//     (pas de halo blanc ni de reste de fond autour des cheveux).

export interface Box { x0: number; y0: number; x1: number; y1: number }

/** Masque binaire réduit (côté max ≈ 320 px) des pixels opaques. */
function downscaleAlpha(alpha: (i: number) => number, w: number, h: number, maxSide = 320) {
  const s = Math.max(1, Math.ceil(Math.max(w, h) / maxSide))
  const sw = Math.ceil(w / s), sh = Math.ceil(h / s)
  const m = new Uint8Array(sw * sh)
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    // pixel opaque si au moins un pixel source du bloc est franchement opaque
    let on = 0
    for (let yy = y * s; yy < Math.min(h, (y + 1) * s) && !on; yy++) for (let xx = x * s; xx < Math.min(w, (x + 1) * s); xx++) if (alpha(yy * w + xx) > 128) { on = 1; break }
    m[y * sw + x] = on
  }
  return { m, sw, sh, s }
}

/** Min / max sur un carré de rayon r (séparable) : érosion (min) ou dilatation (max) d'un masque binaire. */
export function morph(m: Uint8Array, w: number, h: number, r: number, op: 'erode' | 'dilate') {
  if (r <= 0) return m.slice()
  const pick = op === 'erode' ? 0 : 1
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 1 - pick
    for (let d = -r; d <= r; d++) { const xx = x + d; const s = xx < 0 || xx >= w ? 0 : m[y * w + xx]; if (s === pick) { v = pick; break } }
    tmp[y * w + x] = v
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 1 - pick
    for (let d = -r; d <= r; d++) { const yy = y + d; const s = yy < 0 || yy >= h ? 0 : tmp[yy * w + x]; if (s === pick) { v = pick; break } }
    out[y * w + x] = v
  }
  return out
}

/**
 * Masque (taille réduite) du sujet principal :
 *  1. « ouverture » morphologique : les structures fines (filets, grillages, poteaux, rubans fins) disparaissent,
 *     les corps restent ;
 *  2. composantes connexes : on garde celle qui ressemble le plus au joueur au premier plan
 *     (grande, plutôt verticale, centrée, touchant le bas) ;
 *  3. dilatation pour récupérer les bords fins du joueur (cheveux, doigts) ; tout le reste est effacé.
 * Renvoie une fonction keep(x, y) en coordonnées de l'image d'origine.
 */
export function mainSubject(alpha: (i: number) => number, w: number, h: number, dilate = 3) {
  const { m, sw, sh, s } = downscaleAlpha(alpha, w, h)
  const r = Math.max(2, Math.round(Math.max(sw, sh) * 0.012))
  const opened = morph(morph(m, sw, sh, r, 'erode'), sw, sh, r, 'dilate')
  const label = new Int32Array(sw * sh).fill(-1)
  const comps: { area: number; cx: number; maxY: number; minY: number; minX: number; maxX: number }[] = []
  const stack: number[] = []
  for (let i = 0; i < opened.length; i++) {
    if (!opened[i] || label[i] >= 0) continue
    const id = comps.length
    let area = 0, sx = 0, maxY = 0, minY = sh, minX = sw, maxX = 0
    label[i] = id; stack.push(i)
    while (stack.length) {
      const j = stack.pop()!
      const x = j % sw, y = (j - x) / sw
      area++; sx += x; if (y > maxY) maxY = y; if (y < minY) minY = y; if (x < minX) minX = x; if (x > maxX) maxX = x
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue
        const k = ny * sw + nx
        if (opened[k] && label[k] < 0) { label[k] = id; stack.push(k) }
      }
    }
    comps.push({ area, cx: sx / area / sw, maxY: maxY / sh, minY: minY / sh, minX, maxX })
  }
  if (!comps.length) return null
  const score = (c: (typeof comps)[number]) => {
    const bw = c.maxX - c.minX + 1, bh = (c.maxY - c.minY) * sh + 1
    const upright = bh / bw >= 0.8 ? 1 : 0.35 // un joueur est plutôt vertical ; un ruban, une barre, non
    return c.area * upright * (1 - 0.6 * Math.abs(c.cx - 0.5)) * (0.6 + 0.4 * c.maxY)
  }
  const best = comps.reduce((bi, c, i) => (score(c) > score(comps[bi]) ? i : bi), 0)
  const bc = comps[best]
  const bw = bc.maxX - bc.minX + 1, bh = (bc.maxY - bc.minY) * sh + 1
  const main = new Uint8Array(sw * sh)
  for (let i = 0; i < label.length; i++) if (label[i] === best) main[i] = 1
  // bords du joueur : on rend ce que l'ouverture avait rogné (+ marge), sans dépasser la silhouette d'origine
  const grown = morph(main, sw, sh, r + dilate, 'dilate')
  const keepLow = new Uint8Array(sw * sh)
  for (let i = 0; i < keepLow.length; i++) keepLow[i] = grown[i] && (m[i] || main[i]) ? 1 : 0
  const halo = morph(keepLow, sw, sh, 1, 'dilate') // 1 pixel réduit de marge pour les cheveux / transitions douces
  return {
    keep: (x: number, y: number) => halo[Math.min(sh - 1, Math.floor(y / s)) * sw + Math.min(sw - 1, Math.floor(x / s))] === 1,
    components: comps.length,
    /** part de l'image occupée par le joueur retenu (0–1) et silhouette verticale ou non */
    areaFraction: bc.area / (sw * sh),
    upright: bh / bw >= 0.8,
  }
}

/** Boîte englobante des pixels visibles. */
export function alphaBox(alpha: (i: number) => number, w: number, h: number, threshold = 24): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha(y * w + x) > threshold) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  return x1 < 0 ? null : { x0, y0, x1, y1 }
}

/**
 * Cadrage buste / mi-corps : si le joueur est en pied (silhouette haute), on garde le haut du corps
 * (~58 % de la hauteur, de la tête à mi-cuisses), centré horizontalement sur la tête, avec une petite marge.
 * La boîte peut dépasser l'image (marge transparente).
 */
export function bustFrame(alpha: (i: number) => number, w: number, h: number, box: Box): Box {
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1
  const standing = bh / bw > 1.35
  const keepH = standing ? Math.round(Math.min(bh, Math.max(bw * 1.15, bh * 0.58))) : bh
  const y0 = box.y0, y1 = box.y0 + keepH - 1
  // centre de la tête : moyenne des pixels opaques dans le haut de la silhouette
  const headRows = Math.max(2, Math.round(bh * (standing ? 0.1 : 0.18)))
  let sx = 0, n = 0
  for (let y = y0; y < Math.min(h, y0 + headRows); y++) for (let x = box.x0; x <= box.x1; x++) if (alpha(y * w + x) > 128) { sx += x; n++ }
  const headX = n ? sx / n : (box.x0 + box.x1) / 2
  // largeur utile dans la zone gardée
  let minX = w, maxX = -1
  for (let y = y0; y <= Math.min(h - 1, y1); y++) for (let x = box.x0; x <= box.x1; x++) if (alpha(y * w + x) > 24) { if (x < minX) minX = x; if (x > maxX) maxX = x }
  if (maxX < 0) { minX = box.x0; maxX = box.x1 }
  const half = Math.max(headX - minX, maxX - headX)
  const mx = Math.round(half * 0.06), my = Math.round(keepH * 0.03)
  return { x0: Math.floor(headX - half) - mx, x1: Math.ceil(headX + half) + mx, y0: y0 - my, y1 }
}

/**
 * Nettoyage des bords sur une image RGBA (modifiée sur place) :
 *  - alpha resserré (les pixels presque transparents disparaissent : plus de voile autour du joueur) ;
 *  - adoucissement d'un pixel sur le contour seulement ;
 *  - « défrangeage » : les pixels du bord prennent la couleur de l'intérieur du joueur (fini le halo blanc).
 */
export function cleanEdges(px: Uint8ClampedArray, w: number, h: number) {
  const A = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) { const a = px[i * 4 + 3]; A[i] = Math.min(255, Math.max(0, ((a - 40) * 255) / 175)) }
  // adoucissement 3×3 limité au contour
  const B = A.slice()
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    let mn = 255, mxA = 0, s = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = A[i + dy * w + dx]; s += v; if (v < mn) mn = v; if (v > mxA) mxA = v }
    if (mxA - mn > 8) B[i] = (A[i] * 2 + s) / 11
  }
  // défrangeage : couleur moyenne des voisins bien opaques (rayon 2)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    const a = B[i]
    px[i * 4 + 3] = Math.round(a)
    if (a <= 0 || a >= 250) continue
    let r = 0, g = 0, b = 0, n = 0
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
      const j = yy * w + xx
      if (A[j] >= 250) { r += px[j * 4]; g += px[j * 4 + 1]; b += px[j * 4 + 2]; n++ }
    }
    if (n) { px[i * 4] = r / n; px[i * 4 + 1] = g / n; px[i * 4 + 2] = b / n }
  }
  return px
}
