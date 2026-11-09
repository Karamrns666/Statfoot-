// Vérification navigateur (Chromium) — règlement v4 et discipline, desktop 1366 et mobile 390.
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
const B = 'http://localhost:4173'
const out = 'e2e-out'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch()
const logs = []
const log = (...a) => console.log(...a)

async function seed(p) {
  // données de test : saison 2026-2027 (règlement v4), phase de sélection, 2 équipes, 5 matchs
  await p.evaluate(() => {
    const get = (n) => JSON.parse(localStorage.getItem('statfoot:v1:' + n) || '[]')
    const set = (n, v) => localStorage.setItem('statfoot:v1:' + n, JSON.stringify(v))
    const comp = get('Competition').find((c) => c.id === 'comp_2026_selection')
    const [A, Bt, C] = comp.team_ids
    const S = 'season_2026'
    const pl = (id, team, first, last, pos = 'FIELD') => ({ id, first_name: first, last_name: last, team_id: team, position: pos, status: 'active', season_ids: [S] })
    const players = [pl('e2e_gk_a', A, 'Yassine', 'Bennani', 'GK'), pl('e2e_x', A, 'Karim', 'Alaoui'), pl('e2e_y', A, 'Omar', 'Tazi'), pl('e2e_a3', A, 'Hamza', 'Idrissi'), pl('e2e_a4', A, 'Mehdi', 'Fassi'), pl('e2e_a5', A, 'Reda', 'Chraibi'),
      pl('e2e_gk_b', Bt, 'Anas', 'Berrada', 'GK'), pl('e2e_z', Bt, 'Ilyas', 'Sqalli'), pl('e2e_b3', Bt, 'Saad', 'Lahlou'), pl('e2e_b4', Bt, 'Adil', 'Kettani'), pl('e2e_b5', Bt, 'Nabil', 'Amrani'), pl('e2e_b6', Bt, 'Zakaria', 'Bouzid')]
    set('Player', [...get('Player').filter((x) => !x.id.startsWith('e2e_')), ...players])
    const m = (id, round, h, a, hs, as, status = 'finished', extra = {}) => ({ id, season_id: S, competition_id: comp.id, round, stage: 'league_phase', date: `2026-10-${String(round * 3).padStart(2, '0')}T19:00:00`, home_team_id: h, away_team_id: a, home_score: hs, away_score: as, status, published: true, half_duration_min: 20, pitch: 'Terrain 1', ...extra })
    const matches = [m('e2e_m1', 1, A, Bt, 2, 1), m('e2e_m2', 2, A, C, 1, 1), m('e2e_m3', 3, Bt, A, 0, 2), m('e2e_m4', 4, A, Bt, null, null, 'scheduled', { date: '2026-11-20T19:00:00' }), m('e2e_live', 5, C, Bt, 0, 0, 'live', { date: new Date().toISOString() })]
    set('Match', [...get('Match').filter((x) => !x.id.startsWith('e2e_')), ...matches])
    let k = 0
    const ev = (match_id, team_id, type, player_id, minute, extra = {}) => ({ id: `e2e_ev${++k}`, match_id, team_id, type, player_id, period: minute > 20 ? '2H' : '1H', minute, ...extra })
    const events = [
      ev('e2e_m1', A, 'goal', 'e2e_x', 5), ev('e2e_m1', A, 'goal', 'e2e_a3', 12), ev('e2e_m1', Bt, 'goal', 'e2e_z', 30),
      ev('e2e_m1', A, 'yellow_card', 'e2e_x', 8), ev('e2e_m1', Bt, 'yellow_card', 'e2e_z', 14),
      ev('e2e_m2', A, 'goal', 'e2e_a4', 22), ev('e2e_m2', C, 'own_goal', undefined, 30),
      ev('e2e_m2', A, 'yellow_card', 'e2e_x', 9), ev('e2e_m2', A, 'yellow_card', 'e2e_y', 15), ev('e2e_m2', A, 'second_yellow', 'e2e_y', 33),
      ev('e2e_m3', A, 'goal', 'e2e_x', 3), ev('e2e_m3', A, 'goal', 'e2e_a5', 36),
      ev('e2e_m3', A, 'yellow_card', 'e2e_x', 18, { card_target: 'player' }), ev('e2e_m3', Bt, 'yellow_card', 'e2e_z', 25, { card_target: 'substitute' }),
      ev('e2e_m3', Bt, 'red_card', 'e2e_b3', 28), ev('e2e_m3', Bt, 'red_card', undefined, 39, { card_target: 'official', player_name_free: 'Coach Rachid' }),
      // match en direct : rouge à 5:00 (1re période) → infériorité
      ev('e2e_live', C, 'red_card', undefined, 6, { clock_ms: 300000, card_target: 'player' }),
    ]
    set('MatchEvent', [...get('MatchEvent').filter((x) => !x.id.startsWith('e2e_')), ...events])
    const lu = (mid, team, ids) => ({ id: `e2e_lu_${mid}_${team}`, match_id: mid, team_id: team, starter_ids: ids.slice(0, 6), substitute_ids: ids.slice(6), present_ids: ids, goalkeeper_id: ids[0], validated: true })
    const aIds = players.filter((x) => x.team_id === A).map((x) => x.id), bIds = players.filter((x) => x.team_id === Bt).map((x) => x.id)
    set('Lineup', [...get('Lineup').filter((x) => !x.id.startsWith('e2e_')), lu('e2e_m1', A, aIds), lu('e2e_m1', Bt, bIds), lu('e2e_m3', Bt, bIds), lu('e2e_m3', A, aIds.filter((x) => x !== 'e2e_y'))])
    // décision Ardentia : rouge direct de B3 + 2 matchs (insultes), notifiée
    set('Suspension', [...get('Suspension').filter((x) => !x.id.startsWith('e2e_')), { id: 'e2e_s1', kind: 'extra', season_id: S, player_id: 'e2e_b3', team_id: Bt, origin_match_id: 'e2e_m3', origin_event_id: 'e2e_ev15', matches: 2, reason: 'Insultes envers l’arbitre', referee_report: 'Rapport de M. Haddad', notified_at: '2026-10-10' }])
    set('LiveState', [...get('LiveState').filter((x) => x.match_id !== 'e2e_live'), { id: 'e2e_ls', match_id: 'e2e_live', period: '1H', running: true, period_started_at: Date.now() - 317000, period_elapsed_ms: 0, possession: { current: 'dead', since: null, by_period: {} } }])
    localStorage.setItem('statfoot:ui:season', S); localStorage.setItem('statfoot:admin:season', S)
    return { A, Bt, C }
  })
}

