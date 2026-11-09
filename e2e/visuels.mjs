// Génère les visuels réseaux sociaux sur de vrais matchs et vérifie les parcours admin / public.
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173', out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch(); const logs = []
const dataUrl = (f, t) => `data:${t};base64,${fs.readFileSync(f).toString('base64')}`
const PH = { gk: dataUrl('e2e/photo-gk.webp', 'image/webp'), field: dataUrl('e2e/photo-joueur.webp', 'image/webp'), orig: dataUrl('e2e/photo-originale.webp', 'image/webp') }

async function seed(p) {
  return p.evaluate((PH) => {
    const get = (n) => JSON.parse(localStorage.getItem('statfoot:v1:' + n) || '[]')
    const set = (n, v) => localStorage.setItem('statfoot:v1:' + n, JSON.stringify(v))
    const M = get('Match'), E = get('MatchEvent'), Pl = get('Player'), T = get('Team')
    const s25 = M.filter((m) => m.season_id === 'season_2025' && m.status === 'finished')
    const goals = (m) => (m.home_score ?? 0) + (m.away_score ?? 0)
    const big = [...s25].sort((a, b) => goals(b) - goals(a))[0]
    const normal = s25.find((m) => goals(m) >= 3 && goals(m) <= 5 && m.id !== big.id)
    const gkm = s25.find((m) => goals(m) >= 2 && goals(m) <= 4 && m.id !== normal.id && m.id !== big.id && Pl.some((x) => x.team_id === m.home_team_id && x.position === 'GK'))
    // MVP joueur de champ (photo détourée, capitaine) : meilleur buteur du match normal
    const topScorer = (m) => { const c = {}; for (const e of E.filter((e) => e.match_id === m.id && e.type === 'goal' && e.player_id)) c[e.player_id] = (c[e.player_id] ?? 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] }
    const fieldId = topScorer(normal)
    const gk = Pl.find((x) => x.team_id === gkm.home_team_id && x.position === 'GK')
    const bigTop = topScorer(big)
    for (const pl of Pl) {
      if (pl.id === fieldId) Object.assign(pl, { photo_url: PH.orig, photo_cutout_url: PH.field, photo_card_mode: 'cutout', is_captain: true })
      if (pl.id === gk.id) Object.assign(pl, { photo_url: PH.orig, photo_cutout_url: PH.gk, photo_card_mode: 'cutout' })
      if (pl.id === bigTop) Object.assign(pl, { photo_url: PH.orig, photo_cutout_url: undefined, photo_card_mode: 'original' })
    }
    set('Player', Pl)
    for (const m of M) {
      if (m.id === normal.id) m.motm_player_id = fieldId
      if (m.id === gkm.id) { m.motm_player_id = gk.id; m.visual_mvp_template = 'mvp2' }
      if (m.id === big.id) m.motm_player_id = undefined // pré-rempli automatiquement à l'ouverture du match
    }
    // forfait : Attijariwafa bank – Atelier Vert Rabat (saison 2026-2027), Atelier Vert Rabat forfait
    const awb = T.find((t) => t.name === 'Attijariwafa bank'), avr = T.find((t) => t.name === 'Atelier Vert Rabat' && (get('Competition').find((c) => c.id === 'comp_2026_selection')?.team_ids ?? []).includes(t.id)) ?? T.find((t) => t.name === 'Atelier Vert Rabat')
    const ff = { id: 'e2e_ff', season_id: 'season_2026', competition_id: 'comp_2026_selection', round: 3, stage: 'league_phase', date: '2026-11-07T18:00:00', home_team_id: awb.id, away_team_id: avr.id, status: 'finished', published: true, home_score: 3, away_score: 0, forfeit_team_id: avr.id, validated: true, validated_at: new Date().toISOString(), pitch: 'Terrain 1' }
    set('Match', [...M.filter((m) => m.id !== 'e2e_ff'), ff])
    return { normal: normal.id, big: big.id, gk: gkm.id, ff: 'e2e_ff', fieldId, gkId: gk.id, bigTop }
  }, PH)
}

const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
const p = await ctx.newPage()
p.on('pageerror', (e) => logs.push(`desktop ${e.message}`))
p.on('console', (m) => { if (m.type() === 'error') logs.push(`console ${m.text().slice(0, 160)}`) })
await p.goto(B + '/', { waitUntil: 'networkidle' })
const ids = await seed(p)
console.log('MATCHS', JSON.stringify(ids))
await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)

