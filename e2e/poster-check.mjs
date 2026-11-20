// Affiche Saison 4 du billboard (site en ligne) : entière (4 coins visibles), rien par-dessus, sans erreur console
import { chromium, webkit } from '@playwright/test'
import fs from 'node:fs'
const BASE = process.env.BASE || 'https://www.ardentia-foot.com'
const OUT = 'poster-out'; fs.mkdirSync(OUT, { recursive: true })
const log = (...a) => { console.log(...a); fs.appendFileSync(`${OUT}/log.txt`, a.join(' ') + '\n') }
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
const VPS = [
  ['360-portrait', webkit, { viewport: { width: 360, height: 800 }, ...phone }], ['390-portrait', webkit, { viewport: { width: 390, height: 844 }, ...phone }], ['430-portrait', webkit, { viewport: { width: 430, height: 932 }, ...phone }],
  ['360-paysage', webkit, { viewport: { width: 800, height: 360 }, ...phone }], ['390-paysage', webkit, { viewport: { width: 844, height: 390 }, ...phone }], ['430-paysage', webkit, { viewport: { width: 932, height: 430 }, ...phone }],
  ['tablette-768', webkit, { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['tablette-1024', webkit, { viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['ordinateur-1280', chromium, { viewport: { width: 1280, height: 800 } }], ['ordinateur-1440', chromium, { viewport: { width: 1440, height: 900 } }], ['ordinateur-1920', chromium, { viewport: { width: 1920, height: 1080 } }],
]
let bad = 0
for (const [name, eng, ctxo] of VPS) {
  const b = await eng.launch(); const p = await (await b.newContext({ ...ctxo, locale: 'fr-FR' })).newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(1500)
  await p.locator('[role="tab"][aria-label="Affiche de la saison"]').click()
  const pause = p.getByRole('button', { name: 'Mettre en pause' }); if (await pause.count()) await pause.click()
  await p.waitForTimeout(1800)
  const img = p.locator('.bb-panel picture img').last()
  await img.scrollIntoViewIfNeeded(); await p.waitForTimeout(400)
  const r = await img.evaluate((el) => {
    const b = el.getBoundingClientRect(), nr = el.naturalWidth / el.naturalHeight, br = b.width / b.height
    // zone réellement occupée par l'image (object-fit: contain)
    const w = br > nr ? b.height * nr : b.width, h = br > nr ? b.height : b.width / nr
    const x = b.left + (b.width - w) / 2, y = b.top + (b.height - h) / 2
    const panel = document.querySelector('.bb-panel').getBoundingClientRect()
    const pts = { 'haut-gauche': [x + 4, y + 4], 'haut-droit': [x + w - 4, y + 4], 'bas-gauche': [x + 4, y + h - 4], 'bas-droit': [x + w - 4, y + h - 4], centre: [x + w / 2, y + h / 2] }
    const cover = Object.fromEntries(Object.entries(pts).map(([k, [px, py]]) => { const t = document.elementFromPoint(px, py); return [k, t === el || t?.closest('picture') === el.parentElement ? 'ok' : (t ? t.tagName + '.' + String(t.className).slice(0, 30) : 'hors écran')] }))
    const inPanel = x >= panel.left - 1 && y >= panel.top - 1 && x + w <= panel.right + 1 && y + h <= panel.bottom + 1
    return { image: `${Math.round(w)}×${Math.round(h)}`, panneau: `${Math.round(panel.width)}×${Math.round(panel.height)}`, remplitLargeur: Math.round((w / panel.width) * 100) + '%', inPanel, cover, src: (el.currentSrc || '').split('/').pop(), naturel: `${el.naturalWidth}×${el.naturalHeight}` }
  })
  const ok = r.inPanel && Object.values(r.cover).every((v) => v === 'ok') && errs.length === 0
  if (!ok) bad++
  log(name, ok ? 'OK' : 'PROBLÈME', JSON.stringify(r), 'erreurs:', errs.length, errs.slice(0, 2).join(' | '))
  const sec = p.locator('section[aria-label="Billboard de la ligue"]'); await sec.screenshot({ path: `${OUT}/${name}.png` })
  await b.close()
}
log('problèmes', bad)
