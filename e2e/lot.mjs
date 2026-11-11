import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
p.on('pageerror', (e) => logs.push(e.message))
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
await p.goto(B + '/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.setItem('statfoot:ui:season', 'season_2025'))
const snap = async () => { await p.goto(B + '/classement', { waitUntil: 'networkidle' }); await p.waitForTimeout(500); const a = await p.locator('table').first().innerText(); await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(800); return a + (await p.locator('main').innerText()).slice(0, 3000) }
const before = await snap()
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
await p.goto(B + '/admin/capitaines', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
const names = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Player')).filter((x) => x.season_ids?.includes('season_2025')).slice(0, 14).map((x) => ({ n: `${x.first_name} ${x.last_name}`, gk: x.position === 'GK' })))
for (const [side, list] of [['orange', names.slice(0, 7)], ['bleue', names.slice(7, 14)]]) {
  const card = p.locator('div', { has: p.getByRole('textbox', { name: `Ajouter un joueur à l’équipe ${side}` }) }).last()
  const search = p.getByRole('textbox', { name: `Ajouter un joueur à l’équipe ${side}` })
  for (const x of list) { await search.fill(x.n.split(' ').slice(-1)[0]); await p.waitForTimeout(150); await p.locator('button', { hasText: x.n }).first().click() }
  await search.fill('')
}
await p.locator('#cn-orange').fill('Orange Lions'); await p.locator('#cn-bleue').fill('Blue Sharks')
for (const b2 of await p.getByRole('button', { name: 'Enregistrer' }).all()) await b2.click()
await p.waitForTimeout(500)
console.log('ÉQUIPES', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:CaptainTeam')).map((t) => `${t.name}:${t.player_ids.length}`))))
await p.screenshot({ path: `${out}/admin-capitaines.png` })
// match 1 : terminé
await p.getByRole('button', { name: 'Nouveau match' }).click(); await p.waitForURL(/capitaines\/.+/); await p.waitForTimeout(500)
await p.locator('#cm-date').fill('2026-10-03T18:00'); await p.locator('#cm-pitch').fill('Terrain 2')
const setN = async (who, col, n) => p.getByRole('spinbutton', { name: `${col} — ${who}` }).fill(String(n))
const o = names.slice(0, 7).map((x) => x.n), bl = names.slice(7, 14).map((x) => x.n)
for (const n of o.slice(0, 6).concat(bl.slice(0, 6))) await p.getByRole('checkbox', { name: `${n} a joué` }).check()
await setN(o[0], 'Buts', 4); await setN(o[0], 'Cartons jaunes', 1); await setN(o[1], 'Buts', 1); await setN(o[1], 'Passes décisives', 2)
await setN(bl[0], 'Buts', 3); await setN(bl[1], 'Buts contre son camp', 1); await setN(bl[2], 'Cartons rouges', 1); await setN(bl[0], 'Passes décisives', 1)
await p.locator('input[name="gk-orange"]').nth(5).check(); await setN(o[5], 'Arrêts (gardien)', 7)
await p.locator('input[name="gk-bleue"]').nth(5).check(); await setN(bl[5], 'Arrêts (gardien)', 4)
const sc = await p.locator('main .num.text-3xl').allInnerTexts(); console.log('SCORE SAISI', sc.join(' - '))
await p.getByRole('button', { name: 'Terminer le match' }).click(); await p.waitForTimeout(500)
await p.screenshot({ path: `${out}/admin-feuille.png`, fullPage: true })
// match 2 : nul 2-2 tirs au but ; match 3 : à venir
await p.goto(B + '/admin/capitaines', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Nouveau match' }).click(); await p.waitForURL(/capitaines\/.+/); await p.waitForTimeout(400)
await p.locator('#cm-date').fill('2026-11-07T18:00'); await setN(o[2], 'Buts', 2); await setN(bl[3], 'Buts', 2)
await p.getByRole('spinbutton', { name: /Tirs au but Orange/ }).fill('4'); await p.getByRole('spinbutton', { name: /Tirs au but Blue/ }).fill('5')
await p.getByRole('button', { name: 'Terminer le match' }).click(); await p.waitForTimeout(400)
await p.goto(B + '/admin/capitaines', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Nouveau match' }).click(); await p.waitForURL(/capitaines\/.+/); await p.waitForTimeout(400)
await p.locator('#cm-pitch').fill('Terrain 1'); await p.getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(400)
console.log('MATCHS', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:CaptainMatch')).map((m) => `${m.date} ${m.status} lignes:${m.lines.length} tab:${m.orange_pens ?? '-'}-${m.bleue_pens ?? '-'}`))))
// la ligue est inchangée
const after = await snap(); console.log('LIGUE INCHANGÉE (classement + joueurs)', before === after)
// public
for (const [w, h] of [[1366, 900], [360, 800]]) {
  await p.setViewportSize({ width: w, height: h })
  await p.goto(B + '/match-des-capitaines', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  if (w === 1366) console.log('PUBLIC', (await p.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 700))
  await p.screenshot({ path: `${out}/capitaines-${w}.png`, fullPage: true }); console.log('PUBLIC', w, 'débordement', await overflow())
  if (w === 1366) { await p.getByRole('tab', { name: 'Statistiques' }).click(); await p.waitForTimeout(300); console.log('STATS', (await p.locator('[role=tabpanel][data-state=active]').innerText()).replace(/\n+/g, ' | ').slice(0, 400)); await p.screenshot({ path: `${out}/capitaines-stats.png` }) }
  await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  const blk = p.locator('section[aria-labelledby="capitaines-titre"]'); await blk.scrollIntoViewIfNeeded()
  console.log('ACCUEIL', w, (await blk.innerText()).replace(/\n+/g, ' | ').slice(0, 300)); await blk.screenshot({ path: `${out}/accueil-capitaines-${w}.png` })
}
await p.goto(B + '/', { waitUntil: 'networkidle' }); console.log('MENU', await p.getByRole('link', { name: 'Capitaines' }).count())
console.log('LOGS', JSON.stringify(logs)); await b.close()
