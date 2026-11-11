// Types TypeScript miroir des schémas /entities/*.json (format Base44).
// Base44 ajoute automatiquement id, created_date, updated_date, created_by.

export interface BaseEntity {
  id: string
  created_date?: string
  updated_date?: string
  created_by?: string
}

/** 6 contre 6 : pas de postes. GK = gardien, FIELD = joueur de champ. Les seuls rôles affichés sont Gardien et Capitaine. */
export type Position = 'GK' | 'FIELD'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
export type MatchStage = 'league_phase' | 'cup' | 'group' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final'
export type Period = '1H' | '2H' | 'ET1' | 'ET2' | 'PENS'
export type CompetitionPhase = 'league_phase' | 'gold' | 'silver' | 'knockout' | 'groups' | 'other'
export type AdminRole = 'super_admin' | 'admin' | 'operator'

export interface Season extends BaseEntity {
  name: string
  start_date: string
  end_date?: string
  status?: 'upcoming' | 'active' | 'closed'
  is_active?: boolean
  league_phase_rounds?: number
  cup_rounds?: number
  gold_size?: number
  closed_at?: string
  /** version du règlement Ardentia applicable (ex. 'v4') */
  rulebook_version?: string
}

export interface Competition extends BaseEntity {
  season_id: string
  name: string
  phase: CompetitionPhase
  format?: 'swiss' | 'league' | 'groups_knockout' | 'knockout' | 'other'
  status?: 'draft' | 'active' | 'finished' | 'archived'
  team_ids?: string[]
  rounds?: number[]
  default_pitch?: string
  half_duration_min?: number
  extra_time?: { enabled: boolean; period_min: number }
  foul_alert_threshold?: number
  logo_url?: string
  description?: string
  color?: string
  order?: number
  /** phase de sélection : places qui mènent aux deux divisions (renseigné lors de la constitution) */
  split?: { gold_to: number; silver_from: number; gold_name?: string; silver_name?: string }
  /** division issue de la phase de sélection */
  parent_id?: string
  /** Art. 17.3 : ordre fixé par tirage au sort par Ardentia (égalité parfaite) */
  draw_order?: string[]
}

export interface Division extends BaseEntity { name: string; level: number; promotion_count?: number; relegation_count?: number; color?: string }
export interface Group extends BaseEntity { competition_id: string; name: string; team_ids?: string[]; order?: number }
export interface Venue extends BaseEntity { name: string; address?: string; pitches?: string[] }

/** Lien validé par l'admin entre une équipe (ou un joueur) et sa version d'une saison précédente */
export interface SeasonLink { previous_id: string; approved_by?: string; approved_at: string }

/** Identité permanente d'un club MBL (nom, logo, historique) — une « équipe de saison » par saison y est rattachée */
export interface Club extends BaseEntity {
  name: string
  logo_url?: string
  history?: string
  /** correction manuelle du nombre de saisons MBL (badge d'ancienneté), journalisée */
  seasons_override?: number
}

export interface Team extends BaseEntity {
  /** saison de cette équipe (une équipe = une saison ; le club fait le lien entre les saisons) */
  season_id?: string
  /** club permanent ; une nouvelle équipe a son propre club tant que le lien n'est pas approuvé */
  club_id?: string
  /** lien approuvé vers l'équipe de la saison précédente */
  link?: SeasonLink
  /** suggestions de lien écartées par l'admin */
  link_dismissed?: string[]
  name: string
  short_name: string
  company?: string
  logo_url?: string
  company_logo_url?: string
  primary_color?: string
  secondary_color?: string
  division_id?: string
  group_id?: string
  captain_player_id?: string
  /** photos collectives et posters (en-tête de la page équipe) */
  media?: TeamMedia[]
  /** image affichée en en-tête */
  cover_media_id?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  status?: 'active' | 'pending' | 'inactive'
}

/** Image d'équipe ; focus = point de recadrage en % (0–100), séparé pour ordinateur et mobile */
export interface TeamMedia { id: string; url: string; kind: 'team_photo' | 'poster'; focus_x?: number; focus_y?: number; focus_x_mobile?: number; focus_y_mobile?: number; width?: number; height?: number; created_at?: string }

export type DocType = 'id_card' | 'medical' | 'license'
export type DocStatus = 'valid' | 'missing' | 'refused' | 'pending'
export interface PlayerDoc { status: DocStatus; file_url?: string; reason?: string; validated_by?: string }

