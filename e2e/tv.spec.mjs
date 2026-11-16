// Mode TV sur téléphone (portrait et paysage) : logos d'équipe carrés et dans l'écran, bouton plein écran qui agit.
import { expect, test } from '@playwright/test'

for (const orient of ['portrait', 'paysage']) {
  test(`mode TV ${orient}`, async ({ page }, info) => {
    const vp = page.viewportSize()
    if (orient === 'paysage' && vp) await page.setViewportSize({ width: Math.max(vp.width, vp.height), height: Math.min(vp.width, vp.height) })
    await page.clock.setFixedTime(new Date('2026-11-16T21:15:00Z'))
    await page.goto('/tv')
    await page.locator('.tv main').first().waitFor({ timeout: 20_000 })
    await page.waitForTimeout(1200)
    const logos = await page.evaluate(() => [...document.querySelectorAll('.tv main span[role="img"]')].map((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right) } }))
    const vw = await page.evaluate(() => document.documentElement.clientWidth)
    for (const g of logos) {
      expect(Math.abs(g.w - g.h), `logo carré (${g.w}×${g.h})`).toBeLessThanOrEqual(2)
      expect(g.l, 'logo dans l’écran (gauche)').toBeGreaterThanOrEqual(-1)
      expect(g.r, 'logo dans l’écran (droite)').toBeLessThanOrEqual(vw + 1)
    }
    await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/tv-${orient}.png` })
    // plein écran : le bouton doit toujours faire quelque chose (vrai plein écran ou mode épuré)
    const btn = page.getByRole('button', { name: 'Plein écran' })
    if (await btn.count()) {
      await btn.click()
      await page.waitForTimeout(700)
      const ok = await page.evaluate(() => !!document.fullscreenElement || !!document.querySelector('[aria-label="Quitter le plein écran"]'))
      expect(ok, 'plein écran ou mode épuré activé').toBe(true)
      await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/tv-${orient}-plein-ecran.png` })
    }
  })
}
