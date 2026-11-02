# MBL × Match Center — Schémas d'entités v2 (à valider)

Base44 ajoute automatiquement `id`, `created_date`, `updated_date`, `created_by`.
Références = `*_id` (string). ⏸ = dépend de tes réponses sur la formule XP.

## Season
```json
{ "name": "Season", "type": "object", "properties": {
  "name": { "type": "string" }, "start_date": { "type": "string", "format": "date" }, "end_date": { "type": "string", "format": "date" },
  "status": { "type": "string", "enum": ["upcoming", "active", "closed"] }, "is_active": { "type": "boolean" },
  "league_phase_rounds": { "type": "integer", "default": 5 }, "cup_rounds": { "type": "integer", "default": 5 },
  "gold_size": { "type": "integer", "default": 10 }, "closed_at": { "type": "string", "format": "date-time" }
}, "required": ["name", "start_date"] }
```

## Competition
```json
{ "name": "Competition", "type": "object", "properties": {
  "season_id": { "type": "string" }, "name": { "type": "string", "description": "Phase de ligue / Gold Cup / Silver Cup / Phase finale" },
  "phase": { "type": "string", "enum": ["league_phase", "gold", "silver", "knockout", "groups", "other"] },
  "format": { "type": "string", "enum": ["swiss", "league", "groups_knockout", "knockout", "other"] },
  "status": { "type": "string", "enum": ["draft", "active", "finished", "archived"] },
  "team_ids": { "type": "array", "items": { "type": "string" } },
  "rounds": { "type": "array", "items": { "type": "integer" }, "description": "ex. [1..5] ligue, [6..10] cups" },
  "default_pitch": { "type": "string", "description": "Terrain 1 = Gold, Terrain 2 = Silver" },
  "importance": { "type": "number", "description": "⏸ coefficient d'importance (clean sheet × importance)" },
  "half_duration_min": { "type": "integer", "default": 15 },
  "extra_time": { "type": "object", "description": "{ enabled, period_min }" },
  "foul_alert_threshold": { "type": "integer", "default": 5 },
  "logo_url": { "type": "string" }, "description": { "type": "string" }, "color": { "type": "string" }, "order": { "type": "integer" }
}, "required": ["season_id", "name", "phase"] }
```

## Team
```json
{ "name": "Team", "type": "object", "properties": {
  "name": { "type": "string" }, "short_name": { "type": "string", "maxLength": 3 }, "company": { "type": "string" },
  "logo_url": { "type": "string" }, "company_logo_url": { "type": "string" },
  "primary_color": { "type": "string" }, "secondary_color": { "type": "string" },
  "division_id": { "type": "string" }, "group_id": { "type": "string" }, "captain_player_id": { "type": "string" },
  "contact_name": { "type": "string" }, "contact_email": { "type": "string" }, "contact_phone": { "type": "string" },
  "status": { "type": "string", "enum": ["active", "pending", "inactive"] }
}, "required": ["name", "short_name"] }
```

## Player
```json
{ "name": "Player", "type": "object", "properties": {
  "first_name": { "type": "string" }, "last_name": { "type": "string" }, "photo_url": { "type": "string" },
  "position": { "type": "string", "enum": ["GK", "DEF", "MID", "FWD"] }, "number": { "type": "integer" },
  "team_id": { "type": "string" }, "birth_date": { "type": "string", "format": "date" },
  "status": { "type": "string", "enum": ["active", "injured", "inactive"] }, "is_captain": { "type": "boolean" },
  "season_ids": { "type": "array", "items": { "type": "string" }, "description": "1 seule → badge « Recrue · 1re saison »" },
  "email": { "type": "string", "description": "compte joueur" },
  "documents": { "type": "object", "description": "{ id_card|medical|license: { status: valid|missing|refused|pending, file_url, reason, validated_by } }" }
}, "required": ["first_name", "last_name", "position", "team_id"] }
```

## Match
```json
{ "name": "Match", "type": "object", "properties": {
  "season_id": { "type": "string" }, "competition_id": { "type": "string" }, "round": { "type": "integer" },
  "stage": { "type": "string", "enum": ["league_phase", "cup", "group", "round_of_16", "quarter", "semi", "third_place", "final"] },
  "bracket_slot": { "type": "string" }, "home_source": { "type": "object" }, "away_source": { "type": "object" },
  "date": { "type": "string", "format": "date-time" }, "pitch": { "type": "string" }, "venue_id": { "type": "string" },
  "home_team_id": { "type": "string" }, "away_team_id": { "type": "string" },
  "home_score": { "type": "integer" }, "away_score": { "type": "integer" }, "home_ht_score": { "type": "integer" }, "away_ht_score": { "type": "integer" },
  "extra_time": { "type": "boolean" }, "penalties": { "type": "boolean" }, "home_pens": { "type": "integer" }, "away_pens": { "type": "integer" },
  "status": { "type": "string", "enum": ["scheduled", "live", "finished", "postponed", "cancelled"] },
  "published": { "type": "boolean" }, "validated": { "type": "boolean", "description": "clôturé → XP officiel" },
  "validated_at": { "type": "string" }, "validated_by": { "type": "string" },
  "opponent_rank_snapshot": { "type": "object", "description": "⏸ { home_rank, away_rank } figé à la clôture pour le multiplicateur" },
  "motm_player_id": { "type": "string" }, "motm_vote_closes_at": { "type": "string" },
  "referee": { "type": "string" }, "assistant_referees": { "type": "array", "items": { "type": "string" } },
  "operator_user_id": { "type": "string", "description": "opérateur attribué" },
  "source": { "type": "string", "enum": ["match_center", "quick_entry", "manual"] },
  "sheet": { "type": "object", "description": "{ filled_at, filled_by, actions_count, referee_signature, manager_signature, signed_at, status }" }
}, "required": ["season_id", "competition_id", "home_team_id", "away_team_id"] }
```

