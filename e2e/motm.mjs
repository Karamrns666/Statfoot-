import { chromium, devices } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
for (const [label, opts] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['mobile', { ...devices['iPhone 13'] }]]) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage()
  p.on('pageerror', (e) => logs.push(`${label} ${e.message}`))
  await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
  await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)
  await p.goto(B + '/admin/xp', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  const sec = p.getByText('Homme du match', { exact: true }).first()
  await sec.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(300)
  const t = await p.evaluate(() => document.body.innerText)
  const v = await p.locator('input').evaluateAll((els) => els.map((e) => e.value))
  console.log(label, 'ADMIN XP section', /homme du match/i.test(t), 'valeur 70 présente', v.includes('70'))
  await p.screenshot({ path: `${out}/${label}-admin-xp-motm.png` })
  await p.goto(B + '/joueurs', { waitUntil: 'networkidle' })
  await p.getByText(/Comment sont calculés les XP/).first().click(); await p.waitForTimeout(400)
  await p.getByText('Homme du match', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {})
  const t2 = await p.evaluate(() => document.body.innerText)
  console.log(label, 'EXPLICATION', (t2.match(/Homme du match[^\n]*\n?[^\n]*/i) ?? ['absent'])[0].replace(/\n/g, ' | '))
  await p.screenshot({ path: `${out}/${label}-explication-motm.png` })
  await ctx.close()
}
console.log('LOGS', JSON.stringify(logs)); await b.close()
