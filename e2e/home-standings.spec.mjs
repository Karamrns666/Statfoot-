// Classement de l'accueil sur téléphone : aucun défilement interne (ni vertical ni horizontal), rien qui dépasse l'écran.
import { expect, test } from '@playwright/test'
import { FROZEN } from './routes.mjs'

for (const width of [360, 390, 430]) {
  test(`classement accueil sans défilement interne — ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.clock.setFixedTime(FROZEN)
    await page.goto('/')
    const block = page.locator('.compact-standings').first()
    await block.waitFor({ timeout: 20_000 })
    const r = await block.evaluate((el) => {
      const vw = document.documentElement.clientWidth
      const traps = []
      // le bloc, tout ce qu'il contient et ses parents jusqu'à <main> : aucun conteneur défilant
      const nodes = [...el.querySelectorAll('*'), el]
      for (let p = el.parentElement; p && p.tagName !== 'MAIN'; p = p.parentElement) nodes.push(p)
      for (const n of nodes) {
        const cs = getComputedStyle(n)
        const scrollY = /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1
        const scrollX = /(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1
        if (scrollX || scrollY || /(auto|scroll)/.test(cs.overflowY)) traps.push(`${n.tagName}.${String(n.className).slice(0, 40)}`)
      }
      const rect = el.getBoundingClientRect()
      return { traps, right: rect.right, vw, rows: el.querySelectorAll('tbody tr').length, hscroll: document.documentElement.scrollWidth - vw }
    })
    expect(r.traps, 'conteneurs défilants').toEqual([])
    expect(r.right, 'bord droit du bloc').toBeLessThanOrEqual(r.vw)
    expect(r.hscroll, 'défilement horizontal de la page').toBeLessThanOrEqual(1)
    expect(r.rows, 'toutes les équipes dans le flux').toBeGreaterThan(8)
  })
}
