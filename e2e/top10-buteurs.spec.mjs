// Visuels de la semaine (admin, mode local) : Top 10 BUTEURS avec un nom très long, une égalité et moins de 10
// buteurs ; ordre des cartes ; texte de publication. Les rendus sont enregistrés dans screenshots/ pour contrôle.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'

test.skip(({ browserName, isMobile }) => isMobile || browserName !== 'chromium', 'ordinateur Chromium seulement')
test.setTimeout(180_000)

test('Top 10 buteurs : nom long, égalité, moins de 10 buteurs', async ({ page }, info) => {
  await page.goto('/')
  await page.waitForFunction(() => !!localStorage.getItem('statfoot:v1:Match'))
  const setup = await page.evaluate(() => {
    const K = 'statfoot:v1:'
    const get = (n) => JSON.parse(localStorage.getItem(K + n) || '[]')
    const set = (n, v) => localStorage.setItem(K + n, JSON.stringify(v))
    const seasons = get('Season')
    const season = (seasons.find((x) => x.is_active) ?? seasons[0])?.id
    const comps = get('Competition').filter((c) => (!season || c.season_id === season) && ['league_phase', 'gold', 'silver'].includes(c.phase))
    const matches = get('Match')
    const played = (m) => ['finished', 'forfeit'].includes(m.status) || m.home_score != null
    let comp = comps.find((c) => matches.some((m) => m.competition_id === c.id && played(m) && m.round != null))
    if (!comp) {
      // aucune journée jouée dans la saison active : on joue la 1re journée de la 1re compétition
      comp = comps.find((c) => matches.some((m) => m.competition_id === c.id && m.round != null))
      const r1 = Math.min(...matches.filter((m) => m.competition_id === comp.id && m.round != null).map((m) => m.round))
      for (const m of matches) if (m.competition_id === comp.id && m.round === r1) Object.assign(m, { status: 'finished', home_score: 1, away_score: 0, validated: true })
    }
    const round = Math.max(...matches.filter((m) => m.competition_id === comp.id && played(m) && m.round != null).map((m) => m.round))
    const ms = matches.filter((m) => m.competition_id === comp.id && m.round === round && played(m) && !m.forfeit_team_id)
    const players = get('Player')
    const m = ms[0]
    const now = new Date().toISOString()
    // joueurs de test dans les deux équipes du match
    const mk = (tid, tag, i, last = `${tag}${i}`, first = 'Joueur') => { const p = { id: `e2e_${tag}${i}`, first_name: first, last_name: last, number: i, team_id: tid, season_ids: [m.season_id], status: 'active', created_date: now, updated_date: now }; players.push(p); return p }
    const h = [mk(m.home_team_id, 'Dom', 1, 'BENABDELLAH EL OUAZZANI', 'Mohammed-Amine'), mk(m.home_team_id, 'Dom', 2)]
    const a = [mk(m.away_team_id, 'Ext', 1), mk(m.away_team_id, 'Ext', 2), mk(m.away_team_id, 'Ext', 3), mk(m.away_team_id, 'Ext', 4)]
    const long = h[0]
    set('Player', players)
    const ids = new Set(ms.map((x) => x.id))
    const evs = get('MatchEvent').filter((e) => !(ids.has(e.match_id) && ['goal', 'own_goal'].includes(e.type)))
    let n = 0
    const goal = (p, tid, extra = {}) => evs.push({ id: `e2e_g${++n}`, match_id: m.id, team_id: tid, type: 'goal', player_id: p.id, minute: 5 + n, period: '1H', ...extra })
    goal(long, m.home_team_id); goal(long, m.home_team_id); goal(long, m.home_team_id)
    goal(h[1], m.home_team_id); goal(h[1], m.home_team_id) // égalité à 2 buts
    goal(a[0], m.away_team_id); goal(a[0], m.away_team_id)
    goal(a[1], m.away_team_id, { related_player_id: a[0].id })
    goal(a[2], m.away_team_id, { period: 'PENS' }) // tir au but : ne compte pas
    evs.push({ id: 'e2e_csc', match_id: m.id, team_id: m.away_team_id, type: 'own_goal', player_id: a[3].id, minute: 30, period: '2H' }) // CSC : ne compte pas
    set('MatchEvent', evs)
    set('Match', matches.map((x) => (x.id === m.id ? { ...x, home_score: 5, away_score: 3 } : x)))
    return { comp: comp.name, round, long: long.last_name }
  })

  await page.goto('/admin')
  await page.locator('#email').fill('superadmin@mbl.ma')
  await page.locator('#pw').fill('mbl2026')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/admin/)
  await page.goto('/admin/visuels-semaine')
  await page.waitForSelector('figure figcaption')

  // ordre des cartes : buteurs juste avant passeurs
  const labels = await page.$$eval('figure figcaption', (f) => f.map((x) => x.textContent))
  expect(labels.indexOf('Top 10 buteurs')).toBe(labels.indexOf('Top 10 passeurs') - 1)

  const save = async (label, file) => {
    const fig = page.locator('figure', { has: page.locator('figcaption', { hasText: new RegExp(`^${label}$`) }) })
    await expect(fig.locator('img')).toBeVisible({ timeout: 30_000 })
    const data = await fig.locator('img').evaluate(async (img) => { let b; for (let k = 0; k < 10 && !b; k++) { try { b = await (await fetch(img.src)).blob() } catch { await new Promise((r) => setTimeout(r, 500)) } }; return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b) }) })
    fs.mkdirSync(`test-results/visuels-${info.project.name}`, { recursive: true })
    fs.writeFileSync(`test-results/visuels-${info.project.name}/${file}`, Buffer.from(String(data).split(',')[1], 'base64'))
    return fig.locator('textarea').inputValue()
  }
  const caption = await save('Top 10 buteurs', 'top10-buteurs.png')
  console.log(caption)
  expect(caption.split('\n')[0]).toMatch(/^⚽ TOP 10 BUTEURS \| .+ · J\d+$/)
  expect(caption).toMatch(/^1\. M\. Benabdellah El Ouazzani \(.+\) – 3 buts$/m)
  expect(caption).not.toMatch(/0 but/)
  await save('Top 10 passeurs', 'top10-passeurs.png')
  // cumul depuis le début de la compétition
  await page.getByRole('radio', { name: 'Cumul depuis le début' }).click()
  await expect(page.locator('figure', { has: page.locator('figcaption', { hasText: /^Top 10 buteurs$/ }) }).locator('textarea')).toHaveValue(/cumul/)
  await page.waitForTimeout(1500)
  const cumul = await save('Top 10 buteurs', 'top10-buteurs-cumul.png')
  expect(cumul.split('\n')[0]).toMatch(/cumul J1 à J\d+$/)
  // classement : toutes les équipes (1 image), puis 2 images si la compétition a une zone MASTER / CHALLENGER
  await page.getByRole('radio', { name: 'Journée' }).click()
  await save('Classement', 'classement-1-image.png')
  await save('Résultats de la journée', 'resultats.png')
  await page.getByRole('radio', { name: '2 images (MASTER + CHALLENGER)' }).click()
  const two = page.locator('figcaption', { hasText: /^Classement · \d\/2/ })
  if (await two.count()) {
    await save('Classement · 1/2 · zone MASTER', 'classement-2-images-1.png')
    await save('Classement · 2/2 · zone CHALLENGER', 'classement-2-images-2.png')
  }
})