export interface Player extends BaseEntity {
  first_name: string
  last_name: string
  /** photo originale (gardée en secours, utilisée en rond : avatars, équipe type) */
  photo_url?: string
  /** photo détourée (PNG transparent) pour la carte joueur */
  photo_cutout_url?: string
  photo_cutout_status?: 'ok' | 'failed'
  /** photo d'origine du détourage (si la photo change, le détourage est refait) */
  photo_cutout_source?: string
  /** essais de détourage automatique ratés (3 au plus) */
  photo_cutout_tries?: number
  /** photo affichée sur la carte : version détourée (par défaut) ou photo originale (secours choisi dans l'admin) */
  photo_card_mode?: 'cutout' | 'original'
  position: Position
  number?: number
  team_id: string
  birth_date?: string
  status?: 'active' | 'injured' | 'inactive'
  is_captain?: boolean
  season_ids?: string[]
  /** identité permanente du joueur (commune à ses saisons une fois le lien approuvé) */
  person_id?: string
  link?: SeasonLink
  link_dismissed?: string[]
  /** recrue (1re saison dans la ligue) ; à défaut, déduit du nombre de saisons jouées */
  rookie?: boolean
  email?: string
  documents?: Partial<Record<DocType, PlayerDoc>>
}

export interface BracketSource { type: 'rank' | 'winner' | 'loser'; ref: string; rank?: number }
export interface SheetState {
  status?: 'draft' | 'filled' | 'signed'
  filled_at?: string
  filled_by?: string
  actions_count?: number
  referee_signature?: string
  manager_signature?: string
  signed_at?: string
  notes?: string
}

export interface Match extends BaseEntity {
  season_id: string
  competition_id: string
  round?: number
  stage?: MatchStage
  bracket_slot?: string
  home_source?: BracketSource
  away_source?: BracketSource
  date?: string
  pitch?: string
  venue_id?: string
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
  validated?: boolean
  validated_at?: string
  validated_by?: string
  opponent_rank_snapshot?: { home_rank: number | null; away_rank: number | null }
  motm_player_id?: string
  motm_vote_closes_at?: string
  /** forfait (tapis vert, Art. 14) : équipe forfait — score officiel 3-0 pour l'adversaire */
  forfeit_team_id?: string
  /** modèle du visuel homme du match : variante 1 ou 2 */
  visual_mvp_template?: 'mvp' | 'mvp2'
  /** visuels réseaux sociaux générés (cache, version dans l'URL) */
  visuals?: { hash: string; version: number; resultat_url?: string; mvp_url?: string; generated_at: string }
  referee?: string
  assistant_referees?: string[]
  operator_user_id?: string
  half_duration_min?: number
  source?: 'match_center' | 'quick_entry' | 'manual'
  sheet?: SheetState
}

export type EventType =
  | 'goal' | 'own_goal' | 'penalty_missed' | 'goal_disallowed' | 'shot_on_target' | 'shot_off_target'
  | 'save' | 'penalty_saved' | 'corner' | 'throw_in' | 'free_kick' | 'foul'
  | 'yellow_card' | 'second_yellow' | 'red_card' | 'substitution' | 'gk_change'
  | 'shootout_scored' | 'shootout_saved' | 'shootout_missed'
export type GoalKind = 'normal' | 'header' | 'penalty' | 'direct_free_kick'

export interface EventRevision { at: string; by?: string; before: Partial<MatchEvent> }
export interface MatchEvent extends BaseEntity {
  match_id: string
  team_id: string
  type: EventType
  goal_kind?: GoalKind
  player_id?: string
  player_name_free?: string
  related_player_id?: string
  period?: Period
  minute?: number
  added_minute?: number
  clock_ms?: number
  auto?: boolean
  parent_event_id?: string
  shootout_order?: number
  /** carton : joueur sur le terrain, remplaçant (banc) ou officiel d'équipe (Art. 2.5) — nom de l'officiel dans player_name_free */
  card_target?: 'player' | 'substitute' | 'official'
  client_id?: string
  client_ts?: string
  operator?: string
  revisions?: EventRevision[]
}

export interface Lineup extends BaseEntity {
  match_id: string
  team_id: string
  present_ids?: string[]
  starter_ids?: string[]
  substitute_ids?: string[]
  goalkeeper_id?: string
  captain_id?: string
  numbers?: Record<string, number>
  validated?: boolean
  validated_by?: string
  validated_at?: string
  waivers?: { player_id: string; reason: 'suspended' | 'documents'; motif?: string; by: string; at: string }[]
}

