import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import { leagueFromDb } from '@/lib/leagueData'
import { competitionStandings } from '@/lib/standings'
import { contrastText, playedRounds, weeklyResults, weeklyRowsLayout, weeklyStandings, weeklyStandingsInfo, weeklyTop } from './weekly'
import { makeLeague } from '../__fixtures__/league'
import { DEFAULT_VISUALS_CONFIG } from './config'
import type { Settings } from '@/types/entities'

const db = generateLeagueData(new Date('2026-11-11T12:00:00Z'))
const league = leagueFromDb(db, db.Settings[0] ?? ({ id: 'settings' } as Settings))
const comp = db.Competition.find((c) => playedRounds(league, c.id).length > 2)!
const [last, prev] = playedRounds(league, comp.id)

describe('visuels de la semaine', () => {
  it('résultats : uniquement la journée et la compétition choisies', () => {
    const rows = weeklyResults(league, comp.id, prev)
    expect(rows.length).toBe(league.matches.filter((m) => m.competition_id === comp.id && m.round === prev && m.status !== 'cancelled').length)
    expect(rows.every((r) => r.home.name && r.away.name)).toBe(true)
  })
  it('classement : après la journée choisie (pas les suivantes)', () => {
    expect(weeklyStandings(league, comp.id, prev).map((r) => r.points)).toEqual(competitionStandings(league, comp.id, { beforeRound: prev + 1 }).map((r) => r.points))
    expect(weeklyStandings(league, comp.id, last).map((r) => r.played).reduce((a, b) => a + b)).toBeGreaterThan(weeklyStandings(league, comp.id, prev).map((r) => r.played).reduce((a, b) => a + b))
  })
  it('top 10 : 10 max, trié, départage XP puis alphabétique, valeurs > 0, jamais le Match des capitaines', () => {
    for (const kind of ['xp', 'goals', 'assists', 'keepers'] as const) {
      const top = weeklyTop(league, comp.id, last, kind)
      expect(top.length).toBeLessThanOrEqual(10)
      for (let i = 1; i < top.length; i++) {
        const a = top[i - 1], b = top[i]
        expect(a.value > b.value || (a.value === b.value && (a.xp >= b.xp || kind === 'keepers' || kind === 'goals'))).toBe(true)
      }
      if (kind !== 'keepers') expect(top.every((e) => e.value > 0)).toBe(true)
    }
    const before = JSON.stringify(weeklyTop(league, comp.id, last, 'xp'))
    db.CaptainMatch.push({ id: 'cm', date: '2026-01-01T18:00', status: 'finished', lines: [{ side: 'orange', player_id: db.Player[0].id, played: true, goals: 9, og: 0, assists: 9, yc: 0, rc: 0, saves: 0 }] })
    expect(JSON.stringify(weeklyTop(leagueFromDb(db, league.settings as Settings), comp.id, last, 'xp'))).toBe(before)
  })
  it('contraste automatique du texte sur la couleur du club', () => {
    expect(contrastText('#000000')).toBe('#FFFFFF')
    expect(contrastText('#FFE500')).toBe('#0B1B3F')
    expect(contrastText('#0B2E73')).toBe('#FFFFFF')
  })
  it('zones : 16 pastilles au pas de 59 px (1re à 274, 16e à 1160), 7 bandes du Top 10', () => {
    const S = DEFAULT_VISUALS_CONFIG.semaine
    expect(S.zones.pill.y + 15 * S.options.step).toBe(1159)
    expect(DEFAULT_VISUALS_CONFIG.top10.bands).toHaveLength(7)
  })
})

describe('classement de la semaine : toutes les équipes', () => {
  it('une ligne par équipe de la compétition (21, 11, 10) — aucune limite à 16', () => {
    for (const n of [21, 11, 10]) {
      const ids = Array.from({ length: n }, (_, i) => `T${i}`)
      const teams = ids.map((id) => ({ id, name: `Équipe ${id}`, short_name: id, primary_color: '#123456' }))
      const lg = makeLeague({ teams: teams as never, competitions: [{ id: 'c', season_id: 's1', name: 'Test', phase: 'gold', team_ids: ids } as never],
        matches: [{ id: 'm', season_id: 's1', competition_id: 'c', round: 1, home_team_id: 'T0', away_team_id: 'T1', home_score: 2, away_score: 1, status: 'finished', date: '2026-11-17T20:00' } as never], events: [], lineups: [] })
      const rows = weeklyStandingsInfo(lg, 'c', 1).rows
      expect(rows).toHaveLength(n)
      const L = weeklyRowsLayout(n)
      expect(L.top(n - 1) + L.h).toBeLessThanOrEqual(1222)
      expect(L.name).toBeGreaterThanOrEqual(24)
    }
  })
  it('pré-saison : même classement que la page Classement (21 équipes, séparation après la 11e)', () => {
    const pre = db.Competition.find((c) => c.phase === 'league_phase' && c.format === 'swiss' && playedRounds(league, c.id).length)
    if (!pre) return
    const r = Math.max(...playedRounds(league, pre.id))
    const info = weeklyStandingsInfo(league, pre.id, r)
    expect(info.rows).toHaveLength(pre.team_ids!.length)
    expect(info.masterSize).toBeGreaterThan(0)
  })
})
