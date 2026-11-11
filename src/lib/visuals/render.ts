// Dessin des visuels 1080 × 1080 sur canvas, par-dessus le modèle officiel utilisé TEL QUEL comme fond.
// Polices embarquées (Anton + Oswald, /public/fonts) chargées avant le dessin : rendu identique partout.
// Textes : taille réduite automatiquement jusqu'à tenir dans leur zone, puis « … » en dernier recours.
import { colorOf, VISUAL_SIZE, type VisualsConfig, type Zone } from './config'
import type { MvpModel, ResultModel, ResultRow } from './model'

// ---------------------------------------------------------------------------
//  Polices
// ---------------------------------------------------------------------------
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
let fontsReady: Promise<void> | null = null
export function ensureVisualFonts(cfg: VisualsConfig) {
  if (!fontsReady) {
    const faces: [string, string, string, string][] = [
      [cfg.fonts.display, '/fonts/anton-latin-400-normal.woff2', '400', LATIN], [cfg.fonts.display, '/fonts/anton-latin-ext-400-normal.woff2', '400', LATIN_EXT],
      [cfg.fonts.text, '/fonts/oswald-latin-500-normal.woff2', '500', LATIN], [cfg.fonts.text, '/fonts/oswald-latin-ext-500-normal.woff2', '500', LATIN_EXT],
      [cfg.fonts.text, '/fonts/oswald-latin-700-normal.woff2', '700', LATIN], [cfg.fonts.text, '/fonts/oswald-latin-ext-700-normal.woff2', '700', LATIN_EXT],
    ]
    fontsReady = Promise.all(faces.map(async ([family, url, weight, unicodeRange]) => {
      const f = new FontFace(family, `url(${url}) format('woff2')`, { weight, unicodeRange, display: 'block' })
      document.fonts.add(await f.load())
    })).then(() => undefined)
    fontsReady.catch(() => { fontsReady = null })
  }
  return fontsReady
}

// ---------------------------------------------------------------------------
//  Images
// ---------------------------------------------------------------------------
const imgCache = new Map<string, Promise<HTMLImageElement | null>>()
export function loadImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  if (!imgCache.has(url)) {
    imgCache.set(url, new Promise((res) => {
      const i = new Image()
      i.decoding = 'async'
      if (/^https?:/.test(url) && !url.startsWith(location.origin)) i.crossOrigin = 'anonymous'
      i.onload = () => res(i); i.onerror = () => { imgCache.delete(url); res(null) }
      i.src = url
    }))
  }
  return imgCache.get(url)!
}
const natural = (i: HTMLImageElement) => ({ w: i.naturalWidth || i.width || 512, h: i.naturalHeight || i.height || 512 })

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, z: Zone, valign: 'center' | 'bottom' = 'center') {
  const pad = z.pad ?? 0
  const { w, h } = natural(img)
  const s = Math.min((z.w - pad * 2) / w, (z.h - pad * 2) / h)
  const dw = w * s, dh = h * s
  const x = z.x + (z.w - dw) / 2
  const y = valign === 'bottom' ? z.y + z.h - pad - dh : z.y + (z.h - dh) / 2
  ctx.drawImage(img, x, y, dw, dh)
  return { x, y, w: dw, h: dh }
}

// ---------------------------------------------------------------------------
//  Texte
// ---------------------------------------------------------------------------
const fontOf = (cfg: VisualsConfig, z: Zone, size: number) => `${z.font === 'text' ? z.weight ?? 500 : 400} ${size}px "${z.font === 'text' ? cfg.fonts.text : cfg.fonts.display}"`

/** Plus grande taille (≤ z.size, ≥ z.min) pour laquelle le texte tient dans la zone ; sinon taille min + texte raccourci. */
export function fitText(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, text: string, z: Zone, maxH = z.h) {
  const max = z.size ?? 40, min = z.min ?? Math.min(12, max)
  for (let s = max; s >= min; s--) {
    ctx.font = fontOf(cfg, z, s)
    const m = ctx.measureText(text)
    const hgt = (m.actualBoundingBoxAscent || s * 0.75) + (m.actualBoundingBoxDescent || 0)
    if (m.width <= z.w && hgt <= maxH) return { size: s, text }
  }
  ctx.font = fontOf(cfg, z, min)
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > z.w) t = t.slice(0, -1)
  return { size: min, text: t === text ? t : `${t.trimEnd()}…` }
}

