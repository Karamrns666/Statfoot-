// Captures du site EN LIGNE (visiteur anonyme) : téléphone, tablette, ordinateur + temps d'affichage et erreurs.
//   node e2e/prod-captures.mjs → prod-out/*.png + prod-out/report.txt
import { chromium, webkit, devices } from '@playwright/test'
import fs from 'node:fs'
const SITE = 'https://www.ardentia-foot.com'
const PAGES = ['/', '/matchs', '/pre-saison', '/classement', '/equipes', '/joueurs', '/matchs/m26_ps01']
const DEV = [['telephone', webkit, devices['iPhone 13']], ['tablette', webkit, devices['iPad (gen 7)']], ['ordinateur', chromium, { viewport: { width: 1440, height: 900 } }]]
fs.mkdirSync('prod-out', { recursive: true })
const lines = []
for (const [name, engine, dev] of DEV) {
  const b = await engine.launch()
  const ctx = await b.newContext({ ...dev, locale: 'fr-FR', timezoneId: 'Africa/Casablanca' })
  for (const p of PAGES) {
    const page = await ctx.newPage(); const errs = []
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)))
    page.on('response', (r) => r.status() >= 400 && !/_vercel/.test(r.url()) && errs.push(`${r.status()} ${r.url().slice(0, 90)}`))
    const t = Date.now()
    await page.goto(SITE + p)
    await page.waitForFunction(() => !document.getElementById('app-shell') && document.querySelector('main'), null, { timeout: 30000 }).catch(() => errs.push('contenu non affiché en 30 s'))
    const shown = Date.now() - t
    const snap = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => e.name.includes('/api/snapshot')))
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `prod-out/${name}${p.replace(/\//g, '_') || '_'}.png` })
    lines.push(`${name.padEnd(11)} ${p.padEnd(18)} contenu affiché en ${(shown / 1000).toFixed(1)} s · instantané ${snap ? 'oui' : 'non'} · ${errs.length ? 'ERREURS ' + errs.join(' | ') : 'aucune erreur'}`)
    await page.close()
  }
  await b.close()
}
fs.writeFileSync('prod-out/report.txt', lines.join('\n') + '\n'); console.log(lines.join('\n'))
