import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import { OFFICIAL_TEAMS_2026, applyOfficialPlan, matchOfficial, planIsEmpty, planOfficialTeams, planReport, teamKey } from './officialTeams'
import type { Team } from '@/types/entities'

const XLSX_NAMES = ['ARROW ECS', 'ATELIER VERT-R', 'COBCO', 'ALD AUTOMOTIVE', 'PHARMAPROM', 'MIDEA', 'WAFASALAF', 'JTI', 'CREDIT AGRICOLE', 'G3C', 'Parebrise Express', 'MARJANE MARKET', 'ATTIJARIWAFA BANK', 'CANPACK 2', 'DISTRA', 'MICHOC', 'BMCI', 'CANPACK 1', 'CTR', 'MEGA PT', 'ATELIER VERT-C', 'HEURE JOYEUSE', 'CAC']
// saison 2026-2027 telle qu'elle était avant la liste officielle (20 équipes, dont « Simulation FC »)
const OLD = [['Attijariwafa bank', 'ATW'], ['Pharmaprom', 'PHP'], ['Midea', 'MID'], ['JTI', 'JTI'], ['Simulation FC', 'SIM'], ['Cobco', 'COB'], ['Atelier Vert Casa', 'AVC'], ['Canpack 1', 'CP1'], ['BMCI', 'BMC'], ['Mega Post Tension', 'MPT'], ['Crédit Agricole', 'CAM'], ['Arrow', 'ARW'], ['CAC', 'CAC'], ['Michoc', 'MIC'], ['L’Heure Joyeuse', 'LHJ'], ['Canpack 2', 'CP2'], ['Wafasalaf', 'WAF'], ['Distra', 'DST'], ['Atelier Vert Rabat', 'AVR'], ['Marjane Market', 'MJM']]

function oldDb() {
  const db = generateLeagueData(new Date('2026-11-11T12:00:00Z'))
  db.Team = db.Team.filter((t) => t.season_id !== 'season_2026')
  const old: Team[] = OLD.map(([name, short]) => ({ id: `t26_${short.toLowerCase()}`, name, short_name: short, company: name, season_id: 'season_2026', club_id: `club_t26_${short.toLowerCase()}`, status: 'active', logo_url: 'data:image/svg+xml;utf8,x' }))
  db.Team.push(...old)
  db.Club.push(...old.filter((t) => !db.Club.some((c) => c.id === t.club_id)).map((t) => ({ id: t.club_id!, name: t.name })))
  const comp = db.Competition.find((c) => c.season_id === 'season_2026' && c.phase === 'league_phase')!
  comp.team_ids = old.map((t) => t.id)
  db.Player.push({ id: 'p_sim', first_name: 'Test', last_name: 'Sim', team_id: 't26_sim', position: 'FIELD', status: 'active', season_ids: ['season_2026'] })
  db.Match.push({ id: 'm_sim', season_id: 'season_2026', competition_id: comp.id, round: 1, home_team_id: 't26_sim', away_team_id: 't26_cob', status: 'scheduled' })
  return db
}

