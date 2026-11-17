// Diagnostic : carte joueur à l'écran vs PNG téléchargé, sur le site en ligne, Safari iPhone (WebKit) et Chrome Android
import { webkit, chromium, devices } from '@playwright/test'
import fs from 'node:fs'
fs.mkdirSync('png-out', { recursive: true })
const IDS = ['mwf4tha61r1nsqyg', 'p25_1']
for (const [name, eng, dev] of [['iphone', webkit, devices['iPhone 13']], ['android', chromium, devices['Pixel 7']]]) {
  const b = await eng.launch(); const ctx = await b.newContext({ ...dev, locale: 'fr-FR', acceptDownloads: true }); const p = await ctx.newPage()
  const logs = []; p.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`.slice(0, 200))); p.on('requestfailed', (r) => logs.push(`échec ${r.url().split('?')[0].slice(-60)} ${r.failure()?.errorText}`))
  for (const id of IDS) {
    await p.goto(`https://www.ardentia-foot.com/joueurs/${id}`); await p.waitForTimeout(4000)
    await p.screenshot({ path: `png-out/${name}-${id}-ecran.png`, fullPage: true })
    const btn = p.getByRole('button', { name: /Télécharger ma carte/ })
    try {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), btn.click()])
      await dl.saveAs(`png-out/${name}-${id}-png.png`); console.log(name, id, 'téléchargé')
    } catch (e) { console.log(name, id, 'échec téléchargement', e.message.slice(0, 120)) }
    // 2e essai immédiat (Safari charge parfois les images au 2e rendu seulement)
    try {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), btn.click()])
      await dl.saveAs(`png-out/${name}-${id}-png2.png`)
    } catch { /* */ }
  }
  console.log(name, 'journal', JSON.stringify(logs.filter((l) => !/^(log|debug|info)/.test(l)).slice(0, 12)))
  await b.close()
}