const shot = async (p, name, full = false) => { await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${name}.png`, fullPage: full }) }
const text = (p) => p.evaluate(() => document.body.innerText)

for (const [label, opts] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['mobile', { ...devices['iPhone 13'] }]]) {
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  p.on('pageerror', (e) => logs.push(`${label} PAGEERROR ${e.message}`))
  p.on('console', (m) => { if (m.type() === 'error') logs.push(`${label} console ${m.text().slice(0, 200)}`) })
  await p.goto(B + '/', { waitUntil: 'networkidle' })
  await seed(p)
  await p.reload({ waitUntil: 'networkidle' })
  // ---- règlement
  await p.goto(B + '/reglement', { waitUntil: 'networkidle' }); await shot(p, `${label}-reglement`)
  let t = await text(p)
  log(label, 'REGLEMENT', JSON.stringify({ version: /Version 4/.test(t), essentiel: /L’essentiel en 1 minute/.test(t), cumul: /3 jaunes cumulés = 1 match de suspension/.test(t), pdf: /Télécharger le règlement \(PDF\)/.test(t), art18: /Article 18/.test(t), cumulTexte: /Trois \(3\) cartons jaunes cumulés/.test(t) }))
  const pdf = await p.evaluate(async () => { const r = await fetch('/reglement/reglement-ardentia-v4.pdf'); return `${r.status} ${r.headers.get('content-type')} ${(await r.arrayBuffer()).byteLength}` })
  log(label, 'PDF', pdf)
  await p.goto(B + '/reglement#art-17-3', { waitUntil: 'networkidle' }); await p.waitForTimeout(900)
  log(label, 'ANCRE 17.3 visible en haut', await p.evaluate(() => { const r = document.getElementById('art-17-3')?.getBoundingClientRect(); return r ? Math.round(r.top) : null }))
  await shot(p, `${label}-reglement-art-17-3`)
  await p.getByLabel('Rechercher dans le règlement').fill('cumul'); await p.waitForTimeout(400)
  log(label, 'RECHERCHE « cumul »', await p.getByRole('status').first().innerText().catch(() => '?'), 'surlignés', await p.locator('mark').count())
  await shot(p, `${label}-reglement-recherche`)
  await p.goto(B + '/reglement?version=v3', { waitUntil: 'networkidle' }); t = await text(p)
  log(label, 'HISTORIQUE v3', /Version archivée/.test(t), /ne sont pas cumulables/.test(t))
  await shot(p, `${label}-reglement-v3`)
  // ---- discipline
  await p.goto(B + '/discipline', { waitUntil: 'networkidle' }); await shot(p, `${label}-discipline`, true)
  t = await text(p)
  log(label, 'DISCIPLINE', JSON.stringify({ suspenduX: /Karim Alaoui/.test(t), suspenduB3: /Saad Lahlou/.test(t), officiel: /Coach Rachid/.test(t), menaceZ: /Ilyas Sqalli/.test(t), fairplay: /Classement fair-play/.test(t) }))
  // ---- fiche joueur
  await p.goto(B + '/joueurs/e2e_x', { waitUntil: 'networkidle' }); await p.getByText('Discipline', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {}); await shot(p, `${label}-joueur-suspendu`)
  t = await text(p); log(label, 'JOUEUR X', JSON.stringify({ badge: /Suspendu/i.test(t), compteur: /3\/3/.test(t), historique: /3 cartons jaunes cumulés/.test(t) }))
  await p.goto(B + '/joueurs/e2e_z', { waitUntil: 'networkidle' }); await p.getByText('Discipline', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {}); await shot(p, `${label}-joueur-menace`)
  t = await text(p); log(label, 'JOUEUR Z', JSON.stringify({ compteur: /2\/3/.test(t), avertissement: /Encore un jaune/.test(t) }))
  // ---- match à venir : absents
  await p.goto(B + '/matchs/e2e_m4', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
  t = await text(p); log(label, 'MATCH J4 absents', /Absents \(suspendus\)/.test(t), (t.match(/Absents \(suspendus\)[^\n]*/g) ?? []).join(' | '))
  await shot(p, `${label}-match-absents`)
  // ---- classement
  await p.goto(B + '/classement', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Pourquoi cet ordre/ }).click().catch(() => {}); await p.waitForTimeout(300)
  t = await text(p); log(label, 'CLASSEMENT', JSON.stringify({ note: /Critères de départage/.test(t), CJ: /\bCJ\b/.test(t), explication: /(à égalité de points|Aucune égalité de points)/.test(t) }))
  await shot(p, `${label}-classement`, true)
  // ---- TV : infériorité
  await p.goto(B + '/tv', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  t = await text(p); log(label, 'TV infériorité', (t.match(/\d c\. \d — \d:\d\d/) ?? ['absent'])[0])
  await shot(p, `${label}-tv`)
  // ---- admin
  await p.goto(B + '/admin/login', { waitUntil: 'networkidle' })
  await p.fill('#email', 'superadmin@mbl.ma'); await p.fill('#pw', 'mbl2026'); await p.getByRole('button', { name: /Se connecter/ }).click(); await p.waitForTimeout(1500)
  await p.goto(B + '/admin/discipline', { waitUntil: 'networkidle' }); await shot(p, `${label}-admin-discipline`, true)
  t = await text(p); log(label, 'ADMIN DISCIPLINE', JSON.stringify({ decision: /Expulsions — décision/.test(t), nonNotifiee: /sans date de notification/.test(t) }))
  await p.goto(B + '/admin/match-center/e2e_live', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  t = await text(p); log(label, 'MATCH CENTRE infériorité', (t.match(/\d c\. \d — \d:\d\d/) ?? ['absent'])[0], 'chrono', (t.match(/\b0\d:\d\d\b/) ?? [''])[0])
  await shot(p, `${label}-admin-match-centre`)
  if (label === 'desktop') {
    // feuille de match J4 : X et Y bloqués
    await p.goto(B + '/admin/match-center/e2e_m4', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
    await p.getByRole('button', { name: /compo$/ }).first().click().catch((e) => console.log('compo?', e.message.slice(0, 120))); await p.waitForTimeout(1000)
    t = await p.getByRole('dialog').innerText().catch(() => '')
    log('desktop', 'FEUILLE J4', JSON.stringify({ suspendusBadge: (t.match(/Suspendu/g) ?? []).length, bloqueX: /Karim Alaoui/.test(t) }))
    await p.getByRole('dialog').screenshot({ path: `${out}/desktop-feuille-bloque.png` }).catch(() => {})
    // essai d'ajout de X (suspendu) : refus
    await p.getByRole('dialog').getByRole('button', { name: 'Karim Alaoui' }).first().click().catch(() => {}); await p.waitForTimeout(400)
    log('desktop', 'AJOUT SUSPENDU', (await text(p)).match(/[^\n]*ajout à la feuille de match bloqué[^\n]*/)?.[0] ?? 'pas de message')
    // forcer avec motif (Super Admin)
    await p.getByRole('dialog').getByRole('button', { name: /Forcer l’ajout de Karim Alaoui/ }).first().click().catch(() => {}); await p.waitForTimeout(300)
    await p.getByRole('dialog').getByLabel('Motif').fill('Décision Ardentia du 18/11 (test)').catch(() => {})
    await p.getByRole('dialog').getByRole('button', { name: 'Forcer' }).click().catch(() => {}); await p.waitForTimeout(500)
    log('desktop', 'FORCÉ', /Forcé/.test(await p.getByRole('dialog').innerText().catch(() => '')))
    await p.getByRole('dialog').screenshot({ path: `${out}/desktop-feuille-force.png` }).catch(() => {})
    await p.keyboard.press('Escape')
    const journal = await p.evaluate(() => (JSON.parse(localStorage.getItem('statfoot:v1:AuditLog') || '[]')).filter((x) => x.action === 'waiver').map((x) => x.details?.motif))
    log('desktop', 'JOURNAL dérogation', JSON.stringify(journal))
    await p.goto(B + '/admin/reglement', { waitUntil: 'networkidle' }); await shot(p, `${label}-admin-reglement`)
    await p.getByRole('button', { name: /^v3/ }).click(); await p.waitForTimeout(300)
    t = await text(p); log('desktop', 'ADMIN REGLEMENT v3 avertissement', /semblent incohérents/.test(t))
    await shot(p, `${label}-admin-reglement-v3`)
    await p.goto(B + '/admin/parametres', { waitUntil: 'networkidle' }); t = await text(p); log('desktop', 'PARAMÈTRES points fixés', /Fixés par le règlement/.test(t))
  }
  // débordement horizontal
  for (const url of ['/reglement', '/discipline', '/classement', '/joueurs/e2e_x']) {
    await p.goto(B + url, { waitUntil: 'networkidle' })
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (ov > 1) log(label, 'DÉBORDEMENT', url, ov)
  }
  await ctx.close()
}
log('LOGS', JSON.stringify(logs))
await b.close()
