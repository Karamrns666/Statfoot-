// Dessin des visuels de la semaine (1080 × 1350) par-dessus les modèles officiels utilisés TELS QUELS :
//  • template-semaine-resultats-classement.png : 16 pastilles blanches, zone centrale, barre orange verticale ;
//  • template-top10.png : podium (3 cartes + pastilles nom) et 7 bandes (rangs 4 à 10).
// Toutes les zones viennent de src/config/visuals.json (semaine / top10), modifiables et visibles en « aperçu des zones ».
import { colorOf, WEEKLY_H, WEEKLY_W, type VisualsConfig, type Zone } from './config'
import { drawContain, drawText, drawTile, drawZones, ensureVisualFonts, fitText, fontOf, loadImage, newCanvas } from './render'
import { contrastText, shade, weeklyRowsLayout, type TopEntry, type WeeklyResultRow, type WeeklyStandingRow } from './weekly'
import type { SeniorityTier } from '@/lib/seniority'
import { logoPlate, tileLogo } from '@/lib/logoPlate'

const withAlpha = (ctx: CanvasRenderingContext2D, a: number | undefined, f: () => void) => { ctx.save(); ctx.globalAlpha = a ?? 1; f(); ctx.restore() }

/** Masque une pastille inutilisée en recopiant le fond du modèle situé juste à droite (même dégradé). */

async function base(cfg: VisualsConfig, url: string) {
  await ensureVisualFonts(cfg)
  const bg = await loadImage(url)
  const { c, ctx } = newCanvas(WEEKLY_W, WEEKLY_H)
  if (bg) ctx.drawImage(bg, 0, 0, WEEKLY_W, WEEKLY_H)
  return { c, ctx, bg }
}

async function drawDivisionLogo(ctx: CanvasRenderingContext2D, Z: Record<string, Zone>, url?: string) {
  if (!url || !Z.divisionLogo) return
  const img = await loadImage(url)
  if (img) { ctx.save(); ctx.shadowColor = 'rgba(0, 12, 48, .45)'; ctx.shadowBlur = 14; drawContain(ctx, img, Z.divisionLogo); ctx.restore() }
}
function drawHeader(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, Z: Record<string, Zone>, title: string, subtitle: string) {
  drawText(ctx, cfg, title, Z.title, { shadow: true })
  withAlpha(ctx, Z.subtitle.opacity, () => drawText(ctx, cfg, subtitle, Z.subtitle, { shadow: true }))
}

/** Texte à gauche avec largeur maximale (raccourci « … ») centré verticalement sur cy. */
function textAt(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, z: Zone, text: string, x: number, cy: number, maxW: number, size: number, align: CanvasTextAlign = 'left', color?: string, noCut = false) {
  ctx.save()
  // réduit d'abord la taille (jusqu'à 55 %, ou sans limite pour une valeur) avant de couper avec « … »
  const floor = noCut ? 8 : Math.max(12, Math.round(size * 0.55))
  ctx.font = fontOf(cfg, z, size)
  while (size > floor && ctx.measureText(text).width > maxW) { size--; ctx.font = fontOf(cfg, z, size) }
  let t = text
  while (!noCut && t.length > 2 && ctx.measureText(t).width > maxW) t = `${t.slice(0, -2)}…`
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color ?? colorOf(cfg, z.color)
  ctx.shadowColor = 'rgba(0, 12, 48, .4)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1
  ctx.fillText(t, x, cy + size * 0.05)
  const w = Math.min(ctx.measureText(t).width, maxW)
  ctx.restore()
  return w
}

const TIER_FILL: Record<SeniorityTier, string> = { platinum: '#EEF4FB', gold: '#E8B931', silver: '#C9D3DD' }
function tierCoin(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, tier: SeniorityTier, x: number, cy: number, r: number) {
  ctx.save()
  ctx.beginPath(); ctx.arc(x + r, cy, r, 0, Math.PI * 2); ctx.fillStyle = TIER_FILL[tier]; ctx.fill()
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(11, 46, 115, .55)'; ctx.stroke()
  ctx.font = `400 ${Math.round(r * 1.2)}px "${cfg.fonts.display}"`; ctx.fillStyle = '#0B2E73'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(tier[0].toUpperCase(), x + r, cy + 1)
  ctx.restore()
}

