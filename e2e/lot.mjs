import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true })
const p = await ctx.newPage(); p.on('pageerror', (e) => logs.push(e.message)); p.on('console', (m) => m.type() === 'error' && logs.push('console: ' + m.text().slice(0, 160)))
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
// liens 2026 (7 équipes revenantes)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/equipes', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
for (let i = 0; i < 8; i++) { const btn = p.getByRole('button', { name: /suggestion/ }).first(); if (!(await btn.count())) break; await btn.click(); await p.waitForTimeout(300); await p.getByRole('dialog').getByRole('button', { name: 'Approuver' }).first().click(); await p.waitForTimeout(400) }
const chips = await p.evaluate(() => [...document.querySelectorAll('tbody tr')].map((r) => (r.innerText.match(/(PLATINUM|GOLD|SILVER)[^\n]*/i) ?? ['?'])[0]))
console.log('ADMIN 2026 ancienneté', JSON.stringify(chips.reduce((a, c) => { const k = c.split(/\s/)[0]; a[k] = (a[k] ?? 0) + 1; return a }, {})))
await p.screenshot({ path: `${out}/admin-equipes-anciennete.png` })
// correction manuelle : 2025-2026 → AVR 3 saisons (Platinum), DST 2 saisons (Gold)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2025')); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800)
async function override(name, n) {
  const row = p.locator('tbody tr', { hasText: name }).first()
  await row.getByRole('button', { name: /Ancienneté/ }).click(); await p.waitForTimeout(300)
  const d = p.getByRole('dialog'); await d.locator('#sen-n').fill(String(n)); await d.locator('#sen-r').fill('test e2e'); if (n === 3) await d.screenshot({ path: `${out}/admin-correction.png` })
  await d.getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(400)
  return (await row.innerText()).match(/(PLATINUM|GOLD|SILVER)[^\n]*/i)?.[0]
}
console.log('CORRECTION Atelier Vert Rabat →', await override('Atelier Vert Rabat', 3), '| Distra →', await override('Distra', 2))
console.log('JOURNAL', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:AuditLog') || '[]').filter((x) => x.action === 'seniority').map((x) => `${x.name ?? x.entity_name ?? ''} ${JSON.stringify(x.details)}`))))
// public, saison 2025-2026
await p.evaluate(() => localStorage.setItem('statfoot:ui:season', 'season_2025'))
for (const [w, h] of [[1366, 900], [360, 800]]) {
  await p.setViewportSize({ width: w, height: h })
  await p.goto(B + '/equipes', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.screenshot({ path: `${out}/equipes-${w}.png` }); console.log('ÉQUIPES', w, 'débordement', await overflow())
  await p.goto(B + '/classement', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.screenshot({ path: `${out}/classement-${w}.png` }); console.log('CLASSEMENT', w, 'débordement', await overflow(), '| badges', await p.locator('tbody [aria-label*="saison"]').count())
}
await p.setViewportSize({ width: 1366, height: 900 })
const ids = await p.evaluate(() => { const T = JSON.parse(localStorage.getItem('statfoot:v1:Team')); const P = JSON.parse(localStorage.getItem('statfoot:v1:Player')); const pick = (sn) => { const t = T.find((x) => x.short_name === sn && (x.season_id === 'season_2025')); return { team: t.id, player: P.find((x) => x.team_id === t.id && x.position !== 'GK')?.id } }; return { plat: pick('AVR'), gold: pick('DST'), silver: pick('WAF') } })
console.log('IDS', JSON.stringify(ids))
await p.goto(`${B}/equipes/${ids.plat.team}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
await p.screenshot({ path: `${out}/equipe-entete.png` }); console.log('EN-TÊTE ÉQUIPE', (await p.locator('section').first().innerText()).match(/(PLATINUM|GOLD|SILVER)[^\n]*/i)?.[0])
for (const [k, v] of Object.entries(ids)) {
  await p.goto(`${B}/joueurs/${v.player}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(900)
  const card = p.locator('.pcard[role=button]').first()
  console.log('CARTE', k, 'tier', await card.locator('[data-tier]').first().getAttribute('data-tier'), '| badges coin', await card.locator('[aria-label^="Meilleurs badges"] [role=img]').count(), '| tooltip', await card.locator('[role=img]').first().getAttribute('title').catch(() => null))
  await card.screenshot({ path: `${out}/carte-${k}.png` })
  if (k === 'plat') {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: 'Télécharger ma carte' }).click()])
    await dl.saveAs(`${out}/carte-export.png`); console.log('TÉLÉCHARGEMENT', dl.suggestedFilename())
    await p.getByRole('button', { name: 'Partager' }).first().click(); await p.waitForTimeout(2500)
    const d = p.getByRole('dialog'); console.log('PARTAGE (secours)', await d.count() ? (await d.innerText()).replace(/\n+/g, ' | ').slice(0, 200) : 'aucun dialogue')
    if (await d.count()) await d.screenshot({ path: `${out}/partage-secours.png` })
    await p.keyboard.press('Escape')
    await p.setViewportSize({ width: 360, height: 800 }); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800)
    await p.screenshot({ path: `${out}/joueur-360.png` }); console.log('JOUEUR 360 débordement', await overflow())
    await p.setViewportSize({ width: 1366, height: 900 })
  }
}
await p.goto(B + '/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
await p.screenshot({ path: `${out}/joueurs-grille.png`, fullPage: false })
console.log('LOGS', JSON.stringify(logs.slice(0, 8))); await b.close()
