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
        - generic [ref=f1e9]:
          - link "Mode TV" [ref=f1e10]:
            - /url: /tv
          - link "Espace admin" [ref=f1e14]:
            - /url: /admin
          - button "Menu" [ref=f1e18] [cursor=pointer]
    - main [ref=f1e20]:
      - generic [ref=f1e21]:
        - generic [ref=f1e23]:
          - generic [ref=f1e24]:
            - button "Test Carte cutout — retourner la carte" [ref=f1e25] [cursor=pointer]:
              - generic [ref=f1e26]:
                - generic [ref=f1e28]:
                  - generic [ref=f1e29]:
                    - generic [ref=f1e30]: Silver
                    - generic [ref=f1e34]: Recrue
                  - generic [ref=f1e35]:
                    - generic [aria-hidden]: C
                    - generic [aria-hidden]:
                      - generic: TC
                    - generic [ref=f1e36]:
                      - generic [ref=f1e37]: "0"
                      - generic [ref=f1e38]: XP
                  - generic [ref=f1e40]:
                    - generic [ref=f1e41]: Test
                    - generic [ref=f1e42]: Carte cutout
                    - generic [ref=f1e44]:
                      - generic [ref=f1e45]: Arrow ECS
                      - generic "Nouveau" [ref=f1e47]
                  - img "Arrow ECS" [ref=f1e52]
                  - generic [ref=f1e53]:
                    - generic [ref=f1e54]:
                      - generic [ref=f1e55]: "0"
                      - generic [ref=f1e56]: MJ
                    - generic [ref=f1e57]:
                      - generic [ref=f1e58]: "0"
                      - generic [ref=f1e59]: BUT
                    - generic "Passes décisives" [ref=f1e60]:
                      - generic [ref=f1e61]: "0"
                      - generic [ref=f1e62]: PAS
                    - generic "Cartons jaunes" [ref=f1e63]:
                      - generic [ref=f1e64]: "0"
                      - generic [ref=f1e65]: CJ
                - generic [ref=f1e70]:
                  - generic [ref=f1e72]:
                    - generic [ref=f1e73]: Carte cutout
                    - generic [ref=f1e74]: Test · Arrow ECS
                  - generic [ref=f1e75]:
                    - generic [ref=f1e76]: Statistiques
                    - generic [ref=f1e77]: 0XP
                  - generic [ref=f1e78]:
                    - generic [ref=f1e79]:
                      - term [ref=f1e80]:
                        - generic [ref=f1e81]: XP de la saison
                        - 'button "XP de la saison : définition" [ref=f1e82]':
                          - generic [aria-hidden] [ref=f1e83]: i
                      - definition [ref=f1e84]: "0"
                    - generic "Victoires / nuls / défaites" [ref=f1e85]:
                      - term [ref=f1e86]:
                        - generic [ref=f1e87]: V / N / D
                      - definition [ref=f1e88]: 0 / 0 / 0
                    - generic [ref=f1e89]:
                      - term [ref=f1e90]:
                        - generic [ref=f1e91]: Buts
                      - definition [ref=f1e92]: "0"
                    - generic [ref=f1e93]:
                      - term [ref=f1e94]:
                        - generic [ref=f1e95]: Passes décisives
                      - definition [ref=f1e96]: "0"
                    - generic "Cartons jaunes / rouges" [ref=f1e97]:
                      - term [ref=f1e98]:
                        - generic [ref=f1e99]: Cartons J / R
                      - definition [ref=f1e100]: 0 / 0
                  - link "Voir la fiche" [ref=f1e101]:
                    - /url: /joueurs/png_cutout
            - generic [ref=f1e102]:
              - button "Télécharger ma carte" [ref=f1e103] [cursor=pointer]
              - button "Partager" [ref=f1e107] [cursor=pointer]
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
          - generic [ref=f1e114]:
            - generic [ref=f1e115]:
              - generic [ref=f1e116]: Recrue · 1re saison
              - generic "Silver · 1 saison MBL" [ref=f1e117]:
                - generic [ref=f1e118]:
                  - text: Silver
                  - generic [ref=f1e121]: · 1 s.
            - heading "Test Carte cutout" [level=1] [ref=f1e122]
            - generic [ref=f1e123]:
              - link [ref=f1e124]:
                - /url: /equipes/t26_arw
                - img "Arrow ECS" [ref=f1e125]
                - text: Arrow ECS
              - generic [ref=f1e126]: n°1
            - generic [ref=f1e127]:
              - generic [ref=f1e128]:
                - generic [ref=f1e129]:
                  - text: XP saison
                  - 'button "XP saison : définition" [ref=f1e130]':
                    - generic [aria-hidden] [ref=f1e131]: i
                - generic [ref=f1e132]: "0"
              - generic [ref=f1e133]:
                - generic [ref=f1e134]: Rang joueurs
                - generic [ref=f1e135]: —
              - generic [ref=f1e136]:
                - generic [ref=f1e137]: Rang buteurs
                - generic [ref=f1e138]: —
                - generic [ref=f1e139]: 0 buts
              - generic [ref=f1e140]:
                - generic [ref=f1e141]:
                  - text: Badges
                  - 'button "Badges : définition" [ref=f1e142]':
                    - generic [aria-hidden] [ref=f1e143]: i
                - generic [ref=f1e144]: 0 / 22
        - generic [ref=f1e145]:
          - generic [ref=f1e146]:
            - generic [ref=f1e147]: Buts
            - generic [ref=f1e148]: "0"
          - generic [ref=f1e149]:
            - generic [ref=f1e150]: Passes décisives
            - generic [ref=f1e151]: "0"
          - generic [ref=f1e152]:
            - generic [ref=f1e153]: Matchs avec stats
            - generic [ref=f1e154]: "0"
          - generic [ref=f1e155]:
            - generic [ref=f1e156]: Série en cours
            - generic [ref=f1e159]: "0"
            - generic [ref=f1e160]: record 0 · matchs décisifs d'affilée
          - generic [ref=f1e161]:
            - generic [ref=f1e162]:
              - text: Meilleure note
              - 'button "Meilleure note : définition" [ref=f1e163]':
                - generic [aria-hidden] [ref=f1e164]: i
            - generic [ref=f1e165]: —
            - generic [ref=f1e166]: sur 10
        - generic [ref=f1e167]:
          - generic [ref=f1e168]:
            - generic [ref=f1e169]: Tirs
            - generic [ref=f1e170]: –
            - generic [ref=f1e171]: tirs non saisis
          - generic [ref=f1e172]:
            - generic [ref=f1e173]: Tirs cadrés
            - generic [ref=f1e174]: –
            - generic [ref=f1e175]: buts compris
          - generic [ref=f1e176]:
            - generic [ref=f1e177]: Précision
            - generic [ref=f1e178]: –
            - generic [ref=f1e179]: tirs cadrés / tirs
          - generic [ref=f1e180]:
            - generic [ref=f1e181]: Tirs par but
            - generic [ref=f1e182]: –
            - generic [ref=f1e183]: tirs nécessaires pour marquer
        - generic [ref=f1e184]:
          - generic [ref=f1e185]:
            - heading "Défis" [level=2] [ref=f1e186]
            - paragraph [ref=f1e191]: Objectifs calculés sur les 5 derniers matchs du joueur.
            - paragraph [ref=f1e192]: Les défis apparaissent après 2 matchs joués.
          - generic [ref=f1e193]:
            - heading "Défends ta place" [level=2] [ref=f1e194]
            - paragraph [ref=f1e204]: Pas encore classé cette saison.
          - generic [ref=f1e205]:
            - heading "Titres" [level=2] [ref=f1e206]
            - paragraph [ref=f1e213]: "Aucun titre pour l’instant. Prochain titre accessible : Joueur du mois, attribué chaque mois par la ligue."
        - generic [ref=f1e214]:
          - generic [ref=f1e216]:
            - heading "Collection de badges" [level=2] [ref=f1e217]
            - paragraph [ref=f1e219]: Touchez un badge pour voir sa condition exacte, ses paliers et qui l’a obtenu
          - generic [ref=f1e220]:
            - generic [ref=f1e221]:
              - img "0 badges débloqués sur 22" [ref=f1e222]:
                - generic [ref=f1e225]: 0%
              - generic [ref=f1e226]:
                - generic [ref=f1e227]: 0 / 22 badges
                - generic [ref=f1e228]:
                  - generic [ref=f1e229]: 0 commun
                  - generic [ref=f1e230]: · 0 rare
                  - generic [ref=f1e231]: · 0 épique
                  - generic [ref=f1e232]: · 0 légendaire
            - group "Filtrer par rareté" [ref=f1e233]:
              - button "Toutes raretés" [ref=f1e234] [cursor=pointer]
              - button "Légendaire" [ref=f1e235] [cursor=pointer]
              - button "Épique" [ref=f1e236] [cursor=pointer]
              - button "Rare" [ref=f1e237] [cursor=pointer]
              - button "Commun" [ref=f1e238] [cursor=pointer]
            - group "Filtrer par catégorie" [ref=f1e239]:
              - button "Toutes catégories" [ref=f1e240] [cursor=pointer]
              - button "Attaque" [ref=f1e241] [cursor=pointer]
              - button "Création" [ref=f1e242] [cursor=pointer]
              - button "Régularité" [ref=f1e243] [cursor=pointer]
              - button "Spécial" [ref=f1e244] [cursor=pointer]
              - generic [ref=f1e245]:
                - text: Trier
                - combobox "Trier" [ref=f1e246]:
                  - option "par rareté" [selected]
                  - option "par progression"
                  - option "par nom"
            - generic [ref=f1e247]:
              - button "Machine à buts (verrouillé) Machine à buts Légendaire · IV Marquer 20 buts 0 / 20" [ref=f1e248] [cursor=pointer]:
                - img "Machine à buts (verrouillé)" [ref=f1e249]:
                  - generic [ref=f1e275]: IV
                - generic [ref=f1e290]: Machine à buts
                - generic [ref=f1e291]: Légendaire · IV
                - generic [ref=f1e292]: Marquer 20 buts
                - generic [ref=f1e293]: 0 / 20
              - button "Architecte (verrouillé) Architecte Légendaire · IV Délivrer 20 passes décisives 0 / 20" [ref=f1e296] [cursor=pointer]:
                - img "Architecte (verrouillé)" [ref=f1e297]:
                  - generic [ref=f1e317]: IV
                - generic [ref=f1e332]: Architecte
                - generic [ref=f1e333]: Légendaire · IV
                - generic [ref=f1e334]: Délivrer 20 passes décisives
                - generic [ref=f1e335]: 0 / 20
              - button "Total football (verrouillé) Total football Légendaire · III 10 matchs avec au moins 1 but et 1 passe décisive 0 / 10" [ref=f1e338] [cursor=pointer]:
                - img "Total football (verrouillé)" [ref=f1e339]:
                  - generic [ref=f1e367]: III
                - generic [ref=f1e381]: Total football
                - generic [ref=f1e382]: Légendaire · III
                - generic [ref=f1e383]: 10 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e384]: 0 / 10
              - button "Intouchable (verrouillé) Intouchable Légendaire · IV 10 matchs notés 8,0 ou plus 0 / 10" [ref=f1e387] [cursor=pointer]:
                - img "Intouchable (verrouillé)" [ref=f1e388]:
                  - generic [ref=f1e408]: IV
                - generic [ref=f1e423]: Intouchable
                - generic [ref=f1e424]: Légendaire · IV
                - generic [ref=f1e425]: 10 matchs notés 8,0 ou plus
                - generic [ref=f1e426]: 0 / 10
              - button "Finisseur (verrouillé) Finisseur Épique · III Marquer 10 buts 0 / 10" [ref=f1e429] [cursor=pointer]:
                - img "Finisseur (verrouillé)" [ref=f1e430]:
                  - generic [ref=f1e457]: III
                - generic [ref=f1e471]: Finisseur
                - generic [ref=f1e472]: Épique · III
                - generic [ref=f1e473]: Marquer 10 buts
                - generic [ref=f1e474]: 0 / 10
              - button "Maestro (verrouillé) Maestro Épique · III Délivrer 10 passes décisives 0 / 10" [ref=f1e477] [cursor=pointer]:
                - img "Maestro (verrouillé)" [ref=f1e478]:
                  - generic [ref=f1e497]: III
                - generic [ref=f1e511]: Maestro
                - generic [ref=f1e512]: Épique · III
                - generic [ref=f1e513]: Délivrer 10 passes décisives
                - generic [ref=f1e514]: 0 / 10
              - button "Double menace (verrouillé) Double menace Épique · II 5 matchs avec au moins 1 but et 1 passe décisive 0 / 5" [ref=f1e517] [cursor=pointer]:
                - img "Double menace (verrouillé)" [ref=f1e518]:
                  - generic [ref=f1e531]: II
                - generic [ref=f1e544]: Double menace
                - generic [ref=f1e545]: Épique · II
                - generic [ref=f1e546]: 5 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e547]: 0 / 5
              - button "Patron (verrouillé) Patron Épique · III 8 matchs notés 7,5 ou plus 0 / 8" [ref=f1e550] [cursor=pointer]:
                - img "Patron (verrouillé)" [ref=f1e551]:
                  - generic [ref=f1e559]: C
                  - generic [ref=f1e563]: C
                  - generic [ref=f1e564]: III
                - generic [ref=f1e578]: Patron
                - generic [ref=f1e579]: Épique · III
                - generic [ref=f1e580]: 8 matchs notés 7,5 ou plus
                - generic [ref=f1e581]: 0 / 8
              - button "Badge secret (verrouillé) ??? Épique Badge secret" [ref=f1e584] [cursor=pointer]:
                - img "Badge secret (verrouillé)" [ref=f1e585]
                - generic [ref=f1e618]: "???"
                - generic [ref=f1e619]: Épique
                - generic [ref=f1e620]: Badge secret
              - button "Chasseur (verrouillé) Chasseur Épique Marquer 3 buts contre une équipe du top 3 0 / 3" [ref=f1e624] [cursor=pointer]:
                - img "Chasseur (verrouillé)" [ref=f1e625]
                - generic [ref=f1e648]: Chasseur
                - generic [ref=f1e649]: Épique
                - generic [ref=f1e650]: Marquer 3 buts contre une équipe du top 3
                - generic [ref=f1e651]: 0 / 3
              - button "Buteur confirmé (verrouillé) Buteur confirmé Rare · II Marquer 5 buts 0 / 5" [ref=f1e654] [cursor=pointer]:
                - img "Buteur confirmé (verrouillé)" [ref=f1e655]:
                  - generic [ref=f1e682]: II
                - generic [ref=f1e695]: Buteur confirmé
                - generic [ref=f1e696]: Rare · II
                - generic [ref=f1e697]: Marquer 5 buts
                - generic [ref=f1e698]: 0 / 5
              - button "Créateur (verrouillé) Créateur Rare · II Délivrer 5 passes décisives 0 / 5" [ref=f1e701] [cursor=pointer]:
                - img "Créateur (verrouillé)" [ref=f1e702]:
                  - generic [ref=f1e719]: II
                - generic [ref=f1e732]: Créateur
                - generic [ref=f1e733]: Rare · II
                - generic [ref=f1e734]: Délivrer 5 passes décisives
                - generic [ref=f1e735]: 0 / 5
              - button "Polyvalent (verrouillé) Polyvalent Rare · I 3 matchs avec au moins 1 but et 1 passe décisive 0 / 3" [ref=f1e738] [cursor=pointer]:
                - img "Polyvalent (verrouillé)" [ref=f1e739]:
                  - generic [ref=f1e764]: I
                - generic [ref=f1e776]: Polyvalent
                - generic [ref=f1e777]: Rare · I
                - generic [ref=f1e778]: 3 matchs avec au moins 1 but et 1 passe décisive
                - generic [ref=f1e779]: 0 / 3
              - button "Fiable (verrouillé) Fiable Rare · II 5 matchs notés 7,0 ou plus 0 / 5" [ref=f1e782] [cursor=pointer]:
                - img "Fiable (verrouillé)" [ref=f1e783]:
                  - generic [ref=f1e798]: II
                - generic [ref=f1e811]: Fiable
                - generic [ref=f1e812]: Rare · II
                - generic [ref=f1e813]: 5 matchs notés 7,0 ou plus
                - generic [ref=f1e814]: 0 / 5
              - button "Hat-trick (verrouillé) Hat-trick Rare Marquer 3 buts dans un match 0 / 1" [ref=f1e817] [cursor=pointer]:
                - img "Hat-trick (verrouillé)" [ref=f1e818]
                - generic [ref=f1e877]: Hat-trick
                - generic [ref=f1e878]: Rare
                - generic [ref=f1e879]: Marquer 3 buts dans un match
                - generic [ref=f1e880]: 0 / 1
              - button "Homme du match (verrouillé) Homme du match Rare Être élu homme du match 0 / 1" [ref=f1e883] [cursor=pointer]:
                - img "Homme du match (verrouillé)" [ref=f1e884]
                - generic [ref=f1e905]: Homme du match
                - generic [ref=f1e906]: Rare
                - generic [ref=f1e907]: Être élu homme du match
                - generic [ref=f1e908]: 0 / 1
              - button "En feu (verrouillé) En feu Rare Être décisif (but ou passe) 3 matchs de suite 0 / 3" [ref=f1e911] [cursor=pointer]:
                - img "En feu (verrouillé)" [ref=f1e912]
                - generic [ref=f1e933]: En feu
                - generic [ref=f1e934]: Rare
                - generic [ref=f1e935]: Être décisif (but ou passe) 3 matchs de suite
                - generic [ref=f1e936]: 0 / 3
              - button "Perfectionniste (verrouillé) Perfectionniste Rare Réussir les 3 défis d’une même journée 0 / 3" [ref=f1e939] [cursor=pointer]:
                - img "Perfectionniste (verrouillé)" [ref=f1e940]
                - generic [ref=f1e965]: Perfectionniste
                - generic [ref=f1e966]: Rare
                - generic [ref=f1e967]: Réussir les 3 défis d’une même journée
                - generic [ref=f1e968]: 0 / 3
              - button "Premier but (verrouillé) Premier but Commun · I Marquer 1 but 0 / 1" [ref=f1e971] [cursor=pointer]:
                - img "Premier but (verrouillé)" [ref=f1e972]:
                  - generic [ref=f1e995]: I
                - generic [ref=f1e1007]: Premier but
                - generic [ref=f1e1008]: Commun · I
                - generic [ref=f1e1009]: Marquer 1 but
                - generic [ref=f1e1010]: 0 / 1
              - button "Premier service (verrouillé) Premier service Commun · I Délivrer 1 passe décisive 0 / 1" [ref=f1e1013] [cursor=pointer]:
                - img "Premier service (verrouillé)" [ref=f1e1014]:
                  - generic [ref=f1e1037]: I
                - generic [ref=f1e1049]: Premier service
                - generic [ref=f1e1050]: Commun · I
                - generic [ref=f1e1051]: Délivrer 1 passe décisive
                - generic [ref=f1e1052]: 0 / 1
              - button "Solide (verrouillé) Solide Commun · I 3 matchs notés 7,0 ou plus 0 / 3" [ref=f1e1055] [cursor=pointer]:
                - img "Solide (verrouillé)" [ref=f1e1056]:
                  - generic [ref=f1e1069]: I
                - generic [ref=f1e1081]: Solide
                - generic [ref=f1e1082]: Commun · I
                - generic [ref=f1e1083]: 3 matchs notés 7,0 ou plus
                - generic [ref=f1e1084]: 0 / 3
              - button "Doublé (verrouillé) Doublé Commun Marquer 2 buts dans un match 0 / 1" [ref=f1e1087] [cursor=pointer]:
                - img "Doublé (verrouillé)" [ref=f1e1088]
                - generic [ref=f1e1133]: Doublé
                - generic [ref=f1e1134]: Commun
                - generic [ref=f1e1135]: Marquer 2 buts dans un match
                - generic [ref=f1e1136]: 0 / 1
          - paragraph [ref=f1e1139]: "26 badges au total, dont 4 réservés aux gardiens. Note sur 10 calculée à partir des actions du match : but +0,8 ; passe décisive +0,5 ; victoire +0,4, défaite −0,4 ; homme du match +0,5 ; carton jaune −0,4, rouge −1,5 ; gardien : arrêt +0,1, but encaissé −0,15, clean sheet +1,0. Le total part de 6,0 et se rapproche de 10 sans l’atteindre, pour départager les grosses performances. Le Match des capitaines ne débloque aucun badge."
        - generic [ref=f1e1140]:
          - heading "Détail de l’XP" [level=2] [ref=f1e1141]
          - table [ref=f1e1143]:
            - rowgroup [ref=f1e1144]:
              - row [ref=f1e1145]:
                - columnheader [ref=f1e1146]:
                  - button "Date" [ref=f1e1147] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e1149]: ↑
                - columnheader [ref=f1e1150]:
                  - button "Adversaire" [ref=f1e1151] [cursor=pointer]
                - columnheader [ref=f1e1153]:
                  - button "B" [ref=f1e1154] [cursor=pointer]
                - columnheader [ref=f1e1156]:
                  - button "PD" [ref=f1e1157] [cursor=pointer]
                - columnheader [ref=f1e1159]:
                  - button "Import." [ref=f1e1160] [cursor=pointer]
                - columnheader [ref=f1e1162]:
                  - button "Résultat" [ref=f1e1163] [cursor=pointer]
                - columnheader [ref=f1e1165]:
                  - button "Sanctions" [ref=f1e1166] [cursor=pointer]
                - columnheader [ref=f1e1168]:
                  - button "Note" [ref=f1e1169] [cursor=pointer]
                - columnheader [ref=f1e1171]:
                  - button "XP" [ref=f1e1172] [cursor=pointer]
            - rowgroup
          - paragraph [ref=f1e1174]: Pas encore d’XP cette saison.
        - generic [ref=f1e1175]:
          - heading "Historique par saison" [level=2] [ref=f1e1176]
          - table [ref=f1e1178]:
            - rowgroup [ref=f1e1179]:
              - row [ref=f1e1180]:
                - columnheader [ref=f1e1181]:
                  - button "Saison" [ref=f1e1182] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e1184]: ↓
                - columnheader [ref=f1e1185]:
                  - button "MJ" [ref=f1e1186] [cursor=pointer]
                - columnheader [ref=f1e1188]:
                  - button "Buts" [ref=f1e1189] [cursor=pointer]
                - columnheader [ref=f1e1191]:
                  - button "Passes" [ref=f1e1192] [cursor=pointer]
                - columnheader [ref=f1e1194]:
                  - button "Tirs" [ref=f1e1195] [cursor=pointer]
                - columnheader [ref=f1e1197]:
                  - button "Cadrés" [ref=f1e1198] [cursor=pointer]
                - columnheader [ref=f1e1200]:
                  - button "Préc." [ref=f1e1201] [cursor=pointer]
                - columnheader [ref=f1e1203]:
                  - button "Tirs/but" [ref=f1e1204] [cursor=pointer]
                - columnheader [ref=f1e1206]:
                  - button "XP" [ref=f1e1207] [cursor=pointer]
            - rowgroup [ref=f1e1209]:
              - row [ref=f1e1210]:
                - cell "Saison 2026-2027" [ref=f1e1211]
                - cell "0" [ref=f1e1212]
                - cell "0" [ref=f1e1213]
                - cell "0" [ref=f1e1214]
                - cell "–" [ref=f1e1215]
                - cell "–" [ref=f1e1216]
                - cell "–" [ref=f1e1217]
                - cell "–" [ref=f1e1218]
                - cell "0" [ref=f1e1219]
        - paragraph [ref=f1e1220]: Test Carte cutout · XP calculé selon le barème de la saison, recalculé depuis les événements de match.
    - contentinfo [ref=f1e1221]:
      - generic [ref=f1e1222]:
        - generic [ref=f1e1223]:
          - img "Morocco Business League" [ref=f1e1224]
          - generic [ref=f1e1225]:
            - generic [ref=f1e1226]: Morocco Business League
            - paragraph [ref=f1e1227]: 1ère LIGUE DE FOOTBALL INTER‑ENTREPRISES AU MAROC
            - paragraph [ref=f1e1228]: الدوري الوطني للشركات لكرة القدم
            - link [ref=f1e1229]:
              - /url: https://www.ardentia.ma
              - text: Organisé par
              - img "Ardentia" [ref=f1e1230]
        - generic [ref=f1e1231]:
          - generic [ref=f1e1232]: Contact
          - link "contact@ardentia.ma" [ref=f1e1233]:
            - /url: mailto:contact@ardentia.ma
          - link "+212 6 43 04 79 84" [ref=f1e1237]:
            - /url: tel:+212643047984
          - link "39, Av Lalla Yaqout, 1er étage, Apt n°1, Casablanca" [ref=f1e1240]:
            - /url: https://www.google.com/maps/search/?api=1&query=39%2C%20Av%20Lalla%20Yaqout%2C%201er%20%C3%A9tage%2C%20Apt%20n%C2%B01%2C%20Casablanca
          - link "www.ardentia.ma" [ref=f1e1244]:
            - /url: https://www.ardentia.ma
          - generic [ref=f1e1248]:
            - link "WhatsApp" [ref=f1e1249]:
              - /url: https://wa.me/212643047984?text=Bonjour%2C%20je%20vous%20contacte%20depuis%20le%20site%20de%20la%20Morocco%20Business%20League.
            - link "Appeler" [ref=f1e1253]:
              - /url: tel:+212643047984
        - generic [ref=f1e1256]:
          - generic [ref=f1e1257]: Suivez-nous
          - list [ref=f1e1258]:
            - listitem [ref=f1e1259]:
              - link [ref=f1e1260]:
                - /url: https://www.instagram.com/morocco.business.league/
            - listitem [ref=f1e1266]:
              - link [ref=f1e1267]:
                - /url: https://www.instagram.com/ardentia.ma/
            - listitem [ref=f1e1273]:
              - link [ref=f1e1274]:
                - /url: https://www.linkedin.com/company/ardentia-agence/
          - generic [ref=f1e1279]:
            - link "Règlement" [ref=f1e1280]:
              - /url: /reglement
            - link "Discipline" [ref=f1e1281]:
              - /url: /discipline
            - link "Historique" [ref=f1e1282]:
              - /url: /historique
            - link "Pré-saison" [ref=f1e1283]:
              - /url: /pre-saison
            - link "Équipe type" [ref=f1e1284]:
              - /url: /equipe-type
            - link "Badges" [ref=f1e1285]:
              - /url: /badges
            - link "Glossaire" [ref=f1e1286]:
              - /url: /glossaire
            - link "Match des capitaines" [ref=f1e1287]:
              - /url: /match-des-capitaines
            - link "Média" [ref=f1e1288]:
              - /url: /media
            - link "Espace admin" [ref=f1e1289]:
              - /url: /admin
      - generic [ref=f1e1290]: © 2026 Morocco Business League · organisée par Ardentia
  - generic [ref=f1e1291]: Carte téléchargée
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