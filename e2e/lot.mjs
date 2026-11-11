import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
for (const w of [320, 360, 1366]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 740 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => logs.push(`${w} ${e.message}`))
  await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  const tg = await p.evaluate(() => [...document.querySelectorAll('.tagline p')].map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { t: el.textContent.slice(0, 22), lang: el.lang, dir: el.dir, font: Math.round(parseFloat(cs.fontSize) * 10) / 10, lines: Math.round(r.height / parseFloat(cs.lineHeight)), clipped: el.scrollWidth > el.clientWidth + 1, right: Math.round(r.right), fam: cs.fontFamily.slice(0, 18) } }))
  console.log(w, 'ACCROCHE', JSON.stringify(tg))
  console.log(w, 'débordement page', await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 'police arabe chargée', await p.evaluate(() => document.fonts.check('700 16px Tajawal', 'الدوري')))
  await p.screenshot({ path: `${out}/accueil-${w}.png` })
  if (w === 360) { await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/footer-360.png` }) }
  if (w !== 320) {
    for (const [from, to] of [['/trophees', '/meilleure-performance'], ['/classement/gold-cup', '/classement/master'], ['/silver-cup', '/classement/challenger'], ['/classement/master', '/classement/master']]) {
      await p.goto(B + from, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
      console.log(w, 'REDIRECTION', from, '→', new URL(p.url()).pathname, new URL(p.url()).pathname === to ? 'ok' : 'ÉCHEC')
    }
    await p.goto(B + '/meilleure-performance', { waitUntil: 'networkidle' })
    const t = await p.evaluate(() => document.body.innerText)
    console.log(w, 'PAGE titre', /meilleure performance/i.test(t), '| anciens noms visibles', /gold cup|silver cup/i.test(t), '| filtres', (t.match(/MASTER|CHALLENGER/g) ?? []).length)
    await p.screenshot({ path: `${out}/meilleure-performance-${w}.png` })
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
    console.log(w, 'MENU', await p.evaluate(() => [...document.querySelectorAll('header a')].map((a) => a.textContent.trim()).filter(Boolean).join(' | ')))
    console.log(w, 'TITRE/META', await p.title(), '||', await p.evaluate(() => document.querySelector('meta[name=description]').content.slice(0, 90)))
  }
  if (w === 1366) {
    // billboard : « Meilleure attaque » (dans les données des diapositives)
    await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
    await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
    await p.goto(B + '/admin/parametres', { waitUntil: 'networkidle' })
    const lab = await p.evaluate(() => document.body.innerText)
    console.log('ADMIN champs noms', /Nom de la 1re division/.test(lab), /Accroche en arabe/.test(lab))
    await p.getByLabel(/Nom de la 1re division/).fill('ÉLITE'); await p.getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(800)
    await p.goto(B + '/meilleure-performance', { waitUntil: 'networkidle' })
    console.log('ADMIN renommage → site', /ÉLITE/.test(await p.evaluate(() => document.body.innerText)))
    await p.goto(B + '/classement/gold-cup', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
    console.log('ADMIN renommage → redirection', new URL(p.url()).pathname)
    for (const u of ['/admin/trophees', '/admin/competitions', '/admin/xp']) { await p.goto(B + u, { waitUntil: 'networkidle' }); const x = await p.evaluate(() => document.body.innerText); console.log('ADMIN', u, 'anciens noms', /gold cup|silver cup/i.test(x)) }
  }
  await ctx.close()
}
console.log('LOGS', JSON.stringify(logs)); await b.close()
