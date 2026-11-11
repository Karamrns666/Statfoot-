// Le Match des capitaines ne compte NULLE PART dans la ligue : on ajoute des matchs des capitaines riches
// (buts, passes, cartons, rouges, homme du match) joués par de vrais joueurs inscrits, puis on vérifie que
// classements, XP, stats joueurs et équipes, cartons / suspensions et bandeau de saison sont strictement inchangés.
import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import { leagueFromDb, disciplineFromDb } from './leagueData'
import { competitionStandings } from './standings'
import { computePlayerXP } from './xp'
import { computeTeamStats, generalStandings, kpis } from './stats'
import { computeDiscipline } from './reglement'
import { seasonStrip } from './seasonStrip'
import { IPG_RANKING } from './ipg'
import { captainPlayerStats, captainRecord, emptyLine } from './captains'
import type { CaptainMatch, Settings } from '@/types/entities'

function snapshot(db: ReturnType<typeof generateLeagueData>) {
  const league = leagueFromDb(db, db.Settings[0] ?? ({ id: 'settings' } as Settings))
  const seasons = db.Season.map((s) => s.id)
  return JSON.stringify({
    standings: db.Competition.map((c) => competitionStandings(league, c.id)),
    general: seasons.map((s) => generalStandings(league, s)),
    xp: seasons.map((s) => [...computePlayerXP(league, { seasonId: s }).entries()]),
    teams: seasons.map((s) => [...computeTeamStats(league, { seasonId: s }).entries()]),
    kpis: seasons.map((s) => kpis(league, { seasonId: s })),
    discipline: db.Competition.map((c) => { const d = computeDiscipline(c.id, disciplineFromDb(db)); return [...d.players.values()] }),
    strip: seasons.map((s) => seasonStrip(league, s)),
    ipg: IPG_RANKING,
  })
}

describe('Match des capitaines — isolation totale de la ligue', () => {
  it('ajouter des matchs des capitaines ne change aucun calcul de la ligue', () => {
    const db = generateLeagueData(new Date('2026-11-11T12:00:00Z'))
    const before = snapshot(db)
    const ps = db.Player.slice(0, 12)
    const line = (i: number, side: 'orange' | 'bleue', o: Partial<ReturnType<typeof emptyLine>>) => ({ ...emptyLine(side, ps[i].id), played: true, ...o })
    const matches: CaptainMatch[] = [1, 2, 3].map((k) => ({
      id: `cm${k}`, date: `2026-0${k + 6}-15T18:00:00`, status: 'finished', motm_player_id: ps[0].id,
      lines: [
        line(0, 'orange', { goals: 4, assists: 1, yc: 1 }), line(1, 'orange', { goals: 2, rc: 1 }), line(2, 'orange', { gk: true, saves: 9 }),
        line(6, 'bleue', { goals: 3, assists: 2, yc: 2 }), line(7, 'bleue', { og: 1, rc: 1 }), line(8, 'bleue', { gk: true, saves: 5 }),
      ],
    }))
    db.CaptainMatch.push(...matches)
    expect(snapshot(db)).toBe(before)
    // …alors que le module des capitaines, lui, les voit bien
    expect(captainRecord(db.CaptainMatch).orange.played).toBe(3)
    expect(captainPlayerStats(db.CaptainMatch).find((s) => s.player_id === ps[0].id)?.goals).toBe(12)
  })
  it('les données de la ligue ne contiennent aucune entité du Match des capitaines', () => {
    const db = generateLeagueData()
    const league = leagueFromDb(db, db.Settings[0])
    const json = JSON.stringify(Object.keys(league))
    expect(json).not.toMatch(/captain/i)
    expect(Object.values(league).some((v) => v === db.CaptainMatch || v === db.CaptainTeam)).toBe(false)
    expect(db.CaptainTeam.map((t) => t.side)).toEqual(['orange', 'bleue'])
  })
})