describe('liste officielle 2026-2027', () => {
  it('rapprochement : majuscules, accents, tirets, apostrophes et alias', () => {
    const found = XLSX_NAMES.map((n) => matchOfficial([n])?.name)
    expect(found.every(Boolean)).toBe(true)
    expect(new Set(found).size).toBe(23)
    expect(teamKey('L’Heure Joyeuse')).toBe(teamKey("L'HEURE JOYEUSE"))
    expect(matchOfficial(['Construction & Travaux Routiers'])?.name).toBe('CTR')
    expect(matchOfficial(['Mega Post-Tension'])?.name).toBe('Mega Post Tension')
    expect(matchOfficial(['Simulation FC'])).toBeUndefined()
  })
  it('seed : exactement les 23 équipes, plan vide', () => {
    const db = generateLeagueData()
    const plan = planOfficialTeams(db, 'season_2026')
    expect(plan.kept).toHaveLength(23)
    expect(planIsEmpty(plan)).toBe(true)
    expect(OFFICIAL_TEAMS_2026).toHaveLength(23)
  })
  it('ancienne saison : gardées / renommées / créées / retirées, puis idempotent, 2025-2026 intact', () => {
    const db = oldDb()
    const before25 = JSON.stringify([db.Team.filter((t) => t.season_id === 'season_2025'), db.Match.filter((m) => m.season_id === 'season_2025'), db.Player.filter((p) => p.season_ids?.includes('season_2025'))])
    const plan = planOfficialTeams(db, 'season_2026')
    const r = planReport(plan)
    expect(r.renommees.sort()).toEqual(['Arrow → Arrow ECS', 'L’Heure Joyeuse → L\'Heure Joyeuse', 'Midea → Taqeef (Midea)'].sort())
    expect(r.creees.sort()).toEqual(['ALD Automotive', 'CTR', 'G3C', 'Parebrise Express'])
    expect(plan.removed.map((x) => x.team.name)).toEqual(['Simulation FC'])
    expect(plan.removed[0]).toMatchObject({ players: [{ id: 'p_sim' }], matches: [{ id: 'm_sim' }] })
    Object.assign(db, applyOfficialPlan(db, plan))
    const s26 = db.Team.filter((t) => t.season_id === 'season_2026')
    expect(s26).toHaveLength(23)
    expect(s26.find((t) => t.short_name === 'ARW')).toMatchObject({ id: 't26_arw', name: 'Arrow ECS', logo_url: '/logos/arw.png' })
    expect(db.Player.some((p) => p.id === 'p_sim') || db.Match.some((m) => m.id === 'm_sim')).toBe(false)
    expect(db.Competition.find((c) => c.season_id === 'season_2026' && c.phase === 'league_phase')!.team_ids).toHaveLength(23)
    expect(planIsEmpty(planOfficialTeams(db, 'season_2026'))).toBe(true)
    expect(JSON.stringify([db.Team.filter((t) => t.season_id === 'season_2025'), db.Match.filter((m) => m.season_id === 'season_2025'), db.Player.filter((p) => p.season_ids?.includes('season_2025'))])).toBe(before25)
  })
  it('équipe retirée liée à un club de 2025-2026 : club et historique conservés', () => {
    const db = oldDb()
    const t25 = db.Team.find((t) => t.season_id === 'season_2025')!
    db.Team.find((t) => t.id === 't26_sim')!.club_id = t25.club_id ?? `club_${t25.id}`
    const plan = planOfficialTeams(db, 'season_2026')
    expect(plan.removed[0].keepClub).toBe(true)
    const out = applyOfficialPlan(db, plan)
    expect(out.Club!.some((c) => c.id === (t25.club_id ?? `club_${t25.id}`))).toBe(true)
    expect(out.Team!.some((t) => t.id === t25.id)).toBe(true)
  })
})

describe('mise à jour automatique des navigateurs (migration)', () => {
  it('crée et renomme ; retire Simulation FC seulement si elle n’a ni joueur ni match joué', async () => {
    const { applyOfficialTeams2026 } = await import('@/api/seed/migrations')
    const db = oldDb()
    db.Player = db.Player.filter((p) => p.id !== 'p_sim') // sans joueur, match seulement programmé
    const out = applyOfficialTeams2026(db as never)
    expect(out.Team!.filter((t) => t.season_id === 'season_2026')).toHaveLength(23)
    expect(out.Team!.some((t) => t.id === 't26_sim')).toBe(false)
    const withPlayer = oldDb() // Simulation FC a un joueur → laissée à la décision de l’admin
    const out2 = applyOfficialTeams2026(withPlayer as never)
    expect(out2.Team!.some((t) => t.id === 't26_sim')).toBe(true)
    expect(out2.Team!.filter((t) => t.season_id === 'season_2026')).toHaveLength(24)
    // la pré-saison ne contient que les 23 équipes officielles, même si une équipe hors liste est conservée
    expect(out2.Competition!.find((c) => c.id === 'comp_2026_selection')!.team_ids).toHaveLength(23)
    expect(applyOfficialTeams2026({ ...db, ...out } as never)).toEqual({})
  })
  it('Simulation FC retirée même avec des joueurs : 23 équipes, pré-saison à 23, tirage incluant l’équipe annulé (idempotent)', async () => {
    const { applyOfficialTeams2026, applyRemoveSimulation2026 } = await import('@/api/seed/migrations')
    const db = oldDb()
    const step1 = { ...db, ...applyOfficialTeams2026(db as never) } as typeof db
    const comp = step1.Competition.find((c) => c.id === 'comp_2026_selection')!
    comp.team_ids = [...comp.team_ids!, 't26_sim']
    comp.preseason = { seed: 42, draw_order: comp.team_ids, revealed: 3 }
    const out = applyRemoveSimulation2026(step1 as never)
    expect(out.Team!.filter((t) => t.season_id === 'season_2026')).toHaveLength(23)
    expect(out.Player!.some((p) => p.id === 'p_sim')).toBe(false)
    expect(out.Match!.some((m) => m.id === 'm_sim')).toBe(false)
    const c = out.Competition!.find((x) => x.id === 'comp_2026_selection')!
    expect(c.team_ids).toHaveLength(23)
    expect(c.preseason?.draw_order).toBeUndefined()
    expect(applyRemoveSimulation2026({ ...step1, ...out } as never)).toEqual({})
  })
})
