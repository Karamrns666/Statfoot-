import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
p.on('pageerror', (e) => logs.push(e.message))
await p.goto(B + '/', { waitUntil: 'networkidle' })
// MASTER 2026 : J1 et J2 jouées (scores seulement) pour le visuel classement
const info = await p.evaluate(() => {
  const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')); const C = JSON.parse(localStorage.getItem('statfoot:v1:Competition'))
  const gold = C.find((c) => c.season_id === 'season_2026' && c.phase === 'gold')
  let k = 0
  for (const m of M.filter((x) => x.competition_id === gold.id && (x.round === 1 || x.round === 2))) { k++; Object.assign(m, { status: 'finished', home_score: (k * 7) % 6, away_score: (k * 3) % 5, published: true }) }
  localStorage.setItem('statfoot:v1:Match', JSON.stringify(M))
  return { gold: gold.id, n: k }
})
console.log('MASTER injecté', JSON.stringify(info))
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
async function tiles(prefix) {
  await p.waitForTimeout(2500)
  const figs = p.locator('main figure')
  const n = await figs.count()
  for (let i = 0; i < n; i++) {
    const f = figs.nth(i); const label = (await f.locator('figcaption').innerText()).trim()
    const img = f.locator('img'); await img.waitFor({ timeout: 60000 })
    const data = await img.evaluate(async (el) => { const r = await fetch(el.src); const bl = await r.blob(); return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl) }) })
    const name = `${prefix}-${label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    if (i < 6) fs.writeFileSync(`${out}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'))
    if (i < 6) console.log('TUILE', name)
  }
  console.log(prefix, 'tuiles', n, '| textes', (await p.locator('main textarea').first().inputValue()).replace(/\n/g, ' / ').slice(0, 160))
}
// 2026 MASTER
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/visuels-semaine', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('COMPÉTITIONS', await p.locator('main select, main [role=combobox]').first().innerText().catch(() => '?'))
await tiles('master')
// 2025 Championnat (vraies données)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2025'))
await p.goto(B + '/admin/visuels-semaine', { waitUntil: 'networkidle' })
await tiles('championnat')
await p.screenshot({ path: `${out}/admin-visuels-semaine.png` })
await p.getByRole('switch', { name: 'Aperçu des zones' }).click(); await tiles('zones')
// ZIP
await p.getByRole('switch', { name: 'Aperçu des zones' }).click(); await p.waitForTimeout(500)
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.getByRole('button', { name: /Télécharger tout/ }).click()])
await dl.saveAs(`${out}/semaine.zip`); console.log('ZIP', dl.suggestedFilename(), fs.statSync(`${out}/semaine.zip`).size)
// accueil 360
await p.setViewportSize({ width: 360, height: 780 }); await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.screenshot({ path: `${out}/accueil-360.png`, fullPage: true }); console.log('ACCUEIL 360 débordement', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
console.log('LOGS', JSON.stringify(logs)); await b.close()
