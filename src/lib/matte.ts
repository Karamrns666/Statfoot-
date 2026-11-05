// Post-traitement du masque de détourage — fonctions PURES sur des pixels RGBA (testables sans navigateur).
//  1. keepMainSubject : ne garde que le joueur au premier plan (plus grande silhouette), efface les
//     personnes / filets / objets détachés restés en arrière-plan.
//  2. refineEdges     : bords propres — érosion d'1 px + léger lissage de l'alpha, et « décontamination »
//     des couleurs de bord (supprime le halo clair ou vert laissé par l'ancien fond autour des cheveux).
//  3. subjectBox / bustCrop : cadrage buste / mi-corps, tête en haut, centré sur la tête.

export interface Rgba { data: Uint8ClampedArray; width: number; height: number }
export interface Box { x0: number; y0: number; x1: number; y1: number }

/** Garde la plus grande silhouette (et ce qui est entièrement contenu dans son cadre, ex. un ballon tenu). */
export function keepMainSubject(img: Rgba, threshold = 128): { kept: number; removed: number } {
  const { data, width: W, height: H } = img
  const s = Math.max(1, Math.round(Math.max(W, H) / 360)) // grille réduite pour la recherche des composantes
  const gw = Math.ceil(W / s), gh = Math.ceil(H / s)
  const cell = new Uint8Array(gw * gh)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] >= threshold) cell[((y / s) | 0) * gw + ((x / s) | 0)] = 1
  const label = new Int32Array(gw * gh).fill(-1)
  const comps: { area: number; box: Box }[] = []
  const stack: number[] = []
  for (let i = 0; i < cell.length; i++) {
    if (!cell[i] || label[i] >= 0) continue
    const id = comps.length, box = { x0: gw, y0: gh, x1: -1, y1: -1 }
    let area = 0
    label[i] = id; stack.push(i)
    while (stack.length) {
      const k = stack.pop()!, cx = k % gw, cy = (k / gw) | 0
      area++
      if (cx < box.x0) box.x0 = cx; if (cx > box.x1) box.x1 = cx; if (cy < box.y0) box.y0 = cy; if (cy > box.y1) box.y1 = cy
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
        const n = ny * gw + nx
        if (cell[n] && label[n] < 0) { label[n] = id; stack.push(n) }
      }
    }
    comps.push({ area, box })
  }
  if (!comps.length) return { kept: 0, removed: 0 }
  const main = comps.reduce((a, c, i) => (c.area > comps[a].area ? i : a), 0)
  const mb = comps[main].box
  const keep = new Uint8Array(comps.length)
  comps.forEach((c, i) => { keep[i] = i === main || (c.box.x0 >= mb.x0 && c.box.x1 <= mb.x1 && c.box.y0 >= mb.y0 && c.box.y1 <= mb.y1) ? 1 : 0 })
  // cellules gardées, élargies d'une cellule (pour ne pas rogner le bord doux du masque)
  const ok = new Uint8Array(gw * gh)
  for (let i = 0; i < label.length; i++) {
    if (label[i] < 0 || !keep[label[i]]) continue
    const cx = i % gw, cy = (i / gw) | 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) ok[ny * gw + nx] = 1
    }
  }
  let removed = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = (y * W + x) * 4 + 3
    if (data[a] && !ok[((y / s) | 0) * gw + ((x / s) | 0)]) { data[a] = 0; removed++ }
  }
  return { kept: comps.filter((_, i) => keep[i]).length, removed }
}

/** Bords propres : alpha érodé d'1 px puis lissé, couleurs de bord reprises de l'intérieur du joueur. */
export function refineEdges(img: Rgba) {
  const { data, width: W, height: H } = img
  const n = W * H
  const a0 = new Uint8ClampedArray(n)
  for (let i = 0; i < n; i++) a0[i] = data[i * 4 + 3] < 8 ? 0 : data[i * 4 + 3]
  // érosion 3×3 (minimum) : retire le liseré d'ancien fond
  const er = new Uint8ClampedArray(n)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (!a0[i]) continue
    let m = a0[i]
    for (let dy = -1; dy <= 1 && m; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      const v = nx < 0 || ny < 0 || nx >= W || ny >= H ? 0 : a0[ny * W + nx]
      if (v < m) m = v
    }
    er[i] = m
  }
  // lissage 3×3 (moyenne) : bord doux, sans escalier
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let sum = 0, cnt = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      sum += er[ny * W + nx]; cnt++
    }
    data[(y * W + x) * 4 + 3] = Math.round(sum / cnt)
  }
  // décontamination : les pixels semi-transparents prennent la couleur des pixels opaques voisins
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    const a = data[i + 3]
    if (a === 0 || a >= 250) continue
    let r = 0, g = 0, b = 0, c = 0
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const j = (ny * W + nx) * 4
      if (a0[ny * W + nx] >= 250) { r += data[j]; g += data[j + 1]; b += data[j + 2]; c++ }
    }
    if (c) { data[i] = r / c; data[i + 1] = g / c; data[i + 2] = b / c }
  }
}

/** Cadre de la silhouette et centre approximatif de la tête (haut de la silhouette). */
export function subjectBox(img: Rgba, threshold = 24): { box: Box; head: { x: number; y: number } } | null {
  const { data, width: W, height: H } = img
  const box = { x0: W, y0: H, x1: -1, y1: -1 }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > threshold) { if (x < box.x0) box.x0 = x; if (x > box.x1) box.x1 = x; if (y < box.y0) box.y0 = y; if (y > box.y1) box.y1 = y }
  }
  if (box.x1 < 0) return null
  // tête : moyenne horizontale des pixels opaques dans le haut de la silhouette
  const hh = Math.max(1, Math.round((box.y1 - box.y0) * 0.1))
  let sx = 0, c = 0
  for (let y = box.y0; y <= Math.min(box.y1, box.y0 + hh); y++) for (let x = box.x0; x <= box.x1; x++) if (data[(y * W + x) * 4 + 3] > 128) { sx += x; c++ }
  const headX = c ? sx / c : (box.x0 + box.x1) / 2
  return { box, head: { x: headX, y: box.y0 + Math.min(box.y1 - box.y0, (box.x1 - box.x0) * 0.35) / 2 } }
}

/**
 * Cadrage buste / mi-corps au format portrait 4:5 : tête en haut (petite marge), centré sur la tête.
 * Un joueur photographié en pied est coupé vers le haut des cuisses ; un portrait serré est gardé entier.
 */
export function bustCrop(box: Box, headX: number, imgH: number) {
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1
  const full = bh > bw * 1.45 // photo en pied
  let ch = full ? Math.round(bh * 0.6) : bh
  const top = Math.max(0, Math.round(box.y0 - ch * 0.04))
  ch = Math.min(imgH - top, Math.round(ch * 1.04))
  let cw = Math.round(ch * 0.8)
  if (!full) cw = Math.max(cw, bw) // ne jamais couper les épaules d'un portrait
  const x = Math.round(headX - cw / 2)
  return { x, y: top, w: cw, h: ch, full }
}
