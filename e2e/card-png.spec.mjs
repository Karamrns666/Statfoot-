// Carte joueur téléchargée (PNG 1080 × 1350) : la photo (détourée ou normale) doit y figurer, comme à l'écran ;
// sans photo, la silhouette. Photos servies comme celles du site, puis le PNG est analysé pixel par pixel.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FROZEN } from './routes.mjs'

const dir = path.dirname(fileURLToPath(import.meta.url))
const PHOTO = fs.readFileSync(path.join(dir, 'fixtures/test-photo.jpg')) // maillot rouge (200, 40, 40)
const CUTOUT = fs.readFileSync(path.join(dir, 'fixtures/test-cutout.png')) // maillot bleu (30, 90, 200)
const KINDS = ['cutout', 'photo', 'none']
// le service worker du site prend les requêtes d'images avant l'interception de Playwright sous WebKit : bloqué ici
test.use({ serviceWorkers: 'block' })

test('photo présente dans la carte téléchargée', async ({ page }, info) => {
  test.setTimeout(120_000)
  await page.clock.setFixedTime(FROZEN)
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${info.project.name}] console ${m.type()}: ${m.text().slice(0, 200)}`) })
  page.on('pageerror', (e) => console.log(`[${info.project.name}] pageerror: ${e.message.slice(0, 200)}`))
  await page.route('**/test-photo.jpg', (r) => r.fulfill({ body: PHOTO, contentType: 'image/jpeg', headers: { 'Access-Control-Allow-Origin': '*' } }))
  await page.route('**/test-cutout.png', (r) => r.fulfill({ body: CUTOUT, contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' } }))
  await page.goto('/')
  await page.waitForFunction(() => !!localStorage.getItem('statfoot:v1:Team'))
  await page.evaluate((kinds) => {
    const K = 'statfoot:v1:', get = (n) => JSON.parse(localStorage.getItem(K + n) || '[]')
    const teams = get('Team').filter((t) => t.season_id === 'season_2026'), players = get('Player')
    kinds.forEach((k, i) => players.push({ id: `png_${k}`, first_name: 'Test', last_name: `Carte ${k}`, number: i + 1, team_id: teams[i].id, season_ids: ['season_2026'], status: 'active', created_date: '2025-01-01T00:00:00Z', updated_date: '2025-01-01T00:00:00Z',
      ...(k === 'cutout' ? { photo_url: '/test-photo.jpg', photo_cutout_url: '/test-cutout.png', photo_cutout_source: '/test-photo.jpg' } : k === 'photo' ? { photo_url: '/test-photo.jpg', photo_card_mode: 'original' } : {}) }))
    localStorage.setItem(K + 'Player', JSON.stringify(players))
  }, KINDS)
  for (const k of KINDS) {
    await page.goto(`/joueurs/png_${k}`)
    const btn = page.getByRole('button', { name: /Télécharger ma carte/ })
    await btn.waitFor({ timeout: 20_000 })
    await page.waitForTimeout(1500)
    if (k === 'cutout') console.log(`[${info.project.name}] DIAG`, JSON.stringify(await page.evaluate(async () => {
      const out = { states: [...document.querySelectorAll('[data-photo-state]')].map((e) => e.getAttribute('data-photo-state')) }
      const step = async (name, fn) => { try { out[name] = await fn() } catch (e) { out[name] = 'ERREUR ' + (e && e.message || e) } }
      let img
      await step('load', () => new Promise((res, rej) => { img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(`${img.naturalWidth}x${img.naturalHeight}`); img.onerror = () => rej(new Error('onerror')); img.src = '/test-cutout.png' }))
      const c = document.createElement('canvas'); c.width = 200; c.height = 300
      await step('draw', () => { c.getContext('2d').drawImage(img, 0, 0, 200, 300); return 'ok' })
      await step('getImageData', () => { c.getContext('2d').getImageData(0, 0, 10, 10); return 'ok' })
      await step('toDataURL', () => c.toDataURL('image/png').length)
      await step('fetch', async () => { const r = await fetch('/test-cutout.png', { mode: 'cors', credentials: 'omit' }); return r.status + ' ' + r.headers.get('content-type') })
      return out
    })))
    // le téléchargement est intercepté : on récupère le PNG produit (lien <a download>)
    await page.evaluate(() => { window.__png = null; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__png = this.href; return } return o.call(this) } })
    await btn.click()
    await page.waitForFunction(() => !!window.__png, null, { timeout: 30_000 })
    const r = await page.evaluate(async () => {
      const im = new Image(); im.src = window.__png; await im.decode()
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight
      const x = c.getContext('2d'); x.drawImage(im, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      let red = 0, blue = 0
      for (let i = 0; i < d.length; i += 16) { const [R, G, B] = [d[i], d[i + 1], d[i + 2]]; if (R > 150 && G < 90 && B < 90) red++; if (B > 150 && R < 90 && G > 50 && G < 140) blue++ }
      // bandeau blanc du logo : lignes dont les pixels blancs s'étendent sur plus de 400 px (coins arrondis exclus)
      const rows = []
      for (let y = 0; y < c.height; y++) {
        let x0 = -1, x1 = -1, n = 0
        for (let xx = 0; xx < c.width; xx++) { const i = (y * c.width + xx) * 4; if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) { if (x0 < 0) x0 = xx; x1 = xx; n++ } }
        if (x1 - x0 > 400 && n > 120) rows.push({ y, w: x1 - x0 + 1 })
      }
      // plus longue suite de lignes consécutives
      let best = [], cur = []
      for (const r of rows) { if (cur.length && r.y !== cur.at(-1).y + 1) cur = []; cur.push(r); if (cur.length > best.length) best = cur.slice() }
      const bw = best.length ? Math.max(...best.map((r) => r.w)) : 0
      return { w: c.width, h: c.height, red, blue, url: c.toDataURL('image/png'), banner: { w: bw, h: best.length } }
    })
    fs.mkdirSync(`e2e/__screenshots__/${info.project.name}`, { recursive: true })
    fs.writeFileSync(`e2e/__screenshots__/${info.project.name}/carte-png-${k}.png`, Buffer.from(r.url.split(',')[1], 'base64'))
    await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/carte-ecran-${k}.png` })
    console.log(`[${info.project.name}] ${k}: ${r.w}×${r.h} rouge=${r.red} bleu=${r.blue}`)
    expect([r.w, r.h]).toEqual([1080, 1350])
    // bandeau du logo identique à l'écran et dans le PNG : même rapport largeur / hauteur (6,1 : 1, coins arrondis
    // non comptés → ±0,8), et même part de la largeur de la carte
    const screen = await page.evaluate(() => {
      const b = document.querySelector('[data-card-banner]'), card = b?.closest('.pcard')
      if (!b || !card) return null
      const rb = b.getBoundingClientRect(), rc = card.getBoundingClientRect()
      return { ratio: rb.width / rb.height, part: rb.width / rc.width }
    })
    console.log(`[${info.project.name}] bandeau ${k}: écran ${JSON.stringify(screen)} · PNG ${r.banner.w}×${r.banner.h}`)
    expect(screen, 'bandeau du logo sur la carte affichée').not.toBeNull()
    expect(screen.part).toBeGreaterThan(0.72); expect(screen.part).toBeLessThan(0.8)
    expect(r.banner.h, 'bandeau du logo dans le PNG').toBeGreaterThan(40)
    expect(Math.abs(r.banner.w / r.banner.h - screen.ratio), 'même bandeau à l’écran et dans le PNG').toBeLessThan(0.9)
    if (k === 'cutout') expect(r.blue, 'photo détourée (maillot bleu) dans le PNG').toBeGreaterThan(800)
    if (k === 'photo') expect(r.red, 'photo (maillot rouge) dans le PNG').toBeGreaterThan(800)
  }
})
