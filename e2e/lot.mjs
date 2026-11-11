import { chromium } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
p.on('pageerror', (e) => logs.push(e.message))
await p.goto(B + '/', { waitUntil: 'networkidle' })
const ids = await p.evaluate(() => {
  const M = JSON.parse(localStorage.getItem('statfoot:v1:Match')); const P = JSON.parse(localStorage.getItem('statfoot:v1:Player')); let E = JSON.parse(localStorage.getItem('statfoot:v1:MatchEvent'))
  const fin = M.filter((m) => m.status === 'finished' && m.season_id === 'season_2025')
  const roster = (tid) => P.filter((x) => x.team_id === tid)
  const mk = (m, list) => { E = E.filter((e) => e.match_id !== m.id); list.forEach(([team, pid, type, o = {}], i) => E.push({ id: `x_${m.id}_${i}`, match_id: m.id, team_id: team, type, player_id: pid, period: '1H', minute: i + 1, ...o })) }
  // 1) 4 buts + cartons + C.S.C + t.a.b.
  const m1 = fin[0]; const h = roster(m1.home_team_id), a = roster(m1.away_team_id)
  mk(m1, [[m1.home_team_id, h[0].id, 'goal'], [m1.home_team_id, h[0].id, 'goal'], [m1.home_team_id, h[0].id, 'goal'], [m1.home_team_id, h[0].id, 'goal'], [m1.home_team_id, h[0].id, 'yellow_card'],
    [m1.home_team_id, h[1].id, 'goal'], [m1.home_team_id, h[2].id, 'red_card'], [m1.away_team_id, a[3].id, 'own_goal'],
    [m1.away_team_id, a[0].id, 'goal'], [m1.away_team_id, a[0].id, 'goal'], [m1.away_team_id, a[0].id, 'yellow_card'], [m1.away_team_id, a[1].id, 'goal'], [m1.away_team_id, a[1].id, 'goal'], [m1.away_team_id, a[1].id, 'goal'], [m1.away_team_id, a[2].id, 'goal'], [m1.away_team_id, a[4].id, 'yellow_card'], [m1.away_team_id, a[4].id, 'second_yellow']])
  Object.assign(m1, { home_score: 6, away_score: 6, penalties: true, home_pens: 14, away_pens: 13 })
  // 2) cas extrême : 12 lignes + un joueur à 8 buts
  const m2 = fin[1]; const h2 = roster(m2.home_team_id), a2 = roster(m2.away_team_id)
  const L2 = []; for (let k = 0; k < 8; k++) L2.push([m2.home_team_id, h2[0].id, 'goal']); for (let k = 1; k < 12 && k < h2.length; k++) L2.push([m2.home_team_id, h2[k].id, k % 3 ? 'goal' : 'yellow_card'])
  L2.push([m2.away_team_id, a2[0].id, 'goal'])
  mk(m2, L2); Object.assign(m2, { home_score: L2.filter((x) => x[0] === m2.home_team_id && x[2] === 'goal').length, away_score: 1, penalties: false })
  localStorage.setItem('statfoot:v1:Match', JSON.stringify(M)); localStorage.setItem('statfoot:v1:MatchEvent', JSON.stringify(E))
  // capitaines
  const C = [{ id: 'cm_e2e', date: '2026-11-07T18:00', status: 'finished', pitch: 'Terrain 2', orange_pens: 4, bleue_pens: 5, lines: [
    { side: 'orange', player_id: h[0].id, played: true, goals: 3, og: 0, assists: 0, yc: 1, rc: 0, saves: 0 }, { side: 'orange', player_id: h[1].id, played: true, goals: 0, og: 1, assists: 0, yc: 0, rc: 0, saves: 0 },
    { side: 'bleue', player_id: a[0].id, played: true, goals: 4, og: 0, assists: 0, yc: 0, rc: 1, saves: 0 }] }]
  localStorage.setItem('statfoot:v1:CaptainMatch', JSON.stringify(C))
  return [m1.id, m2.id]
})
await p.reload({ waitUntil: 'networkidle' })
async function grab(name) {
  const img = p.getByRole('dialog').locator('img').first(); await img.waitFor({ timeout: 30000 }); await p.waitForTimeout(800)
  const data = await img.evaluate(async (el) => { const r = await fetch(el.src); const bl = await r.blob(); return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(bl) }) })
  fs.writeFileSync(`${out}/${name}.png`, Buffer.from(data.split(',')[1], 'base64')); console.log('VISUEL', name, 'ok')
}
for (const [i, id] of ids.entries()) {
  await p.goto(`${B}/matchs/${id}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
  await p.getByRole('button', { name: /^Partager$/ }).first().click(); await grab(i ? 'resultat-12-lignes' : 'resultat-4-buts-csc-tab')
}
await p.goto(`${B}/match-des-capitaines`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
await p.getByRole('button', { name: 'Visuel' }).first().click(); await grab('resultat-capitaines')
await p.getByRole('dialog').screenshot({ path: `${out}/dialog-capitaines.png` })
console.log('LOGS', JSON.stringify(logs)); await b.close()