/** Texte centré verticalement sur ses vraies dimensions (majuscules), aligné selon la zone. */
function drawText(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, text: string, z: Zone, opts: { shadow?: boolean } = {}) {
  if (!text) return 0
  const { size, text: t } = fitText(ctx, cfg, text, z)
  ctx.font = fontOf(cfg, z, size)
  ctx.fillStyle = colorOf(cfg, z.color)
  ctx.textAlign = z.align ?? 'center'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(t)
  const asc = m.actualBoundingBoxAscent || size * 0.75, desc = m.actualBoundingBoxDescent || 0
  const y = z.y + (z.h - (asc + desc)) / 2 + asc
  const x = z.align === 'left' ? z.x : z.align === 'right' ? z.x + z.w : z.x + z.w / 2
  ctx.save()
  if (opts.shadow) { ctx.shadowColor = 'rgba(0, 12, 48, .45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2 }
  ctx.fillText(t, x, y)
  ctx.restore()
  return size
}

// ---------------------------------------------------------------------------
//  Lignes du résultat : nom + cartons + ballons
// ---------------------------------------------------------------------------
/** Ballon de foot vectoriel (rendu identique sur tous les appareils, sans dépendre des emoji). */
export function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 12, 48, .45)'; ctx.shadowBlur = r * 0.35; ctx.shadowOffsetY = r * 0.08
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  const pent = (x: number, y: number, rr: number, rot: number) => {
    ctx.beginPath()
    for (let k = 0; k < 5; k++) { const a = rot + (k * 2 * Math.PI) / 5; const px = x + rr * Math.cos(a), py = y + rr * Math.sin(a); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py) }
    ctx.closePath(); ctx.fill()
  }
  ctx.fillStyle = '#151B2E'; ctx.strokeStyle = '#151B2E'; ctx.lineWidth = Math.max(1, r * 0.07)
  pent(cx, cy, r * 0.36, -Math.PI / 2)
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
    const ox = cx + Math.cos(a) * r * 0.98, oy = cy + Math.sin(a) * r * 0.98
    pent(ox, oy, r * 0.3, a + Math.PI / 5)
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.36, cy + Math.sin(a) * r * 0.36); ctx.lineTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72); ctx.stroke()
  }
  ctx.restore()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = Math.max(1, r * 0.08); ctx.strokeStyle = '#151B2E'; ctx.stroke()
}
function drawCard(ctx: CanvasRenderingContext2D, x: number, cy: number, h: number, color: string) {
  const w = h * 0.68
  ctx.save(); ctx.shadowColor = 'rgba(0, 12, 48, .4)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1
  ctx.beginPath(); ctx.roundRect(x, cy - h / 2, w, h, Math.max(2, h * 0.08)); ctx.fillStyle = color; ctx.fill(); ctx.restore()
  return w
}
interface RowsLayout { size: number; lh: number; ball: number }
/**
 * Taille commune : jusqu'à 6 lignes à la taille max ; au-delà la hauteur de ligne se réduit pour tout faire tenir
 * (interligne resserré au-delà de 10 lignes). Les ballons rapetissent si un joueur a beaucoup de buts.
 */