export type LivePeriod = 'pre' | '1H' | 'HT' | '2H' | 'ET_BREAK' | 'ET1' | 'ET2' | 'PENS' | 'FT'
export interface PossessionSlice { home_ms: number; away_ms: number; dead_ms: number }
export interface LiveState extends BaseEntity {
  match_id: string
  period: LivePeriod
  running: boolean
  period_started_at?: number | null
  period_elapsed_ms: number
  added_time?: Partial<Record<Period, number>>
  possession?: { current: 'home' | 'away' | 'dead'; since?: number | null; by_period: Partial<Record<Period, PossessionSlice>> }
  lock_user_id?: string
  lock_user_name?: string
  lock_heartbeat_at?: number
  version?: number
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
  passes?: number
  passes_completed?: number
  yellow_cards?: number
  red_cards?: number
  saves?: number
  source?: 'manual' | 'match_center'
}

export type XPKey =
  | 'goal' | 'assist' | 'mult_top3' | 'mult_4_6' | 'mult_7plus' | 'win' | 'loss' | 'yellow' | 'double_yellow_total'
  | 'red_direct' | 'per_suspension_match' | 'clean_sheet_gk' | 'save' | 'penalty_saved' | 'shootout_saved'
  | 'goal_conceded_gk' | 'player_of_month' | 'team_of_month' | 'goal_of_month' | 'min_matches_awards'
  | 'importance_league_phase' | 'importance_gold' | 'importance_silver' | 'importance_knockout'
  | 'motm'
export interface XPRule extends BaseEntity { season_id: string; key: XPKey; value: number }

export interface Suspension extends BaseEntity {
  season_id: string
  player_id: string
  origin_match_id?: string
  origin_event_id?: string
  date?: string
  matches: number
  served_match_ids?: string[]
  created_by?: string
  /** 'extra' = suspension supplémentaire décidée par Ardentia (s'ajoute au match automatique, Art. 11.6) */
  kind?: 'extra'
  team_id?: string
  reason?: string
  referee_report?: string
  /** date de notification de la décision au capitaine */
  notified_at?: string
}

/** Version du règlement officiel Ardentia (texte intégral, rattaché à une saison) */
export interface Rulebook extends BaseEntity {
  version: string
  title: string
  date: string
  season_id?: string
  content: string
  pdf_url?: string
  status: 'current' | 'archived'
  changes?: string
}

export interface MonthlyAward extends BaseEntity {
  season_id: string
  month: string // YYYY-MM
  type: 'player' | 'team' | 'goal'
  player_id?: string
  team_id?: string
  event_id?: string
  designated_by?: string
}

export type AwardCategory =
  | 'ballon_or' | 'golden_glove' | 'top_scorer' | 'top_assist' | 'best_team' | 'player_of_tournament'
  | 'best_defense' | 'best_attack'
export interface Award extends BaseEntity {
  season_id: string
  scope?: 'season' | 'league_phase' | 'gold' | 'silver'
  category: AwardCategory
  player_id?: string
  team_id?: string
  value?: number
  snapshot?: Record<string, unknown>
  not_awarded?: boolean
  status?: 'generated' | 'verified' | 'published'
  locked?: boolean
  poster_url?: string
}

export interface DrawPick { team_id: string; pot: number; group_id: string; at: string }
export interface DrawFixture { round: number; home_team_id: string; away_team_id: string; revealed?: boolean }
export interface Draw extends BaseEntity {
  season_id: string
  competition_id?: string
  type: 'swiss_pots' | 'groups' | 'selection'
  matches_per_team?: number
  pots?: { pot: number; team_ids: string[] }[]
  fixtures?: DrawFixture[]
  groups?: { group_id: string; name?: string; team_ids: string[] }[]
  picks?: DrawPick[]
  one_team_per_pot_per_group?: boolean
  revealed_count?: number
  status?: 'draft' | 'revealing' | 'locked' | 'published'
  performed_by?: string
  seed?: number
}