// ---------------------------------------------------------------------------
//  Classement de la semaine
// ---------------------------------------------------------------------------
// Lignes du classement / des résultats : AUCUNE limite — le nombre de lignes suit les données. Les lignes se
// répartissent entre y = 274 et y = 1222 (hauteur de la barre orange) ; pastilles de rang dessinées en code sur le
// fond sans pastilles (template-semaine-fond.png). Tailles ajustées à la hauteur de ligne.
type RowsLayout = ReturnType<typeof weeklyRowsLayout>
function drawPill(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, P: Zone, Lay: RowsLayout, i: number, text: string) {
  const y = Lay.top(i)
  ctx.save(); ctx.shadowColor = 'rgba(0, 12, 48, .25)'; ctx.shadowBlur = 4
  ctx.beginPath(); ctx.roundRect(P.x, y, P.w, Lay.h, Math.min(10, Lay.h * 0.3)); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore()
  textAt(ctx, cfg, P, text, P.x + P.w / 2, y + Lay.h / 2, P.w - 10, Lay.pillFont, 'center', colorOf(cfg, P.color ?? 'navy'), true)
}

export async function renderWeeklyStandings(rows: (WeeklyStandingRow & { tier?: SeniorityTier })[], cfg: VisualsConfig, opts: { title: string; subtitle: string; showZones?: boolean; logo?: string; masterSize?: number; provisional?: boolean; big?: boolean }) {
  const L = cfg.semaine, Z = L.zones
  const { c, ctx } = await base(cfg, cfg.templates.semaine)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  await drawDivisionLogo(ctx, Z, opts.logo)
  const list = rows
  const Lay = weeklyRowsLayout(list.length, opts.big ? 84 : L.options.step)
  drawText(ctx, cfg, 'PTS', Z.barHead)
  const logos = await Promise.all(list.map((r) => loadImage(r.logo)))
  const row = Z.row
  // tailles communes à toutes les lignes ; noms longs (PARE-BRISE EXPRESS…) sur une ligne sans toucher « MJ · DIFF »
  const lg = Lay.logo, gap = row.gap ?? 12
  ctx.font = fontOf(cfg, Z.rowStats, Lay.stats)
  const statsW = Math.max(...list.map((r) => ctx.measureText(`MJ ${r.played} · DIFF ${r.gd > 0 ? '+' : ''}${r.gd}`).width), 0)
  const nameMax = row.x + row.w - statsW - 22 - (row.x + lg + gap) - (list.some((r) => r.tier) ? 26 : 0)
  let nameSize = Lay.name
  ctx.font = fontOf(cfg, row, nameSize)
  while (nameSize > 16 && Math.max(...list.map((r) => ctx.measureText(r.name).width), 0) > nameMax) { nameSize--; ctx.font = fontOf(cfg, row, nameSize) }
  list.forEach((r, i) => {
    const y = Lay.top(i), cy = y + Lay.h / 2
    drawPill(ctx, cfg, Z.pill, Lay, i, String(r.rank))
    let x = row.x
    const img = logos[i]
    if (img) drawTile(ctx, img, { x, y: cy - lg / 2, w: lg, h: lg }, r.logoBg)
    x += lg + gap
    const stats = `MJ ${r.played} · DIFF ${r.gd > 0 ? '+' : ''}${r.gd}`
    const nw = textAt(ctx, cfg, row, r.name, x, cy, nameMax, nameSize)
    if (r.tier) tierCoin(ctx, cfg, r.tier, x + nw + 8, cy, Math.max(7, Math.round(Lay.h * 0.26)))
    withAlpha(ctx, Z.rowStats.opacity, () => textAt(ctx, cfg, Z.rowStats, stats, row.x + row.w, cy, statsW + 2, Lay.stats, 'right', undefined, true))
    textAt(ctx, cfg, Z.points, String(r.points), Z.points.x + Z.points.w / 2, cy, Z.points.w - 4, nameSize, 'center', colorOf(cfg, Z.points.color), true)
  })
  // séparation MASTER / CHALLENGER + légende
  const ms = opts.masterSize
  if (ms && list.length > ms && list[0]?.rank === 1) {
    const yA = Lay.top(ms - 1) + Lay.h, yB = Lay.top(ms), ys = (yA + yB) / 2
    ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, .9)'; ctx.lineWidth = 3; ctx.setLineDash([14, 8])
    ctx.beginPath(); ctx.moveTo(Z.pill.x - 6, ys); ctx.lineTo(Z.points.x + Z.points.w + 6, ys); ctx.stroke(); ctx.restore()
    const legend = `1–${ms} : zone MASTER · ${ms + 1}–${list.length} : zone CHALLENGER${opts.provisional ? ' (provisoire)' : ''}`
    textAt(ctx, cfg, { ...Z.rowStats, font: 'text', weight: 600 }, legend, Z.pill.x, 1262, Z.points.x + Z.points.w - Z.pill.x, 24, 'left', '#FFFFFF')
  }
  if (opts.showZones) drawZones(ctx, Z, L.decor)
  return c
}

