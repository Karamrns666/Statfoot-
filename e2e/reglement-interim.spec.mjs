// Règlement : paragraphe « Intérimaires et stagiaires » (Art. 2.3) affiché sur téléphone et ordinateur.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'

test('Art. 2.3 : intérimaires et stagiaires', async ({ page }, info) => {
  await page.goto('/reglement')
  const p = page.getByText(/Intérimaires et stagiaires/).first()
  await p.scrollIntoViewIfNeeded()
  await expect(p).toBeVisible()
  const para = p.locator('xpath=ancestor-or-self::p[1]')
  await expect(para).toContainText("les intérimaires et les stagiaires de l'entreprise peuvent également faire partie de l'équipe, sous réserve de la validation préalable d'Ardentia.")
  // juste après « Statut de salarié »
  const prev = await para.evaluate((el) => el.previousElementSibling?.textContent ?? '')
  expect(prev).toMatch(/^Statut de salarié/)
  // aucun débordement horizontal
  const over = await para.evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
  expect(over).toBe(false)
  fs.mkdirSync('test-results/reglement', { recursive: true })
  const box = await para.boundingBox()
  await page.screenshot({ path: `test-results/reglement/${info.project.name}.png`, clip: { x: 0, y: Math.max(0, box.y - 160), width: page.viewportSize().width, height: Math.min(page.viewportSize().height, box.height + 320) } })
})
