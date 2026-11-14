// Mise en page : pas de défilement horizontal, pas de texte coupé, pas d'erreur JavaScript ni de ressource 404.
import { expect, test } from '@playwright/test'
import { FROZEN, ROUTES } from './routes.mjs'

for (const route of ROUTES) {
  test(`mise en page ${route}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).origin === 'http://localhost:4173') errors.push(`${r.status()} ${r.url()}`) })
    await page.clock.setFixedTime(FROZEN)
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const clipped = []
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (el.children.length || !(el.textContent || '').trim() || cs.display === 'none' || el.closest('.sr-only,[aria-hidden="true"]')) continue
        if (el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis' && !/line-clamp|truncate/.test(String(el.className))) clipped.push((el.textContent || '').trim().slice(0, 40))
      }
      return { hscroll: document.documentElement.scrollWidth - vw, clipped }
    })
    expect(r.hscroll, 'défilement horizontal (px)').toBeLessThanOrEqual(1)
    expect(r.clipped, 'texte coupé').toEqual([])
    expect(errors, 'erreurs JavaScript / 404').toEqual([])
  })
}
