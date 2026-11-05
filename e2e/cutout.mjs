// Vérification de bout en bout du détourage dans un vrai Chromium (CI, avec accès réseau).
import { chromium } from 'playwright'
const B = 'http://localhost:4173'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1366, height: 900 } })
const logs = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text().slice(0, 200)) }); p.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message))
p.on('dialog', (d) => d.accept())
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2025'))
// 1) formulaire : import → détourage
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
await p.getByPlaceholder('Rechercher…').fill('Orch'); await p.waitForTimeout(300)
await p.getByTitle('Modifier').first().click(); await p.waitForTimeout(400)
const t0 = Date.now()
await p.getByRole('dialog').locator('input[type=file][accept="image/*"]').setInputFiles('e2e/joueur.jpg')
const res = await Promise.race([
  p.getByRole('dialog').locator('img[alt="Photo détourée"]').waitFor({ timeout: 240000 }).then(() => 'ok'),
  p.getByText(/Détourage impossible/).waitFor({ timeout: 240000 }).then(async () => 'échec : ' + await p.getByText(/Détourage impossible/).innerText()),
]).catch((e) => 'timeout ' + e.message)
console.log('FORMULAIRE', res, `${Math.round((Date.now() - t0) / 1000)} s`)
await p.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(800)
const orch = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((x) => x.last_name === 'Orch'))
console.log('JOUEUR', orch.photo_url, orch.photo_cutout_url, orch.photo_cutout_status)
if (orch.photo_cutout_url) {
  const stats = await p.evaluate(async (u) => {
    const bmp = await createImageBitmap(await (await fetch(u)).blob()); const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0)
    const d = x.getImageData(0, 0, bmp.width, bmp.height).data; let tr = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 20) tr++
    return { w: bmp.width, h: bmp.height, transparent: Math.round((tr / (d.length / 4)) * 100) + ' %' }
  }, orch.photo_cutout_url)
  console.log('PNG DÉTOURÉ', JSON.stringify(stats))
}
// 2) file automatique : un autre joueur reçoit une photo sans détourage → traité en arrière-plan
const other = await p.evaluate(async () => {
  const blob = await (await fetch('/favicon.svg')).blob()
  return null
})
await p.evaluate(async (photo) => {
  const K = 'statfoot:v1:Player'; const pl = JSON.parse(localStorage.getItem(K)); const x = pl.find((y) => y.last_name === 'Naouar'); x.photo_url = photo; delete x.photo_cutout_url; localStorage.setItem(K, JSON.stringify(pl))
}, orch.photo_url)
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' })
const t1 = Date.now()
await p.waitForFunction(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((y) => y.last_name === 'Naouar').photo_cutout_status, null, { timeout: 240000, polling: 1000 }).catch(() => {})
const n = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).find((y) => y.last_name === 'Naouar'))
console.log('FILE AUTO', n.photo_cutout_status, n.photo_cutout_url, `${Math.round((Date.now() - t1) / 1000)} s`)
// 3) carte publique
await p.evaluate(() => localStorage.setItem('statfoot:ui:season', 'season_2025'))
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
console.log('CARTE', await p.locator('.pcard').first().locator('img[src*="cutout"]').count(), 'image(s) détourée(s), photo avec fond :', await p.locator('.pcard').first().locator(`img[src="${orch.photo_url}"]`).count())
await p.locator('.pcard').first().screenshot({ path: 'carte.png' })
console.log('LOGS', JSON.stringify(logs.slice(0, 12), null, 1))
await b.close()
