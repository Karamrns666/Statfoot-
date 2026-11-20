// Vérification finale en ligne : logos des 21 équipes (classements, matchs, PS-11, ticker, TV), une carte joueur par
// équipe (écran + PNG téléchargé), Top 25 IPG (capture + données relevées) et extrait des données des matchs validés
// pour le contrôle à la main de l'IPG.   BASE=https://www.ardentia-foot.com node e2e/final-planche.mjs
import { chromium, webkit, devices } from '@playwright/test'
import fs from 'node:fs'
const BASE = process.env.BASE || 'https://www.ardentia-foot.com'
const OUT = 'final-out'; fs.mkdirSync(`${OUT}/cartes`, { recursive: true }); fs.mkdirSync(`${OUT}/logos`, { recursive: true })
const log = (...a) => { console.log(...a); fs.appendFileSync(`${OUT}/log.txt`, a.join(' ') + '\n') }

// ---- données (lecture publique) ----
const b0 = await chromium.launch(); const p0 = await b0.newPage(); await p0.goto(BASE + '/equipes'); await p0.waitForTimeout(2500)
const data = await p0.evaluate(async () => {
  const js = [...document.querySelectorAll('script[src],link[rel=modulepreload]')].map((e) => e.src || e.href).filter((u) => u.includes('/assets/'))
  let url, key
  for (const j of js) { const t = await (await fetch(j)).text(); const u = t.match(/https:\/\/[a-z0-9]+\.supabase\.co/); const k = t.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); if (u && k) { url = u[0]; key = k[0]; break } }
  const q = async (e) => (await (await fetch(`${url}/rest/v1/entity_rows?select=data&deleted=is.false&entity=eq.${e}&limit=5000`, { headers: { apikey: key, Authorization: 'Bearer ' + key } })).json()).map((x) => x.data)
  const teams = (await q('Team')).filter((t) => t.season_id === 'season_2026')
  const tid = new Set(teams.map((t) => t.id))
  const players = (await q('Player')).filter((p) => tid.has(p.team_id))
  const matches = (await q('Match')).filter((m) => m.season_id === 'season_2026')
  const mid = new Set(matches.map((m) => m.id))
  const events = (await q('MatchEvent')).filter((e) => mid.has(e.match_id))
  const lineups = (await q('Lineup')).filter((l) => mid.has(l.match_id))
  const comps = (await q('Competition')).filter((c) => c.season_id === 'season_2026')
  return { teams, players, matches, events, lineups, comps }
})
await b0.close()
fs.writeFileSync(`${OUT}/donnees.json`, JSON.stringify({
  teams: data.teams.map((t) => ({ id: t.id, name: t.name, short_name: t.short_name, logo_url: t.logo_url, logo_small: t.logo_small, logo_square_url: t.logo_square_url, logo_bg: t.logo_bg, captain_player_id: t.captain_player_id })),
  players: data.players.map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, team_id: p.team_id, photo: !!p.photo_url, cut: !!p.photo_cutout_url, captain: !!p.is_captain })),
  matches: data.matches.map((m) => ({ id: m.id, number: m.number, competition_id: m.competition_id, status: m.status, validated: m.validated, validated_at: m.validated_at, home_team_id: m.home_team_id, away_team_id: m.away_team_id, home_score: m.home_score, away_score: m.away_score, forfeit_team_id: m.forfeit_team_id, round: m.round })),
  events: data.events.filter((e) => ['goal', 'own_goal', 'yellow_card', 'second_yellow', 'red_card'].includes(e.type)).map((e) => ({ match_id: e.match_id, team_id: e.team_id, type: e.type, player_id: e.player_id, related_player_id: e.related_player_id, period: e.period })),
  lineups: data.lineups.map((l) => ({ match_id: l.match_id, team_id: l.team_id, present_ids: l.present_ids, starter_ids: l.starter_ids, substitute_ids: l.substitute_ids })),
  comps: data.comps.map((c) => ({ id: c.id, name: c.name, phase: c.phase })),
}))
log(`équipes ${data.teams.length} · joueurs ${data.players.length} · matchs ${data.matches.length} (validés ${data.matches.filter((m) => m.validated).length}, terminés ${data.matches.filter((m) => m.status === 'finished').length})`)

// une carte par équipe : capitaine pour l'une, sans photo pour une autre, sinon avec photo
const picks = []
let capDone = false, noneDone = false
for (const t of data.teams.sort((a, b) => a.name.localeCompare(b.name))) {
  const ps = data.players.filter((p) => p.team_id === t.id && p.status !== 'inactive')
  let p
  if (!capDone && t.captain_player_id && ps.find((x) => x.id === t.captain_player_id)) { p = ps.find((x) => x.id === t.captain_player_id); capDone = true }
  else if (!noneDone && ps.find((x) => !x.photo_url)) { p = ps.find((x) => !x.photo_url); noneDone = true }
  else p = ps.find((x) => x.photo_cutout_url) ?? ps.find((x) => x.photo_url) ?? ps[0]
  if (p) picks.push({ team: t.name, short: t.short_name, id: p.id, n: `${p.first_name} ${p.last_name}` })
}