## MatchEvent
```json
{ "name": "MatchEvent", "type": "object", "properties": {
  "match_id": { "type": "string" }, "team_id": { "type": "string" },
  "type": { "type": "string", "enum": ["goal", "own_goal", "penalty_missed", "goal_disallowed", "shot_on_target", "shot_off_target",
    "save", "penalty_saved", "corner", "throw_in", "free_kick", "foul", "offside", "yellow_card", "second_yellow", "red_card",
    "substitution", "gk_change", "shootout_scored", "shootout_saved", "shootout_missed"] },
  "goal_kind": { "type": "string", "enum": ["normal", "header", "penalty", "direct_free_kick"] },
  "player_id": { "type": "string" }, "player_name_free": { "type": "string", "description": "« Autre joueur » hors compo / joueur inconnu" },
  "related_player_id": { "type": "string", "description": "passeur / joueur sortant / gardien adverse (TAB)" },
  "period": { "type": "string", "enum": ["1H", "2H", "ET1", "ET2", "PENS"] },
  "minute": { "type": "integer" }, "added_minute": { "type": "integer", "description": "15+2' → minute 15, added 2" },
  "clock_ms": { "type": "integer" }, "auto": { "type": "boolean", "description": "tir cadré automatique" },
  "parent_event_id": { "type": "string" }, "shootout_order": { "type": "integer" },
  "client_id": { "type": "string", "description": "idempotence de la file hors ligne" }, "client_ts": { "type": "string" },
  "operator": { "type": "string" },
  "revisions": { "type": "array", "items": { "type": "object" }, "description": "historique des corrections { at, by, before }" }
}, "required": ["match_id", "team_id", "type"] }
```

## Lineup
```json
{ "name": "Lineup", "type": "object", "properties": {
  "match_id": { "type": "string" }, "team_id": { "type": "string" },
  "present_ids": { "type": "array", "items": { "type": "string" } },
  "starter_ids": { "type": "array", "items": { "type": "string" }, "description": "6 max" },
  "substitute_ids": { "type": "array", "items": { "type": "string" } },
  "goalkeeper_id": { "type": "string" }, "captain_id": { "type": "string" },
  "numbers": { "type": "object", "description": "{ player_id: numéro du jour }" },
  "validated": { "type": "boolean" }, "validated_by": { "type": "string" }, "validated_at": { "type": "string" },
  "waivers": { "type": "array", "items": { "type": "object" }, "description": "dérogations Super Admin { player_id, reason: suspended|documents, by, at }" }
}, "required": ["match_id", "team_id"] }
```

## LiveState (1 par match, écrit très souvent → séparé de Match)
```json
{ "name": "LiveState", "type": "object", "properties": {
  "match_id": { "type": "string" },
  "period": { "type": "string", "enum": ["pre", "1H", "HT", "2H", "ET_BREAK", "ET1", "ET2", "PENS", "FT"] },
  "running": { "type": "boolean" }, "period_started_at": { "type": "integer" }, "period_elapsed_ms": { "type": "integer" },
  "added_time": { "type": "object", "description": "{ 1H: 2, 2H: 3 }" },
  "possession": { "type": "object", "description": "{ current: home|away|dead, since, by_period: { 1H: {home_ms, away_ms, dead_ms}, ... } }" },
  "lock_user_id": { "type": "string" }, "lock_user_name": { "type": "string" }, "lock_heartbeat_at": { "type": "integer" },
  "version": { "type": "integer", "description": "contrôle de concurrence" }
}, "required": ["match_id"] }
```

## XPRule (barème par saison)
```json
{ "name": "XPRule", "type": "object", "properties": {
  "season_id": { "type": "string" },
  "key": { "type": "string", "enum": ["goal", "assist", "mult_top3", "mult_4_6", "mult_7plus", "win", "loss", "yellow", "double_yellow_total",
    "red_direct", "per_suspension_match", "clean_sheet_gk", "save", "penalty_saved", "shootout_saved", "goal_conceded_gk",
    "player_of_month", "team_of_month", "goal_of_month", "min_matches_awards"] },
  "value": { "type": "number" }
}, "required": ["season_id", "key", "value"] }
```

