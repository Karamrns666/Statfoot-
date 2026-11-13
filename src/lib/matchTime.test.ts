import { describe, expect, it } from 'vitest'
import { TBD, checkPlacement, checkRound, fmtWhen, nextNumbers, toWall, wallToISO } from './matchTime'
import type { Match } from '@/types/entities'

const m = (id: string, home: string, away: string, day?: string, time?: string, pitch?: string): Match => ({ id, season_id: 's', competition_id: 'c', home_team_id: home, away_team_id: away, status: 'scheduled', date: day && time ? wallToISO(day, time) : undefined, pitch })

describe('horaires (heure du Maroc)', () => {
  it('lundi 16 novembre 2026 à 21h00 au Maroc = 20h00 UTC ; aller-retour exact', () => {
    expect(wallToISO('2026-11-16', '21:00')).toBe('2026-11-16T20:00:00.000Z')
    expect(toWall('2026-11-16T20:00:00.000Z')).toBe('2026-11-16T21:00')
  })
  it('affichage en français : « Lundi 16 novembre · 21h00 · Terrain 1 » ; sans date : « Horaire à définir »', () => {
    expect(fmtWhen(m('a', 'x', 'y', '2026-11-16', '21:00', 'Terrain 1'))).toBe('Lundi 16 novembre · 21h00 · Terrain 1')
    expect(fmtWhen(m('a', 'x', 'y', '2026-11-19', '22:00', 'Terrain 2'))).toBe('Jeudi 19 novembre · 22h00 · Terrain 2')
    expect(fmtWhen(m('a', 'x', 'y'))).toBe(TBD)
  })
})

describe('contrôles du planning (2 terrains)', () => {
  const others = [m('a', 'A', 'B', '2026-11-16', '21:00', 'Terrain 1'), m('b', 'C', 'D', '2026-11-16', '21:00', 'Terrain 2')]
  it('deux matchs sur le même terrain au même créneau : refusé', () => {
    expect(checkPlacement(m('c', 'E', 'F', '2026-11-16', '21:00', 'Terrain 1'), others.slice(0, 1)).errors[0]).toMatch(/Terrain 1 est déjà pris/)
  })
  it('2 matchs maximum par créneau ; terrain hors liste refusé', () => {
    expect(checkPlacement(m('c', 'E', 'F', '2026-11-16', '21:00', 'Terrain 1'), others).errors.length).toBeGreaterThan(0)
    expect(checkPlacement(m('c', 'E', 'F', '2026-11-16', '22:00', 'Terrain 3'), others).errors[0]).toMatch(/Terrain inconnu/)
  })
  it('même équipe deux fois le même jour : alerte non bloquante', () => {
    const r = checkPlacement(m('c', 'A', 'F', '2026-11-16', '22:00', 'Terrain 1'), others)
    expect(r.errors).toEqual([])
    expect(r.warnings[0]).toMatch(/A joue déjà ce jour-là/)
  })
  it('publication impossible tant qu’un match n’a pas date, heure et terrain', () => {
    const round = [...others, m('c', 'E', 'F')]
    expect(checkRound(round, round).errors[0]).toMatch(/1 match sans date/)
    expect(checkRound(others, others).errors).toEqual([])
  })
})

describe('numéros de match', () => {
  it('à partir de PS-12 après le tirage officiel, sans réutiliser un numéro (compteur conservé)', () => {
    expect(nextNumbers(['PS-01', 'PS-11', 'PS-08'], 11, 3)).toEqual(['PS-12', 'PS-13', 'PS-14'])
    expect(nextNumbers(['PS-01'], 15, 1)).toEqual(['PS-16']) // PS-12…PS-15 supprimés : jamais réattribués
  })
})
