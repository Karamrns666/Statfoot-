// Vérification réelle : photos prises sur un terrain (Unsplash, licence libre) → détourage dans Chromium.
import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173'
const out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
const p = await ctx.newPage()
const logs = []; p.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message)); p.on('dialog', (d) => d.accept())
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)
await p.evaluate(() => { localStorage.setItem('statfoot:admin:season', 'season_2025'); localStorage.setItem('statfoot:ui:season', 'season_2025') })
const save = async (url, file) => { const b64 = await p.evaluate(async (u) => { const bl = await (await fetch(u)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(bl) }) }, url); fs.writeFileSync(`${out}/${file}`, Buffer.from(b64, 'base64')) }
const players = [['Orch', 'e2e/unsplash1.jpg'], ['Naouar', 'e2e/unsplash2.jpg'], ['Afakhar', 'e2e/wiki2.jpg'], ['Ighli', 'e2e/wiki3.jpg'], ['Lamghari', 'e2e/wiki4.jpg'], ['Oudkhmouche', 'e2e/wiki1.jpg']].filter(([, f]) => fs.existsSync(f))
let k = 0
for (const [last, file] of players) {
  k++
  await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.getByPlaceholder('Rechercher…').fill(last); await p.waitForTimeout(300)
  await p.getByTitle('Modifier').first().click(); await p.waitForTimeout(400)
  const t0 = Date.now()
  await p.getByRole('dialog').locator('input[type=file][accept="image/*"]').setInputFiles(file)
  // capture de la barre de progression
  await p.getByRole('progressbar').first().waitFor({ timeout: 20000 }).then(async () => { await p.waitForTimeout(1500); await p.getByRole('dialog').screenshot({ path: `${out}/admin-progression-${k}.png` }) }).catch(() => {})
  const res = await Promise.race([
    p.getByRole('dialog').locator('img[alt="Photo détourée"]').waitFor({ timeout: 300000 }).then(() => 'ok'),
    p.getByRole('alert').waitFor({ timeout: 300000 }).then(async () => 'échec : ' + await p.getByRole('alert').innerText()),
  ]).catch((e) => 'timeout')
  await p.waitForTimeout(800)
  console.log(`JOUEUR ${last} :`, res, `${Math.round((Date.now() - t0) / 1000)} s`)
  await p.getByRole('dialog').screenshot({ path: `${out}/admin-avant-apres-${k}.png` })
  await p.getByRole('dialog').getByRole('button', { name: 'Valider' }).click().catch(() => {})
  await p.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(800)
  const pl = await p.evaluate((n) => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((x) => x.last_name === n), last)
  console.log('  champs', JSON.stringify({ photo_url: pl.photo_url, photo_cutout_url: pl.photo_cutout_url, status: pl.photo_cutout_status, mode: pl.photo_card_mode }))
  if (pl.photo_cutout_url) {
    await save(pl.photo_url, `original-${k}.webp`); await save(pl.photo_cutout_url, `detoure-${k}.${pl.photo_cutout_url.split('.').pop()}`)
    const st = await p.evaluate(async (u) => {
      const blob = await (await fetch(u)).blob(); const bmp = await createImageBitmap(blob); const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0)
      const d = x.getImageData(0, 0, bmp.width, bmp.height).data; let tr = 0, semi = 0, whiteEdge = 0
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) tr++; else if (d[i + 3] < 245) { semi++; if (d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225) whiteEdge++ } }
      return { type: blob.type, taille: `${bmp.width}×${bmp.height}`, poids: `${Math.round(blob.size / 1024)} Ko`, transparent: `${Math.round((tr / (d.length / 4)) * 100)} %`, bords_semi: semi, bords_blancs: whiteEdge, coin_haut_gauche_alpha: d[3] }
    }, pl.photo_cutout_url)
    console.log('  détouré', JSON.stringify(st))
  }
}
// lot : un 3e joueur reçoit la même photo sans détourage → « Détourer toutes les photos existantes »
await p.evaluate(() => { const K = 'statfoot:v1:Player'; const pl = JSON.parse(localStorage.getItem(K)); const src = pl.find((x) => x.last_name === 'Orch'); for (const n of ['Lachker', 'Bouslam']) { const x = pl.find((y) => y.last_name === n); x.photo_url = src.photo_url; delete x.photo_cutout_url; x.photo_card_mode = 'cutout'; x.photo_cutout_tries = 9 } localStorage.setItem(K, JSON.stringify(pl)) })
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.getByRole('button', { name: 'Détourer toutes les photos existantes' }).click(); await p.waitForTimeout(400)
await p.getByRole('dialog').screenshot({ path: `${out}/lot-avant.png` })
const t2 = Date.now()
await p.getByRole('dialog').getByRole('button', { name: /^Détourer \d/ }).click()
await p.getByRole('dialog').getByText('Terminé').waitFor({ timeout: 400000 }).catch(() => {})
console.log('LOT', await p.getByRole('dialog').innerText().then((t) => t.replace(/\s+/g, ' ').slice(0, 300)), `${Math.round((Date.now() - t2) / 1000)} s`)
await p.getByRole('dialog').screenshot({ path: `${out}/lot-fin.png` })
await p.keyboard.press('Escape')
// cartes publiques desktop + mobile, équipe type ronde
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.locator('main .grid').first().screenshot({ path: `${out}/cartes-desktop.png` })
await p.goto(B + '/equipe-type', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const orch = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((x) => x.last_name === 'Orch'))
console.log('ÉQUIPE TYPE photo ronde originale', await p.locator(`main img[src="${orch.photo_url}"]`).count(), '· détourée', await p.locator(`main img[src="${orch.photo_cutout_url}"]`).count())
await p.screenshot({ path: `${out}/equipe-type.png` })
await p.setViewportSize({ width: 390, height: 844 })
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.screenshot({ path: `${out}/cartes-mobile.png` })
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.getByPlaceholder('Rechercher…').fill('Orch'); await p.waitForTimeout(300); await p.getByTitle('Modifier').first().click(); await p.waitForTimeout(800)
await p.getByRole('dialog').getByText('Avant — photo originale').scrollIntoViewIfNeeded()
await p.screenshot({ path: `${out}/admin-mobile.png` })
console.log('LOGS', JSON.stringify(logs.slice(0, 8)))
await b.close()
