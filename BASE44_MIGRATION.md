# Migration vers Base44

L'application locale est structurée pour une migration directe :
- **Données** : chaque fichier `entities/<Nom>.json` est un schéma d'entité Base44 à coller tel quel.
- **Accès aux données** : tout passe par `src/api/`. `src/api/base44Client.ts` imite exactement l'API du SDK
  (`base44.entities.Team.list()`, `.filter({...})`, `.create()`, `.update(id, …)`, `.delete(id)`, `.bulkCreate()`, `base44.auth.me()`,
  `base44.integrations.Core.UploadFile`). Pour migrer du code, remplacez ce fichier par :
  ```ts
  import { createClient } from '@base44/sdk'
  export const base44 = createClient({ appId: 'VOTRE_APP_ID', requiresAuth: false })
  ```
- **Calculs** : copiez `src/lib/` (fonctions pures sans dépendance au stockage) dans l'app Base44, ou demandez à Base44 de recréer
  ces fonctions à partir des prompts ci-dessous. Les tests (`*.test.ts`) servent de référence de résultats attendus.

---

## 1. Entités à créer (23)

| Entité | Rôle | Remarques |
|---|---|---|
| Season | Saisons | `league_phase_rounds`, `cup_rounds`, `gold_size` |
| Competition | Phase de ligue / Gold / Silver / phase finale / groupes | `phase`, `format`, `team_ids`, `half_duration_min`, `foul_alert_threshold` |
| Division | Séries | niveaux, montées/descentes |
| Group | Groupes | `team_ids` |
| Venue | Complexes / terrains | `pitches` |
| Team | Équipes | nom court 3 lettres, 2 logos, 2 couleurs |
| Player | Joueurs | `documents` (CIN, certificat, licence) + `season_ids` (badge recrue) |
| Match | Matchs | `opponent_rank_snapshot`, `validated`, `sheet` (signatures), `operator_user_id` |
| MatchEvent | Toutes les actions | `type`, `goal_kind`, `period`, `minute`, `added_minute`, `auto`, `parent_event_id`, `client_id`, `revisions` |
| Lineup | Compositions | présents, titulaires, gardien, capitaine, numéros, dérogations |
| LiveState | Chrono / possession / verrou | 1 ligne par match, écrite très souvent |
| MatchTeamStats | Stats collectives (feuille) | par période (full / 1H / 2H) |
| XPRule | Barème par saison | clé/valeur |
| Suspension | Matchs de suspension | −XP par match |
| MonthlyAward | Joueur / équipe / but du mois | |
| Award | Trophées de fin de saison | `status` généré → vérifié → publié, `locked` |
| Draw | Tirages (suisse / groupes) | historique = une ligne par tirage |
| Media | Médiathèque | tags équipe / journée |
| MotmVote | Vote du public | 1 vote / appareil / match |
| Settings | Paramètres (1 ligne) | points V/N/D, départage |
| Page | Règlement | markdown |
| AuditLog | Journal d'activité | |
| AdminUser | Administrateurs | **dans Base44 : utiliser l'entité User intégrée** + champs `role`, `status`, `invited_by`, `last_login` |

**Règles d'accès Base44 recommandées** : lecture publique sur Season, Competition, Team, Player (sans `email`/`documents`), Match (si `published`), MatchEvent, Lineup, LiveState, MatchTeamStats, Award (si `status = published`), Media (si `published`), Page, Settings ; création publique sur MotmVote uniquement ; écriture réservée aux rôles admin, et pour l'opérateur : MatchEvent / LiveState / Lineup / Match des matchs qui lui sont attribués.

---

## 2. Prompts par page (à coller dans Base44)

> Préambule à coller une fois au début : *« Application "Morocco Business League" (ligue de football inter-entreprises). Interface en français, mobile-first. Thème sombre : fond bleu nuit #0B1426, cartes bleu foncé #12203B, accent orange #F26B1D, titres en capitales condensées très grasses (Barlow Condensed 900), gros chiffres. Badges de trophées circulaires lumineux : Ballon d'or or, Soulier d'or rouge, Meilleur passeur orange, Gant d'or bleu, Meilleure équipe vert. Les entités existent déjà (voir schémas). Tous les calculs (XP, classements, trophées) doivent passer par UNE seule fonction partagée, utilisée par toutes les pages. »*

