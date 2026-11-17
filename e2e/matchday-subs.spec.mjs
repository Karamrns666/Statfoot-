// Jour de match sur téléphone (mode local, compte de test du jeu de démonstration) : remplacements illimités,
// « Entrer en jeu », but d'un remplaçant (proposition d'entrée), carton sur le banc, puis feuille de match et résumé public.
import { expect, test } from '@playwright/test'

test.skip(({ browserName, isMobile }) => !isMobile || !['chromium', 'webkit'].includes(browserName), 'téléphone seulement')
test.setTimeout(180_000)

test('match complet avec allers-retours de remplacements', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => !!localStorage.getItem('statfoot:v1:Match'))
  const ids = await page.evaluate(() => {
    const K = 'statfoot:v1:'
    const get = (n) => JSON.parse(localStorage.getItem(K + n) || '[]')
    const set = (n, v) => localStorage.setItem(K + n, JSON.stringify(v))
    const matches = get('Match')
    const m = matches.find((x) => x.number === 'PS-01') ?? matches.find((x) => x.season_id === 'season_2026')
    const now = new Date().toISOString()
    const players = get('Player'), lineups = get('Lineup').filter((l) => l.match_id !== m.id)
    for (const [tid, tag] of [[m.home_team_id, 'Dom'], [m.away_team_id, 'Ext']]) {
      const ids = []
      for (let i = 1; i <= 8; i++) {
        const id = `e2e_${tag}${i}`; ids.push(id)
        players.push({ id, first_name: 'Joueur', last_name: `${tag}${i}`, number: i, team_id: tid, season_ids: [m.season_id], status: 'active', created_date: now, updated_date: now })
      }
      lineups.push({ id: `e2e_lu_${tag}`, match_id: m.id, team_id: tid, present_ids: ids, starter_ids: ids.slice(0, 6), substitute_ids: ids.slice(6), goalkeeper_id: ids[0], captain_id: ids[1], validated: true, validated_by: 'e2e', validated_at: now, created_date: now, updated_date: now })
    }
    set('Player', players); set('Lineup', lineups)
    const refs = get('Referee'); refs.push({ id: 'e2e_ref', first_name: 'Arbitre', last_name: 'Test', active: true, created_date: now, updated_date: now }); set('Referee', refs)
    set('Match', matches.map((x) => (x.id === m.id ? { ...x, referee_id: 'e2e_ref', referee_name: 'Arbitre Test', status: 'scheduled' } : x)))
    set('MatchEvent', get('MatchEvent').filter((e) => e.match_id !== m.id))
    return { id: m.id, home: m.home_team_id }
  })

  // connexion avec le compte de test du jeu de démonstration (mode local uniquement)
  await page.goto('/admin')
  await page.locator('#email').fill('superadmin@mbl.ma')
  await page.locator('#pw').fill('mbl2026')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/admin/)
  await page.goto(`/admin/match-center/${ids.id}`)
  await page.getByRole('button', { name: "Coup d'envoi" }).click()
  const dlg = page.getByRole('dialog')
  const homePanel = page.locator('.glass').filter({ has: page.getByRole('button', { name: 'Entrer en jeu' }) }).first()

  const sub = async (out, inn) => {
    await homePanel.getByRole('button', { name: new RegExp(`\\b${out}\\b`) }).first().click()
    await dlg.getByRole('button', { name: /Faire sortir/ }).click()
    await dlg.getByRole('button', { name: new RegExp(inn) }).click()
    await expect(dlg).toBeHidden()
  }
  // allers-retours : Dom2 sort, revient, ressort ; Dom7 entre deux fois
  await sub('Dom2', 'Dom7')
  await sub('Dom7', 'Dom2')
  await sub('Dom2', 'Dom7')
  await expect(homePanel.getByText('6/6')).toBeVisible()

  // « Entrer en jeu » : Dom8 entre à la place de Dom3
  await homePanel.getByRole('button', { name: 'Entrer en jeu' }).click()
  await dlg.getByRole('button', { name: /Dom8/ }).click()
  await dlg.getByRole('button', { name: /Dom3/ }).click()
  await expect(dlg).toBeHidden()

  // but d'un joueur du banc (Dom2) : proposition d'entrée, Dom4 sort, puis sans passeur
  await page.getByRole('button', { name: /But$/ }).first().click()
  await dlg.getByRole('button', { name: 'But', exact: true }).click()
  await dlg.getByRole('button', { name: /Dom2/ }).click()
  await expect(dlg.getByText(/est sur le banc/)).toBeVisible()
  await dlg.getByRole('button', { name: /Dom4/ }).click()
  await dlg.getByRole('button', { name: 'Sans passeur' }).click()
  await expect(dlg).toBeHidden()

  // carton jaune à un joueur sur le banc (Dom3) : pas d'entrée
  await page.getByRole('button', { name: /Jaune/ }).first().click()
  await dlg.getByRole('button', { name: /Dom3/ }).click()
  await expect(dlg).toBeHidden()

  // état final : toujours 6 sur le terrain ; Dom2 et Dom8 sur le terrain, Dom3 et Dom4 sur le banc
  await expect(homePanel.getByText('6/6')).toBeVisible()
  const field = await page.evaluate(({ id }) => {
    const ev = JSON.parse(localStorage.getItem('statfoot:v1:MatchEvent') || '[]').filter((e) => e.match_id === id)
    return { subs: ev.filter((e) => e.type === 'substitution').length, goal: ev.find((e) => e.type === 'goal')?.player_id, card: ev.find((e) => e.type === 'yellow_card')?.card_target }
  }, ids)
  expect(field.subs).toBe(5)
  expect(field.goal).toBe('e2e_Dom2')
  expect(field.card).toBe('substitute')

  // fin du match
  for (const l of ['Mi-temps', 'Début 2e MT', 'Fin du match']) { await page.getByRole('button', { name: l }).click(); await page.waitForTimeout(400) }
  await dlg.getByRole('button', { name: /Terminer le match/ }).click()
  await page.waitForTimeout(1200)
  await page.keyboard.press('Escape')

  // feuille de match : entrées / sorties et minutes jouées
  await page.goto(`/admin/feuille/${ids.id}`)
  await expect(page.getByText('Entrées et sorties')).toBeVisible()
  await expect(page.getByText(/entre Joueur Dom7, sort Joueur Dom2/).first()).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Min.' }).first()).toBeVisible()

  // résumé public
  await page.goto(`/matchs/${ids.id}`)
  await expect(page.getByText(/entre · sort/).first()).toBeVisible()
  await expect(page.getByText(/Dom2/).first()).toBeVisible()
})