export interface Media extends BaseEntity {
  title: string
  type: 'photo' | 'video' | 'article' | 'generated_visual'
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

/** Équipe type d'une journée choisie à la main dans l'admin (sinon : sélection automatique) */
export interface TeamOfWeek extends BaseEntity {
  season_id: string
  round: number
  competition_id?: string | null
  slots: { position: Position; player_id: string }[]
  note?: string
  chosen_by?: string
}

export interface MotmVote extends BaseEntity { match_id: string; player_id: string; voter_key: string }

// ---------------------------------------------------------------------------
//  Match des capitaines : mini-tournoi mensuel ORANGE vs BLEUE, SANS AUCUN LIEN avec la ligue.
//  Entités séparées (CaptainTeam / CaptainMatch) : jamais lues par les calculs de la ligue
//  (classements, XP, IPG, stats joueurs, cartons / suspensions, bandeau de saison).
// ---------------------------------------------------------------------------
export type CaptainSide = 'orange' | 'bleue'
export interface CaptainTeam extends BaseEntity {
  side: CaptainSide
  name: string
  logo_url?: string
  color?: string
  /** joueurs inscrits à la ligue choisis pour l'effectif */
  player_ids: string[]
  captain_id?: string
}
/** ligne de feuille de match d'un joueur (même saisie qu'un match normal, 6 contre 6) */
export interface CaptainLine {
  side: CaptainSide
  player_id: string
  played: boolean
  goals: number
  /** buts contre son camp */
  og: number
  assists: number
  yc: number
  rc: number
  saves: number
  gk?: boolean
}
export interface CaptainMatch extends BaseEntity {
  date: string
  pitch?: string
  status: 'scheduled' | 'finished' | 'cancelled'
  lines: CaptainLine[]
  /** tirs au but (si égalité) */
  orange_pens?: number | null
  bleue_pens?: number | null
  motm_player_id?: string
  notes?: string
}

export interface Settings extends BaseEntity {
  league_name?: string
  short_name?: string
  tagline?: string
  /** accroche en arabe (accueil) */
  tagline_ar?: string
  /** noms des compétitions : gold → MASTER, silver → CHALLENGER (modifiable dans l'admin) */
  competition_names?: { gold?: string; silver?: string; league_phase?: string }
  organizer?: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  website?: string
  /** instagram = compte MBL ; organizer_instagram / linkedin = Ardentia */
  socials?: { instagram?: string; organizer_instagram?: string; facebook?: string; linkedin?: string; youtube?: string; tiktok?: string }
  motm_vote_minutes_after?: number
  /** surcharge de la mise en page des visuels réseaux sociaux (JSON partiel, voir src/config/visuals.json) */
  visuals_config?: Record<string, unknown>
}

export interface Page extends BaseEntity { slug: string; title: string; content?: string; published?: boolean }

export interface AuditLog extends BaseEntity {
  action: string
  entity?: string
  entity_id?: string
  entity_label?: string
  details?: Record<string, unknown>
  author_email?: string
  author_name?: string
}

export interface AdminUser extends BaseEntity {
  email: string
  full_name?: string
  role: AdminRole
  status?: 'invited' | 'active' | 'disabled'
  invited_by?: string
  activated_at?: string
  last_login?: string
  /** mock local uniquement — dans Base44 l'authentification est gérée par la plateforme */
  password?: string
}

export interface EntityMap {
  CaptainTeam: CaptainTeam
  CaptainMatch: CaptainMatch
  Season: Season
  Competition: Competition
  Division: Division
  Group: Group
  Venue: Venue
  Team: Team
  Player: Player
  Match: Match
  MatchEvent: MatchEvent
  Lineup: Lineup
  LiveState: LiveState
  MatchTeamStats: MatchTeamStats
  XPRule: XPRule
  Suspension: Suspension
  MonthlyAward: MonthlyAward
  Award: Award
  Draw: Draw
  Media: Media
  MotmVote: MotmVote
  TeamOfWeek: TeamOfWeek
  Settings: Settings
  Page: Page
  AuditLog: AuditLog
  AdminUser: AdminUser
  Rulebook: Rulebook
  Club: Club
}
export type EntityName = keyof EntityMap
export const ENTITY_NAMES: EntityName[] = [
  'Season', 'Competition', 'Division', 'Group', 'Venue', 'Team', 'Player', 'Match', 'MatchEvent', 'Lineup', 'LiveState',
  'MatchTeamStats', 'XPRule', 'Suspension', 'MonthlyAward', 'Award', 'Draw', 'Media', 'MotmVote', 'TeamOfWeek', 'Settings', 'Page', 'AuditLog', 'AdminUser', 'Rulebook', 'Club', 'CaptainTeam', 'CaptainMatch',
]
