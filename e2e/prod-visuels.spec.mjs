// Visuels de la semaine générés avec les VRAIES données du site en ligne (lecture publique), dans l'application
// locale : classement Pré-saison après la J1 (1 image et 2 images), résultats, Top 10 buteurs. Les images et le
// classement de la page Classement sont enregistrés dans screenshots/prod-visuels/ pour contrôle.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const PROD = 'https://www.ardentia-foot.com'
test.skip(({ browserName, isMobile }) => isMobile || browserName !== 'chromium', 'ordinateur Chromium seulement')
test.setTimeout(240_000)

test('visuels de la semaine — données réelles', async ({ page, context }) => {
  const OUT = 'test-results/prod-visuels'; fs.mkdirSync(OUT, { recursive: true })
  // 1. lecture publique des données en ligne
  const prod = await context.newPage()
  const ok = await prod.goto(PROD + '/equipes', { timeout: 30_000 }).then(() => true).catch(() => false)
  test.skip(!ok, 'site en ligne injoignable')
  await prod.waitForTimeout(2500)
  const data = await prod.evaluate(async () => {
    const js = [...document.querySelectorAll('script[src],link[rel=modulepreload]')].map((e) => e.src || e.href).filter((u) => u.includes('/assets/'))
    let url, key
    for (const j of js) { const t = await (await fetch(j)).text(); const u = t.match(/https:\/\/[a-z0-9]+\.supabase\.co/); const k = t.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); if (u && k) { url = u[0]; key = k[0]; break } }
    const H = { apikey: key, Authorization: 'Bearer ' + key }
    const q = async (e, f = '') => (await (await fetch(`${url}/rest/v1/entity_rows?select=data&deleted=is.false&entity=eq.${e}${f}&limit=5000`, { headers: H })).json()).map((x) => x.data)
    const Season = await q('Season'), Competition = await q('Competition', '&data->>season_id=eq.season_2026')
    const Team = await q('Team', '&data->>season_id=eq.season_2026'), Match = await q('Match', '&data->>season_id=eq.season_2026')
    const ids = Match.map((m) => m.id).join(',')
    const MatchEvent = await q('MatchEvent', `&data->>match_id=in.(${ids})&data->>type=in.(goal,own_goal,yellow_card,second_yellow,red_card,save,penalty_saved,shot_on_target,shot_off_target,penalty_missed,substitution,gk_change,shootout_scored,shootout_saved,shootout_missed)`), Lineup = await q('Lineup', `&data->>match_id=in.(${ids})`)
    const Player = await q('Player', '&data->>team_id=like.t26_*')
    const XPRule = await q('XPRule')
    return { Season, Competition, Team, Match, MatchEvent, Lineup, Player, XPRule }
  })
  await prod.close()
  console.log(Object.entries(data).map(([k, v]) => `${k} ${v.length}`).join(' · '))
  expect(data.Team.length).toBe(21)

  // 2. application locale avec ces données
  await page.goto('/')
  await page.waitForFunction(() => !!localStorage.getItem('statfoot:v1:Match'))
  await page.evaluate((d) => { for (const [k, v] of Object.entries(d)) localStorage.setItem(`statfoot:v1:${k}`, JSON.stringify(v)); localStorage.removeItem('statfoot:admin:season') }, data)
  await page.goto('/classement'); await page.waitForTimeout(1500)
  const table = await page.evaluate(() => [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()))
  fs.writeFileSync(`${OUT}/classement-page.txt`, table.join('\n'))
  await page.goto('/admin')
  await page.locator('#email').fill('superadmin@mbl.ma')
  await page.locator('#pw').fill('mbl2026')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/admin/)
  await page.goto('/admin/visuels-semaine')
  await page.waitForSelector('figure figcaption')
  const save = async (label, file) => {
    const fig = page.locator('figure', { has: page.locator('figcaption', { hasText: new RegExp(`^${label.replace(/[()/]/g, '\\$&')}$`) }) })
    await expect(fig.locator('img')).toBeVisible({ timeout: 60_000 })
    const url = await fig.locator('img').evaluate(async (img) => { let b; for (let k = 0; k < 10 && !b; k++) { try { b = await (await fetch(img.src)).blob() } catch { await new Promise((r) => setTimeout(r, 500)) } }; return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b) }) })
    fs.writeFileSync(`${OUT}/${file}`, Buffer.from(String(url).split(',')[1], 'base64'))
    const cap = await fig.locator('textarea').inputValue(); fs.writeFileSync(`${OUT}/${file.replace('.png', '.txt')}`, cap)
  }
  await save('Classement', 'classement-1-image.png')
  await save('Résultats de la journée', 'resultats.png')
  await save('Top 10 buteurs', 'top10-buteurs.png')
  await save('Top 10 passeurs', 'top10-passeurs.png')
  await save('Top 10 gardiens', 'top10-gardiens.png')
  // changements de gardien de la Pré-saison (à signaler)
  const pre = data.Competition.find((c) => c.phase === 'league_phase')
  const gk = data.MatchEvent.filter((e) => e.type === 'gk_change').map((e) => { const m = data.Match.find((x) => x.id === e.match_id); const p = data.Player.find((x) => x.id === e.player_id); return `${m?.number} J${m?.round} ${m?.competition_id === pre?.id ? 'pré-saison' : ''} — ${e.team_id} — entre : ${p?.first_name} ${p?.last_name} à ${e.minute}' ${e.period ?? ''}` })
  fs.writeFileSync(`${OUT}/changements-gardien.txt`, gk.join('\n') || 'aucun')
  // feuilles de match des gardiens titulaires de la J1 (contrôle à la main)
  const sheet = []
  for (const m of data.Match.filter((x) => x.competition_id === pre?.id && x.round === 1)) for (const tid of [m.home_team_id, m.away_team_id]) {
    const lu = data.Lineup.find((l) => l.match_id === m.id && l.team_id === tid); const gkId = lu?.goalkeeper_id; if (!gkId) continue
    const p = data.Player.find((x) => x.id === gkId), ev = data.MatchEvent.filter((e) => e.match_id === m.id)
    const opp = tid === m.home_team_id ? m.away_team_id : m.home_team_id
    const mine = ev.filter((e) => e.player_id === gkId || e.related_player_id === gkId).map((e) => `${e.type}${e.related_player_id === gkId && e.player_id !== gkId ? '(passe)' : ''} ${e.minute ?? ''}' ${e.period ?? ''}`)
    const against = ev.filter((e) => (e.type === 'goal' && e.team_id === opp) || (e.type === 'own_goal' && e.team_id === tid)).map((e) => `${e.minute}' ${e.period ?? ''}`)
    const chg = ev.filter((e) => e.type === 'gk_change' && e.team_id === tid).map((e) => `changement ${e.minute}' ${e.period ?? ''}`)
    sheet.push(`${m.number} ${m.home_score}-${m.away_score} · ${tid} · ${p?.first_name} ${p?.last_name} · HdM ${m.motm_player_id === gkId ? 'oui' : 'non'} · ${mine.filter((x) => x.startsWith('save')).length} arrêts · encaissés : ${against.join(', ') || '—'} · autres : ${mine.filter((x) => !x.startsWith('save')).join(', ') || '—'} ${chg.join(', ')}`)
  }
  fs.writeFileSync(`${OUT}/gardiens-feuilles.txt`, sheet.join('\n') + `\nRègles XP en ligne : ${JSON.stringify(data.XPRule.map((r) => [r.key, r.value, r.season_id]))}`)
  await page.getByRole('radio', { name: '2 images (MASTER + CHALLENGER)' }).click()
  await page.waitForTimeout(1500)
  await save('Classement · 1/2 · zone MASTER', 'classement-2-images-1.png')
  await save('Classement · 2/2 · zone CHALLENGER', 'classement-2-images-2.png')
})