export function rowsLayout(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, cols: ResultRow[][], z: Zone): RowsLayout {
  const n = Math.max(1, ...cols.map((c) => c.length))
  const maxLh = z.lineHeight ?? 48
  const lh = Math.min(maxLh, z.h / n)
  const tight = n > 10 ? 1.12 : n > 6 ? 0.95 : 0.8 // au-delà de 10 lignes : interligne resserré (capitales Anton, sans jambage)
  let size = Math.max(z.min ?? 16, Math.min(z.size ?? 40, Math.floor(lh * tight)))
  // largeur : le nom doit laisser la place aux icônes de la ligne la plus chargée
  const ball = Math.min(lh * (n > 10 ? 0.86 : 0.74), (z.size ?? 40) * 0.95)
  for (; size > (z.min ?? 16); size--) {
    ctx.font = fontOf(cfg, z, size)
    const ok = cols.every((c) => c.every((r) => ctx.measureText(r.name).width + iconsWidth(r, ball, z.w, z.gap ?? 6).w + 14 <= z.w))
    if (ok) break
  }
  return { size, lh, ball }
}
/** Largeur des icônes (cartons + ballons) ; diamètre des ballons réduit si la place manque (≤ 55 % de la colonne). */
function iconsWidth(r: ResultRow, ball: number, colW: number, gap: number) {
  const cards = r.yellow + r.red
  const cardW = ball * 0.92 * 0.68
  const max = colW * 0.55
  let d = ball
  const width = (dd: number) => cards * (cardW + gap) + r.goals * dd + Math.max(0, r.goals - 1) * gap * 0.5
  while (r.goals && width(d) > max && d > 12) d -= 1
  return { w: width(d), d, cardW }
}
function drawRows(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, rows: ResultRow[], z: Zone, L: RowsLayout) {
  const gap = z.gap ?? 6
  ctx.save()
  ctx.font = fontOf(cfg, z, L.size)
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
  rows.forEach((r, i) => {
    const cy = z.y + L.lh * i + L.lh / 2
    const ic = iconsWidth(r, L.ball, z.w, gap)
    // icônes alignées à droite de la colonne : cartons d'abord, puis les ballons
    let x = z.x + z.w - ic.w
    const cardH = L.ball * 0.92
    for (let k = 0; k < r.yellow; k++) x += drawCard(ctx, x, cy, cardH, '#FFD400') + gap
    for (let k = 0; k < r.red; k++) x += drawCard(ctx, x, cy, cardH, '#E5252A') + gap
    for (let k = 0; k < r.goals; k++) { drawBall(ctx, x + ic.d / 2, cy, ic.d / 2); x += ic.d + gap * 0.5 }
    // nom, raccourci s'il touche les icônes
    const maxW = z.w - ic.w - 14
    let t = r.name
    while (t.length > 2 && ctx.measureText(t).width > maxW) t = `${t.slice(0, -2)}…`
    ctx.save()
    ctx.shadowColor = 'rgba(0, 12, 48, .5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1
    ctx.fillStyle = colorOf(cfg, z.color); ctx.globalAlpha = r.og ? 0.9 : 1
    ctx.fillText(t, z.x, cy + L.size * 0.04)
    ctx.restore()
  })
  ctx.restore()
}

// ---------------------------------------------------------------------------
//  Aperçu des zones (admin)
// ---------------------------------------------------------------------------
function drawZones(ctx: CanvasRenderingContext2D, zones: Record<string, Zone>, decor: Record<string, Zone>) {
  ctx.save()
  ctx.font = '600 15px system-ui, sans-serif'; ctx.textBaseline = 'top'
  for (const [k, d] of Object.entries(decor)) {
    ctx.fillStyle = 'rgba(255, 40, 80, .28)'; ctx.fillRect(d.x, d.y, d.w, d.h)
    ctx.strokeStyle = '#ff2850'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.strokeRect(d.x, d.y, d.w, d.h)
    ctx.fillStyle = '#ffd0d8'; ctx.fillText(`décor : ${k}`, d.x + 3, d.y + d.h + 2)
  }
  for (const [k, z] of Object.entries(zones)) {
    if (k === 'scoreWithSub') continue
    ctx.strokeStyle = '#00ffa3'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]); ctx.strokeRect(z.x, z.y, z.w, z.h)
    ctx.fillStyle = 'rgba(0, 0, 0, .55)'; const tw = ctx.measureText(k).width; ctx.fillRect(z.x, z.y, tw + 8, 19)
    ctx.fillStyle = '#00ffa3'; ctx.fillText(k, z.x + 4, z.y + 2)
  }
  ctx.restore()
}

function newCanvas(w = VISUAL_SIZE, h = VISUAL_SIZE) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  return { c, ctx }
}

