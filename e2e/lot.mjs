import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
// état 2 : pré-saison en cours ; état 3 : pré-saison terminée + MASTER / CHALLENGER en cours
const seed = (state) => {
  const get = (n) => JSON.parse(localStorage.getItem('statfoot:v1:' + n) || '[]'), set = (n, v) => localStorage.setItem('statfoot:v1:' + n, JSON.stringify(v))
  const S = 'season_2026', C = get('Competition'), pre = C.find((c) => c.id === 'comp_2026_selection'), T = pre.team_ids
  const mk = (id, comp, round, i, played) => ({ id, season_id: S, competition_id: comp, round, date: `2026-10-${String(round * 2).padStart(2, '0')}T19:00:00`, home_team_id: T[i % 20], away_team_id: T[(i + 7) % 20], home_score: played ? 2 : null, away_score: played ? 1 : null, status: played ? 'finished' : 'scheduled', published: true })
  let ms = []
  for (let r = 1; r <= 9; r++) for (let i = 0; i < 10; i++) ms.push(mk(`e2e_p${r}_${i}`, pre.id, r, i + r, state === 3 || r < 3 || (r === 3 && i < 4)))
  let comps = C.filter((c) => !c.id.startsWith('e2e_'))
  if (state === 3) {
    comps = [...comps, { id: 'e2e_gold', season_id: S, name: 'MASTER', phase: 'gold', format: 'league', team_ids: T.slice(0, 10), parent_id: pre.id, order: 2 }, { id: 'e2e_silver', season_id: S, name: 'CHALLENGER', phase: 'silver', format: 'league', team_ids: T.slice(10), parent_id: pre.id, order: 3 }]
    for (let r = 1; r <= 9; r++) for (let i = 0; i < 5; i++) { ms.push(mk(`e2e_g${r}_${i}`, 'e2e_gold', r, i, r < 5)); ms.push(mk(`e2e_s${r}_${i}`, 'e2e_silver', r, i + 10, r < 4 || (r === 4 && i < 2))) }
  }
  set('Competition', comps); set('Match', [...get('Match').filter((m) => !m.id.startsWith('e2e_')), ...ms])
  const P = get('Player').filter((p) => !p.id.startsWith('e2e_'))
  set('Player', [...P, ...Array.from({ length: 187 }, (_, i) => ({ id: `e2e_pl${i}`, first_name: 'J', last_name: `Test${i}`, team_id: T[i % 20], position: 'FIELD', status: 'active', season_ids: [S] }))])
}
for (const w of [320, 360, 1366]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 760 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => logs.push(`${w} ${e.message}`))
  for (const state of [1, 2, 3]) {
    await p.goto(B + '/', { waitUntil: 'networkidle' })
    if (state > 1) { await p.evaluate(seed, state); await p.reload({ waitUntil: 'networkidle' }) }
    await p.waitForTimeout(800)
    const strip = p.locator('.glass').first().locator('xpath=..')
    const info = await p.evaluate(() => {
      const grid = [...document.querySelectorAll('div.grid')].find((g) => /Joueurs participants/i.test(g.textContent))
      const tiles = [...grid.children]
      const clipped = [...grid.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim()).map((el) => el.textContent.trim())
      return { text: tiles.map((t) => t.innerText.replace(/\n+/g, ' / ')), clipped, cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length, overflow: document.documentElement.scrollWidth - window.innerWidth }
    })
    console.log(w, 'état', state, JSON.stringify(info))
    const grid = p.locator('div.grid', { hasText: 'Joueurs participants' }).first()
    await grid.scrollIntoViewIfNeeded(); await grid.screenshot({ path: `${out}/bandeau-${w}-etat${state}.png` })
    if (state === 3 && w !== 320) {
      await p.getByRole('link', { name: /^MASTER : .*Voir le classement/ }).click(); await p.waitForTimeout(600)
      const u1 = new URL(p.url()).pathname, tab1 = await p.locator('[role=tab][aria-selected=true]').innerText().catch(() => '?')
      await p.goBack(); await p.waitForTimeout(400)
      await p.getByRole('link', { name: /^CHALLENGER : .*Voir le classement/ }).click(); await p.waitForTimeout(600)
      console.log(w, 'CLIC MASTER →', u1, tab1, '| CHALLENGER →', new URL(p.url()).pathname, await p.locator('[role=tab][aria-selected=true]').innerText().catch(() => '?'))
    }
  }
  await ctx.close()
}
console.log('LOGS', JSON.stringify(logs)); await b.close()
