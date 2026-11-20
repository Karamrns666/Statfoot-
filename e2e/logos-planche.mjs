// Planche de captures des logos d'équipes sur le site en ligne (avant / après) + contrôle automatique des logos.
//   BASE=https://www.ardentia-foot.com LABEL=avant node e2e/logos-planche.mjs
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import { checkLogos, scrollThrough } from './logo-check.mjs'

const BASE = process.env.BASE || 'https://www.ardentia-foot.com'
const LABEL = process.env.LABEL || 'apres'
const OUT = `logos-${LABEL}`; fs.mkdirSync(OUT, { recursive: true })
const log = (...a) => { console.log(...a); fs.appendFileSync(`${OUT}/rapport.txt`, a.join(' ') + '\n') }
const VPS = [['telephone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['ordinateur', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }]]
const FOCUS = ['CAC', 'Parebrise Express', 'Atelier Vert Casa', 'Atelier Vert Rabat', 'Mega Post Tension']

const b = await chromium.launch()
// pages à capturer : équipes ciblées et un match de Parebrise Express
const p0 = await (await b.newContext()).newPage()
await p0.goto(BASE + '/equipes', { waitUntil: 'networkidle' }).catch(() => {})
await p0.waitForTimeout(1500)
const teamLinks = await p0.$$eval('a[href^="/equipes/"]', (as) => as.map((a) => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim() })))
const teams = FOCUS.map((n) => ({ n, href: teamLinks.find((l) => l.text.toLowerCase().includes(n.toLowerCase()))?.href })).filter((t) => t.href)
await p0.goto(BASE + '/matchs', { waitUntil: 'networkidle' }).catch(() => {})
await p0.waitForTimeout(1500)
const match = await p0.$$eval('a[href^="/matchs/"]', (as) => as.find((a) => /parebrise/i.test(a.getAttribute('aria-label') || a.textContent || ''))?.getAttribute('href') ?? as[0]?.getAttribute('href'))
const PAGES = [['accueil', '/'], ['matchs', '/matchs'], ['classement', '/classement'], ['pre-saison', '/pre-saison'], ['equipes', '/equipes'],
  ...teams.map((t) => [`equipe-${t.n.toLowerCase().replace(/[^a-z]+/g, '-')}`, t.href]), ...(match ? [['match', match]] : []),
  ['joueurs', '/joueurs'], ['statistiques', '/statistiques'], ['trophees', '/trophees'], ['tv', '/tv']]
log(`${LABEL} — ${BASE} — ${new Date().toISOString()}`)
let total = 0
for (const [vn, ctxo] of VPS) {
  const page = await (await b.newContext({ ...ctxo, locale: 'fr-FR', serviceWorkers: 'block' })).newPage()
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 140)))
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await scrollThrough(page)
    const issues = await checkLogos(page).catch((e) => [`contrôle impossible : ${e.message}`])
    total += issues.length
    log(`${vn} ${name} (${path}) : ${issues.length ? issues.length + ' problème(s)' : 'OK'}`)
    for (const i of issues.slice(0, 25)) log('   • ' + i)
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    const vw = ctxo.viewport.width
    await page.screenshot({ path: `${OUT}/${vn}-${name}.jpg`, type: 'jpeg', quality: 62, fullPage: true, clip: { x: 0, y: 0, width: vw, height: Math.min(h, vn === 'telephone' ? 5200 : 3600) } }).catch(() => {})
  }
  log(`${vn} erreurs JavaScript : ${errs.length} ${errs.slice(0, 3).join(' | ')}`)
}
log(`TOTAL problèmes : ${total}`)
await b.close()