// ---------------------------------------------------------------------------
//  Modèle 1 — Résultat
// ---------------------------------------------------------------------------
export async function renderResult(model: ResultModel, cfg: VisualsConfig, opts: { leagueLogo?: string; showZones?: boolean } = {}) {
  await ensureVisualFonts(cfg)
  const Z = cfg.resultat.zones
  const [bg, hl, al, lg] = await Promise.all([loadImage(cfg.templates.resultat), loadImage(model.home.logo), loadImage(model.away.logo), loadImage(opts.leagueLogo)])
  const { c, ctx } = newCanvas()
  if (bg) ctx.drawImage(bg, 0, 0, VISUAL_SIZE, VISUAL_SIZE)
  drawText(ctx, cfg, model.competition, Z.competition)
  for (const [img, z, short] of [[hl, Z.homeLogo, model.home.short], [al, Z.awayLogo, model.away.short]] as const) {
    if (img) drawContain(ctx, img, z)
    else drawText(ctx, cfg, short, { ...z, font: 'display', size: 64, min: 24, color: 'white' })
  }
  // score très grand dans les blocs orange latéraux (« 07 »), tirs au but entre parenthèses dessous (« (14) »)
  const pens = model.homePens != null && model.awayPens != null
  const fmt = (n: number) => String(n).padStart(2, '0')
  const sz = pens ? { ...Z.scoreWithSub } : {}
  const scoreSize = Math.min(
    fitText(ctx, cfg, fmt(model.homeScore), { ...Z.homeScore, ...sz }).size,
    fitText(ctx, cfg, fmt(model.awayScore), { ...Z.awayScore, ...sz }).size,
  )
  drawText(ctx, cfg, fmt(model.homeScore), { ...Z.homeScore, ...sz, size: scoreSize }, { shadow: true })
  drawText(ctx, cfg, fmt(model.awayScore), { ...Z.awayScore, ...sz, size: scoreSize }, { shadow: true })
  if (pens) {
    const ps = Math.min(fitText(ctx, cfg, `(${fmt(model.homePens!)})`, Z.homePens).size, fitText(ctx, cfg, `(${fmt(model.awayPens!)})`, Z.awayPens).size)
    drawText(ctx, cfg, `(${fmt(model.homePens!)})`, { ...Z.homePens, size: ps }, { shadow: true })
    drawText(ctx, cfg, `(${fmt(model.awayPens!)})`, { ...Z.awayPens, size: ps }, { shadow: true })
  }
  if (model.sub && !pens) drawText(ctx, cfg, model.sub, Z.subLine)
  // une colonne par équipe : nom « A.MAZRHI », cartons puis un ballon par but ; taille commune aux deux colonnes
  const layout = rowsLayout(ctx, cfg, [model.homeRows, model.awayRows], Z.homeRows)
  drawRows(ctx, cfg, model.homeRows, Z.homeRows, layout)
  drawRows(ctx, cfg, model.awayRows, Z.awayRows, layout)
  drawText(ctx, cfg, model.footer, Z.footer, { shadow: true })
  if (lg) { ctx.save(); ctx.globalAlpha = Z.leagueLogo.opacity ?? 0.85; drawContain(ctx, lg, Z.leagueLogo); ctx.restore() }
  if (opts.showZones) drawZones(ctx, Z, cfg.resultat.decor)
  return c
}

// ---------------------------------------------------------------------------
//  Modèle 2 — Homme du match
// ---------------------------------------------------------------------------
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r)
}

