import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage()
p.on('pageerror', (e) => logs.push(e.message)); p.on('dialog', (d) => d.accept())
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
await p.evaluate(() => { localStorage.setItem('statfoot:admin:season', 'season_2026'); localStorage.setItem('statfoot:ui:season', 'season_2026') })
await p.goto(B + '/admin/pre-saison', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.locator('#ps-seed').fill('20261111'); await p.getByRole('button', { name: 'Tirer au sort la journée 1' }).click(); await p.waitForTimeout(600)
const play = async () => p.evaluate(() => { const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')); let k = 0; for (const m of M) if (m.competition_id === 'comp_2026_selection' && m.status !== 'finished') { k++; Object.assign(m, { status: 'finished', home_score: (k * 7) % 4, away_score: (k * 5) % 3 }) } localStorage.setItem('statfoot:v1:Match', JSON.stringify(M)) })
const pub = async () => { await p.getByRole('button', { name: /^Publier/ }).click(); await p.waitForTimeout(600) }
await pub(); await play(); await p.reload({ waitUntil: 'networkidle' })
await p.getByRole('button', { name: /Générer journée 2/ }).click(); await p.waitForTimeout(500); await pub()
// moitié des résultats de J2
await p.evaluate(() => { const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')); let k = 0; for (const m of M) if (m.competition_id === 'comp_2026_selection' && m.round === 2 && k++ < 6) Object.assign(m, { status: 'finished', home_score: k % 3, away_score: (k + 1) % 2 }); localStorage.setItem('statfoot:v1:Match', JSON.stringify(M)) })
async function shots(tag) {
  for (const [w, h] of [[1366, 900], [360, 800]]) {
    await p.setViewportSize({ width: w, height: h })
    for (const t of ['fonctionnement', 'journees', 'classement', 'parcours']) {
      await p.goto(`${B}/pre-saison?onglet=${t}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
      if (t === 'journees' && tag === 'milieu') { await p.getByRole('tab', { name: 'J1', exact: true }).click(); await p.waitForTimeout(300) }
      await p.screenshot({ path: `${out}/${tag}-${t}-${w}.png`, fullPage: true })
      console.log(tag, t, w, 'débordement', await overflow())
    }
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
    const strip = await p.locator('a[aria-label^="Pré-saison"]').first().innerText().catch(() => '?')
    console.log(tag, 'ACCUEIL bandeau', w, strip.replace(/\n+/g, ' | '), '| débordement', await overflow())
    if (w === 1366) { await p.locator('a[aria-label^="Pré-saison"]').first().screenshot({ path: `${out}/${tag}-bandeau.png` }) }
  }
  await p.setViewportSize({ width: 1366, height: 900 })
}
await shots('milieu')
console.log('J1 texte', (await (async () => { await p.goto(`${B}/pre-saison?onglet=journees`, { waitUntil: 'networkidle' }); await p.getByRole('tab', { name: 'J1', exact: true }).click(); return p.locator('main table').first().innerText() })()).split('\n').slice(0, 3).join(' / '))
await p.goto(B + '/classement', { waitUntil: 'networkidle' }); await p.waitForTimeout(500); console.log('CLASSEMENT page', (await p.locator('main').innerText()).includes('Force adv.'))
const t0 = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Team')).find((t) => t.id === 't26_cac').id)
await p.goto(`${B}/equipes/${t0}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500); console.log('PAGE ÉQUIPE parcours', (await p.locator('main').innerText()).match(/PARCOURS EN PRÉ-SAISON[\s\S]{0,160}/i)?.[0]?.replace(/\n+/g, ' | '))
await p.screenshot({ path: `${out}/equipe-parcours.png`, fullPage: true })
// fin de la pré-saison
await p.goto(B + '/admin/pre-saison', { waitUntil: 'networkidle' }); await play(); await p.reload({ waitUntil: 'networkidle' })
for (const r of ['journée 3', 'journée 4', 'rattrapage']) { await p.getByRole('button', { name: new RegExp(`Générer ${r}`) }).click(); await p.waitForTimeout(500); await pub(); await play(); await p.reload({ waitUntil: 'networkidle' }) }
await p.getByRole('button', { name: 'Clôturer la pré-saison' }).click(); await p.waitForTimeout(500); await p.getByRole('button', { name: /^Créer/ }).click(); await p.waitForTimeout(700)
await shots('fin')
await p.goto(B + '/classement', { waitUntil: 'networkidle' }); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/fin-classement-onglets.png` })
await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
const sb = p.locator('a[aria-label^="MASTER"]').first(); await sb.scrollIntoViewIfNeeded(); await p.locator('a[aria-label^="MASTER"]').first().locator('..').screenshot({ path: `${out}/fin-bandeau-divisions.png` })
console.log('LOGS', JSON.stringify(logs)); await b.close()
