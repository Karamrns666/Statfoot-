// Audit complet (LOT 4) : pages publiques + admin, 13 tailles d'écran (téléphones et tablettes en portrait et paysage,
// ordinateurs), Chromium / Firefox / WebKit. Build local (données de la ligue, sans Supabase) servi sur :4173.
//   node e2e/audit-full.mjs <chromium|firefox|webkit>  → audit-out/<moteur>/report.json + captures des pages à remarques
import { chromium, firefox, webkit } from '@playwright/test'
import fs from 'node:fs'
const PW = { chromium, firefox, webkit }
const ENGINE = process.argv[2] || 'chromium'
const B = 'http://localhost:4173', OUT = 'audit-out/' + ENGINE + '/'
fs.mkdirSync(OUT, { recursive: true })
const AUDIT = () => {
  const vw = innerWidth, issues = []
  const sw = document.documentElement.scrollWidth
  if (sw > vw + 1) issues.push(`hscroll ${sw}`)
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"],svg,.sr-only,[style*="-20000px"]') || el.classList.contains('sr-only')) continue
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
    const txt = (el.textContent || '').trim()
    if (r.right > vw + 2 && cs.position !== 'fixed' && !el.closest('.table-scroll,.overflow-x-auto,.overflow-hidden,[class*="overflow-x"],[role=tablist]')) issues.push(`sort ${Math.round(r.right - vw)}px: ${el.tagName.toLowerCase()} «${txt.slice(0, 30)}»`)
    if (el.children.length === 0 && txt && el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis' && !/line-clamp/.test(el.className)) issues.push(`coupé: ${el.tagName.toLowerCase()} «${txt.slice(0, 40)}»`)
    if (el.children.length === 0 && txt && el.scrollWidth > el.clientWidth + 4 && cs.overflowX === 'visible' && cs.whiteSpace === 'nowrap' && el.clientWidth > 0) issues.push(`déborde: ${el.tagName.toLowerCase()} «${txt.slice(0, 40)}» ${el.scrollWidth}>${el.clientWidth}`)
    // texte qui sort de son conteneur à bord (carte, bouton)
    const par = el.parentElement
    if (el.children.length === 0 && txt && par && ['hidden'].includes(getComputedStyle(par).overflow) && (r.right > par.getBoundingClientRect().right + 3) && cs.textOverflow !== 'ellipsis' && getComputedStyle(par).textOverflow !== 'ellipsis') issues.push(`rogné: «${txt.slice(0, 30)}»`)
  }
  // cibles tactiles < 44 px (liens dans un paragraphe exclus)
  const small = []
  for (const el of document.querySelectorAll('a[href],button,[role=button],[role=tab],input:not([type=hidden]),select,summary')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"],.sr-only')) continue
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
    if (el.tagName === 'A' && el.closest('p,li') && getComputedStyle(el).display === 'inline') continue
    // zone élargie par un pseudo-élément ::before (InfoTip) acceptée
    const b = getComputedStyle(el, '::before'); const ext = b.content !== 'none' && b.position === 'absolute' ? 28 : 0
    if ((el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) continue // la cible est l'étiquette entière
    const min = innerWidth < 1024 ? 36 : 24 // écran tactile : 36 px ; ordinateur : 24 px (WCAG 2.5.8)
    if (Math.min(r.width + ext, r.height + ext) < min) small.push(`${el.tagName.toLowerCase()} «${(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().slice(0, 24)}» ${Math.round(r.width)}×${Math.round(r.height)}`)
  }
  if (small.length) issues.push(`cibles trop petites: ${small.length} ex. ${[...new Set(small)].slice(0, 4).join(' | ')}`)
  const ar = [...document.querySelectorAll('body *')].find((x) => x.children.length === 0 && /[\u0600-\u06FF]/.test(x.textContent || ''))
  if (ar && getComputedStyle(ar).direction !== 'rtl' && !ar.closest('[dir=rtl],[lang=ar]')) issues.push('arabe sans dir=rtl')
  return [...new Set(issues)].slice(0, 12)
}

const VPS = (process.argv[3] || '360x800,800x360,390x844,844x390,430x932,932x430,768x1024,1024x768,820x1180,1180x820,1280x800,1440x900,1920x1080').split(',')
const ADMIN = ["/admin", "/admin/match-center", "/admin/matchs", "/admin/saisons", "/admin/competitions", "/admin/divisions", "/admin/pre-saison", "/admin/planning", "/admin/tirage", "/admin/groupes", "/admin/equipes", "/admin/joueurs", "/admin/import", "/admin/discipline", "/admin/arbitres", "/admin/ajustements-classement", "/admin/visuels", "/admin/visuels-semaine", "/admin/xp", "/admin/trophees", "/admin/equipe-type", "/admin/capitaines", "/admin/statistiques", "/admin/medias", "/admin/reglement", "/admin/diffusion", "/admin/journal", "/admin/administrateurs", "/admin/parametres"]
const nav = async (p, r) => {
  await p.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')) }, r)
  await p.waitForTimeout(700)
}
;(async () => {
  const b = await PW[ENGINE].launch()
  const mk = async (opts = {}) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Africa/Casablanca', locale: 'fr-FR', ...opts }); const p = await c.newPage(); p.setDefaultTimeout(30000); p.on('dialog', (d) => d.dismiss()); const errs = []; p.on('pageerror', (e) => errs.push('js: ' + e.message.slice(0, 140))); p.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.text()) && errs.push('console: ' + m.text().slice(0, 140))); p.on('response', (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`)); p.on('requestfailed', (r) => !/_vercel|abort/i.test(r.url() + r.failure()?.errorText) && errs.push(`échec ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)} ${r.failure()?.errorText}`)); return { c, p, errs } }
  const A = await mk()
  await A.p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
  await A.p.fill('#email', 'superadmin@mbl.ma'); await A.p.fill('#pw', 'mbl2026') // compte de démonstration du mode local
  await A.p.getByRole('button', { name: /Se connecter/ }).click(); await A.p.waitForURL(B + '/admin', { timeout: 30000 }); await A.p.waitForTimeout(1500)
  const live = (e) => A.p.evaluate((e) => JSON.parse(localStorage.getItem('statfoot:v1:' + e) || '[]'), e)
  const ps01 = (await live('Match')).find((x) => x.number === 'PS-01')
  const team = (await live('Team')).find((t) => t.season_id === 'season_2026')
  const player = (await live('Player')).find((p) => (p.season_ids ?? []).includes('season_2026')) ?? (await live('Player'))[0]
  const old = (await live('Match')).find((x) => x.season_id === 'season_2025' && x.status === 'finished')
  const PUBLIC = ['/', '/matchs', '/matchs/' + ps01.id, '/matchs/' + old.id, '/classement', '/pre-saison', '/equipes', '/equipes/' + team.id, '/joueurs', '/joueurs?vue=ipg', '/joueurs/' + player.id, '/trophees', '/statistiques', '/match-des-capitaines', '/equipe-type', '/historique', '/reglement', '/discipline', '/badges', '/glossaire', '/media']
  const ADM = [...ADMIN, '/admin/match-center/' + ps01.id, '/admin/feuille/' + ps01.id, '/admin/matchs/' + ps01.id + '/feuille']
  const V = await mk()
  await V.p.goto(B + '/', { waitUntil: 'networkidle' }); await V.p.waitForTimeout(1500)
  await A.p.goto(B + '/admin', { waitUntil: 'networkidle' }); await A.p.waitForTimeout(1500)
  const res = []; let n = 0
  for (const vp of VPS) {
    const [w, h] = vp.split('x').map(Number)
    for (const [X, routes] of [[V, PUBLIC], [A, ADM]]) {
      await X.p.setViewportSize({ width: w, height: h })
      for (const r of routes) {
        X.errs.length = 0; n++
        await nav(X.p, r)
        const iss = await X.p.evaluate(AUDIT).catch((e) => ['audit: ' + e.message.slice(0, 80)])
        const broken = await X.p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.closest('[aria-hidden="true"]')).map((i) => i.src.replace(location.origin, '').slice(0, 70)))
        if (broken.length) iss.push('image cassée: ' + broken.slice(0, 3).join(' '))
        if (iss.length || X.errs.length) { res.push({ vp, r, iss, errs: [...new Set(X.errs)] }); await X.p.screenshot({ path: `${OUT}${vp}${r.replace(/[\/?=]/g, '_')}.png` }).catch(() => {}) }
      }
    }
    console.log(ENGINE, vp, res.length)
  }
  fs.writeFileSync(OUT + 'report.json', JSON.stringify(res, null, 1)); console.log('\n' + ENGINE, 'pages contrôlées', n, 'avec remarques', res.length)
  await b.close()
})().catch((e) => { console.error('ERR', ENGINE, e.message); process.exit(1) })
