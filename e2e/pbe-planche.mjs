// Planche de vérification du logo Parebrise Express sur le site en ligne (téléphone, tablette, ordinateur)
import { chromium, webkit, devices } from '@playwright/test'
import fs from 'node:fs'
const BASE = process.env.BASE || 'https://www.ardentia-foot.com'
const OUT = 'pbe-out'; fs.mkdirSync(OUT, { recursive: true })
const log = (...a) => { console.log(...a); fs.appendFileSync(`${OUT}/log.txt`, a.join(' ') + '\n') }
const VPS = [['telephone', webkit, devices['iPhone 13']], ['tablette', webkit, { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } }], ['ordinateur', chromium, { viewport: { width: 1440, height: 900 } }]]

const b0 = await chromium.launch(); const p0 = await b0.newPage(); await p0.goto(BASE + '/equipes'); await p0.waitForTimeout(2500)
const info = await p0.evaluate(async () => {
  const js = [...document.querySelectorAll('script[src],link[rel=modulepreload]')].map((e) => e.src || e.href).filter((u) => u.includes('/assets/'))
  let url, key; for (const j of js) { const t = await (await fetch(j)).text(); const u = t.match(/https:\/\/[a-z0-9]+\.supabase\.co/); const k = t.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); if (u && k) { url = u[0]; key = k[0]; break } }
  const q = async (e) => (await (await fetch(`${url}/rest/v1/entity_rows?select=data&deleted=is.false&entity=eq.${e}&limit=2000`, { headers: { apikey: key, Authorization: 'Bearer ' + key } })).json()).map((x) => x.data)
  const team = (await q('Team')).find((t) => t.season_id === 'season_2026' && t.short_name === 'PBE')
  const players = (await q('Player')).filter((p) => p.team_id === team.id)
  const withCut = players.filter((p) => p.photo_cutout_url), withPhoto = players.filter((p) => p.photo_url && !p.photo_cutout_url), none = players.filter((p) => !p.photo_url)
  const pick = [withCut[0], withPhoto[0], none[0], ...players].filter(Boolean).filter((p, i, a) => a.indexOf(p) === i).slice(0, 3)
  const match = (await q('Match')).find((m) => m.season_id === 'season_2026' && (m.home_team_id === team.id || m.away_team_id === team.id))
  return { team: { id: team.id, logo_url: team.logo_url, logo_dark_url: team.logo_dark_url, logo_bg: team.logo_bg }, players: pick.map((p) => ({ id: p.id, n: p.first_name + ' ' + p.last_name, cut: !!p.photo_cutout_url, ph: !!p.photo_url })), match: match?.id }
})
await b0.close()
log('équipe', JSON.stringify(info))

const shotAround = async (page, sel, file, pad = 40, nth = 0) => {
  const el = page.locator(sel).nth(nth)
  if (!(await el.count())) { log('absent', file); return }
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  const r = await el.boundingBox(); if (!r) return
  const vp = page.viewportSize()
  const x = Math.max(0, r.x - pad), y = Math.max(0, r.y - pad)
  await page.screenshot({ path: `${OUT}/${file}.png`, clip: { x, y, width: Math.min(vp.width - x, r.width + pad * 2), height: Math.min(vp.height - y, r.height + pad * 2) } })
  const s = await el.evaluate((e) => { const i = e.tagName === 'IMG' ? e : e.querySelector('img'); const r = e.getBoundingClientRect(), ir = i?.getBoundingClientRect(); return { cadre: `${Math.round(r.width)}×${Math.round(r.height)}`, logo: ir ? `${Math.round(ir.width)}×${Math.round(ir.height)}` : '', src: (i?.getAttribute('src') || '').slice(0, 40) } })
  log(file, JSON.stringify(s))
}
const PBE = `[role="img"][aria-label*="Parebrise"], img[src*="pbe"]`
for (const [vpn, eng, dev] of VPS) {
  const b = await eng.launch(); const ctx = await b.newContext({ ...dev, locale: 'fr-FR', acceptDownloads: true }); const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
  const go = async (u) => { await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(2200) }
  await go('/'); await shotAround(p, `.compact-standings ${PBE}`, `${vpn}-accueil-classement`, 60)
  await go('/classement'); await shotAround(p, `${PBE}`, `${vpn}-classement`, 60)
  await go('/equipes'); await shotAround(p, `a[href="/equipes/${info.team.id}"]`, `${vpn}-carte-equipe`, 10)
  await go(`/equipes/${info.team.id}`); await p.screenshot({ path: `${OUT}/${vpn}-page-equipe.png` })
  if (info.match) { await go(`/matchs/${info.match}`); await p.screenshot({ path: `${OUT}/${vpn}-fiche-match.png` }) }
  for (const [k, pl] of info.players.entries()) {
    await go(`/joueurs/${pl.id}`)
    await shotAround(p, '.pcard, [data-card]', `${vpn}-joueur${k + 1}-ecran`, 8)
    if (vpn === 'ordinateur' || vpn === 'telephone') {
      const btn = p.getByRole('button', { name: /Télécharger ma carte/ })
      if (await btn.count()) { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), btn.click()]); if (d) await d.saveAs(`${OUT}/${vpn}-joueur${k + 1}-png.png`); log(vpn, 'png joueur', k + 1, pl.n, d ? 'ok' : 'ÉCHEC') }
    }
  }
  log(vpn, 'erreurs console', errs.length, errs.slice(0, 3).join(' | '))
  await b.close()
}
