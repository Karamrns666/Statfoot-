import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch()
for (const [w, h] of [[360, 560], [1366, 800]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage()
  await p.goto(B + '/', { waitUntil: 'networkidle' })
  const mid = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Match')).find((m) => m.status === 'finished' && m.motm_player_id)?.id)
  await p.goto(`${B}/matchs/${mid}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.getByRole('button', { name: /^Partager$/ }).first().click(); await p.waitForTimeout(3000)
  await p.screenshot({ path: `${out}/share-${w}.png` })
  const d = p.getByRole('dialog')
  const btns = await d.locator('button').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.innerText.trim() || e.getAttribute('aria-label')}|${Math.round(r.y)}-${Math.round(r.bottom)}|vis:${r.bottom <= innerHeight && r.height > 0}|${cs.color}|${cs.backgroundColor}|op${cs.opacity}` }))
  console.log('PUBLIC', w, JSON.stringify(btns), 'dialog', JSON.stringify(await d.evaluate((e) => { const r = e.getBoundingClientRect(); return [r.y, r.bottom, e.scrollHeight, e.clientHeight] })))
  if (w === 1366) {
    await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
    await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
    await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2025'))
    await p.goto(B + '/admin/visuels', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
    await p.screenshot({ path: `${out}/admin-visuels.png` })
    await p.setViewportSize({ width: 360, height: 740 }); await p.waitForTimeout(800); await p.locator('main figure').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(400)
    await p.screenshot({ path: `${out}/admin-visuels-360.png` }); console.log('ADMIN 360 débordement', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    await p.setViewportSize({ width: 1366, height: 800 })
    const ab = await p.locator('main button').evaluateAll((els) => els.slice(0, 14).map((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return `${e.innerText.trim().slice(0, 20)}|${Math.round(r.width)}x${Math.round(r.height)}|${cs.color}|${cs.backgroundColor}` }))
    console.log('ADMIN', JSON.stringify(ab))
  }
}
await b.close()