async function grab(id, label) {
  await p.goto(`${B}/admin/match-center/${id}`, { waitUntil: 'networkidle' })
  await p.waitForSelector('img[alt="Visuel Résultat"]', { timeout: 30000 })
  await p.waitForTimeout(2500)
  const info = await p.evaluate((id) => { const m = JSON.parse(localStorage.getItem('statfoot:v1:Match')).find((x) => x.id === id); return { motm: m.motm_player_id, visuals: m.visuals?.version, score: `${m.home_score}-${m.away_score}` } }, id)
  for (const [kind, idx] of [['resultat', 0], ['mvp', 1]]) {
    const btn = p.getByRole('button', { name: 'Télécharger PNG' }).nth(idx)
    if (await btn.isDisabled()) { console.log(label, kind, 'désactivé (pas d’homme du match)'); continue }
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), btn.click()])
    const f = `${out}/visuel-${label}-${kind}.png`; await dl.saveAs(f)
    console.log(label, kind, dl.suggestedFilename(), fs.statSync(f).size, 'octets')
  }
  console.log(label, 'MATCH', JSON.stringify(info))
  const caption = await p.getByLabel('Texte de publication').inputValue()
  console.log(label, 'TEXTE\n' + caption)
  await p.locator('#visuels-titre').scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
  await p.screenshot({ path: `${out}/admin-${label}.png` })
}
await grab(ids.normal, 'normal')
await grab(ids.big, 'buteurs')
await grab(ids.gk, 'gardien')
await grab(ids.ff, 'forfait')
// story
await p.goto(`${B}/admin/match-center/${ids.normal}`, { waitUntil: 'networkidle' }); await p.waitForSelector('img[alt="Visuel Résultat"]'); await p.waitForTimeout(1500)
{ const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Story' }).nth(1).click()]); await dl.saveAs(`${out}/visuel-normal-mvp-story.png`); console.log('STORY', dl.suggestedFilename()) }
// génération automatique du forfait (match passé « Terminé »)
await p.goto(`${B}/admin/visuels`, { waitUntil: 'networkidle' }); await p.waitForTimeout(6000)
console.log('AUTO forfait', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('statfoot:v1:Match')).find((x) => x.id === 'e2e_ff').visuals ?? null)))
await p.screenshot({ path: `${out}/admin-visuels-journee.png` })
// ZIP de la journée
{ const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.getByRole('button', { name: /Tout télécharger/ }).click()]); await dl.saveAs(`${out}/journee.zip`); console.log('ZIP', dl.suggestedFilename(), fs.statSync(`${out}/journee.zip`).size) }
// mise en page : aperçu des zones
await p.getByRole('tab', { name: 'Mise en page' }).click(); await p.waitForTimeout(3500)
for (const [alt, f] of [['Aperçu Résultat', 'zones-resultat'], ['Aperçu Homme du match', 'zones-mvp']]) {
  const src = await p.locator(`img[alt="${alt}"]`).getAttribute('src').catch(() => null)
  if (src) { const buf = await p.evaluate(async (s) => { const r = await fetch(s); const a = new Uint8Array(await r.arrayBuffer()); let x = ''; for (const c of a) x += String.fromCharCode(c); return btoa(x) }, src); fs.writeFileSync(`${out}/${f}.png`, Buffer.from(buf, 'base64')) }
}
console.log('MISE EN PAGE alertes', await p.getByRole('alert').count())
await ctx.close()

// mobile : partage public + compteur homme du match
const m = await b.newContext({ ...devices['iPhone 13'] }); const q = await m.newPage()
q.on('pageerror', (e) => logs.push(`mobile ${e.message}`))
await q.goto(B + '/', { waitUntil: 'networkidle' }); await seed(q)
await q.goto(`${B}/matchs/${ids.normal}`, { waitUntil: 'networkidle' })
await q.getByRole('button', { name: 'Partager' }).first().click(); await q.waitForSelector('img[alt="Visuel du résultat"]', { timeout: 30000 }); await q.waitForTimeout(800)
await q.screenshot({ path: `${out}/mobile-partage.png` })
console.log('MOBILE partage boutons', (await q.getByRole('dialog').getByRole('button').allInnerTexts()).join(' | '))
await q.goto(`${B}/joueurs/${ids.fieldId}`, { waitUntil: 'networkidle' })
console.log('FICHE JOUEUR', ((await q.evaluate(() => document.body.innerText)).match(/Homme du match ×\d+/i) ?? ['absent'])[0])
await m.close()
console.log('LOGS', JSON.stringify(logs))
await b.close()
