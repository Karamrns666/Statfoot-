// Types TypeScript miroir des schémas /entities/*.json (format Base44).
// Base44 ajoute automatiquement id, created_date, updated_date, created_by.

export interface BaseEntity {
  id: string
  created_date?: string
  updated_date?: string
  created_by?: string
}

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
export type MatchStage = 'league' | 'group' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final'
export type Period = '1H' | '2H' | 'ET' | 'PENS'
export type AppRole = 'super_admin' | 'league_admin' | 'scorer' | 'player'

export interface Season extends BaseEntity {
  name: string
  start_date: string
  end_date?: string
  is_active?: boolean
  status?: 'upcoming' | 'active' | 'closed'
  closed_at?: string
  champion_team_id?: string
  notes?: string
}

export type CompetitionFormat = 'league' | 'group_stage' | 'cup' | 'other'
export interface Competition extends BaseEntity {
  name: string
  short_name?: string
  season_id: string
  division_id?: string
  format: CompetitionFormat
  legs?: 'single' | 'double'
  logo_url?: string
  color?: string
  description?: string
  start_date?: string
  end_date?: string
  location?: string
  team_count?: number
  team_ids?: string[]
  qualified_per_group?: number
  knockout_rounds?: MatchStage[]
  tiebreakers?: Tiebreaker[]
  status?: 'draft' | 'active' | 'finished' | 'archived'
  order?: number
}

export interface Division extends BaseEntity {
  name: string
  level: number
  promotion_count?: number
  relegation_count?: number
  playoff_format?: 'none' | 'top4_semis' | 'top8_quarters'
  color?: string
}

export interface Group extends BaseEntity {
  competition_id: string
  name: string
  team_ids?: string[]
  order?: number
}

export interface DrawPick { team_id: string; pot: number; group_id: string; at: string }
export interface Draw extends BaseEntity {
  competition_id: string
  status?: 'setup' | 'in_progress' | 'done'
  pots?: { pot: number; team_ids: string[] }[]
  locked?: boolean
  one_team_per_pot_per_group?: boolean
  picks?: DrawPick[]
  applied_to_groups?: boolean
  performed_by?: string
}

export interface Team extends BaseEntity {
  name: string
  short_name: string
  company?: string
  logo_url?: string
  company_logo_url?: string
  primary_color?: string
  secondary_color?: string
  division_id?: string
  captain_player_id?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  status?: 'active' | 'pending' | 'inactive'
}

export interface Player extends BaseEntity {
  first_name: string
  last_name: string
  photo_url?: string
  position: Position
  number?: number
  team_id: string
  birth_date?: string
  status?: 'active' | 'injured' | 'suspended' | 'inactive'
  is_captain?: boolean
  season_ids?: string[]
  email?: string
}

export interface PlayerDocument extends BaseEntity {
  player_id: string
  type: 'id_card' | 'medical_certificate' | 'company_license'
  file_url?: string
  status?: 'missing' | 'pending' | 'valid' | 'refused'
  refusal_reason?: string
  expires_at?: string
  validated_by?: string
  validated_at?: string
}

export interface Venue extends BaseEntity {
  name: string
  address?: string
  pitches?: string[]
  map_url?: string
}

export interface BracketSource { type: 'group_rank' | 'winner' | 'loser' | 'league_rank'; ref: string; rank?: number }
export interface LiveState {
  period: '1H' | 'HT' | '2H' | 'ET' | 'PENS' | 'FT'
  running: boolean
  started_at?: number // timestamp ms du dernier démarrage du chrono
  elapsed_ms: number // temps cumulé avant started_at
  possession?: { home_ms: number; away_ms: number; dead_ms: number; current: 'home' | 'away' | 'dead'; since?: number }
  operator_name?: string
}
export interface SheetState {
  status: 'draft' | 'validated'
  referee_signature?: string
  manager_signature?: string
  validated_at?: string
  validated_by?: string
  notes?: string
}

export interface Match extends BaseEntity {
  season_id: string
  competition_id: string
  group_id?: string
  round?: number
  stage?: MatchStage
  bracket_slot?: string
  home_source?: BracketSource
  away_source?: BracketSource
  date?: string
  venue_id?: string
  pitch?: string
  home_team_id: string
  away_team_id: string
  home_score?: number | null
  away_score?: number | null
  home_ht_score?: number | null
  away_ht_score?: number | null
  extra_time?: boolean
  penalties?: boolean
  home_pens?: number | null
  away_pens?: number | null
  status: MatchStatus
  published?: boolean
  motm_player_id?: string
  motm_vote_open?: boolean
  motm_vote_closes_at?: string
  referee?: string
  assistant_referees?: string[]
  scorer_user_ids?: string[]
  live?: LiveState
  sheet?: SheetState
}

export type EventType =
  | 'goal' | 'assist' | 'own_goal' | 'penalty_goal' | 'penalty_missed' | 'penalty_saved'
  | 'yellow_card' | 'red_card' | 'save' | 'goal_conceded' | 'substitution' | 'goal_disallowed'
  | 'shootout_scored' | 'shootout_missed' | 'shootout_saved'
  | 'shot_on_target' | 'shot_off_target' | 'corner' | 'throw_in' | 'free_kick' | 'foul' | 'offside'

