// Logos d'équipes : aucun chevauchement avec un texte / badge, même taille et noms alignés dans une liste, aucun nom
// coupé par « … », aucune image absente, déformée ou floue — sur téléphone (360 et 390 px), tablette (768 px) et
// ordinateur (1440 px). Pages publiques + pages équipe, fiche match et mode TV.
import { expect, test } from '@playwright/test'
import { FROZEN, ROUTES } from './routes.mjs'
import { checkLogos, scrollThrough } from './logo-check.mjs'

const VIEWPORTS = [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]

test.describe('logos d’équipes', () => {
  // contrôle géométrique : un seul moteur suffit (les tailles d'écran sont simulées ci-dessous)
  test.skip(({ browserName }, ti) => ti.project.name !== 'chromium-desktop', 'contrôle lancé sur Chromium seulement')

  test('toutes les pages', async ({ page }) => {
    test.setTimeout(600_000)
    await page.clock.setFixedTime(FROZEN)
    // pages découvertes : équipes, un match
    await page.goto('/equipes'); await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const teams = await page.$$eval('a[href^="/equipes/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))].slice(0, 25))
    await page.goto('/matchs'); await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const matches = await page.$$eval('a[href^="/matchs/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))].slice(0, 2))
    const pages = [...ROUTES, ...teams, ...matches, '/tv']
    const problems = []
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp)
      for (const route of pages) {
        await page.goto(route)
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
        await page.waitForTimeout(500)
        await scrollThrough(page)
        for (const p of await checkLogos(page)) problems.push(`${vp.width}px ${route} — ${p}`)
      }
    }
    expect(problems, 'problèmes de logos').toEqual([])
  })
})
