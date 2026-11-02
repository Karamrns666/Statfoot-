// Jeu de données CONNU pour les tests : 4 équipes, 4 joueurs chacune, 6 matchs (aller simple).
//
//  J1  A 2-0 B   |  C 1-1 D
//  J2  A 1-1 C   |  B 3-1 D
//  J3  A 0-1 D   |  B 2-2 C
//
//  Classement attendu (pts, diff) : A 4 (+1) · B 4 (0) · D 4 (-1) · C 3 (0)
import type { Lineup, Match, MatchEvent, Player, Position, Team } from '@/types/entities'
import type { LeagueData } from '../stats'
import { DEFAULT_XP_RULES } from '../stats'

const T = ['A', 'B', 'C', 'D'] as const
const POS: Position[] = ['GK', 'DEF', 'MID', 'FWD']

export const teams: Team[] = T.map((t) => ({ id: t, name: `Équipe ${t}`, short_name: `EQ${t}`, division_id: 'div1' }))

export const players: Player[] = T.flatMap((t) =>
  POS.map((pos) => ({
    id: `${t}_${pos}`, first_name: pos, last_name: `${t}-${pos}`, position: pos, team_id: t,
    birth_date: t === 'C' && pos === 'MID' ? '2006-03-01' : '1990-01-01', season_ids: ['s1'],
  })),
)

let mid = 0
function match(round: number, home: string, away: string, hs: number, as: number, extra: Partial<Match> = {}): Match {
  mid++
  return {
    id: `M${mid}`, season_id: 's1', competition_id: 'c1', round, stage: 'league',
    date: `2025-09-${String(round * 7).padStart(2, '0')}T19:00:00`, home_team_id: home, away_team_id: away,
    home_score: hs, away_score: as, status: 'finished', published: true, ...extra,
  }
}

export const matches: Match[] = [
  match(1, 'A', 'B', 2, 0),
  match(1, 'C', 'D', 1, 1),
  match(2, 'A', 'C', 1, 1),
  match(2, 'B', 'D', 3, 1),
  match(3, 'A', 'D', 0, 1, { motm_player_id: 'D_FWD' }),
  match(3, 'B', 'C', 2, 2),
]

let eid = 0
const ev = (match_id: string, type: MatchEvent['type'], player_id: string, minute: number, extra: Partial<MatchEvent> = {}): MatchEvent => ({
  id: extra.id ?? `E${++eid}`, match_id, type, player_id, team_id: player_id[0], minute, period: minute <= 20 ? '1H' : '2H', ...extra,
})

export const events: MatchEvent[] = [
  // M1 A 2-0 B
  ev('M1', 'goal', 'A_FWD', 10, { related_player_id: 'A_MID' }),
  ev('M1', 'penalty_goal', 'A_FWD', 35),
  ev('M1', 'save', 'B_GK', 12), ev('M1', 'save', 'B_GK', 25), ev('M1', 'save', 'B_GK', 30),
  ev('M1', 'save', 'A_GK', 15), ev('M1', 'save', 'A_GK', 33),
  ev('M1', 'yellow_card', 'B_DEF', 22),
  // M2 C 1-1 D  (D n'a pas de composition saisie → MJ déduits des événements)
  ev('M2', 'goal', 'C_FWD', 8, { related_player_id: 'C_DEF' }),
  ev('M2', 'goal', 'D_MID', 30),
  ev('M2', 'assist', 'D_FWD', 30), // passe "legacy" autonome, sans parent → doit compter
  // M3 A 1-1 C
  ev('M3', 'goal', 'A_MID', 5, { id: 'G_M3', related_player_id: 'A_FWD' }),
  ev('M3', 'assist', 'A_FWD', 5, { parent_event_id: 'G_M3' }), // doublon → ne doit PAS compter
  ev('M3', 'own_goal', 'A_DEF', 28), // compte pour C
  // M4 B 3-1 D
  ev('M4', 'goal', 'B_FWD', 4, { related_player_id: 'B_MID' }),
  ev('M4', 'goal', 'B_FWD', 18),
  ev('M4', 'goal', 'B_MID', 26),
  ev('M4', 'goal', 'D_FWD', 33, { related_player_id: 'D_MID' }),
  ev('M4', 'red_card', 'D_DEF', 36),
  // M5 A 0-1 D
  ev('M5', 'goal', 'D_FWD', 14, { related_player_id: 'D_MID' }),
  // M6 B 2-2 C
  ev('M6', 'goal', 'B_FWD', 3),
  ev('M6', 'goal', 'C_FWD', 11),
  ev('M6', 'goal', 'C_MID', 24, { related_player_id: 'C_DEF' }),
  ev('M6', 'goal', 'B_DEF', 38, { related_player_id: 'B_FWD' }),
]

export const lineups: Lineup[] = matches.flatMap((m) =>
  [m.home_team_id, m.away_team_id]
    .filter((t) => !(m.id === 'M2' && t === 'D'))
    .map((t) => ({
      id: `L_${m.id}_${t}`, match_id: m.id, team_id: t,
      starter_ids: POS.map((p) => `${t}_${p}`), goalkeeper_id: `${t}_GK`, subs_entered_ids: [],
    })),
)

export function makeLeague(overrides: Partial<LeagueData> = {}): LeagueData {
  return {
    seasons: [{ id: 's1', name: 'Saison test', start_date: '2025-09-01' }],
    competitions: [{ id: 'c1', name: 'Gold Cup', season_id: 's1', format: 'league', division_id: 'div1', team_ids: ['A', 'B', 'C', 'D'] }],
    divisions: [{ id: 'div1', name: 'Série A', level: 1 }],
    groups: [],
    teams, players, matches, events, lineups,
    xpRules: DEFAULT_XP_RULES.map((r, i) => ({ ...r, id: `x${i}` })),
    settings: { points_win: 3, points_draw: 1, points_loss: 0, awards_min_matches: 3, young_max_age: 23 },
    ...overrides,
  }
}
