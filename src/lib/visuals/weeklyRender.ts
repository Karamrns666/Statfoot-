// Dessin des visuels de la semaine (1080 × 1350) par-dessus les modèles officiels utilisés TELS QUELS :
//  • template-semaine-resultats-classement.png : 16 pastilles blanches, zone centrale, barre orange verticale ;
//  • template-top10.png : podium (3 cartes + pastilles nom) et 7 bandes (rangs 4 à 10).
// Toutes les zones viennent de src/config/visuals.json (semaine / top10), modifiables et visibles en « aperçu des zones ».
import { colorOf, WEEKLY_H, WEEKLY_W, type VisualsConfig, type Zone } from './config'
import { drawContain, drawText, drawZones, ensureVisualFonts, fitText, fontOf, loadImage, newCanvas } from './render'
import { contrastText, shade, type TopEntry, type WeeklyResultRow, type WeeklyStandingRow } from './weekly'
import type { SeniorityTier } from '@/lib/seniority'

const withAlpha = (ctx: CanvasRenderingContext2D, a: number | undefined, f: () => void) => { ctx.save(); ctx.globalAlpha = a ?? 1; f(); ctx.restore() }
const rowY = (cfg: VisualsConfig, z: Zone, i: number) => ({ ...z, y: z.y + i * cfg.semaine.options.step })

/** Masque une pastille inutilisée en recopiant le fond du modèle situé juste à droite (même dégradé). */
function hidePill(ctx: CanvasRenderingContext2D, bg: HTMLImageElement, p: Zone) {
  const sx = p.x + p.w + 14
  ctx.drawImage(bg, sx, p.y - 4, p.w + 4, p.h + 8, p.x - 2, p.y - 4, p.w + 4, p.h + 8)
}

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
function textAt(ctx: CanvasRenderingContext2D, cfg: VisualsConfig, z: Zone, text: string, x: number, cy: number, maxW: number, size: number, align: CanvasTextAlign = 'left', color?: string) {
  ctx.save()
  ctx.font = fontOf(cfg, z, size)
  let t = text
  while (t.length > 2 && ctx.measureText(t).width > maxW) t = `${t.slice(0, -2)}…`
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
export async function renderWeeklyStandings(rows: (WeeklyStandingRow & { tier?: SeniorityTier })[], cfg: VisualsConfig, opts: { title: string; subtitle: string; showZones?: boolean; logo?: string }) {
  const L = cfg.semaine, Z = L.zones
  const { c, ctx, bg } = await base(cfg, cfg.templates.semaine)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  await drawDivisionLogo(ctx, Z, opts.logo)
  const list = rows.slice(0, L.options.maxRows)
  if (bg && L.options.hideUnusedPills) for (let i = list.length; i < L.options.maxRows; i++) hidePill(ctx, bg, rowY(cfg, Z.pill, i))
  drawText(ctx, cfg, 'PTS', Z.barHead)
  const logos = await Promise.all(list.map((r) => loadImage(r.logo)))
  // tailles communes à toutes les lignes
  const nameSize = Math.min(...list.map((r) => fitText(ctx, cfg, r.name, { ...Z.row, w: Z.row.w * 0.6 }).size), Z.row.size ?? 30)
  list.forEach((r, i) => {
    const p = rowY(cfg, Z.pill, i), row = rowY(cfg, Z.row, i), cy = row.y + row.h / 2
    drawText(ctx, cfg, String(r.rank), p)
    const lg = Z.row.logo ?? 40
    let x = row.x
    const img = logos[i]
    if (img) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, cy - lg / 2, lg, lg, 8); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); drawContain(ctx, img, { x: x + 2, y: cy - lg / 2 + 2, w: lg - 4, h: lg - 4 }) }
    x += lg + (Z.row.gap ?? 12)
    const stats = `MJ ${r.played} · DIFF ${r.gd > 0 ? '+' : ''}${r.gd}`
    ctx.font = fontOf(cfg, Z.rowStats, Z.rowStats.size ?? 22); const sw = ctx.measureText(stats).width
    const nameMax = row.x + row.w - sw - 22 - x - (r.tier ? 26 : 0)
    const nw = textAt(ctx, cfg, Z.row, r.name, x, cy, nameMax, nameSize)
    if (r.tier) tierCoin(ctx, cfg, r.tier, x + nw + 8, cy, 9)
    withAlpha(ctx, Z.rowStats.opacity, () => textAt(ctx, cfg, Z.rowStats, stats, row.x + row.w, cy, sw + 2, Z.rowStats.size ?? 22, 'right'))
    drawText(ctx, cfg, String(r.points), rowY(cfg, Z.points, i), { shadow: true })
  })
  if (opts.showZones) drawZones(ctx, Z, L.decor)
  return c
}

