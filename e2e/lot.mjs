import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => logs.push(e.message))
const txt = () => p.evaluate(() => document.body.innerText)
await p.goto(B + '/', { waitUntil: 'networkidle' })
// sélecteur public sur 2025-2026 : l'accueil doit rester sur 2026-2027
await p.evaluate(() => localStorage.setItem('statfoot:ui:season', 'season_2025')); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const slides0 = await p.evaluate(() => [...document.querySelectorAll('[class*="bb-"]')].map((e) => e.textContent).join(' '))
console.log('ACCUEIL (sélecteur sur 2025) saison affichée', /2026-2027/.test(await txt()), '| mises en avant 2025 :', /Champion 2025|Meilleur buteur 2025/.test(slides0))
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1200)
// équipes 2026-2027
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/equipes', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
let rows = await p.locator('tbody tr').count()
console.log('ADMIN ÉQUIPES 2026-2027 lignes', rows, '| suggestions', await p.getByRole('button', { name: /suggestion/ }).count())
await p.screenshot({ path: `${out}/admin-equipes-2026.png` })
// lier Atelier Vert Rabat 2026 à 2025
const row = p.locator('tbody tr', { hasText: 'Atelier Vert Rabat' })
await row.getByRole('button', { name: /suggestion/ }).click(); await p.waitForTimeout(500)
const dlg = p.getByRole('dialog'); console.log('DIALOGUE', (await dlg.innerText()).replace(/\n+/g, ' | ').slice(0, 260))
await dlg.screenshot({ path: `${out}/admin-lien-suggestion.png` })
await dlg.getByRole('button', { name: 'Approuver' }).first().click(); await p.waitForTimeout(700)
console.log('APRÈS APPROBATION', ((await row.innerText()).match(/Atelier Vert Rabat \([^)]*\)/) ?? ['?'])[0])
// lier aussi Wafasalaf et le joueur ? (2026 n'a pas de joueurs) : on crée un joueur 2026 qui revient
await p.evaluate(() => { const P = JSON.parse(localStorage.getItem('statfoot:v1:Player')); const T = JSON.parse(localStorage.getItem('statfoot:v1:Team')); const w26 = T.find((t) => t.season_id === 'season_2026' && t.short_name === 'WAF'); const old = P.find((x) => x.team_id === 't25_waf'); P.push({ id: 'e2e_ret', first_name: old.first_name, last_name: old.last_name, team_id: w26.id, position: old.position, status: 'active', season_ids: ['season_2026'] }); localStorage.setItem('statfoot:v1:Player', JSON.stringify(P)); window.__name = `${old.first_name} ${old.last_name}` })
await p.reload({ waitUntil: 'networkidle' })
// 2025-2026 : liste séparée
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2025')); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800)
console.log('ADMIN ÉQUIPES 2025-2026 lignes', await p.locator('tbody tr').count(), '| boutons de lien', await p.getByRole('button', { name: /suggestion/ }).count())
await p.evaluate(() => localStorage.setItem('statfoot:admin:season', 'season_2026'))
await p.goto(B + '/admin/joueurs', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
const prow = p.locator('tbody tr').first()
console.log('ADMIN JOUEURS 2026 lignes', await p.locator('tbody tr').count(), '|', (await prow.innerText()).replace(/\n+/g, ' | ').slice(0, 120))
await prow.getByRole('button', { name: /suggestion/ }).click(); await p.waitForTimeout(400)
await p.getByRole('dialog').screenshot({ path: `${out}/admin-lien-joueur.png` })
await p.getByRole('dialog').getByRole('button', { name: 'Approuver' }).first().click(); await p.waitForTimeout(600)
console.log('JOUEUR LIÉ', ((await prow.innerText()).match(/\([^)]*2025[^)]*\)/) ?? ['?'])[0])
// accueil : mises en avant 2025-2026 pour les revenus uniquement
await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
const slides = await p.evaluate(() => [...document.querySelectorAll('button[aria-label], [role=tab]')].map((e) => e.getAttribute('aria-label')).filter(Boolean).join(' | '))
const allText = await p.evaluate(() => document.querySelector('section, main')?.innerHTML ?? '')
console.log('ACCUEIL mises en avant', JSON.stringify((allText.match(/(Champion|[23]e en|N°1 XP|Meilleur buteur|Meilleur passeur|Gant d’or) 2025-2026/g) ?? []).filter((v, i, a) => a.indexOf(v) === i)))
// page équipe : historique
const t26 = await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:Team')).find((t) => t.season_id === 'season_2026' && t.short_name === 'AVR').id)
await p.goto(`${B}/equipes/${t26}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
console.log('PAGE ÉQUIPE historique', ((await txt()).match(/Saisons MBL :[^\n]*\n?[^\n]*\n?[^\n]*/) ?? ['absent'])[0].replace(/\n/g, ' '))
await p.screenshot({ path: `${out}/equipe-historique.png` })
// journal
console.log('JOURNAL', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statfoot:v1:AuditLog') || '[]').filter((x) => x.action === 'link').map((x) => `${x.entity} ${x.details?.lie_a}`))))
console.log('LOGS', JSON.stringify(logs)); await b.close()
