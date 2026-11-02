# Morocco Business League — plateforme (StatFoot)

Organisée par Ardentia. Identité : bleu du blason MBL, orange Ardentia, blanc — polices Big Shoulders Display et Manrope.

Ligue de football inter-entreprises : site public, administration, **Match Center live**, XP et trophées.
React + Vite + TypeScript + Tailwind v4 + shadcn/ui + recharts. Données de démo en localStorage, prêtes à migrer vers Base44.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 54 tests unitaires (XP, classements, Match Center, système suisse, seed)
npm run build
```

### Données
- **Saison 2025-2026 : données réelles** importées du tracker Excel de la ligue (16 équipes, 120 matchs, buts, passes, arrêts, cartons)
  et classement **Top 25 IPG** (`src/api/seed/season2025.data.ts`, `src/lib/ipg.ts`). Le fichier Excel ne contenant ni dates ni postes,
  les dates sont estimées (une journée par semaine à partir du 4 octobre 2025) et les postes déduits des stats (modifiables dans l'admin).
  Pour réimporter une nouvelle version des fichiers :
  ```bash
  python3 scripts/import_excel_parse.py MBL_tracker.xlsx /tmp/mbl.json
  python3 scripts/import_excel_build.py /tmp/mbl.json IPG_Top25.xlsx src/api/seed/season2025.data.ts
  ```
  puis augmenter `SEED_VERSION` dans `src/api/seed/index.ts`.
- **Saison 2026-2027 (démo)** : jeu fictif conservé pour montrer le direct, le Match Center et les cups.

Au premier lancement, un jeu de démo fictif est généré : 2 saisons, 20 équipes, 240 joueurs, 5 chapeaux,
phase de ligue suisse J1–J5, Gold/Silver Cup J6–J10 (J1–J7 jouées, J8 aujourd'hui avec **un match en direct**).
Réinitialisation : Admin → Paramètres → « Réinitialiser ».

### Comptes de démonstration (mot de passe `mbl2026`)
| Email | Rôle |
|---|---|
| superadmin@mbl.ma | Super Admin (tout, dérogations, administrateurs) |
| admin@mbl.ma | Admin (tout sauf paramètres / administrateurs) |
| operateur@mbl.ma | Opérateur de saisie (Match Center uniquement) |

## Architecture

```
entities/*.json          schémas Base44 (1 fichier par entité)
src/api/                 SEUL accès aux données — imite le SDK Base44 (base44.entities.X.list/filter/create/update/delete)
  base44Client.ts        client + journalisation automatique (AuditLog)
  localStore.ts          implémentation localStorage (+ synchro entre onglets)
  matchOps.ts            clôture / réouverture, file d'écriture hors ligne, verrou opérateur
  seed/                  génération des données de démo
src/lib/                 calculs PURS, testés — source unique pour public, admin, Match Center, mode TV
  xp.ts                  barème MBL, multiplicateur adversaire, suspensions, bonus mensuels, trophées
  matchEngine.ts         chrono, minutes (15+2'), possession, tirs cadrés auto, 2 jaunes, CSC, TAB, minutes jouées, checklist
  standings.ts           classements, départage, forme, H2H
  stats.ts               façade unique (+ équipes, KPIs, awards, équipe type)
  draw.ts / schedule.ts  système suisse par chapeaux, tirage en groupes, tableau final
src/pages/public|admin   pages
```

## Choix par défaut à confirmer (questions XP ouvertes)
Tous modifiables dans **Admin → Règles XP** (ou dans `src/lib/xp.ts`) :
1. **Coefficient d'importance** du clean sheet : ×1 pour toutes les phases (neutre) en attendant les valeurs officielles.
2. **Ordre d'application** : but/passe = valeur × multiplicateur adversaire ; clean sheet = valeur × importance ; arrondi à l'entier par ligne.
3. **Rang de l'adversaire** = classement avant la journée, figé à la clôture ; ×1 en J1 ; en début de cup = ordre d'entrée (rang en phase de ligue) ; en phase finale = rang final dans la cup.
4. Nul = 0 XP ; victoire/défaite pour tous les joueurs ayant joué (titulaires + entrés) ; un match gagné aux TAB = nul.
5. 2 jaunes = −40 au total, sans −50 de rouge supplémentaire ; la suspension est saisie à part (−50 / match), comptée à la journée de l'exclusion.
6. Penalty arrêté +30 (pas +5 en plus) ; TAB arrêté +20 ; CSC sans effet XP ; buts en TAB hors XP ; pas d'XP « a joué ».
7. Clean sheet uniquement pour un gardien ayant joué tout le match ; les buts encaissés vont au gardien en jeu.
8. Équipe du mois : +50 aux joueurs ayant joué ce mois-ci.
9. Système suisse : 1 adversaire de chaque chapeau (y compris le sien), jamais de revanche, domicile/extérieur équilibré.
   Gold/Silver J6–J10 : même principe avec 5 chapeaux de 2 (selon le classement de la phase de ligue), points remis à zéro.
10. Classement général = Gold (1–10) puis Silver (11–20). Égalité d'XP : buts, passes, moins de matchs, nom.
