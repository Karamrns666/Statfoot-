// Captures de référence : chaque page clé est comparée à sa capture validée (dossier __screenshots__).
// Mettre à jour après un changement voulu : npx playwright test -c e2e/playwright.config.mjs visual --update-snapshots
import { expect, test } from '@playwright/test'
import { FROZEN, SHOTS } from './routes.mjs'

for (const route of SHOTS) {
  test(`capture ${route}`, async ({ page, browserName }) => {
    // WebKit : la grille des cartes équipes (reflets animés) ne se stabilise pas assez pour une capture fiable
    test.skip(browserName === 'webkit' && route === '/equipes', 'capture instable sur WebKit (reflets animés des cartes)')
    await page.clock.setFixedTime(FROZEN)
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(600)
    const name = (route === '/' ? 'accueil' : route.slice(1).replace(/\//g, '-')) + '.png'
    // zones qui bougent d'elles-mêmes (bandeau défilant, carrousel) masquées
    await expect(page).toHaveScreenshot(name, { fullPage: false, mask: [page.locator('[data-ticker], .marquee, [aria-roledescription="carousel"]')] })
  })
}
