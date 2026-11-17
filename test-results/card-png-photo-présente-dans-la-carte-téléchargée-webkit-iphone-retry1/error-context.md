# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: card-png.spec.mjs >> photo présente dans la carte téléchargée
- Location: e2e/card-png.spec.mjs:16:1

# Error details

```
Error: photo détourée (maillot bleu) dans le PNG

expect(received).toBeGreaterThan(expected)

Expected: > 800
Received:   66
```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - generic [ref=f1e5]:
        - link "MBL — Morocco Business League, accueil" [ref=f1e6]:
          - /url: /
          - generic [ref=f1e7]: MBL
        - button "Menu" [ref=f1e10] [cursor=pointer]
    - main [ref=f1e12]:
      - generic [ref=f1e13]:
        - generic [ref=f1e15]:
          - generic [ref=f1e16]:
            - button "Test Carte cutout — retourner la carte" [ref=f1e17] [cursor=pointer]:
              - generic [ref=f1e18]:
                - generic [ref=f1e20]:
                  - generic [ref=f1e21]:
                    - generic [ref=f1e22]: Silver
                    - generic [ref=f1e26]: Recrue
                  - generic [ref=f1e27]:
                    - generic [aria-hidden]: C
                    - generic [aria-hidden]:
                      - generic: TC
                    - generic [ref=f1e28]:
                      - generic [ref=f1e29]: "0"
                      - generic [ref=f1e30]: XP
                  - generic [ref=f1e32]:
                    - generic [ref=f1e33]: Test
                    - generic [ref=f1e34]: Carte cutout
                    - generic [ref=f1e36]:
                      - generic [ref=f1e37]: Arrow ECS
                      - generic "Nouveau" [ref=f1e39]
                  - img "Arrow ECS" [ref=f1e44]
                  - generic [ref=f1e45]:
                    - generic [ref=f1e46]:
                      - generic [ref=f1e47]: "0"
                      - generic [ref=f1e48]: MJ
                    - generic [ref=f1e49]:
                      - generic [ref=f1e50]: "0"
                      - generic [ref=f1e51]: BUT
                    - generic "Passes décisives" [ref=f1e52]:
                      - generic [ref=f1e53]: "0"
                      - generic [ref=f1e54]: PAS
                    - generic "Cartons jaunes" [ref=f1e55]:
                      - generic [ref=f1e56]: "0"
                      - generic [ref=f1e57]: CJ
                - generic [ref=f1e62]:
                  - generic [ref=f1e64]:
                    - generic [ref=f1e65]: Carte cutout
                    - generic [ref=f1e66]: Test · Arrow ECS
                  - generic [ref=f1e67]:
                    - generic [ref=f1e68]: Statistiques
                    - generic [ref=f1e69]: 0XP
                  - generic [ref=f1e70]:
                    - generic [ref=f1e71]:
                      - term [ref=f1e72]:
                        - generic [ref=f1e73]: XP de la saison
                        - 'button "XP de la saison : définition" [ref=f1e74]':
                          - generic [aria-hidden] [ref=f1e75]: i
                      - definition [ref=f1e76]: "0"
                    - generic "Victoires / nuls / défaites" [ref=f1e77]:
                      - term [ref=f1e78]:
                        - generic [ref=f1e79]: V / N / D
                      - definition [ref=f1e80]: 0 / 0 / 0
                    - generic [ref=f1e81]:
                      - term [ref=f1e82]:
                        - generic [ref=f1e83]: Buts
                      - definition [ref=f1e84]: "0"
                    - generic [ref=f1e85]:
                      - term [ref=f1e86]:
                        - generic [ref=f1e87]: Passes décisives
                      - definition [ref=f1e88]: "0"
                    - generic "Cartons jaunes / rouges" [ref=f1e89]:
                      - term [ref=f1e90]:
                        - generic [ref=f1e91]: Cartons J / R
                      - definition [ref=f1e92]: 0 / 0
                  - link "Voir la fiche" [ref=f1e93]:
                    - /url: /joueurs/png_cutout
            - generic [ref=f1e94]:
              - button "Télécharger ma carte" [ref=f1e95] [cursor=pointer]
              - button "Partager" [ref=f1e99] [cursor=pointer]
            - generic [aria-hidden]:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic: MBL
                        - generic: Morocco Business League
                    - generic: Organisé par
                  - generic: Arrow ECS · Saison 2026-2027
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - generic:
                              - generic:
                                - generic: Silver
                                - generic: Recrue
                              - generic:
                                - generic [aria-hidden]: C
                                - generic [aria-hidden]:
                                  - generic: TC
                                - generic:
                                  - generic: "0"
                                  - generic: XP
                              - generic:
                                - generic: Test
                                - generic: Carte cutout
                                - generic: Arrow ECS
                              - generic:
                                - generic:
                                  - generic: "0"
                                  - generic: MJ
                                - generic:
                                  - generic: "0"
                                  - generic: BUT
                                - generic:
                                  - generic: "0"
                                  - generic: PAS
                                - generic:
                                  - generic: "0"
                                  - generic: CJ
          - generic [ref=f1e106]:
            - generic [ref=f1e107]:
              - generic [ref=f1e108]: Recrue · 1re saison
              - generic "Silver · 1 saison MBL" [ref=f1e109]:
                - generic [ref=f1e110]:
                  - text: Silver
                  - generic [ref=f1e113]: · 1 s.
            - heading "Test Carte cutout" [level=1] [ref=f1e114]
            - generic [ref=f1e115]:
              - link [ref=f1e116]:
                - /url: /equipes/t26_arw
                - img "Arrow ECS" [ref=f1e117]
                - text: Arrow ECS
              - generic [ref=f1e118]: n°1
            - generic [ref=f1e119]:
              - generic [ref=f1e120]:
                - generic [ref=f1e121]:
                  - text: XP saison
                  - 'button "XP saison : définition" [ref=f1e122]':
                    - generic [aria-hidden] [ref=f1e123]: i
                - generic [ref=f1e124]: "0"
              - generic [ref=f1e125]:
                - generic [ref=f1e126]: Rang joueurs
                - generic [ref=f1e127]: —
              - generic [ref=f1e128]:
                - generic [ref=f1e129]: Rang buteurs
                - generic [ref=f1e130]: —
                - generic [ref=f1e131]: 0 buts
              - generic [ref=f1e132]:
                - generic [ref=f1e133]:
                  - text: Badges
                  - 'button "Badges : définition" [ref=f1e134]':
                    - generic [aria-hidden] [ref=f1e135]: i
                - generic [ref=f1e136]: 0 / 22
        - generic [ref=f1e137]:
          - generic [ref=f1e138]:
            - generic [ref=f1e139]: Buts
            - generic [ref=f1e140]: "0"
          - generic [ref=f1e141]:
            - generic [ref=f1e142]: Passes décisives
            - generic [ref=f1e143]: "0"
          - generic [ref=f1e144]:
            - generic [ref=f1e145]: Matchs avec stats
            - generic [ref=f1e146]: "0"
          - generic [ref=f1e147]:
            - generic [ref=f1e148]: Série en cours
            - generic [ref=f1e151]: "0"
            - generic [ref=f1e152]: record 0 · matchs décisifs d'affilée
          - generic [ref=f1e153]:
            - generic [ref=f1e154]:
              - text: Meilleure note
              - 'button "Meilleure note : définition" [ref=f1e155]':
                - generic [aria-hidden] [ref=f1e156]: i
            - generic [ref=f1e157]: —
            - generic [ref=f1e158]: sur 10
        - generic [ref=f1e159]:
          - generic [ref=f1e160]:
            - generic [ref=f1e161]: Tirs
            - generic [ref=f1e162]: –
            - generic [ref=f1e163]: tirs non saisis
          - generic [ref=f1e164]:
            - generic [ref=f1e165]: Tirs cadrés
            - generic [ref=f1e166]: –
            - generic [ref=f1e167]: buts compris
          - generic [ref=f1e168]:
            - generic [ref=f1e169]: Précision
            - generic [ref=f1e170]: –
            - generic [ref=f1e171]: tirs cadrés / tirs
          - generic [ref=f1e172]:
            - generic [ref=f1e173]: Tirs par but
            - generic [ref=f1e174]: –
            - generic [ref=f1e175]: tirs nécessaires pour marquer
        - generic [ref=f1e176]:
          - generic [ref=f1e177]:
            - heading "Défis" [level=2] [ref=f1e178]
            - paragraph [ref=f1e183]: Objectifs calculés sur les 5 derniers matchs du joueur.
            - paragraph [ref=f1e184]: Les défis apparaissent après 2 matchs joués.
          - generic [ref=f1e185]:
            - heading "Défends ta place" [level=2] [ref=f1e186]
            - paragraph [ref=f1e196]: Pas encore classé cette saison.
          - generic [ref=f1e197]:
            - heading "Titres" [level=2] [ref=f1e198]
            - paragraph [ref=f1e205]: "Aucun titre pour l’instant. Prochain titre accessible : Joueur du mois, attribué chaque mois par la ligue."
        - generic [ref=f1e206]:
          - generic [ref=f1e208]:
            - heading "Collection de badges" [level=2] [ref=f1e209]
            - paragraph [ref=f1e211]: Touchez un badge pour voir sa condition exacte, ses paliers et qui l’a obtenu
          - generic [ref=f1e212]:
            - generic [ref=f1e213]:
              - img "0 badges débloqués sur 22" [ref=f1e214]:
                - generic [ref=f1e217]: 0%
              - generic [ref=f1e218]:
                - generic [ref=f1e219]: 0 / 22 badges
                - generic [ref=f1e220]:
                  - generic [ref=f1e221]: 0 commun
                  - generic [ref=f1e222]: · 0 rare
                  - generic [ref=f1e223]: · 0 épique
                  - generic [ref=f1e224]: · 0 légendaire
            - group "Filtrer par rareté" [ref=f1e225]:
              - button "Toutes raretés" [ref=f1e226] [cursor=pointer]
              - button "Légendaire" [ref=f1e227] [cursor=pointer]
              - button "Épique" [ref=f1e228] [cursor=pointer]
              - button "Rare" [ref=f1e229] [cursor=pointer]
              - button "Commun" [ref=f1e230] [cursor=pointer]
            - group "Filtrer par catégorie" [ref=f1e231]:
              - button "Toutes catégories" [ref=f1e232] [cursor=pointer]
              - button "Attaque" [ref=f1e233] [cursor=pointer]
              - button "Création" [ref=f1e234] [cursor=pointer]
              - button "Régularité" [ref=f1e235] [cursor=pointer]
              - button "Spécial" [ref=f1e236] [cursor=pointer]
              - generic [ref=f1e237]:
                - text: Trier
                - combobox "Trier" [ref=f1e238]:
                  - option "par rareté" [selected]
                  - option "par progression"
                  - option "par nom"
            - generic [ref=f1e239]:
              - button "Machine à buts (verrouillé) Machine à buts Légendaire · IV Marquer 20 buts 0 / 20" [ref=f1e240] [cursor=pointer]:
                - img "Machine à buts (verrouillé)" [ref=f1e241]:
                  - generic [ref=f1e267]: IV
                - generic [ref=f1e282]: Machine à buts
                - generic [ref=f1e283]: Légendaire · IV
                - generic [ref=f1e284]: Marquer 20 buts
                - generic [ref=f1e285]: 0 / 20
              - button "Architecte (verrouillé) Architecte Légendaire · IV Délivrer 20 passes décisives 0 / 20" [ref=f1e288] [cursor=pointer]:
                - img "Architecte (verrouillé)" [ref=f1e289]:
                  - generic [ref=f1e309]: IV
                - generic [ref=f1e324]: Architecte
                - generic [ref=f1e325]: Légendaire · IV
                - generic [ref=f1e326]: Délivrer 20 passes décisives
                - generic [ref=f1e327]: 0 / 20
              - button "Total football (verrouillé) Total football Légendaire · III 10 matchs avec au moins 1 but et 1 passe décisive 0 / 10" [ref=f1e330] [cursor=pointer]:
                - img "Total football (verrouillé)" [ref=f1e331]:
                  - generic [ref=f1e359]: III
                - generic [ref=f1e373]: Total football
                - generic [ref=f1e374]: Légendaire · III
                - generic [ref=f1e375]: 10 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e376]: 0 / 10
              - button "Intouchable (verrouillé) Intouchable Légendaire · IV 10 matchs notés 8,0 ou plus 0 / 10" [ref=f1e379] [cursor=pointer]:
                - img "Intouchable (verrouillé)" [ref=f1e380]:
                  - generic [ref=f1e400]: IV
                - generic [ref=f1e415]: Intouchable
                - generic [ref=f1e416]: Légendaire · IV
                - generic [ref=f1e417]: 10 matchs notés 8,0 ou plus
                - generic [ref=f1e418]: 0 / 10
              - button "Finisseur (verrouillé) Finisseur Épique · III Marquer 10 buts 0 / 10" [ref=f1e421] [cursor=pointer]:
                - img "Finisseur (verrouillé)" [ref=f1e422]:
                  - generic [ref=f1e449]: III
                - generic [ref=f1e463]: Finisseur
                - generic [ref=f1e464]: Épique · III
                - generic [ref=f1e465]: Marquer 10 buts
                - generic [ref=f1e466]: 0 / 10
              - button "Maestro (verrouillé) Maestro Épique · III Délivrer 10 passes décisives 0 / 10" [ref=f1e469] [cursor=pointer]:
                - img "Maestro (verrouillé)" [ref=f1e470]:
                  - generic [ref=f1e489]: III
                - generic [ref=f1e503]: Maestro
                - generic [ref=f1e504]: Épique · III
                - generic [ref=f1e505]: Délivrer 10 passes décisives
                - generic [ref=f1e506]: 0 / 10
              - button "Double menace (verrouillé) Double menace Épique · II 5 matchs avec au moins 1 but et 1 passe décisive 0 / 5" [ref=f1e509] [cursor=pointer]:
                - img "Double menace (verrouillé)" [ref=f1e510]:
                  - generic [ref=f1e523]: II
                - generic [ref=f1e536]: Double menace
                - generic [ref=f1e537]: Épique · II
                - generic [ref=f1e538]: 5 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e539]: 0 / 5
              - button "Patron (verrouillé) Patron Épique · III 8 matchs notés 7,5 ou plus 0 / 8" [ref=f1e542] [cursor=pointer]:
                - img "Patron (verrouillé)" [ref=f1e543]:
                  - generic [ref=f1e551]: C
                  - generic [ref=f1e555]: C
                  - generic [ref=f1e556]: III
                - generic [ref=f1e570]: Patron
                - generic [ref=f1e571]: Épique · III
                - generic [ref=f1e572]: 8 matchs notés 7,5 ou plus
                - generic [ref=f1e573]: 0 / 8
              - button "Badge secret (verrouillé) ??? Épique Badge secret" [ref=f1e576] [cursor=pointer]:
                - img "Badge secret (verrouillé)" [ref=f1e577]
                - generic [ref=f1e610]: "???"
                - generic [ref=f1e611]: Épique
                - generic [ref=f1e612]: Badge secret
              - button "Chasseur (verrouillé) Chasseur Épique Marquer 3 buts contre une équipe du top 3 0 / 3" [ref=f1e616] [cursor=pointer]:
                - img "Chasseur (verrouillé)" [ref=f1e617]
                - generic [ref=f1e640]: Chasseur
                - generic [ref=f1e641]: Épique
                - generic [ref=f1e642]: Marquer 3 buts contre une équipe du top 3
                - generic [ref=f1e643]: 0 / 3
              - button "Buteur confirmé (verrouillé) Buteur confirmé Rare · II Marquer 5 buts 0 / 5" [ref=f1e646] [cursor=pointer]:
                - img "Buteur confirmé (verrouillé)" [ref=f1e647]:
                  - generic [ref=f1e674]: II
                - generic [ref=f1e687]: Buteur confirmé
                - generic [ref=f1e688]: Rare · II
                - generic [ref=f1e689]: Marquer 5 buts
                - generic [ref=f1e690]: 0 / 5
              - button "Créateur (verrouillé) Créateur Rare · II Délivrer 5 passes décisives 0 / 5" [ref=f1e693] [cursor=pointer]:
                - img "Créateur (verrouillé)" [ref=f1e694]:
                  - generic [ref=f1e711]: II
                - generic [ref=f1e724]: Créateur
                - generic [ref=f1e725]: Rare · II
                - generic [ref=f1e726]: Délivrer 5 passes décisives
                - generic [ref=f1e727]: 0 / 5
              - button "Polyvalent (verrouillé) Polyvalent Rare · I 3 matchs avec au moins 1 but et 1 passe décisive 0 / 3" [ref=f1e730] [cursor=pointer]:
                - img "Polyvalent (verrouillé)" [ref=f1e731]:
                  - generic [ref=f1e756]: I
                - generic [ref=f1e768]: Polyvalent
                - generic [ref=f1e769]: Rare · I
                - generic [ref=f1e770]: 3 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e771]: 0 / 3
              - button "Fiable (verrouillé) Fiable Rare · II 5 matchs notés 7,0 ou plus 0 / 5" [ref=f1e774] [cursor=pointer]:
                - img "Fiable (verrouillé)" [ref=f1e775]:
                  - generic [ref=f1e790]: II
                - generic [ref=f1e803]: Fiable
                - generic [ref=f1e804]: Rare · II
                - generic [ref=f1e805]: 5 matchs notés 7,0 ou plus
                - generic [ref=f1e806]: 0 / 5
              - button "Hat-trick (verrouillé) Hat-trick Rare Marquer 3 buts dans un match 0 / 1" [ref=f1e809] [cursor=pointer]:
                - img "Hat-trick (verrouillé)" [ref=f1e810]
                - generic [ref=f1e869]: Hat-trick
                - generic [ref=f1e870]: Rare
                - generic [ref=f1e871]: Marquer 3 buts dans un match
                - generic [ref=f1e872]: 0 / 1
              - button "Homme du match (verrouillé) Homme du match Rare Être élu homme du match 0 / 1" [ref=f1e875] [cursor=pointer]:
                - img "Homme du match (verrouillé)" [ref=f1e876]
                - generic [ref=f1e897]: Homme du match
                - generic [ref=f1e898]: Rare
                - generic [ref=f1e899]: Être élu homme du match
                - generic [ref=f1e900]: 0 / 1
              - button "En feu (verrouillé) En feu Rare Être décisif (but ou passe) 3 matchs de suite 0 / 3" [ref=f1e903] [cursor=pointer]:
                - img "En feu (verrouillé)" [ref=f1e904]
                - generic [ref=f1e925]: En feu
                - generic [ref=f1e926]: Rare
                - generic [ref=f1e927]: Être décisif (but ou passe) 3 matchs de suite
                - generic [ref=f1e928]: 0 / 3
              - button "Perfectionniste (verrouillé) Perfectionniste Rare Réussir les 3 défis d’une même journée 0 / 3" [ref=f1e931] [cursor=pointer]:
                - img "Perfectionniste (verrouillé)" [ref=f1e932]
                - generic [ref=f1e957]: Perfectionniste
                - generic [ref=f1e958]: Rare
                - generic [ref=f1e959]: Réussir les 3 défis d’une même journée
                - generic [ref=f1e960]: 0 / 3
              - button "Premier but (verrouillé) Premier but Commun · I Marquer 1 but 0 / 1" [ref=f1e963] [cursor=pointer]:
                - img "Premier but (verrouillé)" [ref=f1e964]:
                  - generic [ref=f1e987]: I
                - generic [ref=f1e999]: Premier but
                - generic [ref=f1e1000]: Commun · I
                - generic [ref=f1e1001]: Marquer 1 but
                - generic [ref=f1e1002]: 0 / 1
              - button "Premier service (verrouillé) Premier service Commun · I Délivrer 1 passe décisive 0 / 1" [ref=f1e1005] [cursor=pointer]:
                - img "Premier service (verrouillé)" [ref=f1e1006]:
                  - generic [ref=f1e1029]: I
                - generic [ref=f1e1041]: Premier service
                - generic [ref=f1e1042]: Commun · I
                - generic [ref=f1e1043]: Délivrer 1 passe décisive
                - generic [ref=f1e1044]: 0 / 1
              - button "Solide (verrouillé) Solide Commun · I 3 matchs notés 7,0 ou plus 0 / 3" [ref=f1e1047] [cursor=pointer]:
                - img "Solide (verrouillé)" [ref=f1e1048]:
                  - generic [ref=f1e1061]: I
                - generic [ref=f1e1073]: Solide
                - generic [ref=f1e1074]: Commun · I
                - generic [ref=f1e1075]: 3 matchs notés 7,0 ou plus
                - generic [ref=f1e1076]: 0 / 3
              - button "Doublé (verrouillé) Doublé Commun Marquer 2 buts dans un match 0 / 1" [ref=f1e1079] [cursor=pointer]:
                - img "Doublé (verrouillé)" [ref=f1e1080]
                - generic [ref=f1e1125]: Doublé
                - generic [ref=f1e1126]: Commun
                - generic [ref=f1e1127]: Marquer 2 buts dans un match
                - generic [ref=f1e1128]: 0 / 1
          - paragraph [ref=f1e1131]: "26 badges au total, dont 4 réservés aux gardiens. Note sur 10 calculée à partir des actions du match : but +0,8 ; passe décisive +0,5 ; victoire +0,4, défaite −0,4 ; homme du match +0,5 ; carton jaune −0,4, rouge −1,5 ; gardien : arrêt +0,1, but encaissé −0,15, clean sheet +1,0. Le total part de 6,0 et se rapproche de 10 sans l’atteindre, pour départager les grosses performances. Le Match des capitaines ne débloque aucun badge."
        - generic [ref=f1e1132]:
          - heading "Détail de l’XP" [level=2] [ref=f1e1133]
          - table [ref=f1e1135]:
            - rowgroup [ref=f1e1136]:
              - row [ref=f1e1137]:
                - columnheader [ref=f1e1138]:
                  - button "Date" [ref=f1e1139] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e1141]: ↑
                - columnheader [ref=f1e1142]:
                  - button "Adversaire" [ref=f1e1143] [cursor=pointer]
                - columnheader [ref=f1e1145]:
                  - button "B" [ref=f1e1146] [cursor=pointer]
                - columnheader [ref=f1e1148]:
                  - button "PD" [ref=f1e1149] [cursor=pointer]
                - columnheader [ref=f1e1151]:
                  - button "Import." [ref=f1e1152] [cursor=pointer]
                - columnheader [ref=f1e1154]:
                  - button "Résultat" [ref=f1e1155] [cursor=pointer]
                - columnheader [ref=f1e1157]:
                  - button "Sanctions" [ref=f1e1158] [cursor=pointer]
                - columnheader [ref=f1e1160]:
                  - button "Note" [ref=f1e1161] [cursor=pointer]
                - columnheader [ref=f1e1163]:
                  - button "XP" [ref=f1e1164] [cursor=pointer]
            - rowgroup
          - paragraph [ref=f1e1166]: Pas encore d’XP cette saison.
        - generic [ref=f1e1167]:
          - heading "Historique par saison" [level=2] [ref=f1e1168]
          - table [ref=f1e1170]:
            - rowgroup [ref=f1e1171]:
              - row [ref=f1e1172]:
                - columnheader [ref=f1e1173]:
                  - button "Saison" [ref=f1e1174] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e1176]: ↓
                - columnheader [ref=f1e1177]:
                  - button "MJ" [ref=f1e1178] [cursor=pointer]
                - columnheader [ref=f1e1180]:
                  - button "Buts" [ref=f1e1181] [cursor=pointer]
                - columnheader [ref=f1e1183]:
                  - button "Passes" [ref=f1e1184] [cursor=pointer]
                - columnheader [ref=f1e1186]:
                  - button "XP" [ref=f1e1187] [cursor=pointer]
            - rowgroup [ref=f1e1189]:
              - row [ref=f1e1190]:
                - cell "Saison 2026-2027" [ref=f1e1191]
                - cell "0" [ref=f1e1192]
                - cell "0" [ref=f1e1193]
                - cell "0" [ref=f1e1194]
                - cell "0" [ref=f1e1195]
        - paragraph [ref=f1e1196]: Test Carte cutout · XP calculé selon le barème de la saison, recalculé depuis les événements de match.
    - contentinfo [ref=f1e1197]:
      - generic [ref=f1e1198]:
        - generic [ref=f1e1199]:
          - img "Morocco Business League" [ref=f1e1200]
          - generic [ref=f1e1201]:
            - generic [ref=f1e1202]: Morocco Business League
            - paragraph [ref=f1e1203]: 1ère LIGUE DE FOOTBALL INTER‑ENTREPRISES AU MAROC
            - paragraph [ref=f1e1204]: الدوري الوطني للشركات لكرة القدم
            - link [ref=f1e1205]:
              - /url: https://www.ardentia.ma
              - text: Organisé par
              - img "Ardentia" [ref=f1e1206]
        - generic [ref=f1e1207]:
          - generic [ref=f1e1208]: Contact
          - link "contact@ardentia.ma" [ref=f1e1209]:
            - /url: mailto:contact@ardentia.ma
          - link "+212 6 43 04 79 84" [ref=f1e1213]:
            - /url: tel:+212643047984
          - link "39, Av Lalla Yaqout, 1er étage, Apt n°1, Casablanca" [ref=f1e1216]:
            - /url: https://www.google.com/maps/search/?api=1&query=39%2C%20Av%20Lalla%20Yaqout%2C%201er%20%C3%A9tage%2C%20Apt%20n%C2%B01%2C%20Casablanca
          - link "www.ardentia.ma" [ref=f1e1220]:
            - /url: https://www.ardentia.ma
          - generic [ref=f1e1224]:
            - link "WhatsApp" [ref=f1e1225]:
              - /url: https://wa.me/212643047984?text=Bonjour%2C%20je%20vous%20contacte%20depuis%20le%20site%20de%20la%20Morocco%20Business%20League.
            - link "Appeler" [ref=f1e1229]:
              - /url: tel:+212643047984
        - generic [ref=f1e1232]:
          - generic [ref=f1e1233]: Suivez-nous
          - list [ref=f1e1234]:
            - listitem [ref=f1e1235]:
              - link [ref=f1e1236]:
                - /url: https://www.instagram.com/morocco.business.league/
            - listitem [ref=f1e1242]:
              - link [ref=f1e1243]:
                - /url: https://www.instagram.com/ardentia.ma/
            - listitem [ref=f1e1249]:
              - link [ref=f1e1250]:
                - /url: https://www.linkedin.com/company/ardentia-agence/
          - generic [ref=f1e1255]:
            - link "Règlement" [ref=f1e1256]:
              - /url: /reglement
            - link "Discipline" [ref=f1e1257]:
              - /url: /discipline
            - link "Historique" [ref=f1e1258]:
              - /url: /historique
            - link "Pré-saison" [ref=f1e1259]:
              - /url: /pre-saison
            - link "Équipe type" [ref=f1e1260]:
              - /url: /equipe-type
            - link "Badges" [ref=f1e1261]:
              - /url: /badges
            - link "Glossaire" [ref=f1e1262]:
              - /url: /glossaire
            - link "Match des capitaines" [ref=f1e1263]:
              - /url: /match-des-capitaines
            - link "Média" [ref=f1e1264]:
              - /url: /media
            - link "Espace admin" [ref=f1e1265]:
              - /url: /admin
      - generic [ref=f1e1266]: © 2026 Morocco Business League · organisée par Ardentia
  - generic [ref=f1e1267]: Carte téléchargée
