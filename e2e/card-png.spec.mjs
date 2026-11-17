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
      return { w: c.width, h: c.height, red, blue, url: c.toDataURL('image/png') }
    })
    fs.mkdirSync(`e2e/__screenshots__/${info.project.name}`, { recursive: true })
    fs.writeFileSync(`e2e/__screenshots__/${info.project.name}/carte-png-${k}.png`, Buffer.from(r.url.split(',')[1], 'base64'))
    await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/carte-ecran-${k}.png` })
    console.log(`[${info.project.name}] ${k}: ${r.w}×${r.h} rouge=${r.red} bleu=${r.blue}`)
    expect([r.w, r.h]).toEqual([1080, 1350])
    if (k === 'cutout') expect(r.blue, 'photo détourée (maillot bleu) dans le PNG').toBeGreaterThan(800)
    if (k === 'photo') expect(r.red, 'photo (maillot rouge) dans le PNG').toBeGreaterThan(800)
  }
})