/** Photo détourée : halo bleu clair derrière, ombre portée, fondu en bas sous le nom. */
function drawCutout(ctx: CanvasRenderingContext2D, img: HTMLImageElement, z: Zone, cfg: VisualsConfig) {
  const cx = z.x + z.w / 2
  const halo = ctx.createRadialGradient(cx, z.y + z.h * 0.5, 10, cx, z.y + z.h * 0.5, z.w * 0.55)
  halo.addColorStop(0, `${colorOf(cfg, 'halo')}aa`); halo.addColorStop(0.55, `${colorOf(cfg, 'halo')}33`); halo.addColorStop(1, `${colorOf(cfg, 'halo')}00`)
  ctx.fillStyle = halo; ctx.fillRect(z.x - 60, z.y - 20, z.w + 120, z.h + 40)
  // photo dessinée à part pour appliquer le fondu du bas
  const off = newCanvas(z.w, z.h)
  const r = drawContain(off.ctx, img, { x: 0, y: 0, w: z.w, h: z.h }, 'bottom')
  off.ctx.globalCompositeOperation = 'destination-in'
  const fade = off.ctx.createLinearGradient(0, z.h * 0.72, 0, z.h)
  fade.addColorStop(0, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)')
  off.ctx.fillStyle = fade; off.ctx.fillRect(0, 0, z.w, z.h)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 14, 50, .55)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 10
  ctx.drawImage(off.c, z.x, z.y)
  ctx.restore()
  return r
}
/** Photo originale (pas de détourage) : cadre arrondi propre, cadré sur le visage. */
function drawFramed(ctx: CanvasRenderingContext2D, img: HTMLImageElement, z: Zone, cfg: VisualsConfig) {
  const fw = Math.min(380, z.w), fh = Math.min(400, z.h - 40)
  const x = z.x + (z.w - fw) / 2, y = z.y + 6
  const { w, h } = natural(img)
  const s = Math.max(fw / w, fh / h)
  const dw = w * s, dh = h * s
  ctx.save()
  ctx.shadowColor = 'rgba(0, 14, 50, .55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10
  roundRect(ctx, x, y, fw, fh, 28); ctx.fillStyle = colorOf(cfg, 'navy'); ctx.fill()
  ctx.restore()
  ctx.save(); roundRect(ctx, x, y, fw, fh, 28); ctx.clip()
  ctx.drawImage(img, x + (fw - dw) / 2, y + (fh - dh) * 0.18, dw, dh)
  ctx.restore()
  ctx.save(); roundRect(ctx, x, y, fw, fh, 28); ctx.lineWidth = 6; ctx.strokeStyle = colorOf(cfg, 'white'); ctx.stroke(); ctx.restore()
}
/** Silhouette générique (aucune photo). */
function drawSilhouette(ctx: CanvasRenderingContext2D, z: Zone) {
  const cx = z.x + z.w / 2, top = z.y + 70
  ctx.save(); ctx.fillStyle = 'rgba(255, 255, 255, .22)'
  ctx.beginPath(); ctx.arc(cx, top + 75, 75, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx - 190, z.y + z.h - 60); ctx.quadraticCurveTo(cx - 180, top + 175, cx, top + 170); ctx.quadraticCurveTo(cx + 180, top + 175, cx + 190, z.y + z.h - 60); ctx.closePath(); ctx.fill()
  ctx.restore()
}