// ---------------------------------------------------------------------------
//  Résultats de la semaine
// ---------------------------------------------------------------------------
export async function renderWeeklyResults(rows: WeeklyResultRow[], cfg: VisualsConfig, opts: { title: string; subtitle: string; barLabel: string; showZones?: boolean; logo?: string }) {
  const L = cfg.semaine, Z = L.zones
  const { c, ctx } = await base(cfg, cfg.templates.semaine)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  await drawDivisionLogo(ctx, Z, opts.logo)
  const list = rows
  const Lay = weeklyRowsLayout(list.length, L.options.step)
  // libellé vertical dans la barre orange
  const bz = Z.barLabel
  ctx.save(); ctx.translate(bz.x + bz.w / 2, bz.y + bz.h / 2); ctx.rotate(-Math.PI / 2)
  drawText(ctx, cfg, opts.barLabel, { ...bz, x: -bz.h / 2, y: -bz.w / 2, w: bz.h, h: bz.w })
  ctx.restore()
  const imgs = await Promise.all(list.flatMap((r) => [loadImage(r.home.logo), loadImage(r.away.logo)]))
  const row0 = Z.row, cx = row0.x + row0.w / 2, lg = Math.min(Lay.logo, Lay.h + 10), scoreW = 120, gap = row0.gap ?? 12
  const nameMax = cx - scoreW / 2 - gap - lg - gap - row0.x
  const nameSize = Math.min(...list.flatMap((r) => [r.home.name, r.away.name]).map((n) => fitText(ctx, cfg, n, { ...row0, w: nameMax, size: Lay.name }).size), Lay.name)
  list.forEach((r, i) => {
    const y = Lay.top(i), cy = y + Lay.h / 2
    drawPill(ctx, cfg, Z.pill, Lay, i, r.tag)
    // score dans un cartouche blanc
    ctx.save(); ctx.beginPath(); ctx.roundRect(cx - scoreW / 2, y - 2, scoreW, Lay.h + 4, 8); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore()
    textAt(ctx, cfg, row0, r.score, cx, cy, scoreW - 10, Math.min(nameSize, 30), 'center', colorOf(cfg, 'navy'), true)
    if (r.sub) textAt(ctx, cfg, Z.rowStats, r.sub, cx, y + Lay.h + 9, scoreW + 60, 14, 'center')
    const hx = cx - scoreW / 2 - gap - lg, ax = cx + scoreW / 2 + gap
    for (const [img, x, bgc] of [[imgs[i * 2], hx, r.home.logoBg], [imgs[i * 2 + 1], ax, r.away.logoBg]] as const) {
      if (img) drawTile(ctx, img, { x, y: cy - lg / 2, w: lg, h: lg }, bgc)
      else { ctx.save(); ctx.beginPath(); ctx.roundRect(x, cy - lg / 2, lg, lg, lg * 0.22); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore() }
    }
    textAt(ctx, cfg, row0, r.home.name, hx - gap, cy, nameMax, nameSize, 'right')
    textAt(ctx, cfg, row0, r.away.name, ax + lg + gap, cy, nameMax, nameSize, 'left')
  })
  if (opts.showZones) drawZones(ctx, Z, L.decor)
  return c
}

// ---------------------------------------------------------------------------
//  Top 10
// ---------------------------------------------------------------------------
/** Efface une bande du modèle : chaque colonne reprend un dégradé entre le décor juste au-dessus et juste en dessous. */
function eraseBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  x = Math.max(0, Math.round(x)); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  const top = Math.max(0, y - 2), bot = Math.min(WEEKLY_H - 1, y + h + 2)
  const img = ctx.getImageData(x, top, w, bot - top + 1), d = img.data, rows = bot - top + 1
  for (let xx = 0; xx < w; xx++) {
    const a = xx * 4, b = ((rows - 1) * w + xx) * 4
    for (let yy = 1; yy < rows - 1; yy++) {
      const t = yy / (rows - 1), i = (yy * w + xx) * 4
      for (let ch = 0; ch < 3; ch++) d[i + ch] = d[a + ch] * (1 - t) + d[b + ch] * t
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, x, top)
}

