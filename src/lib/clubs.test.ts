import { describe, expect, it } from 'vitest'
import { generateLeagueData } from '@/api/seed/generate'
import { applyClubs, migrate } from '@/api/seed/migrations'
import { clubKey, clubSeasonCount, nameSimilarity, personKey, suggestPlayerLinks, suggestTeamLinks, teamInSeason, teamSeasonId } from './clubs'
import { returningHighlights } from './heritage'
import { generalStandings } from './stats'
import type { LeagueData } from './stats'

const db = generateLeagueData(new Date('2026-11-11T10:00:00'))
const league = (): LeagueData => ({ seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings: db.Settings[0], divisions: db.Division, groups: db.Group })

describe('saisons séparées : clubs et équipes de saison', () => {
  it('chaque équipe a une seule saison et son propre club ; aucun lien automatique', () => {
    expect(db.Team.every((t) => t.season_id && t.club_id === `club_${t.id}` && !t.link)).toBe(true)
    expect(new Set(db.Team.map(clubKey)).size).toBe(db.Team.length)
    expect(db.Club.length).toBe(db.Team.length)
    const s25 = db.Team.filter((t) => t.season_id === 'season_2025'), s26 = db.Team.filter((t) => t.season_id === 'season_2026')
    expect(s25.length).toBe(16); expect(s26.length).toBe(21)
    expect(s25.every((t) => teamSeasonId(t, db.Competition) === 'season_2025')).toBe(true)
  })
  it('migration d’une base existante (équipes sans saison) : saison déduite des compétitions, idempotente', () => {
    const old = { Team: db.Team.map(({ season_id: _s, club_id: _c, ...t }) => t), Competition: db.Competition, Club: [] as never[] }
    const out = applyClubs(old)
    expect(out.Team!.every((t) => !!t.season_id && !!t.club_id)).toBe(true)
    expect(out.Club!.length).toBe(db.Team.length)
    expect(applyClubs({ ...old, ...out })).toEqual({})
  })
  it('suggestion par nom proche, seulement vers une saison précédente', () => {
    expect(nameSimilarity('Atelier Vert Rabat', 'ATELIER-VERT  rabat')).toBe(1)
    expect(nameSimilarity('Attijariwafa bank', 'Attijari Wafa Bank')).toBeGreaterThan(0.7)
    expect(nameSimilarity('Dell', 'Wafasalaf')).toBeLessThan(0.3)
    const avr26 = db.Team.find((t) => t.season_id === 'season_2026' && t.name === 'Atelier Vert Rabat')!
    const sug = suggestTeamLinks(avr26, db.Team, db.Competition, db.Season)
    expect(sug[0].item.name).toBe('Atelier Vert Rabat')
    expect(sug[0].item.season_id).toBe('season_2025')
    // une équipe 2025 n'a rien à lier (pas de saison avant)
    expect(suggestTeamLinks(sug[0].item, db.Team, db.Competition, db.Season)).toEqual([])
    // suggestion écartée → plus proposée
    expect(suggestTeamLinks({ ...avr26, link_dismissed: [sug[0].item.id] }, db.Team, db.Competition, db.Season).some((s) => s.item.id === sug[0].item.id)).toBe(false)
  })
  it('anciennes données : une fiche partagée par deux saisons est séparée (aucun lien automatique)', () => {
    const t25 = db.Team.find((t) => t.season_id === 'season_2025' && t.short_name === 'AVR')!
    const t26 = db.Team.find((t) => t.season_id === 'season_2026' && t.short_name === 'AVR')!
    // reconstitue l'ancien état : la phase 2026 utilise la fiche 2025
    const comps = db.Competition.map((c) => (c.season_id === 'season_2026' ? { ...c, team_ids: c.team_ids!.map((x) => (x === t26.id ? t25.id : x)) } : c))
    const m26 = { id: 'm26', season_id: 'season_2026', competition_id: 'comp_2026_selection', home_team_id: t25.id, away_team_id: 'x', status: 'scheduled' as const }
    const old = { Team: db.Team.filter((t) => t.id !== t26.id).map(({ season_id: _s, club_id: _c, ...t }) => t), Competition: comps, Season: db.Season, Match: [m26], MatchEvent: [{ id: 'e', match_id: 'm26', team_id: t25.id, type: 'goal' as const }], Player: [{ id: 'np', first_name: 'N', last_name: 'P', team_id: t25.id, position: 'FIELD' as const, status: 'active' as const, season_ids: ['season_2026'] }], Club: [] as never[] }
    const out = migrate(old as never, 4) // étapes « séparation » puis « clubs »
    const clone = out.Team!.find((t) => t.season_id === 'season_2026' && t.short_name === 'AVR')!
    expect(clone.id).not.toBe(t25.id)
    expect(out.Team!.find((t) => t.id === t25.id)!.season_id).toBe('season_2025')
    expect(out.Competition!.find((c) => c.id === 'comp_2026_selection')!.team_ids).toContain(clone.id)
    expect(out.Competition!.find((c) => c.id === 'comp_2026_selection')!.team_ids).not.toContain(t25.id)
    expect([out.Match![0].home_team_id, out.MatchEvent![0].team_id, out.Player![0].team_id]).toEqual([clone.id, clone.id, clone.id])
    expect(clubKey(clone)).not.toBe(clubKey(out.Team!.find((t) => t.id === t25.id)!))
    expect(clone.link).toBeUndefined()
  })
  it('lien approuvé : club commun, 2 saisons, historique ; sans approbation : nouvelle équipe', () => {
    const avr26 = db.Team.find((t) => t.season_id === 'season_2026' && t.name === 'Atelier Vert Rabat')!
    const avr25 = db.Team.find((t) => t.season_id === 'season_2025' && t.name === 'Atelier Vert Rabat')!
    expect(clubSeasonCount(avr26, db.Team, db.Competition, db.Season)).toBe(1)
    const teams = db.Team.map((t) => (t.id === avr26.id ? { ...t, club_id: avr25.club_id, link: { previous_id: avr25.id, approved_at: '2026-11-11' } } : t))
    const linked = teams.find((t) => t.id === avr26.id)!
    expect(clubSeasonCount(linked, teams, db.Competition, db.Season)).toBe(2)
    expect(teamInSeason(avr25, 'season_2026', teams, db.Competition)?.id).toBe(avr26.id)
    expect(clubSeasonCount(linked, teams, db.Competition, db.Season, 4)).toBe(4) // correction manuelle
  })
  it('joueurs : suggestion par nom, lien = identité commune', () => {
    const p25 = db.Player.find((p) => p.season_ids?.includes('season_2025'))!
    const p26 = { ...p25, id: 'new26', season_ids: ['season_2026'], team_id: 's26_x', person_id: undefined }
    const sug = suggestPlayerLinks(p26, [...db.Player, p26], db.Team, db.Season)
    expect(sug[0].item.id).toBe(p25.id)
    expect(personKey({ ...p26, person_id: personKey(p25) })).toBe(personKey(p25))
  })
  it('accueil : les mises en avant 2025-2026 n’apparaissent que pour les équipes et joueurs revenus avec un lien approuvé', () => {
    const L = league()
    expect(returningHighlights(L, 'season_2025', 'season_2026')).toEqual([])
    // on lie le champion 2025 à son équipe 2026 (même nom) et le meilleur buteur à un joueur 2026
    const champ25 = L.teams.find((t) => t.id === returningChampion(L))!
    const t26 = L.teams.find((t) => t.season_id === 'season_2026' && t.name === champ25.name) ?? L.teams.find((t) => t.season_id === 'season_2026')!
    const teams = L.teams.map((t) => (t.id === t26.id ? { ...t, club_id: champ25.club_id, link: { previous_id: champ25.id, approved_at: 'x' } } : t))
    const h = returningHighlights({ ...L, teams }, 'season_2025', 'season_2026')
    expect(h).toHaveLength(1)
    expect(h[0]).toMatchObject({ kind: 'team', label: 'Champion 2025-2026' })
    expect(h[0].team.id).toBe(t26.id) // l'équipe affichée est celle de 2026
  })
})
const returningChampion = (L: LeagueData) => generalStandings(L, 'season_2025')[0].team_id
