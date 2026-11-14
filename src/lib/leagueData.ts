// Données lues par TOUS les calculs de la ligue (classements, XP, IPG, stats, discipline, bandeau).
// Liste fermée d'entités : le Match des capitaines (CaptainTeam / CaptainMatch) n'y figure pas
// et ne peut donc compter nulle part dans la ligue.
import type { EntityMap, EntityName, Settings } from '@/types/entities'
import type { LeagueData } from './stats'
import type { DisciplineData } from './reglement'

type DBLike = { [N in EntityName]: EntityMap[N][] }

export function leagueFromDb(db: DBLike, settings: Settings): LeagueData {
  return {
    seasons: db.Season, competitions: db.Competition, divisions: db.Division, groups: db.Group, teams: db.Team,
    players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule,
    suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings, teamStats: db.MatchTeamStats, adjustments: db.StandingAdjustment ?? [],
  }
}
export function disciplineFromDb(db: Pick<DBLike, 'Match' | 'MatchEvent' | 'Lineup' | 'Player' | 'Suspension'>): DisciplineData {
  return { matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, players: db.Player, suspensions: db.Suspension }
}