### Fonctions partagées (à créer en premier)
> Crée un module de fonctions `leagueStats` : (1) **classement** d'une compétition à partir des matchs terminés (MJ V N D BP BC DIFF PTS, forme 5 derniers V/N/D), points V/N/D et départage lus dans Settings (points, diff, buts marqués, confrontation directe, fair-play jaune=1 rouge=3) ; (2) **XP joueur** recalculé depuis MatchEvent avec le barème XPRule de la saison : but +50 et passe +20 multipliés selon le rang de l'adversaire avant la journée (1–3 ×2, 4–6 ×1,5, 7+ ×1, ×1 si pas encore de classement, rang figé dans Match.opponent_rank_snapshot à la clôture), victoire +50, défaite −50, jaune −20, 2 jaunes −40 au total, rouge direct −50, −50 par match de Suspension, clean sheet gardien +50 × importance de la phase, arrêt +5, penalty arrêté +30, TAB arrêté +20, but encaissé gardien −10, joueur du mois +100, équipe du mois +50 (joueurs ayant joué ce mois), but du mois +50, arrondi à l'entier par ligne ; une passe = `related_player_id` d'un événement `goal` ; un joueur a joué s'il est titulaire ou entré en jeu ; (3) **courses** : Ballon d'or (joueurs de champ, XP, min. de matchs), Gant d'or (gardiens, XP), Soulier d'or (buts, puis passes, puis moins de matchs), Meilleur passeur (passes, puis buts, puis moins de matchs), Meilleure équipe (classement général : Gold 1–10 puis Silver 11–20, jamais une équipe à 0 point) ; (4) **évolution du rang** ▲▼ = rang actuel comparé au rang calculé sans la dernière journée. Ne rien stocker de calculé, sauf le rang adversaire figé à la clôture.

### Accueil
> Page d'accueil : bandeau défilant des derniers scores (pastille rouge « EN DIRECT » + minute pour les matchs en cours), hero avec nom de la ligue, saison, organisateur, boutons Calendrier et Classement, 4 compteurs (équipes, matchs joués, buts, passes). Section « En direct », section « Journée N » (cartes de match : compétition, journée, logos, score, mi-temps, date, terrain), « À venir », classements résumés Gold Cup et Silver Cup (Pos, Équipe, MJ, DIFF, PTS, Forme en pastilles colorées), podium top 3 XP (rang ▲▼), top 5 gardiens (CS, arrêts, XP), carrousel des logos d'équipes, footer contact + réseaux sociaux. Sélecteur de saison global dans l'en-tête (« Toutes saisons » ou une saison).

### Matchs
> Page Matchs : calendrier et résultats groupés par journée (ou par date), filtres journée, compétition, équipe, statut (programmé, en direct, terminé, reporté, annulé) dans l'URL.

### Fiche match (/matchs/:id)
> En-tête : compétition, journée/phase, logos, score géant, score mi-temps, TAB « 3-3 (4-1 tab) », buteurs avec minute (format 15+2', « pen. », « csc »), barre de possession, date/heure/terrain/arbitre, badge EN DIRECT avec minute qui avance si le match est en cours (rafraîchissement temps réel sur MatchEvent, LiveState et Match). Onglets : Résumé (homme du match avec XP du match, vote du public 1 vote par appareil ouvert jusqu'à 15 min après la fin, timeline par mi-temps équipe A à gauche / B à droite avec passeurs), Statistiques (Match / 1re MT / 2e MT : possession, buts, tirs, cadrés, non cadrés, arrêts, corners, touches, coups francs, fautes, hors-jeu, cartons — équipe dominante en valeur, inversé pour fautes et cartons), Compositions (terrain visuel, G / C, badges ⚽ 🅰 🟨 🟥, remplaçants entrés), Avant-match (forme 5 derniers, confrontations directes). Bouton « Visuels Instagram » (1080×1350 : BUT !, score final, homme du match, téléchargeables en PNG).

### Classement
> Onglets Phase de ligue, Gold Cup, Silver Cup, Général. Colonnes Pos, Équipe, MJ, V, N, D, BP, BC, DIFF, PTS, Forme. Zones colorées (phase de ligue : 1–10 qualifié Gold, 11–20 Silver). Mention des critères de départage. Export PDF.

### Équipes / fiche équipe
> Grille des équipes (logo, entreprise, cup, rang). Fiche : en-tête aux couleurs de l'équipe, forme, compteurs (MJ, BP, BC, clean sheets), onglets Effectif (numéro, poste, MJ, buts, passes, XP), Résultats, Statistiques (courbe des points cumulés, barres buts marqués/encaissés par match).

### Joueurs / fiche joueur
> Classement XP filtrable (Toute la saison / Phase de ligue / Gold / Silver, équipe, poste, recherche) : rang avec flèche ▲▼, photo, nom, badge « Recrue · 1re saison » si une seule saison jouée, MJ, buts, passes, XP. Fiche : photo, poste, équipe, rang XP ▲▼, XP, MJ, buts/passes (ou CS/arrêts pour un gardien), graphique XP par match, historique XP détaillé par match (chaque ligne du barème avec multiplicateur), historique par saison.

