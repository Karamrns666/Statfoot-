# StatFoot — Proposition d'architecture (étape 0, à valider)

> Rien n'est encore codé. Ce document contient : (1) l'analyse des fonctionnalités admin relevées sur cac-foot.ma,
> (2) l'arborescence, (3) les schémas d'entités au format Base44, (4) les règles de calcul, (5) le plan par étapes.

---

## 1. Analyse des fonctionnalités admin (cac-foot.ma) → intégration StatFoot

| # | Fonctionnalité | Page admin StatFoot | Entités utilisées | Décisions / remarques |
|---|---|---|---|---|
| 0 | Sélecteur global Compétition/Saison | barre du haut `AdminLayout` | Season, Competition | Contexte React partagé, persisté dans l'URL (`?season=&competition=`) pour être partageable |
| 1 | Dashboard | `/admin` | toutes | 8 compteurs, 4 actions rapides, graph « buts par équipe » (barres), « participation joueurs » (MJ par joueur, histogramme), matchs récents avec TAB, prochains matchs, **alertes** (documents manquants, feuilles non validées, matchs passés non clôturés) |
| 2 | Compétitions | `/admin/competitions` | Competition | format : championnat / groupes + éliminatoires / élimination directe / autre ; statut brouillon / active / terminée / archivée |
| 3 | Saisons + clôture | `/admin/saisons` | Season, Competition, Division, Award | Clôture = assistant en 3 écrans : vérif (matchs non terminés), aperçu promotions/relégations calculées depuis le classement final, confirmation → crée les compétitions de la saison suivante avec les équipes redistribuées |
| 4 | Séries & Divisions | `/admin/divisions` | **Division** (nouvelle) | niveau 1 = Série A ; nb de montées/descentes ; format des éliminatoires (aucun / demies top 4 / quarts top 8) |
| 5 | Équipes | `/admin/equipes` | Team | nom court 3 lettres auto-proposé, 2 logos, 2 couleurs, série, groupe, effectif (compté), statut |
| 6 | Joueurs + documents | `/admin/joueurs` | Player, **PlayerDocument** (nouvelle) | vue liste / trombinoscope, import photos en masse (association par nom de fichier `NUMERO_NOM.jpg` ou `prenom-nom.jpg`), workflow documents valide / manquant / refusé + motif. Email joueur → accès « Ma carte joueur » |
| 7 | Groupes | `/admin/groupes` | **Group** (nouvelle) | affectation drag & drop, liste « équipes sans groupe », export PDF |
| 8 | Tirage au sort | `/admin/tirage` | **Draw** (nouvelle), Group | 4 pots, tirage animé carte par carte, pots verrouillés dès le 1er tirage, export visuel PNG, recommencer (ré-ouvre), « voir résultats » → écrit `Group.team_ids`. Contrainte optionnelle : 1 équipe max par pot et par groupe |
| 9 | Matchs | `/admin/matchs` | Match, Venue | générateur aller/retour (algorithme du cercle / Berger), **Planifier** (créneaux × terrains, évite qu'une équipe joue 2 fois sur le même créneau), **Automatiser le tableau** (QF → SF → petite finale → finale, alimenté par classements de groupes puis vainqueurs/perdants), publié/brouillon |
| 10 | Feuille de match officielle | `/admin/matchs/:id/feuille` | Match, Lineup, MatchEvent, **MatchTeamStats** (nouvelle) | 6 titulaires max (paramétrable), remplaçants « entré en jeu », gardien, capitaine ; statuts + prolongation + TAB ; actions complètes ; stats collectives ; « Remplir depuis le Match Center » ; signatures canvas arbitre + responsable ; PDF officiel |
| 11 | Match Center | `/admin/match-center/:id` | Match (`live`), MatchEvent, Lineup | mobile-first, gros boutons ; possession au chrono (3 états, n'avance pas chrono arrêté) ; but/arrêt ⇒ tir cadré auto ; annuler dernière action (pile) ; terminer/rouvrir ; stats par mi-temps ; opérateur tracé ; top buteurs/passeurs en direct |
| 12 | Statistiques | `/admin/statistiques` | (calculé) | filtres compétition/saison/série/groupe/équipe/joueur/période ; KPIs ; onglets Matchs/Joueurs/Équipes ; export CSV + PDF |
| 13 | Awards de fin de tournoi | `/admin/trophees` | Award | génération auto → Vérifié → Publié (invisible côté public avant), « Valider et verrouiller », poster PNG par award, rating joueur calculé |
| 14 | Médiathèque | `/admin/medias` | Media | tags équipes + journée (« J1, J2… »), publié ; import Google Drive = collage de liens de partage Drive (convertis en URL d'aperçu) en local, vrai connecteur dans Base44 |
| 15 | Import CSV | `/admin/import` | Team, Player | glisser-déposer, aperçu + validation ligne par ligne avant écriture, modèles CSV téléchargeables |
| 16 | Journal d'activité | `/admin/journal` | **ActivityLog** (nouvelle) | écrit automatiquement par la couche `src/api/` à chaque create/update/delete (diff JSON avant/après) |
| 17 | Administrateurs | `/admin/administrateurs` | User (étendu), **Invitation** (nouvelle) | liste blanche : seuls les emails invités peuvent se connecter ; Google simulé en local (vrai dans Base44) |
| 18 | Règlement éditable | `/admin/reglement` → `/reglement` | **Page** (nouvelle) | éditeur Markdown + aperçu |

### Corrections obligatoires — comment elles sont garanties

| Correction | Mécanisme |
|---|---|
| Une seule source de calcul | `src/lib/stats.ts` = fonctions pures `(données brutes) → résultats`. Admin et public appellent le même hook `useLeagueStats()` qui n'a **aucune** logique propre. Aucune stat n'est stockée en base sauf les awards figés (snapshot). |
| Passes décisives comptées partout | Une passe = `related_player_id` d'un événement `goal` (saisie standard) **ou** un événement `assist` autonome (import/legacy), dédoublonné via `parent_event_id`. Une seule fonction `countAssists()`. Test dédié. |
| Meilleure équipe ≠ équipe à 0 pt | Si la compétition a une finale jouée → vainqueur de la finale ; sinon 1er du classement général ; équipes à 0 MJ exclues ; aucune équipe ⇒ « Non attribué ». |
| Meilleur ATT/MIL/DEF/jeune | filtre poste réel (`Player.position`), âge calculé à la date de début de saison (`young_max_age`, défaut 23 ans), minimum `awards_min_matches` (défaut 3) ; sans candidat ⇒ `not_awarded: true` affiché « Non attribué ». |
| Meilleure défense / attaque | buts encaissés (moins = mieux, puis MJ ↑) / buts marqués (plus = mieux), depuis les matchs terminés. |
| Tests | Vitest + jeu de données fixe `src/lib/__fixtures__/league.ts` (4 équipes, 6 matchs, résultats connus à la main). |

---

## 2. Arborescence

```
statfoot/
├── entities/                    # 1 schéma JSON Base44 par entité (copiables tels quels)
│   ├── Season.json  Competition.json  Division.json  Group.json  Draw.json
│   ├── Team.json  Player.json  PlayerDocument.json  Venue.json
│   ├── Match.json  MatchEvent.json  MatchTeamStats.json  Lineup.json
│   ├── Media.json  Award.json  TeamOfRound.json  MotmVote.json
│   ├── XPRule.json  Settings.json  Page.json  ActivityLog.json  Invitation.json
│   └── User.json                # champs ajoutés à l'entité User native de Base44
├── src/
│   ├── api/                     # ⚠️ SEUL endroit qui touche aux données
│   │   ├── base44Client.ts      # mock qui imite le SDK : base44.entities.X.list/filter/get/create/update/delete/bulkCreate
│   │   ├── localStore.ts        # implémentation localStorage (remplacée par @base44/sdk plus tard)
│   │   ├── auth.ts              # me(), login(), logout() — mock ; base44.auth dans Base44
│   │   ├── integrations.ts      # UploadFile (→ dataURL en local)
│   │   ├── activityLog.ts       # middleware de journalisation
│   │   └── seed/                # données fictives générées au 1er lancement
│   ├── types/entities.ts        # types TS générés à la main depuis entities/*.json
│   ├── lib/
│   │   ├── stats.ts             # classements, forme, XP, gardiens, awards, rating, équipe type
│   │   ├── stats.test.ts
│   │   ├── schedule.ts (+test)  # calendrier aller/retour, planification créneaux, tableau final
│   │   ├── draw.ts (+test)      # tirage au sort
│   │   ├── csv.ts  pdf.ts  share-image.ts  format.ts  permissions.ts  utils.ts
│   │   └── __fixtures__/league.ts
│   ├── hooks/                   # useEntity, useLeagueStats, useSeasonContext, useAuth, useLiveMatch
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── layout/              # PublicLayout, AdminLayout, SeasonSelector, ScoreTicker, Footer, Spotlights
│   │   ├── match/               # MatchCard, ScoreHeader, EventTimeline, PitchLineup, H2H
│   │   ├── standings/  awards/ (TrophyBadge, AwardHeroCard, AwardTop5)  players/  teams/  charts/
│   │   └── share/               # gabarits de visuels Instagram 1080×1350 / 1080×1080
│   ├── pages/
│   │   ├── public/   Home, Matches, MatchDetail, Standings, Teams, TeamDetail, Players, PlayerDetail,
│   │   │             Awards, Stats, Media, History, Rules, TeamOfRound, TvMode, Login, MyPlayerCard
│   │   └── admin/    Dashboard, Seasons, Competitions, Divisions, Teams, Players, Groups, Draw, Matches,
│   │                 MatchSheet, MatchCenter, Stats, Awards, TeamOfRound, Media, Import, XPRules,
│   │                 ActivityLog, Admins, Settings, RulesEditor, Visuals
│   ├── App.tsx  main.tsx  index.css
├── BASE44_MIGRATION.md          # écrit à la fin
├── package.json  vite.config.ts  tsconfig.json  components.json
```

### Routes
**Public** : `/` · `/matchs` · `/matchs/:id` · `/classement` · `/equipes` · `/equipes/:id` · `/joueurs` · `/joueurs/:id` · `/trophees` · `/statistiques` · `/equipe-de-la-journee` · `/media` · `/historique` · `/reglement` · `/tv` (plein écran) · `/ma-carte` (joueur connecté)

**Admin** (`/admin/*`, login) : voir tableau §1. Permissions :

| | Super admin | Admin ligue | Marqueur |
|---|---|---|---|
| Match Center + feuille (matchs assignés) | ✅ | ✅ | ✅ |
| CRUD sportif, médias, trophées, import, stats | ✅ | ✅ | ❌ |
| Paramètres, règles XP, administrateurs, clôture saison, journal | ✅ | lecture journal | ❌ |

---

## 3. Schémas d'entités (format Base44)

Base44 ajoute automatiquement `id`, `created_date`, `updated_date`, `created_by` — ils ne figurent donc pas dans les schémas. Les références sont des `string` suffixées `_id` / `_ids`.

### Season
```json
{ "name": "Season", "type": "object",
  "properties": {
    "name":        { "type": "string", "description": "ex. Saison 2026" },
    "start_date":  { "type": "string", "format": "date" },
    "end_date":    { "type": "string", "format": "date" },
    "is_active":   { "type": "boolean", "default": false },
    "status":      { "type": "string", "enum": ["upcoming", "active", "closed"], "default": "upcoming" },
    "closed_at":   { "type": "string", "format": "date-time" },
    "champion_team_id": { "type": "string" },
    "notes":       { "type": "string" }
  }, "required": ["name", "start_date"] }
```

### Competition
```json
{ "name": "Competition", "type": "object",
  "properties": {
    "name":        { "type": "string", "description": "ex. Gold Cup" },
    "short_name":  { "type": "string" },
    "season_id":   { "type": "string" },
    "division_id": { "type": "string" },
    "format":      { "type": "string", "enum": ["league", "group_stage", "cup", "other"], "description": "championnat / groupes + éliminatoires / élimination directe / autre" },
    "legs":        { "type": "string", "enum": ["single", "double"], "default": "double" },
    "logo_url":    { "type": "string" },
    "color":       { "type": "string", "description": "accent néon hex" },
    "description": { "type": "string" },
    "start_date":  { "type": "string", "format": "date" },
    "end_date":    { "type": "string", "format": "date" },
    "location":    { "type": "string" },
    "team_count":  { "type": "integer" },
    "team_ids":    { "type": "array", "items": { "type": "string" } },
    "qualified_per_group": { "type": "integer", "default": 2 },
    "knockout_rounds": { "type": "array", "items": { "type": "string", "enum": ["round_of_16", "quarter", "semi", "third_place", "final"] } },
    "tiebreakers": { "type": "array", "items": { "type": "string" }, "description": "surcharge de Settings.tiebreakers (optionnel)" },
    "status":      { "type": "string", "enum": ["draft", "active", "finished", "archived"], "default": "draft" },
    "order":       { "type": "integer", "default": 0 }
  }, "required": ["name", "season_id", "format"] }
```

### Division *(nouvelle — Séries)*
```json
{ "name": "Division", "type": "object",
  "properties": {
    "name":  { "type": "string", "description": "Série A" },
    "level": { "type": "integer", "description": "1 = plus haut niveau" },
    "promotion_count":  { "type": "integer", "default": 2 },
    "relegation_count": { "type": "integer", "default": 2 },
    "playoff_format":   { "type": "string", "enum": ["none", "top4_semis", "top8_quarters"], "default": "none" },
    "color": { "type": "string" }
  }, "required": ["name", "level"] }
```

### Group *(nouvelle)*
```json
{ "name": "Group", "type": "object",
  "properties": {
    "competition_id": { "type": "string" },
    "name":     { "type": "string", "description": "Groupe A" },
    "team_ids": { "type": "array", "items": { "type": "string" } },
    "order":    { "type": "integer" }
  }, "required": ["competition_id", "name"] }
```

### Draw *(nouvelle — tirage au sort)*
```json
{ "name": "Draw", "type": "object",
  "properties": {
    "competition_id": { "type": "string" },
    "status": { "type": "string", "enum": ["setup", "in_progress", "done"], "default": "setup" },
    "pots":   { "type": "array", "items": { "type": "object", "properties": {
                  "pot": { "type": "integer" }, "team_ids": { "type": "array", "items": { "type": "string" } } } } },
    "locked": { "type": "boolean", "default": false },
    "one_team_per_pot_per_group": { "type": "boolean", "default": true },
    "picks":  { "type": "array", "items": { "type": "object", "properties": {
                  "team_id": { "type": "string" }, "pot": { "type": "integer" }, "group_id": { "type": "string" }, "at": { "type": "string" } } } },
    "applied_to_groups": { "type": "boolean", "default": false },
    "performed_by": { "type": "string" }
  }, "required": ["competition_id"] }
```

### Team
```json
{ "name": "Team", "type": "object",
  "properties": {
    "name":             { "type": "string" },
    "short_name":       { "type": "string", "maxLength": 3 },
    "company":          { "type": "string" },
    "logo_url":         { "type": "string" },
    "company_logo_url": { "type": "string" },
    "primary_color":    { "type": "string" },
    "secondary_color":  { "type": "string" },
    "division_id":      { "type": "string", "description": "série actuelle" },
    "captain_player_id":{ "type": "string" },
    "contact_name":     { "type": "string" },
    "contact_email":    { "type": "string" },
    "contact_phone":    { "type": "string" },
    "status":           { "type": "string", "enum": ["active", "pending", "inactive"], "default": "active" }
  }, "required": ["name", "short_name"] }
```
> **Choix** : l'appartenance d'une équipe à une compétition / un groupe est portée par `Competition.team_ids` et `Group.team_ids` (et non par `Team`), car une équipe change de compétition d'une saison à l'autre (promotions). Les filtres « par groupe / compétition » restent simples.

### Player
```json
{ "name": "Player", "type": "object",
  "properties": {
    "first_name": { "type": "string" },
    "last_name":  { "type": "string" },
    "photo_url":  { "type": "string" },
    "position":   { "type": "string", "enum": ["GK", "DEF", "MID", "FWD"], "description": "GB / DEF / MIL / ATT" },
    "number":     { "type": "integer" },
    "team_id":    { "type": "string" },
    "birth_date": { "type": "string", "format": "date" },
    "status":     { "type": "string", "enum": ["active", "injured", "suspended", "inactive"], "default": "active" },
    "is_captain": { "type": "boolean", "default": false },
    "season_ids": { "type": "array", "items": { "type": "string" }, "description": "saisons jouées → badge Recrue si 1 seule" },
    "email":      { "type": "string", "description": "compte joueur (accès à sa carte)" }
  }, "required": ["first_name", "last_name", "position", "team_id"] }
```

### PlayerDocument *(nouvelle)*
```json
{ "name": "PlayerDocument", "type": "object",
  "properties": {
    "player_id": { "type": "string" },
    "type":      { "type": "string", "enum": ["id_card", "medical_certificate", "company_license"] },
    "file_url":  { "type": "string" },
    "status":    { "type": "string", "enum": ["missing", "pending", "valid", "refused"], "default": "missing" },
    "refusal_reason": { "type": "string" },
    "expires_at":     { "type": "string", "format": "date" },
    "validated_by":   { "type": "string" },
    "validated_at":   { "type": "string", "format": "date-time" }
  }, "required": ["player_id", "type"] }
```

### Venue *(nouvelle — terrains, pour « Planifier »)*
```json
{ "name": "Venue", "type": "object",
  "properties": {
    "name":    { "type": "string" },
    "address": { "type": "string" },
    "pitches": { "type": "array", "items": { "type": "string" }, "description": "Terrain 1, Terrain 2…" },
    "map_url": { "type": "string" }
  }, "required": ["name"] }
```

### Match
```json
{ "name": "Match", "type": "object",
  "properties": {
    "season_id":      { "type": "string" },
    "competition_id": { "type": "string" },
    "group_id":       { "type": "string" },
    "round":          { "type": "integer", "description": "journée" },
    "stage":          { "type": "string", "enum": ["league", "group", "round_of_16", "quarter", "semi", "third_place", "final"], "default": "league" },
    "bracket_slot":   { "type": "string", "description": "QF1, SF2, F…" },
    "home_source":    { "type": "object", "description": "{type:'group_rank'|'winner'|'loser', ref, rank} pour l'automatisation du tableau" },
    "away_source":    { "type": "object" },
    "date":           { "type": "string", "format": "date-time" },
    "venue_id":       { "type": "string" },
    "pitch":          { "type": "string" },
    "home_team_id":   { "type": "string" },
    "away_team_id":   { "type": "string" },
    "home_score":     { "type": "integer" },
    "away_score":     { "type": "integer" },
    "home_ht_score":  { "type": "integer" },
    "away_ht_score":  { "type": "integer" },
    "extra_time":     { "type": "boolean", "default": false },
    "penalties":      { "type": "boolean", "default": false },
    "home_pens":      { "type": "integer" },
    "away_pens":      { "type": "integer" },
    "status":         { "type": "string", "enum": ["scheduled", "live", "finished", "postponed", "cancelled"], "default": "scheduled" },
    "published":      { "type": "boolean", "default": true },
    "motm_player_id": { "type": "string", "description": "homme du match officiel" },
    "motm_vote_open": { "type": "boolean", "default": false },
    "motm_vote_closes_at": { "type": "string", "format": "date-time" },
    "referee":        { "type": "string" },
    "assistant_referees": { "type": "array", "items": { "type": "string" } },
    "scorer_user_ids":{ "type": "array", "items": { "type": "string" }, "description": "marqueurs assignés" },
    "live":           { "type": "object", "description": "{period:'1H'|'HT'|'2H'|'ET'|'PENS'|'FT', running, started_at, elapsed_ms, possession:{home_ms,away_ms,dead_ms,current}, operator_name}" },
    "sheet":          { "type": "object", "description": "{status:'draft'|'validated', referee_signature, manager_signature, validated_at, validated_by, notes}" }
  }, "required": ["season_id", "competition_id", "home_team_id", "away_team_id"] }
```

### MatchEvent
```json
{ "name": "MatchEvent", "type": "object",
  "properties": {
    "match_id":  { "type": "string" },
    "team_id":   { "type": "string" },
    "minute":    { "type": "integer" },
    "period":    { "type": "string", "enum": ["1H", "2H", "ET", "PENS"] },
    "type":      { "type": "string", "enum": [
      "goal", "assist", "own_goal", "penalty_goal", "penalty_missed", "penalty_saved",
      "yellow_card", "red_card", "save", "goal_conceded", "substitution", "goal_disallowed",
      "shootout_scored", "shootout_missed", "shootout_saved",
      "shot_on_target", "shot_off_target", "corner", "throw_in", "free_kick", "foul", "offside" ] },
    "player_id":         { "type": "string" },
    "related_player_id": { "type": "string", "description": "passeur (but) / joueur sortant (remplacement) / tireur (arrêt)" },
    "parent_event_id":   { "type": "string", "description": "lie un événement dérivé à son origine (passe → but, tir cadré auto → but)" },
    "auto":      { "type": "boolean", "default": false, "description": "créé automatiquement (tir cadré auto)" },
    "operator":  { "type": "string" },
    "note":      { "type": "string" }
  }, "required": ["match_id", "type", "team_id"] }
```

### MatchTeamStats *(nouvelle — stats collectives de la feuille de match)*
```json
{ "name": "MatchTeamStats", "type": "object",
  "properties": {
    "match_id": { "type": "string" },
    "team_id":  { "type": "string" },
    "period":   { "type": "string", "enum": ["full", "1H", "2H"], "default": "full" },
    "possession": { "type": "number" }, "shots": { "type": "integer" }, "shots_on_target": { "type": "integer" },
    "corners": { "type": "integer" }, "fouls": { "type": "integer" }, "offsides": { "type": "integer" },
    "passes": { "type": "integer" }, "passes_completed": { "type": "integer" },
    "yellow_cards": { "type": "integer" }, "red_cards": { "type": "integer" }, "saves": { "type": "integer" },
    "source": { "type": "string", "enum": ["manual", "match_center"], "default": "manual" }
  }, "required": ["match_id", "team_id"] }
```

### Lineup
```json
{ "name": "Lineup", "type": "object",
  "properties": {
    "match_id":  { "type": "string" },
    "team_id":   { "type": "string" },
    "formation": { "type": "string", "description": "ex. 2-2-1 (hors gardien)" },
    "starter_ids":    { "type": "array", "items": { "type": "string" } },
    "substitute_ids": { "type": "array", "items": { "type": "string" } },
    "subs_entered_ids": { "type": "array", "items": { "type": "string" }, "description": "remplaçants entrés en jeu (comptent comme MJ)" },
    "goalkeeper_id": { "type": "string" },
    "captain_id":    { "type": "string" },
    "positions": { "type": "array", "items": { "type": "object", "properties": {
                   "player_id": { "type": "string" }, "x": { "type": "number" }, "y": { "type": "number" } } } }
  }, "required": ["match_id", "team_id"] }
```

### Media
```json
{ "name": "Media", "type": "object",
  "properties": {
    "title": { "type": "string" },
    "type":  { "type": "string", "enum": ["photo", "video", "article"] },
    "url":   { "type": "string" },
    "thumbnail_url": { "type": "string" },
    "body":  { "type": "string", "description": "contenu article (markdown)" },
    "match_id":  { "type": "string" },
    "season_id": { "type": "string" },
    "team_ids":  { "type": "array", "items": { "type": "string" } },
    "round":     { "type": "integer", "description": "tag journée (J1, J2…)" },
    "date":      { "type": "string", "format": "date" },
    "source":    { "type": "string", "enum": ["upload", "url", "google_drive", "generated"], "default": "url" },
    "published": { "type": "boolean", "default": true }
  }, "required": ["title", "type", "url"] }
```

### Award
```json
{ "name": "Award", "type": "object",
  "properties": {
    "season_id":      { "type": "string" },
    "competition_id": { "type": "string", "description": "vide = toute la saison" },
    "period":   { "type": "string", "enum": ["season", "league_phase", "competition"] },
    "category": { "type": "string", "enum": [
      "player_of_tournament", "ballon_or", "top_scorer", "top_assist", "golden_glove",
      "best_defender", "best_midfielder", "best_forward", "best_young",
      "best_team", "best_defense", "best_attack" ] },
    "player_id": { "type": "string" },
    "team_id":   { "type": "string" },
    "value":     { "type": "number", "description": "XP, buts, rating… selon catégorie" },
    "snapshot":  { "type": "object", "description": "stats figées au moment de la validation" },
    "not_awarded": { "type": "boolean", "default": false },
    "status":    { "type": "string", "enum": ["generated", "verified", "published"], "default": "generated" },
    "locked":    { "type": "boolean", "default": false },
    "verified_by":  { "type": "string" },
    "published_at": { "type": "string", "format": "date-time" },
    "poster_url":   { "type": "string" }
  }, "required": ["season_id", "category"] }
```
> La **course aux trophées** publique est calculée en direct ; l'entité Award ne sert qu'au **palmarès** officiel (fin de saison, validé/verrouillé).

### TeamOfRound *(nouvelle — équipe type de la journée)*
```json
{ "name": "TeamOfRound", "type": "object",
  "properties": {
    "season_id": { "type": "string" }, "competition_id": { "type": "string" },
    "round": { "type": "integer" }, "formation": { "type": "string" },
    "slots": { "type": "array", "items": { "type": "object", "properties": {
               "player_id": { "type": "string" }, "position": { "type": "string" }, "rating": { "type": "number" } } } },
    "status": { "type": "string", "enum": ["generated", "published"], "default": "generated" }
  }, "required": ["season_id", "round"] }
```

### MotmVote *(nouvelle — vote du public)*
```json
{ "name": "MotmVote", "type": "object",
  "properties": {
    "match_id":  { "type": "string" },
    "player_id": { "type": "string" },
    "voter_key": { "type": "string", "description": "empreinte anonyme (1 vote / appareil / match)" }
  }, "required": ["match_id", "player_id", "voter_key"] }
```

### XPRule
```json
{ "name": "XPRule", "type": "object",
  "properties": {
    "action": { "type": "string", "enum": [
      "match_played", "win", "draw", "goal", "assist", "penalty_goal", "own_goal", "penalty_missed",
      "clean_sheet_gk", "clean_sheet_def", "save", "penalty_saved", "goal_conceded_gk",
      "motm", "yellow_card", "red_card" ] },
    "label":  { "type": "string" },
    "points": { "type": "number" },
    "positions": { "type": "array", "items": { "type": "string", "enum": ["GK", "DEF", "MID", "FWD"] }, "description": "vide = tous" },
    "active": { "type": "boolean", "default": true },
    "order":  { "type": "integer" }
  }, "required": ["action", "points"] }
```
Valeurs par défaut proposées : MJ +2 · victoire +3 · nul +1 · but +10 · passe +6 · penalty marqué +8 · CSC −3 · penalty raté −3 · clean sheet GB +8 · clean sheet DEF +4 · arrêt +1 · penalty arrêté +6 · but encaissé GB −1 · homme du match +8 · jaune −2 · rouge −5.

### Settings *(singleton)*
```json
{ "name": "Settings", "type": "object",
  "properties": {
    "league_name": { "type": "string" }, "short_name": { "type": "string" }, "tagline": { "type": "string" },
    "organizer": { "type": "string" }, "logo_url": { "type": "string" },
    "contact_email": { "type": "string" }, "contact_phone": { "type": "string" }, "address": { "type": "string" },
    "socials": { "type": "object", "description": "{instagram, facebook, linkedin, tiktok, youtube, x}" },
    "points_win": { "type": "integer", "default": 3 },
    "points_draw": { "type": "integer", "default": 1 },
    "points_loss": { "type": "integer", "default": 0 },
    "tiebreakers": { "type": "array", "items": { "type": "string", "enum": ["points", "head_to_head", "goal_diff", "goals_for", "wins", "fair_play", "fewer_played"] },
                     "default": ["points", "goal_diff", "goals_for", "head_to_head", "fair_play"] },
    "starters_count": { "type": "integer", "default": 6 },
    "match_duration_minutes": { "type": "integer", "default": 40 },
    "awards_min_matches": { "type": "integer", "default": 3 },
    "young_max_age": { "type": "integer", "default": 23 },
    "motm_vote_enabled": { "type": "boolean", "default": true },
    "motm_vote_weight": { "type": "number", "default": 0, "description": "0 = vote purement consultatif" }
  } }
```

### Page *(nouvelle — Règlement et pages éditables)*
```json
{ "name": "Page", "type": "object",
  "properties": {
    "slug": { "type": "string" }, "title": { "type": "string" },
    "content": { "type": "string", "description": "markdown" },
    "published": { "type": "boolean", "default": true }
  }, "required": ["slug", "title"] }
```

### ActivityLog *(nouvelle)*
```json
{ "name": "ActivityLog", "type": "object",
  "properties": {
    "action": { "type": "string", "description": "create | update | delete | login | close_season | publish_award | ..." },
    "entity": { "type": "string" }, "entity_id": { "type": "string" }, "entity_label": { "type": "string" },
    "details": { "type": "object", "description": "diff avant/après" },
    "author_email": { "type": "string" }, "author_name": { "type": "string" }
  }, "required": ["action"] }
```

### Invitation *(nouvelle)* + User *(entité native Base44, champs ajoutés)*
```json
{ "name": "Invitation", "type": "object",
  "properties": {
    "email": { "type": "string" },
    "app_role": { "type": "string", "enum": ["super_admin", "league_admin", "scorer"] },
    "status": { "type": "string", "enum": ["pending", "accepted", "revoked"], "default": "pending" },
    "invited_by": { "type": "string" }, "accepted_at": { "type": "string", "format": "date-time" }
  }, "required": ["email", "app_role"] }
```
```json
{ "name": "User", "type": "object",
  "properties": {
    "app_role": { "type": "string", "enum": ["super_admin", "league_admin", "scorer", "player"] },
    "active": { "type": "boolean", "default": true },
    "activated_at": { "type": "string", "format": "date-time" },
    "last_login": { "type": "string", "format": "date-time" },
    "player_id": { "type": "string", "description": "pour les comptes joueurs" }
  } }
```

---

## 4. Règles de calcul (`src/lib/stats.ts`)

- **Matchs pris en compte** : `status = finished` uniquement (et `published`).
- **Classement** : V/N/D/BP/BC/DIFF/PTS depuis les scores ; départage selon `tiebreakers` ; `head_to_head` = mini-classement entre équipes à égalité ; `fair_play` = jaune 1, rouge 3.
- **Forme** : 5 derniers matchs terminés, du plus ancien au plus récent (V vert, N gris, D rouge).
- **MJ joueur** : présent dans `Lineup.starter_ids` ou `subs_entered_ids` ; si aucune compo saisie pour ce match → joueur ayant au moins un événement.
- **Buts** : `goal` + `penalty_goal` (pas les CSC, ni les TAB). **Passes** : voir §1.
- **Gardien** : gardien du match = `Lineup.goalkeeper_id` (sinon 1er GB de l'effectif présent) ; buts encaissés = score adverse ; clean sheet = 0 encaissé ; arrêts = `save` + `penalty_saved`.
- **XP** = Σ (compteur × points des XPRule actives applicables au poste).
- **Rang ▲▼** : rang XP actuel vs rang calculé sans la dernière journée jouée.
- **Courses** : Ballon d'or (champ, XP) · Gant d'or (GB, XP) · Soulier d'or (buts ↓, passes ↓, MJ ↑) · Passeur (passes ↓, buts ↓, MJ ↑) · Meilleure équipe (classement général / champion).
- **Rating match /10** : base 6.0 + but 1.0, passe 0.7, arrêt 0.15, clean sheet (GB 1.0 / DEF 0.5), victoire 0.3, défaite −0.2, jaune −0.3, rouge −1.5, CSC −0.8, HdM +0.5 ; borné [3, 10]. Sert au Player of the Tournament et à l'équipe type de la journée.

---

## 5. Plan de construction

1. **Couche data + seed** — schémas, types, client mock Base44, seed (2 saisons dont 1 passée, Gold Cup + Silver Cup, 12 équipes fictives, ~130 joueurs, matchs + événements réalistes, logos/avatars SVG générés).
2. **Calculs** — `stats.ts`, `schedule.ts`, `draw.ts` + tests Vitest (nécessaires aux pages publiques, donc avant elles).
3. **Pages publiques** + design « stade de nuit ».
4. **Admin** — auth/rôles, CRUD, feuille de match, Match Center, tirage, trophées, journal…
5. **Nouvelles fonctionnalités** — visuels Instagram (html-to-image), équipe type, vote HdM, PDF (jsPDF), mode TV.
6. **BASE44_MIGRATION.md**.

À chaque étape : `npm run dev` + vérification de chaque page avec Playwright (captures d'écran, console sans erreur).

Librairies supplémentaires : vitest, papaparse (CSV), jspdf + jspdf-autotable (PDF), html-to-image (visuels), react-markdown, date-fns, @dnd-kit (groupes/compos).