```

# Test source

```ts
  1  | // Carte joueur téléchargée (PNG 1080 × 1350) : la photo (détourée ou normale) doit y figurer, comme à l'écran ;
  2  | // sans photo, la silhouette. Photos servies comme celles du site, puis le PNG est analysé pixel par pixel.
  3  | import { expect, test } from '@playwright/test'
  4  | import fs from 'node:fs'
  5  | import path from 'node:path'
  6  | import { fileURLToPath } from 'node:url'
  7  | import { FROZEN } from './routes.mjs'
  8  | 
  9  | const dir = path.dirname(fileURLToPath(import.meta.url))
  10 | const PHOTO = fs.readFileSync(path.join(dir, 'fixtures/test-photo.jpg')) // maillot rouge (200, 40, 40)
  11 | const CUTOUT = fs.readFileSync(path.join(dir, 'fixtures/test-cutout.png')) // maillot bleu (30, 90, 200)
  12 | const KINDS = ['cutout', 'photo', 'none']
  13 | // le service worker du site prend les requêtes d'images avant l'interception de Playwright sous WebKit : bloqué ici
  14 | test.use({ serviceWorkers: 'block' })
  15 | 
  16 | test('photo présente dans la carte téléchargée', async ({ page }, info) => {
  17 |   test.setTimeout(120_000)
  18 |   await page.clock.setFixedTime(FROZEN)
  19 |   page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${info.project.name}] console ${m.type()}: ${m.text().slice(0, 200)}`) })
  20 |   page.on('pageerror', (e) => console.log(`[${info.project.name}] pageerror: ${e.message.slice(0, 200)}`))
  21 |   await page.route('**/test-photo.jpg', (r) => r.fulfill({ body: PHOTO, contentType: 'image/jpeg', headers: { 'Access-Control-Allow-Origin': '*' } }))
  22 |   await page.route('**/test-cutout.png', (r) => r.fulfill({ body: CUTOUT, contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' } }))
  23 |   await page.goto('/')
  24 |   await page.waitForFunction(() => !!localStorage.getItem('statfoot:v1:Team'))
  25 |   await page.evaluate((kinds) => {
  26 |     const K = 'statfoot:v1:', get = (n) => JSON.parse(localStorage.getItem(K + n) || '[]')
  27 |     const teams = get('Team').filter((t) => t.season_id === 'season_2026'), players = get('Player')
  28 |     kinds.forEach((k, i) => players.push({ id: `png_${k}`, first_name: 'Test', last_name: `Carte ${k}`, number: i + 1, team_id: teams[i].id, season_ids: ['season_2026'], status: 'active', created_date: '2025-01-01T00:00:00Z', updated_date: '2025-01-01T00:00:00Z',
  29 |       ...(k === 'cutout' ? { photo_url: '/test-photo.jpg', photo_cutout_url: '/test-cutout.png', photo_cutout_source: '/test-photo.jpg' } : k === 'photo' ? { photo_url: '/test-photo.jpg', photo_card_mode: 'original' } : {}) }))
  30 |     localStorage.setItem(K + 'Player', JSON.stringify(players))
  31 |   }, KINDS)
  32 |   for (const k of KINDS) {
  33 |     await page.goto(`/joueurs/png_${k}`)
  34 |     const btn = page.getByRole('button', { name: /Télécharger ma carte/ })
  35 |     await btn.waitFor({ timeout: 20_000 })
  36 |     await page.waitForTimeout(1500)
  37 |     if (k === 'cutout') console.log(`[${info.project.name}] DIAG`, JSON.stringify(await page.evaluate(async () => {
  38 |       const out = { states: [...document.querySelectorAll('[data-photo-state]')].map((e) => e.getAttribute('data-photo-state')) }
  39 |       const step = async (name, fn) => { try { out[name] = await fn() } catch (e) { out[name] = 'ERREUR ' + (e && e.message || e) } }
  40 |       let img
  41 |       await step('load', () => new Promise((res, rej) => { img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(`${img.naturalWidth}x${img.naturalHeight}`); img.onerror = () => rej(new Error('onerror')); img.src = '/test-cutout.png' }))
  42 |       const c = document.createElement('canvas'); c.width = 200; c.height = 300
  43 |       await step('draw', () => { c.getContext('2d').drawImage(img, 0, 0, 200, 300); return 'ok' })
  44 |       await step('getImageData', () => { c.getContext('2d').getImageData(0, 0, 10, 10); return 'ok' })
  45 |       await step('toDataURL', () => c.toDataURL('image/png').length)
  46 |       await step('fetch', async () => { const r = await fetch('/test-cutout.png', { mode: 'cors', credentials: 'omit' }); return r.status + ' ' + r.headers.get('content-type') })
  47 |       return out
  48 |     })))
  49 |     // le téléchargement est intercepté : on récupère le PNG produit (lien <a download>)
  50 |     await page.evaluate(() => { window.__png = null; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__png = this.href; return } return o.call(this) } })
  51 |     await btn.click()
  52 |     await page.waitForFunction(() => !!window.__png, null, { timeout: 30_000 })
  53 |     const r = await page.evaluate(async () => {
  54 |       const im = new Image(); im.src = window.__png; await im.decode()
  55 |       const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight
  56 |       const x = c.getContext('2d'); x.drawImage(im, 0, 0)
  57 |       const d = x.getImageData(0, 0, c.width, c.height).data
  58 |       let red = 0, blue = 0
  59 |       for (let i = 0; i < d.length; i += 16) { const [R, G, B] = [d[i], d[i + 1], d[i + 2]]; if (R > 150 && G < 90 && B < 90) red++; if (B > 150 && R < 90 && G > 50 && G < 140) blue++ }
  60 |       return { w: c.width, h: c.height, red, blue, url: c.toDataURL('image/png') }
  61 |     })
  62 |     fs.mkdirSync(`e2e/__screenshots__/${info.project.name}`, { recursive: true })
  63 |     fs.writeFileSync(`e2e/__screenshots__/${info.project.name}/carte-png-${k}.png`, Buffer.from(r.url.split(',')[1], 'base64'))
  64 |     await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/carte-ecran-${k}.png` })
  65 |     console.log(`[${info.project.name}] ${k}: ${r.w}×${r.h} rouge=${r.red} bleu=${r.blue}`)
  66 |     expect([r.w, r.h]).toEqual([1080, 1350])
> 67 |     if (k === 'cutout') expect(r.blue, 'photo détourée (maillot bleu) dans le PNG').toBeGreaterThan(800)
     |                                                                                     ^ Error: photo détourée (maillot bleu) dans le PNG
  68 |     if (k === 'photo') expect(r.red, 'photo (maillot rouge) dans le PNG').toBeGreaterThan(800)
  69 |   }
  70 | })
  71 | 
```