/** Efface une zone en reprenant, ligne par ligne, un dégradé entre les pixels juste à gauche et juste à droite. */
function eraseH(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  x = Math.max(1, Math.round(x)); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  const img = ctx.getImageData(x - 1, y, w + 2, h), d = img.data, W = w + 2
  for (let yy = 0; yy < h; yy++) {
    const a = yy * W * 4, b = (yy * W + W - 1) * 4
    for (let xx = 1; xx < W - 1; xx++) { const t = xx / (W - 1), i = (yy * W + xx) * 4; for (let ch = 0; ch < 3; ch++) d[i + ch] = d[a + ch] * (1 - t) + d[b + ch] * t; d[i + 3] = 255 }
  }
  ctx.putImageData(img, x - 1, y)
}

/** Petite icône de ballon (dessinée, pas d'image) : distingue le Top 10 buteurs d'un coup d'œil. */
function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 12, 48, .35)'; ctx.shadowBlur = 4
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill()
  ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.strokeStyle = '#0B1B3F'; ctx.stroke()
  const pent = (px: number, py: number, pr: number, rot: number) => {
    ctx.beginPath()
    for (let k = 0; k < 5; k++) { const a = rot + k * (Math.PI * 2 / 5); ctx[k ? 'lineTo' : 'moveTo'](px + pr * Math.cos(a), py + pr * Math.sin(a)) }
    ctx.closePath(); ctx.fillStyle = '#0B1B3F'; ctx.fill()
  }
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  pent(cx, cy, r * 0.36, -Math.PI / 2)
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * (Math.PI * 2 / 5); pent(cx + r * 0.95 * Math.cos(a), cy + r * 0.95 * Math.sin(a), r * 0.3, a + Math.PI / 2) }
  ctx.restore()
}