export async function renderMvp(model: MvpModel, cfg: VisualsConfig, variant: 'mvp' | 'mvp2' = 'mvp', opts: { showZones?: boolean } = {}) {
  await ensureVisualFonts(cfg)
  const Z = cfg.mvp.zones
  const [bg, hl, al, tl, ph] = await Promise.all([loadImage(cfg.templates[variant]), loadImage(model.scoreLine.homeLogo), loadImage(model.scoreLine.awayLogo), loadImage(model.team.logo), loadImage(model.photo?.url)])
  const { c, ctx } = newCanvas()
  if (bg) ctx.drawImage(bg, 0, 0, VISUAL_SIZE, VISUAL_SIZE)
  drawText(ctx, cfg, model.competition, Z.competition, { shadow: true })
  // « [logo] ÉQUIPE A 3 - 1 ÉQUIPE B [logo] » — noms courts si les noms longs ne tiennent pas en grand
  {
    const z = Z.scoreLine, L = z.logo ?? 56, gap = z.gap ?? 14
    const textZone = { ...z, w: z.w - 2 * (L + gap) }
    const full = `${model.scoreLine.home}  ${model.scoreLine.score}  ${model.scoreLine.away}`
    let fit = fitText(ctx, cfg, full, textZone)
    let text = full
    if (fit.size < Math.round((z.size ?? 44) * 0.7) && model.scoreLine.homeShort && model.scoreLine.awayShort) {
      text = `${model.scoreLine.homeShort}  ${model.scoreLine.score}  ${model.scoreLine.awayShort}`
      fit = fitText(ctx, cfg, text, textZone)
    }
    ctx.font = fontOf(cfg, z, fit.size)
    const tw = Math.min(ctx.measureText(fit.text).width, textZone.w)
    const total = tw + 2 * (L + gap)
    const x0 = z.x + (z.w - total) / 2
    if (hl) drawContain(ctx, hl, { x: x0, y: z.y + (z.h - L) / 2, w: L, h: L })
    if (al) drawContain(ctx, al, { x: x0 + total - L, y: z.y + (z.h - L) / 2, w: L, h: L })
    drawText(ctx, cfg, fit.text, { ...z, x: x0 + L + gap, w: tw, size: fit.size, min: fit.size }, { shadow: true })
  }
  drawText(ctx, cfg, Z.barLabel.text ?? 'HOMME DU MATCH', Z.barLabel)
  // photo
  if (ph && model.photo?.cutout) drawCutout(ctx, ph, Z.photo, cfg)
  else if (ph) drawFramed(ctx, ph, Z.photo, cfg)
  else drawSilhouette(ctx, Z.photo)
  // brassard
  if (model.captain) {
    const z = Z.captain, r = Math.min(z.w, z.h) / 2
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(z.x + r, z.y + r, r, 0, Math.PI * 2); ctx.fillStyle = colorOf(cfg, 'orange'); ctx.fill(); ctx.restore()
    ctx.save(); ctx.beginPath(); ctx.arc(z.x + r, z.y + r, r - 3, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = colorOf(cfg, 'white'); ctx.stroke(); ctx.restore()
    drawText(ctx, cfg, 'C', { ...z, font: 'display', size: Math.round(r * 1.2), min: 12, color: 'white' })
  }
  // nom
  drawText(ctx, cfg, model.firstName, Z.firstName, { shadow: true })
  drawText(ctx, cfg, model.lastName, Z.lastName, { shadow: true })
  // équipe : logo + nom
  {
    const z = Z.team, L = z.logo ?? 38, gap = z.gap ?? 10
    const fit = fitText(ctx, cfg, model.team.name, { ...z, w: z.w - (tl ? L + gap : 0) })
    ctx.font = fontOf(cfg, z, fit.size)
    const tw = ctx.measureText(fit.text).width
    const total = tw + (tl ? L + gap : 0)
    const x0 = z.x + (z.w - total) / 2
    if (tl) drawContain(ctx, tl, { x: x0, y: z.y + (z.h - L) / 2, w: L, h: L })
    drawText(ctx, cfg, fit.text, { ...z, x: x0 + (tl ? L + gap : 0), w: tw + 2, size: fit.size, min: fit.size }, { shadow: true })
  }
  // pastilles de stats
  {
    const z = Z.stats, n = model.stats.length, gap = z.gap ?? 12
    const pw = (z.w - gap * (n - 1)) / n
    model.stats.forEach((s, i) => {
      const x = z.x + i * (pw + gap)
      const xpPill = i === n - 1
      ctx.save()
      roundRect(ctx, x, z.y, pw, z.h, z.h / 2)
      ctx.fillStyle = xpPill ? colorOf(cfg, z.fill ?? 'orange') : 'rgba(7, 26, 80, .78)'; ctx.fill()
      if (!xpPill) { ctx.lineWidth = 2; ctx.strokeStyle = colorOf(cfg, z.fill ?? 'orange'); ctx.stroke() }
      ctx.restore()
      // valeur (Anton) + libellé (Oswald) sur une ligne, réduits ensemble si besoin
      const label = s.label.toLocaleUpperCase('fr-FR')
      let vs = z.size ?? 28, ls = z.labelSize ?? 17
      const fv = () => `400 ${vs}px "${cfg.fonts.display}"`, fl = () => `500 ${ls}px "${cfg.fonts.text}"`
      const width = () => { ctx.font = fv(); const a = ctx.measureText(s.value).width; ctx.font = fl(); return a + 8 + ctx.measureText(label).width }
      while (width() > pw - 24 && ls > 10) { vs = Math.max(16, vs - 1); ls -= 1 }
      const total = width()
      let x0 = x + (pw - total) / 2
      const cy = z.y + z.h / 2
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = colorOf(cfg, z.color)
      ctx.font = fv(); ctx.fillText(s.value, x0, cy + 1); x0 += ctx.measureText(s.value).width + 8
      ctx.font = fl(); ctx.fillText(label, x0, cy + 1)
    })
  }
  if (opts.showZones) drawZones(ctx, Z, cfg.mvp.decor)
  return c
}

// ---------------------------------------------------------------------------
//  Story 1080 × 1920 : le visuel carré au centre, fond = modèle agrandi, flouté et assombri
// ---------------------------------------------------------------------------
export async function renderStory(square: HTMLCanvasElement, templateUrl: string) {
  const { c, ctx } = newCanvas(1080, 1920)
  const bg = await loadImage(templateUrl)
  if (bg) {
    ctx.save(); ctx.filter = 'blur(28px) brightness(.72)'
    ctx.drawImage(bg, -420, 0, 1920, 1920)
    ctx.restore()
  }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40
  ctx.drawImage(square, 0, 420, 1080, 1080)
  ctx.restore()
  return c
}

export const canvasToPng = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG impossible'))), 'image/png'))