export interface MatchEvent extends BaseEntity {
  match_id: string
  team_id: string
  minute?: number
  period?: Period
  type: EventType
  player_id?: string
  related_player_id?: string
  parent_event_id?: string
  auto?: boolean
  operator?: string
  note?: string
}

export interface MatchTeamStats extends BaseEntity {
  match_id: string
  team_id: string
  period?: 'full' | '1H' | '2H'
  possession?: number
  shots?: number
  shots_on_target?: number
  corners?: number
  fouls?: number
  offsides?: number
  passes?: number
  passes_completed?: number
  yellow_cards?: number
  red_cards?: number
  saves?: number
  source?: 'manual' | 'match_center'
}

export interface Lineup extends BaseEntity {
  match_id: string
  team_id: string
  formation?: string
  starter_ids?: string[]
  substitute_ids?: string[]
  subs_entered_ids?: string[]
  goalkeeper_id?: string
  captain_id?: string
  positions?: { player_id: string; x: number; y: number }[]
}

export interface Media extends BaseEntity {
  title: string
  type: 'photo' | 'video' | 'article'
  url: string
  thumbnail_url?: string
  body?: string
  match_id?: string
  season_id?: string
  team_ids?: string[]
  round?: number
  date?: string
  source?: 'upload' | 'url' | 'google_drive' | 'generated'
  published?: boolean
}

export type AwardCategory =
  | 'player_of_tournament' | 'ballon_or' | 'top_scorer' | 'top_assist' | 'golden_glove'
  | 'best_defender' | 'best_midfielder' | 'best_forward' | 'best_young'
  | 'best_team' | 'best_defense' | 'best_attack'

export interface Award extends BaseEntity {
  season_id: string
  competition_id?: string
  period?: 'season' | 'league_phase' | 'competition'
  category: AwardCategory
  player_id?: string
  team_id?: string
  value?: number
  snapshot?: Record<string, unknown>
  not_awarded?: boolean
  status?: 'generated' | 'verified' | 'published'
  locked?: boolean
  verified_by?: string
  published_at?: string
  poster_url?: string
}

export interface TeamOfRound extends BaseEntity {
  season_id: string
  competition_id?: string
  round: number
  formation?: string
  slots?: { player_id: string; position: Position; rating: number }[]
  status?: 'generated' | 'published'
}

export interface MotmVote extends BaseEntity {
  match_id: string
  player_id: string
  voter_key: string
}

export type XPAction =
  | 'match_played' | 'win' | 'draw' | 'goal' | 'assist' | 'penalty_goal' | 'own_goal' | 'penalty_missed'
  | 'clean_sheet_gk' | 'clean_sheet_def' | 'save' | 'penalty_saved' | 'goal_conceded_gk'
  | 'motm' | 'yellow_card' | 'red_card'

export interface XPRule extends BaseEntity {
  action: XPAction
  label?: string
  points: number
  positions?: Position[]
  active?: boolean
  order?: number
}

export type Tiebreaker = 'points' | 'head_to_head' | 'goal_diff' | 'goals_for' | 'wins' | 'fair_play' | 'fewer_played'

export interface Settings extends BaseEntity {
  league_name?: string
  short_name?: string
  tagline?: string
  organizer?: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  socials?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string; youtube?: string; x?: string }
  points_win?: number
  points_draw?: number
  points_loss?: number
  tiebreakers?: Tiebreaker[]
  starters_count?: number
  match_duration_minutes?: number
  awards_min_matches?: number
  young_max_age?: number
  motm_vote_enabled?: boolean
  motm_vote_weight?: number
}

export interface Page extends BaseEntity {
  slug: string
  title: string
  content?: string
  published?: boolean
}

export interface ActivityLog extends BaseEntity {
  action: string
  entity?: string
  entity_id?: string
  entity_label?: string
  details?: Record<string, unknown>
  author_email?: string
  author_name?: string
}

export interface Invitation extends BaseEntity {
  email: string
  app_role: Exclude<AppRole, 'player'>
  status?: 'pending' | 'accepted' | 'revoked'
  invited_by?: string
  accepted_at?: string
}

export interface User extends BaseEntity {
  email: string
  full_name?: string
  app_role: AppRole
  active?: boolean
  activated_at?: string
  last_login?: string
  player_id?: string
  /** mock local uniquement — n'existe pas dans Base44 (auth gérée par la plateforme) */
  password?: string
}

export interface EntityMap {
  Season: Season
  Competition: Competition
  Division: Division
  Group: Group
  Draw: Draw
  Team: Team
  Player: Player
  PlayerDocument: PlayerDocument
  Venue: Venue
  Match: Match
  MatchEvent: MatchEvent
  MatchTeamStats: MatchTeamStats
  Lineup: Lineup
  Media: Media
  Award: Award
  TeamOfRound: TeamOfRound
  MotmVote: MotmVote
  XPRule: XPRule
  Settings: Settings
  Page: Page
  ActivityLog: ActivityLog
  Invitation: Invitation
  User: User
}
export type EntityName = keyof EntityMap
export const ENTITY_NAMES: EntityName[] = [
  'Season', 'Competition', 'Division', 'Group', 'Draw', 'Team', 'Player', 'PlayerDocument', 'Venue',
  'Match', 'MatchEvent', 'MatchTeamStats', 'Lineup', 'Media', 'Award', 'TeamOfRound', 'MotmVote',
  'XPRule', 'Settings', 'Page', 'ActivityLog', 'Invitation', 'User',
]