export async function renderTop10(entries: TopEntry[], cfg: VisualsConfig, opts: { title: string; subtitle: string; showZones?: boolean; icon?: 'ball' }) {
  const L = cfg.top10, Z = L.zones
  const { c, ctx } = await base(cfg, cfg.templates.top10)
  // moins de 10 joueurs : les bandes vides du modèle sont effacées (décor bleu reconstitué entre les bandes voisines)
  L.bands.forEach((y, k) => { if (!entries[k + 3]) eraseBand(ctx, Z.band.x, y - 3, Z.band.w, Z.band.h + 6) })
  // podium incomplet : la pastille blanche vide est effacée (dégradé de la carte, de gauche à droite)
  for (const [i, pz] of [[1, Z.pill2], [0, Z.pill1], [2, Z.pill3]] as const) if (!entries[i]) eraseH(ctx, pz.x - 2, pz.y - 2, pz.w + 4, pz.h + 4)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  const photos = await Promise.all(entries.slice(0, 3).map((e) => loadImage(e.player.photo_card_mode !== 'original' && e.player.photo_cutout_url ? e.player.photo_cutout_url : e.player.photo_url)))
  const logos = await Promise.all(entries.map((e) => loadImage(tileLogo(e.team, true))))
  // podium : 2e à gauche, 1er au centre, 3e à droite
  const slots: [number, Zone, Zone][] = [[0, Z.card1, Z.pill1], [1, Z.card2, Z.pill2], [2, Z.card3, Z.pill3]]
  // nom de chaque pastille ajusté à sa place (un nom très long ne réduit pas les deux autres), jamais coupé
  const pillSize = (i: number, pz: Zone) => fitText(ctx, cfg, entries[i].name, { ...pz, w: pz.w - 16, min: 12 }).size
  for (const [i, card, pill] of slots) {
    const e = entries[i]; if (!e) continue
    // photo (ou logo du club) dans le haut de la carte, découpée aux coins arrondis
    const area = { x: card.x + 10, y: card.y + 8, w: card.w - 20, h: pill.y - card.y - 6 }
    ctx.save(); ctx.beginPath(); ctx.roundRect(card.x, card.y, card.w, card.h, 34); ctx.clip()
    const ph = photos[i]
    if (ph) { ctx.shadowColor = 'rgba(0, 10, 40, .5)'; ctx.shadowBlur = 18; drawContain(ctx, ph, area, 'bottom') }
    else if (logos[i]) { ctx.globalAlpha = 0.9; drawContain(ctx, logos[i]!, { ...area, pad: 40 }) }
    ctx.restore()
    drawText(ctx, cfg, String(e.rank), { ...Z.podiumRank, x: card.x + 8, y: card.y + 8 }, { shadow: true })
    drawText(ctx, cfg, e.name, { ...pill, x: pill.x + 8, w: pill.w - 16, size: pillSize(i, pill), min: 12 })
    // valeur + logo du club sous la pastille
    const vz = Z.podiumValue, lg = vz.logo ?? 46, vy = vz.y + vz.h / 2
    const ic = opts.icon ? Math.round(lg * 0.72) : 0, icGap = ic ? 8 : 0
    const room = card.w - lg - 40 - ic - icGap
    ctx.font = fontOf(cfg, vz, vz.size ?? 40); const vw = Math.min(ctx.measureText(e.display).width, room)
    const x0 = card.x + (card.w - (ic + icGap + vw + 10 + lg)) / 2
    if (ic) drawBall(ctx, x0 + ic / 2, vy, ic / 2)
    textAt(ctx, cfg, vz, e.display, x0 + ic + icGap, vy, room, vz.size ?? 40, 'left', undefined, true)
    if (logos[i]) drawTile(ctx, logos[i]!, { x: x0 + ic + icGap + vw + 10, y: vy - lg / 2, w: lg, h: lg }, logoPlate(e.team).bg)
  }
  // bandes 4 à 10 : couleur principale du club, texte contrasté automatiquement
  const band = Z.band, rk = Z.bandRank, val = Z.bandValue, team = Z.bandTeam
  L.bands.forEach((y, k) => {
    const e = entries[k + 3]
    // moins de 10 joueurs : les bandes vides ne sont pas dessinées (jamais de « 0 BUT »)
    if (!e) return
    const color = e.team?.primary_color ?? '#123E8F'
    const fg = contrastText(color)
    ctx.fillStyle = shade(color, 0.78); ctx.fillRect(rk.x, y, rk.w, band.h)
    ctx.fillStyle = color; ctx.fillRect(val.x + val.w + 1, y, band.x + band.w - (val.x + val.w + 1), band.h)
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(val.x, y, val.w + 1, band.h)
    const cy = y + band.h / 2
    textAt(ctx, cfg, rk, String(e.rank), rk.x + rk.w / 2, cy, rk.w - 8, rk.size ?? 52, 'center', contrastText(shade(color, 0.78)))
    if (opts.icon) {
      // ballon + valeur centrés ensemble dans la case blanche, valeur jamais coupée
      const ic = Math.round(band.h * 0.42), gap = 8, room = val.w - 16 - ic - gap
      ctx.font = fontOf(cfg, val, val.size ?? 44); const w = Math.min(ctx.measureText(e.display).width, room)
      const x0 = val.x + (val.w - (ic + gap + w)) / 2
      drawBall(ctx, x0 + ic / 2, cy, ic / 2)
      textAt(ctx, cfg, val, e.display, x0 + ic + gap, cy, room, val.size ?? 44, 'left', colorOf(cfg, 'navy'), true)
    } else textAt(ctx, cfg, val, e.display, val.x + val.w / 2, cy, val.w - 16, val.size ?? 44, 'center', colorOf(cfg, 'navy'), true)
    let x = val.x + val.w + 16
    const lg = band.logo ?? 56
    if (logos[k + 3]) drawTile(ctx, logos[k + 3]!, { x, y: cy - lg / 2, w: lg, h: lg }, logoPlate(e.team).bg)
    x += lg + (band.gap ?? 14)
    const tname = (e.team?.short_name ?? '').toLocaleUpperCase('fr-FR')
    ctx.font = fontOf(cfg, team, team.size ?? 22); const tw = ctx.measureText(tname).width
    textAt(ctx, cfg, band, e.name, x, cy, band.x + band.w - x - tw - 30, band.size ?? 44, 'left', fg)
    withAlpha(ctx, team.opacity, () => textAt(ctx, cfg, team, tname, band.x + band.w - 16, cy, tw + 2, team.size ?? 22, 'right', fg))
  })
  if (opts.showZones) drawZones(ctx, Object.fromEntries([...Object.entries(Z).filter(([k]) => k !== 'podiumRank' && k !== 'podiumValue'), ...L.bands.map((y, k) => [`rang${k + 4}`, { ...band, y }])]), L.decor)
  return c
}