// ---------------------------------------------------------------------------
//  Résultats de la semaine
// ---------------------------------------------------------------------------
export async function renderWeeklyResults(rows: WeeklyResultRow[], cfg: VisualsConfig, opts: { title: string; subtitle: string; barLabel: string; showZones?: boolean; logo?: string }) {
  const L = cfg.semaine, Z = L.zones
  const { c, ctx, bg } = await base(cfg, cfg.templates.semaine)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  await drawDivisionLogo(ctx, Z, opts.logo)
  const list = rows.slice(0, L.options.maxRows)
  if (bg && L.options.hideUnusedPills) for (let i = list.length; i < L.options.maxRows; i++) hidePill(ctx, bg, rowY(cfg, Z.pill, i))
  // libellé vertical dans la barre orange
  const bz = Z.barLabel
  ctx.save(); ctx.translate(bz.x + bz.w / 2, bz.y + bz.h / 2); ctx.rotate(-Math.PI / 2)
  drawText(ctx, cfg, opts.barLabel, { ...bz, x: -bz.h / 2, y: -bz.w / 2, w: bz.h, h: bz.w })
  ctx.restore()
  const imgs = await Promise.all(list.flatMap((r) => [loadImage(r.home.logo), loadImage(r.away.logo)]))
  const row0 = Z.row, cx = row0.x + row0.w / 2, lg = Math.min(row0.logo ?? 40, row0.h + 6), scoreW = 120, gap = row0.gap ?? 12
  const nameMax = cx - scoreW / 2 - gap - lg - gap - row0.x
  const nameSize = Math.min(...list.flatMap((r) => [r.home.name, r.away.name]).map((n) => fitText(ctx, cfg, n, { ...row0, w: nameMax }).size), row0.size ?? 30)
  list.forEach((r, i) => {
    const p = rowY(cfg, Z.pill, i), row = rowY(cfg, row0, i), cy = row.y + row.h / 2
    drawText(ctx, cfg, r.tag, p)
    // score dans un cartouche blanc
    ctx.save(); ctx.beginPath(); ctx.roundRect(cx - scoreW / 2, row.y - 2, scoreW, row.h + 4, 8); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore()
    textAt(ctx, cfg, row0, r.score, cx, cy, scoreW - 10, Math.min(row0.size ?? 30, 30), 'center', colorOf(cfg, 'navy'))
    if (r.sub) textAt(ctx, cfg, Z.rowStats, r.sub, cx, row.y + row.h + 9, scoreW + 60, 14, 'center')
    const hx = cx - scoreW / 2 - gap - lg, ax = cx + scoreW / 2 + gap
    for (const [img, x] of [[imgs[i * 2], hx], [imgs[i * 2 + 1], ax]] as const) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, cy - lg / 2, lg, lg, 8); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore()
      if (img) drawContain(ctx, img, { x: x + 2, y: cy - lg / 2 + 2, w: lg - 4, h: lg - 4 })
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
export async function renderTop10(entries: TopEntry[], cfg: VisualsConfig, opts: { title: string; subtitle: string; showZones?: boolean }) {
  const L = cfg.top10, Z = L.zones
  const { c, ctx } = await base(cfg, cfg.templates.top10)
  drawHeader(ctx, cfg, Z, opts.title, opts.subtitle)
  const photos = await Promise.all(entries.slice(0, 3).map((e) => loadImage(e.player.photo_card_mode !== 'original' && e.player.photo_cutout_url ? e.player.photo_cutout_url : e.player.photo_url)))
  const logos = await Promise.all(entries.map((e) => loadImage(e.team?.logo_url)))
  // podium : 2e à gauche, 1er au centre, 3e à droite
  const slots: [number, Zone, Zone][] = [[0, Z.card1, Z.pill1], [1, Z.card2, Z.pill2], [2, Z.card3, Z.pill3]]
  const pillSize = Math.min(...slots.filter(([i]) => entries[i]).map(([i, , pz]) => fitText(ctx, cfg, entries[i].name, pz).size), Z.pill1.size ?? 30)
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
    drawText(ctx, cfg, e.name, { ...pill, size: pillSize })
    // valeur + logo du club sous la pastille
    const vz = Z.podiumValue, lg = vz.logo ?? 46, vy = vz.y + vz.h / 2
    ctx.font = fontOf(cfg, vz, vz.size ?? 40); const vw = Math.min(ctx.measureText(e.display).width, card.w - lg - 40)
    const x0 = card.x + (card.w - (vw + 10 + lg)) / 2
    textAt(ctx, cfg, vz, e.display, x0, vy, card.w - lg - 40, vz.size ?? 40)
    if (logos[i]) { ctx.save(); ctx.beginPath(); ctx.roundRect(x0 + vw + 10, vy - lg / 2, lg, lg, 10); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); drawContain(ctx, logos[i]!, { x: x0 + vw + 12, y: vy - lg / 2 + 2, w: lg - 4, h: lg - 4 }) }
  }
  // bandes 4 à 10 : couleur principale du club, texte contrasté automatiquement
  const band = Z.band, rk = Z.bandRank, val = Z.bandValue, team = Z.bandTeam
  L.bands.forEach((y, k) => {
    const e = entries[k + 3]
    const color = e?.team?.primary_color ?? '#123E8F'
    const fg = contrastText(color)
    ctx.fillStyle = shade(color, 0.78); ctx.fillRect(rk.x, y, rk.w, band.h)
    ctx.fillStyle = color; ctx.fillRect(val.x + val.w + 1, y, band.x + band.w - (val.x + val.w + 1), band.h)
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(val.x, y, val.w + 1, band.h)
    if (!e) return
    const cy = y + band.h / 2
    textAt(ctx, cfg, rk, String(e.rank), rk.x + rk.w / 2, cy, rk.w - 8, rk.size ?? 52, 'center', contrastText(shade(color, 0.78)))
    textAt(ctx, cfg, val, e.display, val.x + val.w / 2, cy, val.w - 16, val.size ?? 44, 'center', colorOf(cfg, 'navy'))
    let x = val.x + val.w + 16
    const lg = band.logo ?? 56
    if (logos[k + 3]) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, cy - lg / 2, lg, lg, 10); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); drawContain(ctx, logos[k + 3]!, { x: x + 3, y: cy - lg / 2 + 3, w: lg - 6, h: lg - 6 }) }
    x += lg + (band.gap ?? 14)
    const tname = (e.team?.short_name ?? '').toLocaleUpperCase('fr-FR')
    ctx.font = fontOf(cfg, team, team.size ?? 22); const tw = ctx.measureText(tname).width
    textAt(ctx, cfg, band, e.name, x, cy, band.x + band.w - x - tw - 30, band.size ?? 44, 'left', fg)
    withAlpha(ctx, team.opacity, () => textAt(ctx, cfg, team, tname, band.x + band.w - 16, cy, tw + 2, team.size ?? 22, 'right', fg))
  })
  if (opts.showZones) drawZones(ctx, Object.fromEntries([...Object.entries(Z).filter(([k]) => k !== 'podiumRank' && k !== 'podiumValue'), ...L.bands.map((y, k) => [`rang${k + 4}`, { ...band, y }])]), L.decor)
  return c
}