const shot = async (page, loc, file, pad = 12) => {
  if (!(await loc.count())) { log('absent', file); return false }
  await loc.first().scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(400)
  const r = await loc.first().boundingBox(); if (!r) return false
  const vp = page.viewportSize()
  const x = Math.max(0, r.x - pad), y = Math.max(0, r.y - pad)
  await page.screenshot({ path: file, clip: { x, y, width: Math.min(vp.width - x, r.width + pad * 2), height: Math.min(vp.height - y, r.height + pad * 2) } }).catch(() => {})
  return true
}
const full = async (page, file, maxH) => { const h = await page.evaluate(() => document.documentElement.scrollHeight); await page.screenshot({ path: file, type: 'jpeg', quality: 70, fullPage: true, clip: { x: 0, y: 0, width: page.viewportSize().width, height: Math.min(h, maxH) } }).catch(() => {}) }

const VPS = [['telephone', webkit, { ...devices['iPhone 13'] }], ['ordinateur', chromium, { viewport: { width: 1440, height: 900 } }]]
const ps11 = data.matches.find((m) => m.number === 'PS-11')
for (const [vn, eng, dev] of VPS) {
  const b = await eng.launch(); const ctx = await b.newContext({ ...dev, locale: 'fr-FR', serviceWorkers: 'block' }); const page = await ctx.newPage()
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 140)))
  const go = async (u) => { await page.goto(BASE + u, { waitUntil: 'networkidle', timeout: 45_000 }).catch(() => {}); await page.waitForTimeout(2000) }
  // ---- logos ----
  await go('/')
  await shot(page, page.locator('header').first(), `${OUT}/logos/${vn}-ticker.png`, 0)
  await shot(page, page.locator('.compact-standings, section:has(h2:text-matches("Classements","i"))').first(), `${OUT}/logos/${vn}-accueil-classement.png`)
  await full(page, `${OUT}/logos/${vn}-accueil.jpg`, 9000)
  await go('/classement'); await full(page, `${OUT}/logos/${vn}-classement-compact.jpg`, 4000)
  await page.getByRole('button', { name: 'Tableau complet' }).click().catch(() => {}); await page.waitForTimeout(800)
  await full(page, `${OUT}/logos/${vn}-classement-complet.jpg`, 4000)
  await go('/matchs'); await full(page, `${OUT}/logos/${vn}-matchs.jpg`, 7000)
  if (ps11) { await go(`/matchs/${ps11.id}`); await full(page, `${OUT}/logos/${vn}-ps11.jpg`, 3000) }
  await go('/tv'); await page.screenshot({ path: `${OUT}/logos/${vn}-tv.png` }).catch(() => {})
  // ---- Top 25 IPG ----
  await go('/joueurs?vue=ipg'); await full(page, `${OUT}/${vn}-top25.jpg`, vn === 'telephone' ? 9000 : 5000)
  if (vn === 'ordinateur') {
    const top = await page.evaluate(() => [...document.querySelectorAll('.pcard')].map((c) => c.innerText.replace(/\s+/g, ' ').trim().slice(0, 200)))
    fs.writeFileSync(`${OUT}/top25-cartes.json`, JSON.stringify(top, null, 1))
    log(`Top 25 : ${top.length} cartes ; texte : ${(await page.locator('main').innerText()).match(/Top 25 de l.Indice[^\n]*/)?.[0] ?? '—'}`)
  }
  // ---- cartes joueurs : écran + PNG ----
  for (const pk of picks) {
    await go(`/joueurs/${pk.id}`)
    const f = `${OUT}/cartes/${vn}-${pk.short.toLowerCase()}`
    await shot(page, page.locator('.pcard').first(), `${f}-ecran.png`, 4)
    const btn = page.getByRole('button', { name: /Télécharger ma carte/ })
    if (await btn.count()) {
      await page.evaluate(() => { window.__png = null; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__png = this.href; return } return o.call(this) } })
      await btn.click()
      const ok = await page.waitForFunction(() => !!window.__png, null, { timeout: 30_000 }).then(() => true).catch(() => false)
      if (ok) {
        const url = await page.evaluate(async () => { const bl = await (await fetch(window.__png)).blob(); return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(bl) }) })
        fs.writeFileSync(`${f}-png.png`, Buffer.from(String(url).split(',')[1], 'base64'))
      } else log('PNG non obtenu', vn, pk.short)
    }
    log(`${vn} carte ${pk.short} ${pk.n}`)
  }
  log(`${vn} erreurs JavaScript : ${errs.length} ${errs.slice(0, 3).join(' | ')}`)
  await b.close()
}
