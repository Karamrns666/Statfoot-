import { chromium } from 'playwright'
const B = 'http://localhost:4173'
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
const hits = async () => p.evaluate(() => [...new Set((document.documentElement.innerHTML.match(/(Champion|[23]e en|N°1 XP|Meilleur buteur|Meilleur passeur|Gant d’or|[A-Za-zé°1 ’]+) 2025-2026/g) ?? []))])
await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('AVANT liens', JSON.stringify(await hits()))
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/equipes', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
for (let i = 0; i < 7; i++) { const btn = p.getByRole('button', { name: /suggestion/ }).first(); if (!(await btn.count())) break; await btn.click(); await p.waitForTimeout(300); await p.getByRole('dialog').getByRole('button', { name: 'Approuver' }).first().click(); await p.waitForTimeout(500) }
console.log('suggestions restantes', await p.getByRole('button', { name: /suggestion/ }).count())
await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('APRÈS liens', JSON.stringify(await hits()))
await p.setViewportSize({ width: 360, height: 800 }); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('360 débordement', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
await b.close()