### Trophées
> Titre « Les Trophées », sous-titre « Classements mis à jour automatiquement après chaque match ». Filtres Toute la saison / Phase de ligue / Gold Cup / Silver Cup. Onglets Course aux trophées / Statistiques / Palmarès. Pour Ballon d'or, Gant d'or, Soulier d'or, Meilleur passeur : grande carte du n°1 (photo, équipe, poste, buts, passes, XP, rang ▲▼, badge recrue ; Gant d'or : MJ, clean sheets, arrêts, buts encaissés) puis top 5. Meilleure équipe : grande carte + top 5 du classement général. « Non attribué » si aucun candidat. Palmarès = Award publiés par saison.

### Statistiques, Équipe type, Média, Historique, Règlement
> Statistiques : KPIs (matchs, buts, moyenne, passes, arrêts, clean sheets, cartons), graphique buts par équipe, meilleures défenses / attaques. Équipe type : sélection de journée, terrain avec 1 GB + 2 DEF + 2 MIL + 1 ATT aux meilleurs XP de la journée. Média : galerie filtrable (type, équipe, journée), lecteur photo/vidéo/article. Historique : podium des saisons clôturées + palmarès. Règlement : page markdown éditable (entité Page slug « reglement »).

### Mode TV (/live/:terrain)
> Plein écran pour écran géant : matchs en cours du terrain (ou du jour), score énorme, minute, buteurs, possession, rotation automatique toutes les 12 s, QR code « Suivez en direct » vers la même page.

### Admin — structure
> Espace /admin protégé (liste blanche, connexion email/mot de passe + Google, comptes créés par un admin). Rôles : Super Admin (tout), Admin (tout sauf paramètres et administrateurs), Opérateur de saisie (Match Center uniquement). Menu latéral, sélecteur global Saison / Compétition en haut. Chaque création/modification/suppression écrit une ligne AuditLog (date, action, élément, détails JSON avant/après, auteur).

### Admin — Tableau de bord
> 8 compteurs (compétitions, équipes, joueurs, matchs, terminés, à venir, buts, cartons), actions rapides, matchs du jour, alertes (matchs passés non clôturés, exclusions sans suspension, documents à traiter, feuilles non signées), graphique buts par équipe, graphique participation des joueurs, matchs récents et prochains.

### Admin — CRUD
> Saisons (avec clôture : génère les Award au statut « Généré »), Compétitions (format, statut brouillon/active/terminée/archivée, durée de mi-temps, seuil de fautes), Séries & Divisions, Équipes (nom court 3 lettres, entreprise, 2 logos, 2 couleurs, série, groupe, statut), Joueurs (liste ou trombinoscope, import de photos en masse par nom de fichier, documents CIN / certificat / licence : valide / à vérifier / manquant / refusé + motif, email du compte joueur), Médiathèque (tags équipe/journée, statut publié, import de liens Google Drive), Administrateurs (invitation, rôle, statut, dernière connexion), Paramètres (ligue, contacts, réseaux, points V/N/D, ordre de départage), Règlement (éditeur markdown + aperçu), Import CSV (équipes, joueurs : modèle téléchargeable, glisser-déposer, aperçu avec contrôle ligne par ligne).

### Admin — Tirage phase de ligue
> 20 équipes en 5 chapeaux de 4 (chapeau 1 = têtes de série issues du classement de la saison précédente, modifiables). Bouton « Générer les 50 affiches » : chaque équipe affronte une équipe de chaque chapeau (y compris le sien), jamais deux fois, domicile/extérieur équilibré, 5 journées de 10 matchs. Compteur « x / 50 affiches révélées », bouton « Voir la cérémonie » plein écran (révélation affiche par affiche, mode auto), « Verrouiller et publier » (crée les 50 matchs), historique des tirages (date, admin, type, résultat). Onglet Groupes : création de groupes, affectation, équipes sans groupe, export PDF, tirage animé par 4 pots (pots verrouillés, 1 équipe par pot et par groupe, export du visuel, recommencer, appliquer aux groupes).

### Admin — Matchs
> Liste filtrable (journée, statut, équipe) : date, rencontre, score, phase, statut, publié/brouillon, boutons Saisie / Live / Feuille / PDF / Modifier / Supprimer. « Créer match » (compétition, journée, phase, équipes, date, terrain, arbitre, opérateur, durée de mi-temps). Après la J5 : « Constituer Gold / Silver » (top 10 → Gold sur Terrain 1, 11–20 → Silver sur Terrain 2, affiches J6–J10 en système suisse par chapeaux de 2). « Automatiser le tableau » (demi-finales / quarts depuis le classement, petite finale, finale ; les vainqueurs — TAB compris — se qualifient automatiquement à la clôture).