## Suspension
```json
{ "name": "Suspension", "type": "object", "properties": {
  "season_id": { "type": "string" }, "player_id": { "type": "string" }, "origin_match_id": { "type": "string" },
  "origin_event_id": { "type": "string" }, "date": { "type": "string", "format": "date" },
  "matches": { "type": "integer", "description": "nombre de match(s) de suspension" },
  "served_match_ids": { "type": "array", "items": { "type": "string" } }, "created_by": { "type": "string" }
}, "required": ["season_id", "player_id", "matches"] }
```

## MonthlyAward
```json
{ "name": "MonthlyAward", "type": "object", "properties": {
  "season_id": { "type": "string" }, "month": { "type": "string", "description": "YYYY-MM" },
  "type": { "type": "string", "enum": ["player", "team", "goal"] },
  "player_id": { "type": "string" }, "team_id": { "type": "string" }, "event_id": { "type": "string", "description": "le but du mois" },
  "designated_by": { "type": "string" }
}, "required": ["season_id", "month", "type"] }
```

## Award (fin de saison)
```json
{ "name": "Award", "type": "object", "properties": {
  "season_id": { "type": "string" }, "scope": { "type": "string", "enum": ["season", "league_phase", "gold", "silver"] },
  "category": { "type": "string", "enum": ["ballon_or", "golden_glove", "top_scorer", "top_assist", "best_team", "player_of_tournament",
    "best_defender", "best_midfielder", "best_forward", "best_young", "best_defense", "best_attack"] },
  "player_id": { "type": "string" }, "team_id": { "type": "string" }, "value": { "type": "number" },
  "snapshot": { "type": "object" }, "not_awarded": { "type": "boolean" },
  "status": { "type": "string", "enum": ["generated", "verified", "published"] }, "locked": { "type": "boolean" },
  "poster_url": { "type": "string" }
}, "required": ["season_id", "category"] }
```

## Draw (tirage — chaque ligne = une entrée de l'historique)
```json
{ "name": "Draw", "type": "object", "properties": {
  "season_id": { "type": "string" }, "competition_id": { "type": "string" },
  "type": { "type": "string", "enum": ["swiss_pots", "groups"] },
  "pots": { "type": "array", "items": { "type": "object" }, "description": "[{ pot: 1..5, team_ids: [4 équipes] }]" },
  "fixtures": { "type": "array", "items": { "type": "object" }, "description": "swiss : [{ round, home_team_id, away_team_id, revealed }] (50)" },
  "groups": { "type": "array", "items": { "type": "object" }, "description": "groupes : [{ group_id, team_ids }]" },
  "revealed_count": { "type": "integer" }, "status": { "type": "string", "enum": ["draft", "revealing", "locked", "published"] },
  "performed_by": { "type": "string" }, "seed": { "type": "integer", "description": "graine aléatoire → tirage rejouable/auditable" }
}, "required": ["season_id", "type"] }
```

## Media
```json
{ "name": "Media", "type": "object", "properties": {
  "title": { "type": "string" }, "type": { "type": "string", "enum": ["photo", "video", "article", "generated_visual"] },
  "url": { "type": "string" }, "thumbnail_url": { "type": "string" }, "match_id": { "type": "string" },
  "season_id": { "type": "string" }, "team_ids": { "type": "array", "items": { "type": "string" } }, "round": { "type": "integer" },
  "source": { "type": "string", "enum": ["upload", "url", "google_drive", "generated"] }, "published": { "type": "boolean" }
}, "required": ["title", "type", "url"] }
```

## AuditLog
```json
{ "name": "AuditLog", "type": "object", "properties": {
  "action": { "type": "string" }, "entity": { "type": "string" }, "entity_id": { "type": "string" }, "entity_label": { "type": "string" },
  "details": { "type": "object" }, "author_email": { "type": "string" }, "author_name": { "type": "string" }
}, "required": ["action"] }
```

## AdminUser
```json
{ "name": "AdminUser", "type": "object", "properties": {
  "email": { "type": "string" }, "full_name": { "type": "string" },
  "role": { "type": "string", "enum": ["super_admin", "admin", "operator"] },
  "status": { "type": "string", "enum": ["invited", "active", "disabled"] },
  "invited_by": { "type": "string" }, "activated_at": { "type": "string" }, "last_login": { "type": "string" }
}, "required": ["email", "role"] }
```

## Entités secondaires conservées de la v1
`Division`, `Group`, `Venue`, `MatchTeamStats` (stats collectives de la feuille officielle), `MotmVote`, `Settings` (nom, organisateur, contacts, réseaux, points V/N/D), `Page` (Règlement).
→ **21 entités** au total.
