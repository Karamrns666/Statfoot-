import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await ctx.newPage()
p.on('pageerror', (e) => logs.push(e.message)); p.on('dialog', (d) => d.accept())
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/pre-saison', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('FORMAT', (await p.locator('main').innerText()).match(/23 équipes · 4 journées[^\n]*/)?.[0])
await p.locator('#ps-seed').fill('20261111'); await p.getByRole('button', { name: 'Tirer au sort la journée 1' }).click(); await p.waitForTimeout(700)
const order1 = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Competition')).find((c) => c.id === 'comp_2026_selection').preseason.draw_order.join(','))
// projection
await p.getByRole('button', { name: /Projection du tirage/ }).click(); await p.waitForTimeout(600)
await p.screenshot({ path: `${out}/projection-0.png` })
for (let i = 0; i < 7; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(1500) }
await p.screenshot({ path: `${out}/projection-7.png` })
await p.emulateMedia({ reducedMotion: 'reduce' })
for (let i = 7; i < 23; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(900) }
await p.waitForTimeout(500); await p.screenshot({ path: `${out}/projection-fin.png` })
console.log('PROJECTION', (await p.locator('[role=dialog][aria-label^="Tirage"] header').innerText()).replace(/\n+/g, ' | '))
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
// rejouable : même graine → même ordre
await p.getByRole('button', { name: /Annuler le tirage/ }).click(); await p.waitForTimeout(400)
await p.locator('#ps-seed').fill('20261111'); await p.getByRole('button', { name: 'Tirer au sort la journée 1' }).click(); await p.waitForTimeout(600)
const order2 = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Competition')).find((c) => c.id === 'comp_2026_selection').preseason.draw_order.join(','))
console.log('REJOUABLE même graine → même ordre :', order1 === order2)
await p.screenshot({ path: `${out}/admin-j1-apercu.png`, fullPage: true })
const play = async () => p.evaluate(() => { const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')); let k = 0; for (const m of M) if (m.competition_id === 'comp_2026_selection' && m.status !== 'finished') { k++; const h = (m.id.charCodeAt(m.id.length - 1) + k) % 4, a = (m.id.charCodeAt(m.id.length - 2) + 2 * k) % 3; Object.assign(m, { status: 'finished', home_score: h, away_score: a }) } localStorage.setItem('statfoot:v1:Match', JSON.stringify(M)) })
const publish = async (label) => { await p.getByRole('button', { name: /^Publier/ }).click(); await p.waitForTimeout(700); console.log('PUBLIÉ', label) }
await publish('J1')
console.log('Générer bloqué avant résultats :', await p.getByRole('button', { name: /Générer/ }).isDisabled())
await play(); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(600)
for (const r of ['journée 2', 'journée 3', 'journée 4', 'rattrapage']) {
  await p.getByRole('button', { name: new RegExp(`Générer ${r}`) }).click(); await p.waitForTimeout(700)
  const rows = await p.locator('main table').first().locator('tbody tr').allInnerTexts()
  console.log('APERÇU', r, rows.length, 'matchs |', rows.slice(0, 3).map((x) => x.replace(/\s+/g, ' ')).join(' / '))
  if (r === 'journée 2') {
    await p.screenshot({ path: `${out}/admin-j2-apercu.png`, fullPage: true })
    // échange menant à un rematch → refusé
    const pend = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Competition')).find((c) => c.id === 'comp_2026_selection').preseason.pending)
    const M = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Match')).filter((m) => m.round === 1 && m.competition_id === 'comp_2026_selection'))
    const T = await p.evaluate(() => Object.fromEntries(JSON.parse(localStorage.getItem('statfoot:v1:Team')).map((t) => [t.id, t.name])))
    // J1 : X–Y ; en J2 X joue P, Y joue Q → échanger P et Y crée X–Y (rematch)
    const j1 = M[0]; const pX = pend.pairs.find((q) => q.home === j1.home_team_id || q.away === j1.home_team_id); const P = pX.home === j1.home_team_id ? pX.away : pX.home
    await p.getByRole('button', { name: 'Modifier un match' }).click(); await p.waitForTimeout(300)
    const d = p.getByRole('dialog'); const sel = d.getByRole('combobox')
    await sel.nth(0).click(); await p.getByRole('option', { name: T[P], exact: true }).click()
    await sel.nth(1).click(); await p.getByRole('option', { name: T[j1.away_team_id], exact: true }).click(); await d.locator('#sw-motif').fill('test rematch')
    console.log('REMATCH refusé :', (await d.innerText()).includes('Rematch interdit'), '| bouton désactivé :', await d.getByRole('button', { name: /Appliquer/ }).isDisabled())
    await d.screenshot({ path: `${out}/admin-echange.png` }); await p.keyboard.press('Escape')
  }
  await publish(r); await play(); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(600)
}
const stats = await p.evaluate(() => { const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')).filter((m) => m.competition_id === 'comp_2026_selection'); const n = {}; const pairs = new Set(); for (const m of M) { for (const t of [m.home_team_id, m.away_team_id]) n[t] = (n[t] ?? 0) + 1; pairs.add([m.home_team_id, m.away_team_id].sort().join('|')) } const c = JSON.parse(localStorage.getItem('statfoot:v1:Competition')).find((x) => x.id === 'comp_2026_selection'); return { matchs: M.length, uniques: pairs.size, parEquipe: [...new Set(Object.values(n))], equipes: Object.keys(n).length, repos: c.preseason.rests, raisons: [...new Set(M.map((m) => m.pairing_reason?.replace(/\d+/g, 'n')))] } })
console.log('BILAN', JSON.stringify(stats))
await p.getByRole('button', { name: 'Clôturer la pré-saison' }).click(); await p.waitForTimeout(700)
await p.getByRole('button', { name: /^Créer/ }).click(); await p.waitForTimeout(800)
console.log('DIVISIONS', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Competition')).filter((c) => c.season_id === 'season_2026').map((c) => `${c.name}:${c.phase}:${c.team_ids.length}`))))
await p.screenshot({ path: `${out}/admin-final.png`, fullPage: true })
console.log('JOURNAL', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:AuditLog') || '[]').filter((x) => String(x.action).startsWith('preseason')).map((x) => x.action))))
await p.setViewportSize({ width: 360, height: 800 }); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700)
console.log('ADMIN 360 débordement page', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
await p.screenshot({ path: `${out}/admin-360.png` })
console.log('LOGS', JSON.stringify(logs)); await b.close()
