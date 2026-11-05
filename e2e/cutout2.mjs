// Vérification de bout en bout : photos de terrain réelles → admin (formulaire + lot) → cartes, desktop et mobile.
import fs from 'node:fs'
import { chromium, devices } from 'playwright'
const B = 'http://localhost:4173'
const photos = JSON.parse(fs.readFileSync('e2e/photos/sources.json', 'utf8'))
fs.mkdirSync('shots', { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept())
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)
await p.evaluate(() => { localStorage.setItem('statfoot:admin:season', 'season_2025'); localStorage.setItem('statfoot:ui:season', 'season_2025') })
const top = ['Orch', 'Naouar', 'Lachker', 'Bouslam']
for (const [i, ph] of photos.entries()) {
  await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.getByPlaceholder('Rechercher…').fill(top[i]); await p.waitForTimeout(300)
  await p.getByTitle('Modifier').first().click(); await p.waitForTimeout(400)
  const t0 = Date.now(); let maxPct = 0
  const watch = setInterval(async () => { const v = await p.locator('[role=progressbar][aria-label="Avancement du détourage"]').getAttribute('aria-valuenow').catch(() => null); if (v) maxPct = Math.max(maxPct, +v) }, 250)
  await p.getByRole('dialog').locator('input[type=file][accept="image/*"]').setInputFiles(`e2e/photos/${ph.file}`)
  const res = await Promise.race([
    p.getByRole('dialog').locator('img[alt="Joueur détouré"]').waitFor({ timeout: 240000 }).then(() => 'ok'),
    p.getByRole('dialog').getByRole('alert').waitFor({ timeout: 240000 }).then(async () => 'échec : ' + await p.getByRole('dialog').getByRole('alert').innerText()),
  ]).catch((e) => 'timeout')
  clearInterval(watch)
  await p.waitForTimeout(800)
  await p.getByRole('dialog').screenshot({ path: `shots/form-${i + 1}.png` })
  if (res === 'ok' && i === 0) { await p.getByRole('dialog').getByRole('button', { name: 'Valider' }).click(); await p.waitForTimeout(200) }
  await p.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(700)
  const pl = await p.evaluate((n) => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((x) => x.last_name === n), top[i])
  let info = {}
  if (pl.photo_cutout_url) {
    info = await p.evaluate(async (u) => {
      const blob = await (await fetch(u)).blob(); const bmp = await createImageBitmap(blob); const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0)
      const d = x.getImageData(0, 0, bmp.width, bmp.height).data; let tr = 0, white = 0, edge = 0
      for (let k = 0; k < d.length; k += 4) { if (d[k + 3] < 20) tr++; else if (d[k + 3] < 240) { edge++; if (d[k] > 230 && d[k + 1] > 230 && d[k + 2] > 230) white++ } }
      const r = new FileReader(); const url = await new Promise((res) => { r.onload = () => res(r.result); r.readAsDataURL(blob) })
      return { type: blob.type, w: bmp.width, h: bmp.height, kb: Math.round(blob.size / 1024), transparent: Math.round((tr / (d.length / 4)) * 100) + ' %', halo_blanc: edge ? Math.round((white / edge) * 1000) / 10 + ' % des bords' : '—', data: url }
    }, pl.photo_cutout_url)
    fs.writeFileSync(`shots/cutout-${i + 1}.${info.type === 'image/webp' ? 'webp' : 'png'}`, Buffer.from(info.data.split(',')[1], 'base64')); delete info.data
  }
  const warn = await p.locator('[role=note]').innerText().catch(() => '')
  console.log(`PHOTO ${i + 1} (${ph.title}) → ${res} en ${Math.round((Date.now() - t0) / 1000)} s · progression max ${maxPct} % · visage ${pl.photo_face_x}/${pl.photo_face_y} · ${JSON.stringify(info)}${warn ? ' · conseil affiché' : ''}`)
}
// traitement en lot : 2 joueurs avec photo mais sans détourage
const orig = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((x) => x.last_name === 'Orch').photo_url)
await p.evaluate((u) => { const K = 'statfoot:v1:Player'; const pl = JSON.parse(localStorage.getItem(K)); for (const n of ['Afakhar', 'Ighli']) { const x = pl.find((y) => y.last_name === n); x.photo_url = u; delete x.photo_cutout_url; x.photo_cutout_tries = 3; x.photo_cutout_source = u } localStorage.setItem(K, JSON.stringify(pl)) }, orig)
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
await p.getByRole('button', { name: /Détourer toutes les photos existantes/ }).click(); await p.waitForTimeout(300)
await p.getByRole('dialog').getByRole('button', { name: /Lancer le détourage/ }).click()
await p.getByRole('dialog').getByText(/photos? détourées?\b.*\./).waitFor({ timeout: 240000 }).catch(() => {}); await p.waitForTimeout(800)
await p.waitForTimeout(500)
console.log('LOT', (await p.getByRole('dialog').innerText()).replace(/\s+/g, ' ').slice(0, 300))
await p.getByRole('dialog').screenshot({ path: 'shots/lot.png' })
// cartes publiques + équipe type, desktop puis mobile
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.locator('main .grid').first().screenshot({ path: 'shots/cartes-desktop.png' })
await p.goto(B + '/equipe-type', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
await p.locator('main').screenshot({ path: 'shots/equipe-type.png' })
const state = await ctx.storageState()
await p.setViewportSize({ width: 390, height: 844 })
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.screenshot({ path: 'shots/cartes-mobile.png' })
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.getByPlaceholder('Rechercher…').fill('Orch'); await p.waitForTimeout(300)
await p.getByTitle('Modifier').first().click(); await p.waitForTimeout(600)
await p.screenshot({ path: 'shots/form-mobile.png', fullPage: true })
console.log('ERREURS', JSON.stringify(errs.slice(0, 5)))
await b.close()