### Admin — Saisie rapide (secours)
> Tableau par équipe : A joué, Buts, CSC, Passes, CJ, CR, Arrêts, Pén. arr., TAB arr. + Homme du match + « Terminer le match ». Les compteurs sont convertis en MatchEvent (passes rattachées aux buts), puis clôture identique au Match Center.

### Admin — Règles XP
> Titre « Règles XP — Barème, suspensions et bonus mensuels », sélecteur de saison, boutons « Recalculer toute la saison » (refige le rang des adversaires), « Enregistrer le barème », « Valeurs par défaut ». Barème éditable (tableau des valeurs + multiplicateurs + coefficients d'importance par phase). Section Suspensions : joueurs exclus (nom, date, motif) + champ « nombre de match(s) » + Enregistrer. Section bonus mensuels : choix du mois puis But du mois (liste date · joueur · minute) « Désigner le but du mois », Joueur du mois, Équipe du mois.

### Admin — Match Center (programme)
> Matchs groupés par jour puis par créneau (heure · terrain · phase), filtres Tous / Phase de ligue / Gold / Silver / Phase finale, « Mes matchs » pour l'opérateur. Carte : score, pastille (À venir / minute en direct qui clignote / Pause / Mi-temps / Terminé), barre de possession, opérateur. Panneau top 10 buteurs et passeurs.

### Admin — Match Center (écran live)
> Écran mobile au bord du terrain (2 colonnes sur desktop, onglets Saisie / Statistiques / Résumé / XP sur mobile). Verrou : un seul opérateur en écriture (LiveState.lock_user_id + heartbeat), les autres en lecture seule, « Prendre la main » pour un admin. Bandeau bloquant tant que les 2 compositions ne sont pas validées (présents, 6 titulaires, gardien, capitaine, numéros ; joueurs suspendus ou documents non validés bloqués, dérogation Super Admin tracée). Tableau de score : logos, score géant, chrono, buteurs avec minute et badge « +50 XP », bouton principal Coup d'envoi → Mi-temps → Début 2e MT → Fin du match (prolongation 2 périodes et tirs au but en phase finale), Pause/Reprendre, temps additionnel « +2 ». Possession : 3 gros boutons Ballon A / Ballon mort / Ballon B avec temps cumulés et % (ne compte pas chrono arrêté ; corner/touche/coup franc donnent le ballon à l'équipe, un but met le ballon mort). Pavé par équipe avec compteurs : BUT, tir cadré, non cadré, arrêt (attribué au gardien en jeu), corner, touche, coup franc, faute, hors-jeu, jaune, rouge, + CSC, penalty manqué/arrêté, but refusé, remplacement, changement de gardien. But en 2 étapes (type normal/tête/penalty/coup franc direct/CSC, buteur dans une grille de numéros, passeur ou « Sans passeur », champ « Autre joueur »). But = +1 tir cadré automatique, arrêt = +1 tir cadré adverse, 2e jaune = rouge automatique, rouge → proposition de suspension. Toucher un joueur ouvre un menu rapide. Toast « Annuler » 4,5 s, « Annuler la dernière action », correction d'un événement avec historique, suppression avec double confirmation. Alerte de fautes cumulées par mi-temps. Onglet « XP du match » (gains/pertes par joueur selon le barème, provisoire jusqu'à la clôture). Checklist de clôture (compos validées, score cohérent, cartons attribués, homme du match), puis recalcul automatique ; « Rouvrir le match ». Boutons ≥ 56 px, vibration, Wake Lock, raccourcis clavier (A/B/M possession, espace pause, G/H but), mode haute luminosité, file d'actions hors ligne avec indicateur « ✓ synchronisé / ⏳ N en attente ».

### Admin — Feuille de match officielle
> Bouton « Remplir depuis le Match Center » + bandeau « Remplie automatiquement le … par … · N actions · Score ». Compositions (titulaires, remplaçants entrés, G, C), résultat (score, MT, statut, prolongation, TAB), arbitres, homme du match, buts (passeurs), cartons, remplacements, stats collectives éditables, signatures au doigt arbitre + responsable compétition, « Valider et signer », document imprimable A4 / PDF.

### Admin — Statistiques, Awards, Diffusion
> Statistiques : filtres phase, série, groupe, équipe, joueur, dates ; KPIs ; onglets Matchs / Joueurs / Équipes ; export CSV. Awards : génération automatique (Ballon d'or, Gant d'or, Soulier d'or, Meilleur passeur, Meilleure équipe, Joueur du tournoi, meilleurs défenseur/milieu/attaquant/jeune, meilleure défense, attaque la plus prolifique ; « Non attribué » si aucun candidat), workflow Généré → Vérifié → Publié (« Valider et verrouiller »), poster 1080×1350 téléchargeable. Diffusion : QR code par terrain vers /live/:terrain et lien vers le mode TV.
