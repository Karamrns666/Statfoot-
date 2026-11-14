import{n as e}from"./rolldown-runtime-COiEfhsA.js";import{d as t,t as n}from"./clubs-Dau_Tvbx.js";import{B as r,h as i,j as a,l as o,o as s,p as c,v as l,z as u}from"./matchTime-plbU0zIc.js";import{p as d,y as f}from"./format-ConSPhzH.js";var p=`statfoot:v1:`,m=typeof window<`u`&&window.localStorage!==void 0,h=new Map,g=new Set;function _(e){if(!h.has(e)){let t=[];if(m)try{t=JSON.parse(window.localStorage.getItem(p+e)||`[]`)}catch{t=[]}h.set(e,t)}return h.get(e)}var v=null;function ee(e){v=e}function te(e,t){let n=v?_(e):[];if(h.set(e,t),v?.(e,n,t),m)try{window.localStorage.setItem(p+e,JSON.stringify(t))}catch(e){console.error(`localStorage plein ?`,e)}x(e)}var y=0,b=new Set;function x(e){y>0?b.add(e):g.forEach(t=>t(e))}var S={all(e){return _(e)},replace(e,t){te(e,t)},subscribe(e){return g.add(e),()=>{g.delete(e)}},batch(e){y++;try{return e()}finally{if(y--,y===0){let e=[...b];b.clear(),e.forEach(x)}}},getFlag(e){return m?window.localStorage.getItem(p+e):null},setFlag(e,t){m&&(t===null?window.localStorage.removeItem(p+e):window.localStorage.setItem(p+e,t))},clearAll(){h.clear(),m&&Object.keys(window.localStorage).filter(e=>e.startsWith(p)).forEach(e=>window.localStorage.removeItem(e))}};m&&window.addEventListener(`storage`,e=>{if(!e.key||!e.key.startsWith(p))return;let t=e.key.slice(12);h.delete(t),g.forEach(e=>e(t))});function C(){return Date.now().toString(36)+Math.random().toString(36).slice(2,10)}var w=[{name:`Arrow ECS`,short:`ARW`,aliases:[`ARROW ECS`,`Arrow`],c1:`#D9DDE2`,c2:`#1A1D21`},{name:`Atelier Vert Rabat`,short:`AVR`,aliases:[`ATELIER VERT-R`],c1:`#4A7729`,c2:`#0E1A08`},{name:`Atelier Vert Casa`,short:`AVC`,aliases:[`ATELIER VERT-C`],c1:`#4A7729`,c2:`#0E1A08`},{name:`Cobco`,short:`COB`,aliases:[`COBCO`],c1:`#005A83`,c2:`#06183A`},{name:`ALD Automotive`,short:`ALD`,aliases:[`ALD AUTOMOTIVE`,`ALD`],c1:`#1B2A4A`,c2:`#0A1124`},{name:`Pharmaprom`,short:`PHP`,aliases:[`PHARMAPROM`],c1:`#3A74C2`,c2:`#0A1E3D`},{name:`Taqeef (Midea)`,short:`MID`,aliases:[`MIDEA`,`TAQEEF`,`Taqeef Midea`,`TAQEEF (MIDEA)`],c1:`#1C6FA8`,c2:`#04223A`},{name:`Wafasalaf`,short:`WAF`,aliases:[`WAFASALAF`],c1:`#009CB3`,c2:`#04262A`},{name:`JTI`,short:`JTI`,aliases:[`JTI`],c1:`#22B24C`,c2:`#081B10`},{name:`Crédit Agricole`,short:`CAM`,aliases:[`CREDIT AGRICOLE`,`Crédit Agricole du Maroc`],c1:`#29756E`,c2:`#04241B`},{name:`G3C`,short:`G3C`,aliases:[`G3C`,`G3C.ma`],c1:`#78BF43`,c2:`#16171A`},{name:`Parebrise Express`,short:`PBE`,aliases:[`Parebrise Express`,`Pare-Brise Express`,`PBE`],c1:`#FFC20E`,c2:`#231F20`},{name:`Marjane Market`,short:`MJM`,aliases:[`MARJANE MARKET`,`Marjane`],c1:`#CF5014`,c2:`#2A1003`},{name:`Attijariwafa bank`,short:`ATW`,aliases:[`ATTIJARIWAFA BANK`,`Attijariwafa`],c1:`#F39200`,c2:`#2A1503`},{name:`Distra`,short:`DST`,aliases:[`DISTRA`],c1:`#8CC63F`,c2:`#13240A`},{name:`Michoc`,short:`MIC`,aliases:[`MICHOC`],c1:`#E30613`,c2:`#2A0406`},{name:`BMCI`,short:`BMC`,aliases:[`BMCI`],c1:`#00915A`,c2:`#05241A`},{name:`CTR`,short:`CTR`,aliases:[`CTR`,`Construction & Travaux Routiers`,`Construction et Travaux Routiers`],c1:`#2E44B0`,c2:`#0A1236`},{name:`Mega Post Tension`,short:`MPT`,aliases:[`MEGA PT`,`Mega PT`,`Mega Post-Tension`,`Mega Post Tension`],c1:`#1E90FF`,c2:`#0A1E33`},{name:`L'Heure Joyeuse`,short:`LHJ`,aliases:[`HEURE JOYEUSE`,`L'Heure Joyeuse`],c1:`#E2007A`,c2:`#2A0418`},{name:`CAC`,short:`CAC`,aliases:[`CAC`,`Centrale Automobile Chérifienne`],c1:`#285370`,c2:`#0A1724`}],T=e=>(e??``).normalize(`NFD`).replace(/[̀-ͯ]/g,``).toLowerCase().replace(/[^a-z0-9]+/g,``),E={CAM:`2026-11`},D=e=>{let t=e.short.toLowerCase(),n=E[e.short]?`?v=${E[e.short]}`:``;return{logo_url:`/logos/${t}.png${n}`,company_logo_url:`/logos/${t}-full.png${n}`}};function O(e,t=w){let n=new Set(e.map(T).filter(Boolean));return t.find(e=>[e.name,...e.aliases].some(e=>n.has(T(e))))??t.find(e=>n.has(T(e.short))&&[...n].some(e=>e.length<=4))}var ne=e=>!e||e.startsWith(`data:image/svg`)||e.startsWith(`/logos/`);function k(e,r,i=w){let a=e.Team.filter(n=>t(n,e.Competition)===r),o=[],s=[],c=[],l=new Set;for(let t of a){let a=O([t.name,t.company,t.short_name],i);if(a&&!l.has(a.short)){l.add(a.short);let e=ne(t.logo_url)&&t.logo_url!==D(a).logo_url;o.push({team:t,official:a,rename:t.name===a.name?void 0:t.name,logo:e})}else if(a)c.push({team:t,official:a});else{let i=e.Match.filter(e=>e.season_id===r&&(e.home_team_id===t.id||e.away_team_id===t.id)),a=e.Player.filter(e=>e.team_id===t.id),o=n(t);s.push({team:t,players:a,matches:i,keepClub:e.Team.some(e=>e.id!==t.id&&n(e)===o)})}}for(let t of c){let i=e.Match.filter(e=>e.season_id===r&&(e.home_team_id===t.team.id||e.away_team_id===t.team.id));s.push({team:t.team,players:e.Player.filter(e=>e.team_id===t.team.id),matches:i,keepClub:e.Team.some(e=>e.id!==t.team.id&&n(e)===n(t.team))})}return{seasonId:r,kept:o,created:i.filter(e=>!l.has(e.short)),removed:s,duplicates:c}}var A=e=>!e.created.length&&!e.removed.length&&!e.kept.some(e=>e.rename||e.logo);function j(e,t,r={}){let i=r.idFor??(e=>`t${t.seasonId.replace(/\D/g,``).slice(2,4)||`26`}_${e.short.toLowerCase()}`),a=new Set(t.removed.map(e=>e.team.id)),o=new Set(t.removed.flatMap(e=>e.matches.map(e=>e.id))),s=new Map(t.kept.map(e=>[e.team.id,e])),c=e.Team.filter(e=>!a.has(e.id)).map(e=>{let n=s.get(e.id);return n?{...e,name:n.official.name,...n.logo?D(n.official):{},season_id:e.season_id??t.seasonId}:e}),l=e.Club.filter(e=>!t.removed.some(t=>!t.keepClub&&n(t.team)===e.id)),u=new Set(e.Team.map(e=>e.id));for(let e of t.created){let n=i(e),r=2;for(;u.has(n);)n=`${i(e)}_${r++}`;u.add(n),c.push({id:n,name:e.name,short_name:e.short,company:e.name,...D(e),primary_color:e.c1,secondary_color:e.c2,status:`active`,season_id:t.seasonId,club_id:`club_${n}`}),l.some(e=>e.id===`club_${n}`)||l.push({id:`club_${n}`,name:e.name,logo_url:D(e).logo_url})}let d=c.filter(t=>!e.Team.some(e=>e.id===t.id)).map(e=>e.id),f=new Set([...t.kept.map(e=>e.team.id),...d]),p=e.Competition.map(e=>{if(e.season_id!==t.seasonId)return e;let n=(e.team_ids??[]).filter(e=>!a.has(e));return e.phase===`league_phase`?{...e,team_ids:[...f].sort()}:{...e,team_ids:n}}),m=new Set(t.removed.flatMap(e=>e.players.map(e=>e.id)));return{Team:c,Club:l,Competition:p,Player:e.Player.filter(e=>!m.has(e.id)),Match:e.Match.filter(e=>!o.has(e.id)),MatchEvent:e.MatchEvent.filter(e=>!o.has(e.match_id)),Lineup:e.Lineup.filter(e=>!o.has(e.match_id)),MatchTeamStats:e.MatchTeamStats.filter(e=>!o.has(e.match_id))}}function re(e){return{gardees:e.kept.filter(e=>!e.rename).map(e=>e.official.name),renommees:e.kept.filter(e=>e.rename).map(e=>`${e.rename} → ${e.official.name}`),creees:e.created.map(e=>e.name),retirees:e.removed.map(e=>`${e.team.name} (${e.players.length} joueur(s), ${e.matches.length} match(s)${e.keepClub?`, club et historique conservés`:``})`)}}var M=`season_2026`,ie=e=>`t26_${e.toLowerCase()}`;function ae(){let e={id:M,name:`Saison 2026-2027`,start_date:`2026-08-22`,status:`active`,is_active:!0,league_phase_rounds:0,cup_rounds:10,gold_size:12,rulebook_version:`v9`},t=[];for(let e of w)t.push({id:ie(e.short),name:e.name,short_name:e.short,company:e.name,...D(e),primary_color:e.c1,secondary_color:e.c2,status:`active`});return{season:e,teams:t,competitions:[{id:`comp_2026_selection`,season_id:e.id,name:`Pré-saison`,phase:`league_phase`,format:`swiss`,status:`draft`,team_ids:t.map(e=>e.id).sort(),half_duration_min:l.duration.halfMin,foul_alert_threshold:5,color:`#F85A00`,order:1,description:`Un seul groupe · matchs tirés au sort`}]}}var oe=`# PRÉAMBULE

Le présent règlement régit l'ensemble des matchs et compétitions organisés par Ardentia sur ses terrains de football en gazon synthétique à 6 joueurs. Son objectif est d'assurer la sécurité des participants, la fluidité du jeu et le respect du fair-play. Tout participant — joueur, remplaçant, officiel d'équipe ou spectateur — est réputé avoir pris connaissance de ce règlement et s'engage à le respecter.

En cas de situation non prévue par le présent règlement, l'arbitre tranche en accord avec les principes généraux du football à 6 et, si nécessaire, en concertation avec le comité organisateur Ardentia. Sa décision est définitive.

# ARTICLE 1 — LE TERRAIN ET LE MATÉRIEL

## 1.1 Le terrain

Les matchs se déroulent sur les terrains en gazon synthétique mis à disposition par le partenaire d'Ardentia. Les terrains abritent des matchs de 6 joueurs contre 6 joueurs.

## 1.2 Le ballon

Le ballon officiel utilisé lors de tous les matchs est de taille 5. Il est fourni par Ardentia. En cas de dommage au ballon en cours de jeu, l'arbitre arrête le jeu, fait remplacer le ballon et reprend avec une balle à terre à l'endroit où le ballon a été endommagé.

## 1.3 La zone de remplacement

Les remplaçants et le staff technique doivent se tenir dans la zone qui leur est réservée, à l'intérieur de l'enceinte du terrain. Cette zone est délimitée par des plots visibles. Il est interdit aux remplaçants et au staff technique de sortir de cette zone sans l'autorisation de l'arbitre.

Les remplacements s'effectuent exclusivement par la porte du terrain. Tout joueur sortant du terrain est tenu de fermer la porte derrière lui afin d'éviter tout risque de blessure. Le non-respect de cette consigne constitue une faute de sécurité pouvant être sanctionnée par un avertissement verbal.

# ARTICLE 2 — LES JOUEURS

## 2.1 Composition des équipes

Un match se joue entre deux équipes, chacune composée d'un maximum de six (6) joueurs sur le terrain, dont obligatoirement un gardien de but.

Chaque équipe peut disposer d'un maximum de six (6) remplaçants.

## 2.2 Nombre minimum de joueurs

Le nombre minimum de joueurs requis pour débuter et poursuivre un match est de quatre (4) joueurs par équipe, gardien de but compris.

-   Si, avant le coup d'envoi, une équipe ne dispose pas d'au moins quatre (4) joueurs après l'expiration du délai de carence (voir Article 14.1), le match est déclaré perdu par forfait pour cette équipe.

-   Si, en cours de match, une équipe tombe en dessous de quatre (4) joueurs suite à des expulsions ou blessures ne pouvant être remplacées, le match est définitivement arrêté. L'équipe concernée est déclarée perdante par forfait sur le score de 3-0, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 2.3 Inscription et liste des joueurs

Les noms complets des joueurs et remplaçants, tels qu'ils figurent sur leur carte d'identité nationale (CIN), doivent être communiqués à Ardentia lors de la période des inscriptions, avant le début de la compétition. Ces listes servent à garantir la couverture d'assurance et à assurer le fair-play.

Tout joueur dont le nom n'est pas mentionné sur la liste de l'équipe est strictement interdit de participation. Si un joueur non inscrit est découvert en cours de match, l'arbitre l'expulse immédiatement. Tout but marqué par ce joueur non inscrit est refusé rétroactivement, et le joueurs est expulsé du terrain.

Un joueur peut être ajouté ou retiré de la liste de l'équipe sur demande écrite (email) du capitaine auprès d'Ardentia, au moins 48 heures avant le prochain match, afin de permettre la mise à jour de la couverture d'assurance. Sans le respect de ce ce délai, le joueurs ne peut faire partie du match.

## 2.4 Procédure de remplacement

Un nombre illimité de remplacements peut être effectué au cours d'un match. Un remplacement ne peut avoir lieu que lorsque le ballon n'est pas en jeu. Les règles suivantes s'appliquent :

-   Le joueur remplacé quitte le pelouse vers la zone des remplaçants.

-   Le joueur remplacé avise l'arbitre avant de quitter le pelouse.

-   Les remplaçants portent obligatoirement des dossards d'une couleur distincte de celle des joueurs présents sur le terrain.

-   Avant d'entrer sur la pelouse, le remplaçant remet son dossard au joueur remplacé. Le remplaçant ne peut pas entrer sur la pelouse tant que cet échange de dossard n'a pas eu lieu.

-   Le remplaçant n'entre sur la pelouse qu'après le départ complet du joueur remplacé.

-   À partir du moment où le remplaçant entre sur le terrain, il devient joueur et le joueur remplacé devient remplaçant.

-   L'autorisation de procéder à un remplacement peut être refusée par l'arbitre si l'équipement du remplaçant n'est pas conforme.

-   Tous les joueurs, remplaçants et staff technique sont soumis à l'autorité de l'arbitre.

Si un joueur de champ effectue un remplacement sans aviser l'arbitre, il reçoit un avertissement verbal. En cas de récidive, l'arbitre lui adresse un carton jaune, voire rouge selon la gravité.

Si un remplaçant entre sur la pelouse avant le départ complet du joueur remplacé :

-   L'arbitre arrête le jeu (sauf application de la règle de l'avantage).

-   Le remplaçant est averti et invité à quitter immédiatement la pelouse.

-   Le jeu reprend par un coup franc indirect accordé à l'équipe adverse, à l'endroit où se trouvait le remplaçant irrégulier.

## 2.5 Sanctions impliquant les remplaçants et officiels d'équipe

Si un remplaçant ou un officiel du staff technique reçoit un carton rouge, son équipe doit retirer un joueur de champ pendant deux (2) minutes, sauf si un but est marqué par l'équipe adverse avant la fin de cette période, auquel cas un remplaçant peut entrer pour rétablir la parité numérique. Le remplaçant ou officiel expulsé ne peut plus participer au match sous quelque forme que ce soit.

Si un remplaçant reçoit un carton jaune alors qu'il est sur le banc, il portera cette sanction lorsqu'il entrera sur le terrain.

## 2.6 Changement de gardien de but

-   Tout joueur ou remplaçant peut prendre le rôle de gardien de but, à condition d'en informer l'arbitre lors d'un arrêt de jeu et de revêtir un dossard de couleur distincte.

-   Le changement doit obligatoirement se faire lors d'un arrêt du jeu et avec l'autorisation expresse de l'arbitre.

-   Si un joueur assume le rôle de gardien sans en informer l'arbitre et touche le ballon de la main dans sa surface, son équipe est sanctionnée d'un penalty.

-   Aucun changement de gardien n'est autorisé après le sifflement d'un penalty, sauf en cas de blessure grave constatée et validée par l'arbitre et Ardentia.

-   Lors des phases éliminatoires, si un match est décidé aux tirs au but, le gardien en place au moment du coup de sifflet final ne peut pas être changé, sauf blessure grave.

## 2.7 Joueurs et remplaçants expulsés

Un joueur expulsé (carton rouge) doit quitter immédiatement le terrain. Il ne peut plus participer au match.

Son équipe joue en infériorité numérique pendant deux (2) minutes de temps de jeu effectif. Un remplaçant peut entrer pour combler cette infériorité selon les conditions suivantes :

-   6 joueurs contre 5, ou 5 contre 4 : si l'équipe la plus nombreuse marque un but, l'équipe réduite peut faire entrer un remplaçant.

-   Si les deux équipes jouent à effectifs réduits égaux (ex : 5 contre 5, 4 contre 4) et qu'un but est marqué, aucune équipe ne récupère un joueur avant la fin de la réduction numérique respective de deux minutes.

-   6 joueurs contre 4 : si l'équipe à 6 marque, l'équipe à 4 ne peut faire entrer qu'un seul remplaçant (portant à 5 son effectif).

-   Si l'équipe en infériorité marque un but, le jeu continue sans modification du nombre de joueurs jusqu'à l'écoulement des deux minutes.

**Tout joueur expulsé par l'arbitre doit quitter immédiatement le terrain. En cas de refus de sortie, l'arbitre accorde un délai maximal de 5 minutes pour que le ou les joueurs concernés quittent le terrain. À défaut d'exécution dans ce délai, la rencontre est arrêtée et l'équipe du ou des joueurs expulsés est déclarée perdante par forfait.**

## 2.8 But marqué avec une personne supplémentaire sur le terrain

Si, après qu'un but est marqué et que le jeu a repris, l'arbitre constate qu'une personne supplémentaire se trouvait sur le terrain au moment du but, le but ne peut pas être refusé rétroactivement.

Si l'arbitre constate la présence d'une personne supplémentaire avant la reprise du jeu :

-   Le but est refusé si la personne supplémentaire appartenait à l'équipe ayant marqué (joueur, remplaçant, expulsé ou officiel). Le jeu reprend par un coup franc direct pour l'équipe adverse à l'endroit où se trouvait cette personne.

-   Le but est refusé si la personne supplémentaire était un agent extérieur ayant gêné le jeu. Le jeu reprend par une balle à terre.

Dans tous les cas, l'arbitre fait sortir la personne supplémentaire de la pelouse.

## 2.9 Capitaine d'équipe

Chaque équipe désigne un capitaine avant le début du match. Le capitaine est identifiable par un brassard. Il est le seul joueur autorisé à s'adresser à l'arbitre pour demander des éclaircissements sur une décision, et ce, de manière respectueuse et calme. Toute autre forme d'interpellation de l'arbitre par d'autres joueurs est passible d'avertissement.

Le capitaine est responsable du comportement de son équipe et de ses supporters. En cas d'incidents répétés, l'arbitre peut tenir le capitaine pour responsable disciplinairement.

# ARTICLE 3 — L'ÉQUIPEMENT DES JOUEURS

## 3.1 Sécurité

Aucun joueur ne peut utiliser ou porter un équipement ou objet dangereux pour lui-même ou pour autrui. Sont notamment interdits :

-   Tous bijoux : colliers, bagues, bracelets, boucles d'oreilles, élastiques métalliques. L'usage de ruban adhésif pour couvrir les bijoux n'est pas autorisé.

-   Chaussures à crampons métalliques ou tout autre équipement susceptible d'endommager le gazon synthétique ou de blesser un adversaire.

Si un joueur porte un équipement non autorisé, l'arbitre lui ordonne de le retirer. Si le joueur ne peut ou ne veut pas s'y conformer, il quitte le terrain au prochain arrêt. Un refus de se conformer, ou le port répété d'un article interdit, est sanctionné par un carton jaune.

## 3.2 Couleurs et tenues

Les deux équipes doivent porter des couleurs qui les distinguent l'une de l'autre ainsi que des officiels de match. Si les deux équipes portent des couleurs similaires, l'arbitre procède à un tirage au sort en présence des deux capitaines pour désigner l'équipe devant revêtir des dossards distinctifs fournis par Ardentia.

Le gardien de but doit obligatoirement porter un dossard d'une couleur distincte de celle de ses coéquipiers et de celle de l'équipe adverse.

## 3.3 Équipements de protection autorisés

Les équipements de protection non dangereux sont autorisés : masques de protection, lunettes de sport homologuées, genouillères et coudières en matériau rembourré souple. Ces équipements doivent être présentés à l'arbitre avant le match pour validation.

# ARTICLE 4 — L'ARBITRE

## 4.1 Autorité de l'arbitre

Chaque match est dirigé par un arbitre désigné par Ardentia. L'arbitre a pleine autorité pour faire respecter le présent règlement durant toute la durée du match, depuis son entrée sur le terrain jusqu'à sa sortie après le coup de sifflet final (y compris pendant les tirs au but).

## 4.2 Décisions de l'arbitre

Les décisions de l'arbitre sur les faits de jeu — y compris l'attribution d'un but et le résultat du match — sont définitives et sans appel immédiat. Elles prévalent sur celles des organisateurs présents sur place.

Si un assistant de match signale une infraction mais que l'arbitre ne l'observe qu'après la reprise du jeu, l'arbitre peut prendre les mesures disciplinaires appropriées, mais la sanction de reprise de jeu liée à la faute ne s'applique pas.

Toute protestation excessive contre une décision arbitrale — y compris de la part du capitaine — peut entraîner un avertissement verbal ou un carton jaune, selon l'appréciation de l'arbitre.

## 4.3 Pouvoirs et devoirs de l'arbitre

L'arbitre est investi des missions suivantes :

-   Appliquer le présent règlement Ardentia.

-   Vérifier l'équipement des joueurs avant le coup d'envoi.

-   Tenir un registre des incidents du match (cartons, buts, expulsions).

-   Agir comme chronométreur officiel du match.

-   Arrêter, suspendre ou abandonner le match en cas de problème (interférence extérieure, projecteurs défaillants, animal sur le terrain, conditions météorologiques dangereuses). En cas d'interférence extérieure affectant le jeu, le jeu reprend par une balle à terre, sauf si le ballon pénètre dans le but sans intervention de l'agent extérieur, auquel cas le but est accordé.

-   Arrêter le jeu en cas de blessure grave et veiller à ce que le joueur blessé soit retiré du terrain. Un joueur blessé ne peut pas être soigné sur le terrain sauf dans les cas suivants : collision entre gardien et joueur de champ, collision entre deux joueurs de la même équipe, blessure grave, penalty accordé au joueur blessé (qu'il soit tireur ou gardien).

-   Décider, avec l'aide des organisateurs, des incidents dont il n'a pas été directement témoin.

-   Garantir qu'aucune personne non autorisée ne pénètre sur le terrain.

-   Demander au capitaine de l'une ou l'autre équipe de calmer ses spectateurs lorsque leur comportement perturbe le bon déroulement du match. Si nécessaire, l'arbitre arrête le jeu jusqu'au retour au calme.

-   En cas de défaillance du chronomètre, aviser immédiatement Ardentia pour en obtenir un de remplacement.

## 4.4 Équipement obligatoire de l'arbitre

-   Au moins un sifflet.

-   Cartons rouges et jaunes.

-   Un carnet (ou tout autre support) pour la tenue du registre du match.

-   Au moins une montre ou chronomètre.

# ARTICLE 5 — LA DURÉE DU MATCH

## 5.1 Périodes de jeu

Un match se compose de deux (2) périodes de vingt (20) minutes chacune de temps de jeu effectif. Le chronomètre est arrêté à chaque interruption de jeu (blessures, remplacements, litiges, etc.) et repris à la reprise du jeu.

## 5.2 Temps morts et arrêts de jeu

L'arbitre est responsable du décompte de tous les temps morts et s'assure qu'ils sont ajoutés au temps officiel du match. La durée totale cumulée des arrêts de jeu ne peut excéder dix (10) minutes par match. Au-delà de ce seuil, l'arbitre peut, à sa discrétion et après concertation avec Ardentia, suspendre ou arrêter le match.

## 5.3 Intervalle à la mi-temps

Les joueurs ont droit à une pause à la mi-temps ne dépassant pas cinq (5) minutes. À l'issue de la pause, les équipes changent de côté de terrain. Les officiels d'équipe et remplaçants changent également de banc.

## 5.4 Fin des périodes

L'arbitre siffle la fin de chaque période de vingt minutes. Il peut prolonger une période pour permettre l'exécution d'un coup franc, d'un penalty ou d'un corner accordé juste avant le coup de sifflet final.

## 5.5 Prolongation

Il n'y a pas de prolongation dans le cadre de ce règlement. En phases éliminatoires, en cas d'égalité à l'issue du temps réglementaire, les équipes passent directement aux tirs au but (voir Article 13).

# ARTICLE 6 — LE COUP D'ENVOI ET LA REPRISE DU JEU

## 6.1 Coup d'envoi

Avant le début du match, l'arbitre effectue un tirage au sort (pièce de monnaie) en présence des deux capitaines. L'équipe gagnante choisit le sens d'attaque pour la première période ; l'équipe perdante effectue le coup d'envoi. À la mi-temps, les rôles s'inversent.

Le coup d'envoi est effectué depuis le centre du terrain au coup de sifflet de l'arbitre. Le ballon doit être stationnaire au centre. Les joueurs de l'équipe adverse doivent se trouver dans leur propre moitié de terrain. Le ballon est en jeu dès qu'il est touché. Un but peut être marqué directement sur un coup d'envoi.

## 6.2 Reprise après un but

Après qu'un but est accordé, le jeu reprend par un coup d'envoi effectué par l'équipe qui a encaissé le but, depuis le centre du terrain.

## 6.3 Balle à terre

Une balle à terre est accordée lorsque l'arbitre a arrêté le jeu sans qu'aucune infraction n'ait été commise (blessure, objet sur le terrain, etc.). La procédure est la suivante :

-   L'arbitre lâche le ballon à l'endroit où il se trouvait au moment de l'arrêt (ou à l'endroit le plus proche en jeu).

-   Le ballon est en jeu dès qu'il touche le sol.

-   Les joueurs adverses doivent se tenir à au moins un (1) mètre du ballon jusqu'à ce qu'il soit en jeu.

-   Si la balle à terre doit être donnée dans la surface de réparation, elle est donnée sur la ligne de surface de réparation la plus proche du point d'arrêt.

# ARTICLE 7 — LE HORS-JEU

La règle du hors-jeu ne s'applique pas dans ce format de jeu. Aucun joueur ne peut être sanctionné pour hors-jeu, quelle que soit sa position sur le terrain.

# ARTICLE 8 — LES REMISES EN JEU (TOUCHES)

## 8.1 Accord d'une remise en jeu

Une remise en jeu est accordée lorsque le ballon franchit entièrement la ligne de touche (latérale) — que ce soit au sol ou en l'air — au dernier contact d'un joueur de l'équipe adverse.

## 8.2 Procédure

La remise en jeu se fait au pied (coup de pied de touche). Les règles suivantes s'appliquent :

-   Le ballon doit être posé, immobile, sur la ligne de touche, à l'endroit exact où il est sorti.

-   Le joueur effectuant la remise dispose de cinq (5) secondes pour jouer le ballon, à partir du moment où celui-ci est posé sur la ligne.

-   Les adversaires doivent se tenir à au moins cinq (5) mètres du point de remise en jeu.

-   Le joueur effectuant la remise ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

-   Un but ne peut pas être marqué directement depuis une remise en jeu en touche.

Si le joueur dépasse le délai de cinq (5) secondes, ou s'il ne pose pas le ballon sur la ligne de touche, la remise en jeu est accordée à l'équipe adverse.

## 8.3 Ballon sorti en fond de terrain

Si le ballon sort entièrement par la ligne de fond (ligne de but) sans qu'un but ne soit marqué, les règles suivantes s'appliquent selon le dernier contact :

-   Dernier contact d'un défenseur : corner accordé à l'équipe attaquante (voir Article 9).

-   Dernier contact d'un attaquant : coup de pied de but accordé à l'équipe défendante (voir Article 10).

# ARTICLE 9 — LES CORNERS

## 9.1 Accord d'un corner

Un corner est accordé à l'équipe attaquante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe défendante.

## 9.2 Procédure

-   Le ballon est posé, immobile, dans l'arc de corner le plus proche du point de sortie.

-   Le tireur dispose de huit (8) secondes pour frapper le ballon, à partir du moment où celui-ci est posé dans l'arc de corner.

-   Les joueurs adverses doivent se tenir à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Le ballon est en jeu dès qu'il est frappé.

-   Un but peut être marqué directement depuis un corner.

-   Le tireur ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

## 9.3 Infractions

Si le tireur dépasse le délai de huit (8) secondes ou ne respecte pas la procédure, le jeu reprend par un coup de pied de but en faveur de l'équipe adverse. Si un adversaire pénètre dans la zone des cinq mètres avant la frappe, le corner est retiré.

# ARTICLE 10 — LES COUPS DE PIED DE BUT

## 10.1 Accord d'un coup de pied de but

Un coup de pied de but est accordé à l'équipe défendante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe attaquante.

## 10.2 Procédure

-   Le gardien de but (ou tout joueur défenseur désigné) effectue le coup de pied de but depuis n'importe quel point à l'intérieur de la surface de réparation.

-   Le ballon est en jeu dès qu'il sort de la surface de réparation.

-   Les joueurs adverses doivent se trouver hors de la surface de réparation jusqu'à ce que le ballon soit en jeu.

-   Le gardien dispose de quatre (4) secondes pour mettre le ballon en jeu après l'avoir récupéré.

-   Un but peut être marqué directement depuis un coup de pied de but.

-   Le joueur effectuant le coup de pied ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

# ARTICLE 11 — FAUTES ET INCONDUITES

## 11.1 Coup franc direct

Toute infraction impliquant un contact avec un adversaire est sanctionnée par un coup franc direct ou, si elle est commise par un joueur dans sa propre surface de réparation, par un penalty (voir Article 11.4).

Un coup franc direct est accordé à l'équipe adverse lorsqu'un joueur commet l'une des infractions suivantes de manière jugée insouciante, imprudente ou avec usage excessif de la force :

-   Tacler ou défier un adversaire de manière dangereuse.

-   Sauter sur un adversaire.

-   Charger un adversaire.

-   Frapper ou tenter de frapper un adversaire.

-   Pousser un adversaire.

-   Mordre ou cracher sur quelqu'un.

-   Tenir un adversaire.

-   Faire trébucher ou tenter de faire trébucher un adversaire.

-   Toucher intentionnellement le ballon avec la main ou le bras (sauf le gardien dans sa surface).

L'évaluation de la faute suit les degrés suivants :

-   **Insouciance :** le joueur fait preuve d'un manque d'attention ou de considération en disputant le ballon, ou agit sans précaution. Coup franc direct, sans sanction disciplinaire.

-   **Imprudence :** le joueur agit sans tenir compte du danger ou des conséquences de son geste pour l'adversaire. Coup franc direct et carton jaune obligatoire.

-   **Usage excessif de la force :** le joueur dépasse la force nécessaire et/ou met en danger la sécurité d'un adversaire. Coup franc direct et carton rouge obligatoire (expulsion).

## 11.2 Coup franc indirect

Un coup franc indirect sanctionne une infraction commise sans contact avec un adversaire. Il est accordé à l'équipe adverse si un joueur :

-   Joue de manière dangereuse sans contact (ex. : tenter une tête alors qu'un adversaire s'apprête à botter le ballon à hauteur de la tête).

-   Fait obstruction à la progression d'un adversaire sans contact.

-   Empêche le gardien de lâcher le ballon.

-   Est coupable de dissidence, langage ou gestes offensants, insultants ou abusifs.

Un coup franc indirect est également accordé à l'équipe adverse si le gardien :

-   Touche le ballon avec les mains ou les bras à l'intérieur de sa surface de réparation après qu'il a été délibérément botté par un coéquipier (règle de la passe en retour).

-   Reçoit directement dans les mains une rentrée de touche effectuée au pied par un coéquipier.

Le gardien est considéré comme en contrôle du ballon lorsque : il le tient dans ses mains, le fait rebondir sur le sol ou le projette en l'air.

Sur un coup franc indirect, un but ne peut être accordé que si le ballon a touché un autre joueur avant de pénétrer dans le but.

## 11.3 Le mur et la distance réglementaire

Les règles suivantes s'appliquent à tout coup franc, direct ou indirect :

-   Lors d'un coup franc adverse, les joueurs formant le mur doivent se placer à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Lorsque le coup franc est sifflé dans la propre moitié de terrain de l'équipe qui en bénéficie, aucun mur n'est autorisé : les adversaires doivent simplement se tenir à cinq (5) mètres du ballon.

-   Tout joueur qui ne respecte pas la distance réglementaire est passible d'un carton jaune (voir Article 11.5).

## 11.4 Le penalty

Un penalty est accordé lorsqu'un joueur commet, dans sa propre surface de réparation, l'une des infractions passibles d'un coup franc direct, que le ballon soit en jeu ou non.

Procédure d'exécution d'un penalty :

-   Le ballon est placé sur le point de penalty tracé sur le terrain.

-   Le gardien adverse se place sur sa ligne de but, entre les poteaux, et ne peut pas avancer avant que le ballon soit frappé.

-   Tous les autres joueurs (des deux équipes) se placent en dehors de la surface de réparation et derrière le ballon (ou sur la ligne de but adjacente) jusqu'à ce que le ballon soit frappé.

-   Le tireur désigné frappe le ballon vers l'avant en un seul mouvement. Tout arrêt complet du mouvement lors de l'élan est sanctionné par un coup franc indirect en faveur de l'équipe défendante.

-   Si le gardien avance prématurément et que le tir est manqué ou repoussé, le penalty est retiré. Si le tir est transformé, le but est accordé.

-   Si le ballon rebondit sur les poteaux ou la barre et revient en jeu, tout joueur peut jouer le ballon, y compris le tireur.

-   Si le temps réglementaire expire avant l'exécution du penalty, celui-ci est tout de même tiré et le match se termine à l'issue de son exécution.

## 11.5 Cartons jaunes — Avertissements

Un carton jaune est délivré à un joueur, remplaçant ou officiel d'équipe pour l'une des raisons suivantes :

-   Comportement antisportif (simulation, protestation excessive, jeu déloyal).

-   Dissidence par les mots ou les gestes envers l'arbitre.

-   Infractions répétées aux règles du jeu.

-   Retarder la reprise du jeu.

-   Ne pas respecter la distance requise lors d'un coup franc, corner ou remise en jeu.

-   Entrer ou quitter le terrain sans autorisation.

-   Imprudence dans un tacle ou une charge.

Deux (2) cartons jaunes dans le même match entraînent automatiquement un carton rouge (expulsion).

Les cartons ne sont pas cumulables d'un match à un autre.

## 11.6 Cartons rouges — Expulsions

Un carton rouge est délivré pour l'une des raisons suivantes, entraînant l'expulsion immédiate du joueur :

-   Faute grossière (tacle ou charge mettant en danger l'intégrité physique d'un adversaire).

-   Comportement violent (coup, tentative de coup, morsure, crachat).

-   Déni d'une occasion de but manifeste par une faute de main volontaire (hors gardien dans sa surface).

-   Déni d'une occasion de but manifeste par une faute physique.

-   Langage ou gestes offensants, insultants ou abusifs envers quiconque.

-   Deux cartons jaunes dans le même match.

Un joueur expulsé quitte le terrain immédiatement. Son équipe joue en infériorité numérique pendant deux (2) minutes (voir Article 2.7). Le joueur expulsé ne peut plus participer au match.

## 11.7 Erreur d'identification lors d'un carton

Si l'arbitre se rend compte, avant la reprise du jeu, qu'il a attribué un carton au mauvais joueur, il annule la sanction envers ce joueur et l'attribue au joueur fautif. Toute réclamation pour erreur d'identification doit être soulevée immédiatement et avant la reprise du jeu.

# ARTICLE 12 — LES BUTS

## 12.1 But valide

Un but est accordé lorsque la totalité du ballon franchit entièrement la ligne de but, entre les poteaux et sous la barre transversale, à condition qu'aucune infraction n'ait été commise par l'équipe marquant le but. Un but est accordé si le gardien lance le ballon directement dans le but adverse.

## 12.2 But refusé

Un but est refusé dans les cas suivants :

-   Une infraction a été commise par l'équipe attaquante avant ou pendant l'action menant au but.

-   Une personne supplémentaire appartenant à l'équipe attaquante se trouvait sur le terrain (voir Article 2.8).

-   Le ballon a été touché par un agent extérieur appartenant à l'équipe attaquante avant d'entrer dans le but.

# ARTICLE 13 — LES TIRS AU BUT

## 13.1 Quand sont-ils organisés ?

Les tirs au but sont organisés exclusivement lors des phases éliminatoires en cas d'égalité à l'issue du temps réglementaire. Ils ne font pas partie du match et les statistiques de la série de tirs au but ne sont pas comptabilisées dans les buts du match.

## 13.2 Désignation du but et ordre de tir

-   L'arbitre effectue un tirage au sort en présence des deux capitaines pour désigner le but dans lequel les tirs seront effectués.

-   Un second tirage au sort détermine l'équipe qui tire en premier.

-   Chaque équipe désigne cinq (5) tireurs parmi les joueurs qui se trouvaient sur le terrain au coup de sifflet final. Un joueur expulsé ne peut pas participer aux tirs au but.

-   L'ordre de passage des tireurs est librement choisi par chaque équipe.

## 13.3 Procédure de chaque tir

-   Les joueurs qui ne tirent pas se regroupent au centre du terrain, à au moins dix (10) mètres des tireurs.

-   Seul le tireur désigné et les deux gardiens sont autorisés dans la moitié de terrain des buts.

-   Le gardien doit rester sur sa ligne de but jusqu'à ce que le ballon soit frappé.

-   Les mêmes règles que pour un penalty en cours de match s'appliquent (voir Article 11.4).

## 13.4 Issue de la série initiale

L'équipe qui marque le plus de tirs sur les cinq tentatives de chaque côté est déclarée vainqueur. Si les deux équipes sont toujours à égalité après la série de cinq tirs chacune, la séance se poursuit en mort subite : les mêmes cinq joueurs tirent à nouveau, dans le même ordre ou un ordre différent choisi par l'équipe, jusqu'à ce qu'une équipe marque et que l'autre manque sur le même numéro de tir.

# ARTICLE 14 — FORFAIT ET MATCHS NON JOUÉS

## 14.1 Non-présentation et délai de carence

Si une équipe ne se présente pas ou ne réunit pas le nombre minimum de joueurs (4) dans un délai de quinze (15) minutes après l'heure officielle de début du match, le match lui est attribué par forfait. Le score officiel est fixé à 3-0 en faveur de l'équipe présente.

En cas de force majeure dûment justifiée et communiquée à Ardentia avant le début du délai de carence, Ardentia se réserve le droit d'examiner la situation, étant entendu que les reports de matchs ne sont pas acceptés en règle générale (voir Article 17.5).

## 14.2 Équipe avec un effectif en dessous du minimum en cours de match

Si, en cours de match, une équipe se retrouve avec moins de quatre (4) joueurs suite à des expulsions ou blessures sans remplaçants disponibles, le match est arrêté. L'équipe concernée est déclarée perdante par forfait. Le score retenu est 3-0 en sa défaveur, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 14.3 Forfait général (retrait d'une équipe de la compétition)

Une équipe qui déclare forfait pour le reste de la compétition est retirée de celle-ci. Cette règle s'applique au championnat et à la phase de groupes du tournoi. Tous les matchs déjà disputés par l'équipe forfait sont annulés, et ses matchs restants ne sont pas joués. Les conséquences sont les suivantes :

-   **Points :** chaque équipe qui avait battu l'équipe forfait perd les trois (3) points de cette victoire. Chaque équipe qui avait fait match nul contre elle perd un (1) point. Les équipes qui avaient perdu contre elle ne perdent aucun point.

-   **Buteurs :** les buts marqués par des joueurs contre l'équipe forfait sont retirés de leur total personnel et du classement des buteurs.

-   **Buts marqués contre l'équipe forfait :** ils sont retirés du total de buts marqués de chaque équipe adverse concernée.

-   **Buts marqués par l'équipe forfait :** ils sont retirés du total de buts encaissés de chaque équipe adverse concernée.

-   **Cartons :** les cartons jaunes et rouges reçus lors des matchs annulés ne sont plus comptés pour le départage des équipes (Article 17.3, critères 5 et 6). En revanche, les sanctions disciplinaires individuelles qui en découlent (suspensions, expulsions) restent applicables aux joueurs concernés.

La différence de buts, le classement général des équipes et le classement des buteurs sont recalculés en conséquence par Ardentia.

**Forfait en phase à élimination directe :** si une équipe déclare forfait ou abandonne la compétition pendant la phase à élimination directe du tournoi, son adversaire est qualifié d'office pour le tour suivant, sur le score de 3-0. Les résultats de la phase de groupes ne sont pas modifiés.

# ARTICLE 15 — RÈGLES SPÉCIFIQUES AU GARDIEN DE BUT

## 15.1 Dans sa surface de réparation

Le gardien peut utiliser ses mains et ses bras pour jouer le ballon exclusivement à l'intérieur de sa propre surface de réparation. En dehors de sa surface, il est soumis aux mêmes règles que n'importe quel joueur de champ et ne peut en aucun cas utiliser ses mains ou ses bras pour jouer le ballon.

## 15.2 Hors de sa surface de réparation

Le gardien peut se déplacer librement en dehors de sa surface et jouer le ballon au pied comme tout joueur de champ. Toute utilisation des mains hors de la surface est sanctionnée par un coup franc direct accordé à l'équipe adverse.

## 15.3 Règle des quatre secondes

Le gardien dispose de quatre (4) secondes maximum pour mettre le ballon en jeu à partir du moment où il en prend le contrôle (avec les mains, en le faisant rebondir ou en le projetant en l'air). Au-delà, un corner est accordé à l'équipe adverse.

## 15.4 Règle de la passe en retour

Si un coéquipier botte délibérément le ballon vers son propre gardien, celui-ci ne peut pas le toucher avec les mains ou les bras à l'intérieur de sa surface. Une infraction à cette règle est sanctionnée par un coup franc indirect accordé à l'équipe adverse à l'endroit où le gardien a touché le ballon. La même règle s'applique si le ballon est directement remis en jeu (touche au pied) vers le gardien par un coéquipier.

# ARTICLE 16 — FAIR-PLAY ET COMPORTEMENT

## 16.1 Comportement envers l'arbitre

Tout joueur, remplaçant ou officiel d'équipe doit respecter l'arbitre à tout moment. Seul le capitaine est autorisé à s'adresser à l'arbitre pour demander des explications, calmement et avec respect.

-   Contestation verbale légère : avertissement verbal.

-   Contestation persistante ou irrespectueuse : carton jaune.

-   Langage offensant, insultant ou abusif envers l'arbitre : carton rouge direct et potentiellement une suspension supplémentaire décidée par Ardentia.

## 16.2 Comportement général

Les règles de fair-play et de respect mutuel s'appliquent à tout moment, y compris en dehors du terrain (abords du terrain, zone de spectateurs, vestiaires, avant et après le match). Tout incident survenant dans ces zones est traité avec les mêmes sanctions disciplinaires que s'il s'était produit sur le terrain.

Les comportements suivants sont passibles de sanctions, y compris de suspension ou d'exclusion de la compétition par Ardentia :

-   Insultes ou provocations à l'égard des adversaires, arbitres ou spectateurs.

-   Comportements discriminatoires (racisme, sexisme, etc.).

-   Comportements violents ou menaçants.

## 16.3 Substances interdites

Il est strictement interdit de participer à un match sous l'influence d'alcool, de drogues ou de toute substance altérant les facultés physiques ou mentales. Tout joueur suspecté d'être sous l'influence d'une telle substance peut être exclu du match par l'arbitre, en concertation avec Ardentia, sans que cela n'entraîne de sanction numérique pour son équipe (le joueur est simplement considéré comme indisponible).

## 16.4 Respect du matériel

Les joueurs et officiels d'équipe sont tenus de respecter les installations d'Ardentia : terrain, buts, filets, vestiaires et tout autre équipement. Tout dommage causé intentionnellement ou par négligence grave peut faire l'objet d'une indemnisation financière et/ou d'une exclusion de la compétition, selon la décision d'Ardentia.

# ARTICLE 17 — ORGANISATION DE LA COMPÉTITION

## 17.1 Format de la compétition

Ardentia organise deux types de compétitions :

-   Le Championnat : compétition basée sur un système de points, avec des matchs disputés selon un calendrier établi par Ardentia.

-   Le Tournoi : compétition comportant une phase de groupes suivie d'une phase à élimination directe.

Les modalités détaillées de chaque compétition (nombre de journées, format de poules, etc.) sont communiquées par Ardentia avant le début de chaque édition.

## 17.2 Système de points — Championnat

-   Victoire : 3 points.

-   Match nul : 1 point pour chaque équipe.

-   Défaite : 0 point.

-   Forfait : 0 point pour l'équipe forfait, 3 points et score 3-0 pour l'équipe présente.

-   Forfait général (retrait d'une équipe en cours de compétition) : voir Article 14.3.

## 17.3 Critères de classement des équipes

Le classement des équipes (championnat ou phase de groupes) est établi selon les critères suivants, par ordre de priorité. Chaque critère n'est appliqué que si l'égalité persiste après le critère précédent :

1.  **Points :** 3 points pour une victoire, 1 point pour un match nul, 0 point pour une défaite (voir Article 17.2).

2.  **Confrontation directe :** résultat du ou des matchs ayant opposé les équipes à égalité. Si plus de deux équipes sont à égalité, un mini-classement est établi entre elles sur la base des seuls matchs qui les ont opposées.

3.  **Différence de buts :** buts marqués moins buts encaissés, sur l'ensemble des matchs de la saison ou du groupe.

4.  **Buts marqués :** nombre total de buts inscrits sur l'ensemble des matchs.

5.  **Cartons jaunes :** l'équipe ayant reçu le moins de cartons jaunes est classée devant.

6.  **Cartons rouges :** l'équipe ayant reçu le moins de cartons rouges est classée devant.

Si l'égalité persiste après l'application de l'ensemble de ces critères, les équipes sont départagées par un tirage au sort organisé par Ardentia.

## 17.4 Réclamations et litiges

Si une équipe souhaite formuler une réserve ou une réclamation concernant un match, elle doit la soumettre à Ardentia dans les vingt-quatre (24) heures suivant le coup de sifflet final du match concerné. La réclamation peut être transmise par WhatsApp ou par email à l'adresse communiquée par Ardentia. Toute réclamation formulée après ce délai sera irrecevable.

Ardentia examinera la réclamation et communiquera sa décision dans un délai raisonnable. La décision d'Ardentia est définitive.

## 17.5 Reports de matchs

Les demandes de report de match ne sont pas acceptées. Tout match non disputé à la date et à l'heure prévues est attribué par forfait à l'équipe absente (voir Article 14.1), sauf décision contraire et exceptionnelle d'Ardentia.

## 17.6 Conditions météorologiques

La décision de maintenir, reporter ou annuler un match en raison des conditions météorologiques appartient exclusivement à Ardentia. Cette décision est communiquée aux équipes dans un délai d'au moins vingt-quatre (24) heures avant le match concerné, sauf si les conditions météorologiques se dégradent de manière imprévisible dans les heures précédant le match, auquel cas la décision peut être prise plus tardivement.

-   En cas de forte pluie ou de conditions dangereuses : le match est annulé ou reporté par Ardentia.

-   En cas de pluie légère : le match se déroule comme prévu, sauf si l'arbitre, en concertation avec Ardentia, juge les conditions dangereuses ou le terrain impraticable.

# ARTICLE 18 — AUTRES CAS DE FIGURES

## 18.1 Abandon d'un match

Si une équipe abandonne son match sous forme de protestation contre une décision d'un arbitre ou d'un officiel du match, celle-ci sera qualifiée de perdante par forfait. Ainsi, elle perd son match 3-0.
`,se=`# PRÉAMBULE

Le présent règlement régit l'ensemble des matchs et compétitions organisés par Ardentia sur ses terrains de football en gazon synthétique à 6 joueurs. Son objectif est d'assurer la sécurité des participants, la fluidité du jeu et le respect du fair-play. Tout participant — joueur, remplaçant, officiel d'équipe ou spectateur — est réputé avoir pris connaissance de ce règlement et s'engage à le respecter.

En cas de situation non prévue par le présent règlement, l'arbitre tranche en accord avec les principes généraux du football à 6 et, si nécessaire, en concertation avec le comité organisateur Ardentia. Sa décision est définitive.

# ARTICLE 1 — LE TERRAIN ET LE MATÉRIEL

## 1.1 Le terrain

Les matchs se déroulent sur les terrains en gazon synthétique mis à disposition par le partenaire d'Ardentia. Les terrains abritent des matchs de 6 joueurs contre 6 joueurs.

## 1.2 Le ballon

Le ballon officiel utilisé lors de tous les matchs est de taille 5. Il est fourni par Ardentia. En cas de dommage au ballon en cours de jeu, l'arbitre arrête le jeu, fait remplacer le ballon et reprend avec une balle à terre à l'endroit où le ballon a été endommagé.

## 1.3 La zone de remplacement

Les remplaçants et le staff technique doivent se tenir dans la zone qui leur est réservée, à l'intérieur de l'enceinte du terrain. Cette zone est délimitée par des plots visibles. Il est interdit aux remplaçants et au staff technique de sortir de cette zone sans l'autorisation de l'arbitre.

Les remplacements s'effectuent exclusivement par la porte du terrain. Tout joueur sortant du terrain est tenu de fermer la porte derrière lui afin d'éviter tout risque de blessure. Le non-respect de cette consigne constitue une faute de sécurité pouvant être sanctionnée par un avertissement verbal.

# ARTICLE 2 — LES JOUEURS

## 2.1 Composition des équipes

Un match se joue entre deux équipes, chacune composée d'un maximum de six (6) joueurs sur le terrain, dont obligatoirement un gardien de but.

Chaque équipe peut disposer d'un maximum de six (6) remplaçants.

## 2.2 Nombre minimum de joueurs

Le nombre minimum de joueurs requis pour débuter et poursuivre un match est de quatre (4) joueurs par équipe, gardien de but compris.

-   Si, avant le coup d'envoi, une équipe ne dispose pas d'au moins quatre (4) joueurs après l'expiration du délai de carence (voir Article 14.1), le match est déclaré perdu par forfait pour cette équipe.

-   Si, en cours de match, une équipe tombe en dessous de quatre (4) joueurs suite à des expulsions ou blessures ne pouvant être remplacées, le match est définitivement arrêté. L'équipe concernée est déclarée perdante par forfait sur le score de 3-0, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 2.3 Inscription et liste des joueurs

Les noms complets des joueurs et remplaçants, tels qu'ils figurent sur leur carte d'identité nationale (CIN), doivent être communiqués à Ardentia lors de la période des inscriptions, avant le début de la compétition. Ces listes servent à garantir la couverture d'assurance et à assurer le fair-play.

Tout joueur dont le nom n'est pas mentionné sur la liste de l'équipe est strictement interdit de participation. Si un joueur non inscrit est découvert en cours de match, l'arbitre l'expulse immédiatement. Tout but marqué par ce joueur non inscrit est refusé rétroactivement, et le joueurs est expulsé du terrain.

Un joueur peut être ajouté ou retiré de la liste de l'équipe sur demande écrite (email) du capitaine auprès d'Ardentia, au moins 48 heures avant le prochain match, afin de permettre la mise à jour de la couverture d'assurance. Sans le respect de ce ce délai, le joueurs ne peut faire partie du match.

## 2.4 Procédure de remplacement

Un nombre illimité de remplacements peut être effectué au cours d'un match. Un remplacement ne peut avoir lieu que lorsque le ballon n'est pas en jeu. Les règles suivantes s'appliquent :

-   Le joueur remplacé quitte le pelouse vers la zone des remplaçants.

-   Le joueur remplacé avise l'arbitre avant de quitter le pelouse.

-   Les remplaçants portent obligatoirement des dossards d'une couleur distincte de celle des joueurs présents sur le terrain.

-   Avant d'entrer sur la pelouse, le remplaçant remet son dossard au joueur remplacé. Le remplaçant ne peut pas entrer sur la pelouse tant que cet échange de dossard n'a pas eu lieu.

-   Le remplaçant n'entre sur la pelouse qu'après le départ complet du joueur remplacé.

-   À partir du moment où le remplaçant entre sur le terrain, il devient joueur et le joueur remplacé devient remplaçant.

-   L'autorisation de procéder à un remplacement peut être refusée par l'arbitre si l'équipement du remplaçant n'est pas conforme.

-   Tous les joueurs, remplaçants et staff technique sont soumis à l'autorité de l'arbitre.

Si un joueur de champ effectue un remplacement sans aviser l'arbitre, il reçoit un avertissement verbal. En cas de récidive, l'arbitre lui adresse un carton jaune, voire rouge selon la gravité.

Si un remplaçant entre sur la pelouse avant le départ complet du joueur remplacé :

-   L'arbitre arrête le jeu (sauf application de la règle de l'avantage).

-   Le remplaçant est averti et invité à quitter immédiatement la pelouse.

-   Le jeu reprend par un coup franc indirect accordé à l'équipe adverse, à l'endroit où se trouvait le remplaçant irrégulier.

## 2.5 Sanctions impliquant les remplaçants et officiels d'équipe

Si un remplaçant ou un officiel du staff technique reçoit un carton rouge, son équipe doit retirer un joueur de champ pendant deux (2) minutes, sauf si un but est marqué par l'équipe adverse avant la fin de cette période, auquel cas un remplaçant peut entrer pour rétablir la parité numérique. Le remplaçant ou officiel expulsé ne peut plus participer au match sous quelque forme que ce soit.

Si un remplaçant reçoit un carton jaune alors qu'il est sur le banc, il portera cette sanction lorsqu'il entrera sur le terrain.

## 2.6 Changement de gardien de but

-   Tout joueur ou remplaçant peut prendre le rôle de gardien de but, à condition d'en informer l'arbitre lors d'un arrêt de jeu et de revêtir un dossard de couleur distincte.

-   Le changement doit obligatoirement se faire lors d'un arrêt du jeu et avec l'autorisation expresse de l'arbitre.

-   Si un joueur assume le rôle de gardien sans en informer l'arbitre et touche le ballon de la main dans sa surface, son équipe est sanctionnée d'un penalty.

-   Aucun changement de gardien n'est autorisé après le sifflement d'un penalty, sauf en cas de blessure grave constatée et validée par l'arbitre et Ardentia.

-   Lors des phases éliminatoires, si un match est décidé aux tirs au but, le gardien en place au moment du coup de sifflet final ne peut pas être changé, sauf blessure grave.

## 2.7 Joueurs et remplaçants expulsés

Un joueur expulsé (carton rouge) doit quitter immédiatement le terrain. Il ne peut plus participer au match.

Son équipe joue en infériorité numérique pendant deux (2) minutes de temps de jeu effectif. Un remplaçant peut entrer pour combler cette infériorité selon les conditions suivantes :

-   6 joueurs contre 5, ou 5 contre 4 : si l'équipe la plus nombreuse marque un but, l'équipe réduite peut faire entrer un remplaçant.

-   Si les deux équipes jouent à effectifs réduits égaux (ex : 5 contre 5, 4 contre 4) et qu'un but est marqué, aucune équipe ne récupère un joueur avant la fin de la réduction numérique respective de deux minutes.

-   6 joueurs contre 4 : si l'équipe à 6 marque, l'équipe à 4 ne peut faire entrer qu'un seul remplaçant (portant à 5 son effectif).

-   Si l'équipe en infériorité marque un but, le jeu continue sans modification du nombre de joueurs jusqu'à l'écoulement des deux minutes.

**Tout joueur expulsé par l'arbitre doit quitter immédiatement le terrain. En cas de refus de sortie, l'arbitre accorde un délai maximal de 5 minutes pour que le ou les joueurs concernés quittent le terrain. À défaut d'exécution dans ce délai, la rencontre est arrêtée et l'équipe du ou des joueurs expulsés est déclarée perdante par forfait.**

## 2.8 But marqué avec une personne supplémentaire sur le terrain

Si, après qu'un but est marqué et que le jeu a repris, l'arbitre constate qu'une personne supplémentaire se trouvait sur le terrain au moment du but, le but ne peut pas être refusé rétroactivement.

Si l'arbitre constate la présence d'une personne supplémentaire avant la reprise du jeu :

-   Le but est refusé si la personne supplémentaire appartenait à l'équipe ayant marqué (joueur, remplaçant, expulsé ou officiel). Le jeu reprend par un coup franc direct pour l'équipe adverse à l'endroit où se trouvait cette personne.

-   Le but est refusé si la personne supplémentaire était un agent extérieur ayant gêné le jeu. Le jeu reprend par une balle à terre.

Dans tous les cas, l'arbitre fait sortir la personne supplémentaire de la pelouse.

## 2.9 Capitaine d'équipe

Chaque équipe désigne un capitaine avant le début du match. Le capitaine est identifiable par un brassard. Il est le seul joueur autorisé à s'adresser à l'arbitre pour demander des éclaircissements sur une décision, et ce, de manière respectueuse et calme. Toute autre forme d'interpellation de l'arbitre par d'autres joueurs est passible d'avertissement.

Le capitaine est responsable du comportement de son équipe et de ses supporters. En cas d'incidents répétés, l'arbitre peut tenir le capitaine pour responsable disciplinairement.

# ARTICLE 3 — L'ÉQUIPEMENT DES JOUEURS

## 3.1 Sécurité

Aucun joueur ne peut utiliser ou porter un équipement ou objet dangereux pour lui-même ou pour autrui. Sont notamment interdits :

-   Tous bijoux : colliers, bagues, bracelets, boucles d'oreilles, élastiques métalliques. L'usage de ruban adhésif pour couvrir les bijoux n'est pas autorisé.

-   Chaussures à crampons métalliques ou tout autre équipement susceptible d'endommager le gazon synthétique ou de blesser un adversaire.

Si un joueur porte un équipement non autorisé, l'arbitre lui ordonne de le retirer. Si le joueur ne peut ou ne veut pas s'y conformer, il quitte le terrain au prochain arrêt. Un refus de se conformer, ou le port répété d'un article interdit, est sanctionné par un carton jaune.

## 3.2 Couleurs et tenues

Les deux équipes doivent porter des couleurs qui les distinguent l'une de l'autre ainsi que des officiels de match. Si les deux équipes portent des couleurs similaires, l'arbitre procède à un tirage au sort en présence des deux capitaines pour désigner l'équipe devant revêtir des dossards distinctifs fournis par Ardentia.

Le gardien de but doit obligatoirement porter un dossard d'une couleur distincte de celle de ses coéquipiers et de celle de l'équipe adverse.

## 3.3 Équipements de protection autorisés

Les équipements de protection non dangereux sont autorisés : masques de protection, lunettes de sport homologuées, genouillères et coudières en matériau rembourré souple. Ces équipements doivent être présentés à l'arbitre avant le match pour validation.

# ARTICLE 4 — L'ARBITRE

## 4.1 Autorité de l'arbitre

Chaque match est dirigé par un arbitre désigné par Ardentia. L'arbitre a pleine autorité pour faire respecter le présent règlement durant toute la durée du match, depuis son entrée sur le terrain jusqu'à sa sortie après le coup de sifflet final (y compris pendant les tirs au but).

## 4.2 Décisions de l'arbitre

Les décisions de l'arbitre sur les faits de jeu — y compris l'attribution d'un but et le résultat du match — sont définitives et sans appel immédiat. Elles prévalent sur celles des organisateurs présents sur place.

Si un assistant de match signale une infraction mais que l'arbitre ne l'observe qu'après la reprise du jeu, l'arbitre peut prendre les mesures disciplinaires appropriées, mais la sanction de reprise de jeu liée à la faute ne s'applique pas.

Toute protestation excessive contre une décision arbitrale — y compris de la part du capitaine — peut entraîner un avertissement verbal ou un carton jaune, selon l'appréciation de l'arbitre.

## 4.3 Pouvoirs et devoirs de l'arbitre

L'arbitre est investi des missions suivantes :

-   Appliquer le présent règlement Ardentia.

-   Vérifier l'équipement des joueurs avant le coup d'envoi.

-   Tenir un registre des incidents du match (cartons, buts, expulsions).

-   Agir comme chronométreur officiel du match.

-   Arrêter, suspendre ou abandonner le match en cas de problème (interférence extérieure, projecteurs défaillants, animal sur le terrain, conditions météorologiques dangereuses). En cas d'interférence extérieure affectant le jeu, le jeu reprend par une balle à terre, sauf si le ballon pénètre dans le but sans intervention de l'agent extérieur, auquel cas le but est accordé.

-   Arrêter le jeu en cas de blessure grave et veiller à ce que le joueur blessé soit retiré du terrain. Un joueur blessé ne peut pas être soigné sur le terrain sauf dans les cas suivants : collision entre gardien et joueur de champ, collision entre deux joueurs de la même équipe, blessure grave, penalty accordé au joueur blessé (qu'il soit tireur ou gardien).

-   Décider, avec l'aide des organisateurs, des incidents dont il n'a pas été directement témoin.

-   Garantir qu'aucune personne non autorisée ne pénètre sur le terrain.

-   Demander au capitaine de l'une ou l'autre équipe de calmer ses spectateurs lorsque leur comportement perturbe le bon déroulement du match. Si nécessaire, l'arbitre arrête le jeu jusqu'au retour au calme.

-   En cas de défaillance du chronomètre, aviser immédiatement Ardentia pour en obtenir un de remplacement.

## 4.4 Équipement obligatoire de l'arbitre

-   Au moins un sifflet.

-   Cartons rouges et jaunes.

-   Un carnet (ou tout autre support) pour la tenue du registre du match.

-   Au moins une montre ou chronomètre.

# ARTICLE 5 — LA DURÉE DU MATCH

## 5.1 Périodes de jeu

Un match se compose de deux (2) périodes de vingt (20) minutes chacune de temps de jeu effectif. Le chronomètre est arrêté à chaque interruption de jeu (blessures, remplacements, litiges, etc.) et repris à la reprise du jeu.

## 5.2 Temps morts et arrêts de jeu

L'arbitre est responsable du décompte de tous les temps morts et s'assure qu'ils sont ajoutés au temps officiel du match. La durée totale cumulée des arrêts de jeu ne peut excéder dix (10) minutes par match. Au-delà de ce seuil, l'arbitre peut, à sa discrétion et après concertation avec Ardentia, suspendre ou arrêter le match.

## 5.3 Intervalle à la mi-temps

Les joueurs ont droit à une pause à la mi-temps ne dépassant pas cinq (5) minutes. À l'issue de la pause, les équipes changent de côté de terrain. Les officiels d'équipe et remplaçants changent également de banc.

## 5.4 Fin des périodes

L'arbitre siffle la fin de chaque période de vingt minutes. Il peut prolonger une période pour permettre l'exécution d'un coup franc, d'un penalty ou d'un corner accordé juste avant le coup de sifflet final.

## 5.5 Prolongation

Il n'y a pas de prolongation dans le cadre de ce règlement. En phases éliminatoires, en cas d'égalité à l'issue du temps réglementaire, les équipes passent directement aux tirs au but (voir Article 13).

# ARTICLE 6 — LE COUP D'ENVOI ET LA REPRISE DU JEU

## 6.1 Coup d'envoi

Avant le début du match, l'arbitre effectue un tirage au sort (pièce de monnaie) en présence des deux capitaines. L'équipe gagnante choisit le sens d'attaque pour la première période ; l'équipe perdante effectue le coup d'envoi. À la mi-temps, les rôles s'inversent.

Le coup d'envoi est effectué depuis le centre du terrain au coup de sifflet de l'arbitre. Le ballon doit être stationnaire au centre. Les joueurs de l'équipe adverse doivent se trouver dans leur propre moitié de terrain. Le ballon est en jeu dès qu'il est touché. Un but peut être marqué directement sur un coup d'envoi.

## 6.2 Reprise après un but

Après qu'un but est accordé, le jeu reprend par un coup d'envoi effectué par l'équipe qui a encaissé le but, depuis le centre du terrain.

## 6.3 Balle à terre

Une balle à terre est accordée lorsque l'arbitre a arrêté le jeu sans qu'aucune infraction n'ait été commise (blessure, objet sur le terrain, etc.). La procédure est la suivante :

-   L'arbitre lâche le ballon à l'endroit où il se trouvait au moment de l'arrêt (ou à l'endroit le plus proche en jeu).

-   Le ballon est en jeu dès qu'il touche le sol.

-   Les joueurs adverses doivent se tenir à au moins un (1) mètre du ballon jusqu'à ce qu'il soit en jeu.

-   Si la balle à terre doit être donnée dans la surface de réparation, elle est donnée sur la ligne de surface de réparation la plus proche du point d'arrêt.

# ARTICLE 7 — LE HORS-JEU

La règle du hors-jeu ne s'applique pas dans ce format de jeu. Aucun joueur ne peut être sanctionné pour hors-jeu, quelle que soit sa position sur le terrain.

# ARTICLE 8 — LES REMISES EN JEU (TOUCHES)

## 8.1 Accord d'une remise en jeu

Une remise en jeu est accordée lorsque le ballon franchit entièrement la ligne de touche (latérale) — que ce soit au sol ou en l'air — au dernier contact d'un joueur de l'équipe adverse.

## 8.2 Procédure

La remise en jeu se fait au pied (coup de pied de touche). Les règles suivantes s'appliquent :

-   Le ballon doit être posé, immobile, sur la ligne de touche, à l'endroit exact où il est sorti.

-   Le joueur effectuant la remise dispose de cinq (5) secondes pour jouer le ballon, à partir du moment où celui-ci est posé sur la ligne.

-   Les adversaires doivent se tenir à au moins cinq (5) mètres du point de remise en jeu.

-   Le joueur effectuant la remise ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

-   Un but ne peut pas être marqué directement depuis une remise en jeu en touche.

Si le joueur dépasse le délai de cinq (5) secondes, ou s'il ne pose pas le ballon sur la ligne de touche, la remise en jeu est accordée à l'équipe adverse.

## 8.3 Ballon sorti en fond de terrain

Si le ballon sort entièrement par la ligne de fond (ligne de but) sans qu'un but ne soit marqué, les règles suivantes s'appliquent selon le dernier contact :

-   Dernier contact d'un défenseur : corner accordé à l'équipe attaquante (voir Article 9).

-   Dernier contact d'un attaquant : coup de pied de but accordé à l'équipe défendante (voir Article 10).

# ARTICLE 9 — LES CORNERS

## 9.1 Accord d'un corner

Un corner est accordé à l'équipe attaquante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe défendante.

## 9.2 Procédure

-   Le ballon est posé, immobile, dans l'arc de corner le plus proche du point de sortie.

-   Le tireur dispose de huit (8) secondes pour frapper le ballon, à partir du moment où celui-ci est posé dans l'arc de corner.

-   Les joueurs adverses doivent se tenir à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Le ballon est en jeu dès qu'il est frappé.

-   Un but peut être marqué directement depuis un corner.

-   Le tireur ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

## 9.3 Infractions

Si le tireur dépasse le délai de huit (8) secondes ou ne respecte pas la procédure, le jeu reprend par un coup de pied de but en faveur de l'équipe adverse. Si un adversaire pénètre dans la zone des cinq mètres avant la frappe, le corner est retiré.

# ARTICLE 10 — LES COUPS DE PIED DE BUT

## 10.1 Accord d'un coup de pied de but

Un coup de pied de but est accordé à l'équipe défendante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe attaquante.

## 10.2 Procédure

-   Le gardien de but (ou tout joueur défenseur désigné) effectue le coup de pied de but depuis n'importe quel point à l'intérieur de la surface de réparation.

-   Le ballon est en jeu dès qu'il sort de la surface de réparation.

-   Les joueurs adverses doivent se trouver hors de la surface de réparation jusqu'à ce que le ballon soit en jeu.

-   Le gardien dispose de quatre (4) secondes pour mettre le ballon en jeu après l'avoir récupéré.

-   Un but peut être marqué directement depuis un coup de pied de but.

-   Le joueur effectuant le coup de pied ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

# ARTICLE 11 — FAUTES ET INCONDUITES

## 11.1 Coup franc direct

Toute infraction impliquant un contact avec un adversaire est sanctionnée par un coup franc direct ou, si elle est commise par un joueur dans sa propre surface de réparation, par un penalty (voir Article 11.4).

Un coup franc direct est accordé à l'équipe adverse lorsqu'un joueur commet l'une des infractions suivantes de manière jugée insouciante, imprudente ou avec usage excessif de la force :

-   Tacler ou défier un adversaire de manière dangereuse.

-   Sauter sur un adversaire.

-   Charger un adversaire.

-   Frapper ou tenter de frapper un adversaire.

-   Pousser un adversaire.

-   Mordre ou cracher sur quelqu'un.

-   Tenir un adversaire.

-   Faire trébucher ou tenter de faire trébucher un adversaire.

-   Toucher intentionnellement le ballon avec la main ou le bras (sauf le gardien dans sa surface).

L'évaluation de la faute suit les degrés suivants :

-   **Insouciance :** le joueur fait preuve d'un manque d'attention ou de considération en disputant le ballon, ou agit sans précaution. Coup franc direct, sans sanction disciplinaire.

-   **Imprudence :** le joueur agit sans tenir compte du danger ou des conséquences de son geste pour l'adversaire. Coup franc direct et carton jaune obligatoire.

-   **Usage excessif de la force :** le joueur dépasse la force nécessaire et/ou met en danger la sécurité d'un adversaire. Coup franc direct et carton rouge obligatoire (expulsion).

## 11.2 Coup franc indirect

Un coup franc indirect sanctionne une infraction commise sans contact avec un adversaire. Il est accordé à l'équipe adverse si un joueur :

-   Joue de manière dangereuse sans contact (ex. : tenter une tête alors qu'un adversaire s'apprête à botter le ballon à hauteur de la tête).

-   Fait obstruction à la progression d'un adversaire sans contact.

-   Empêche le gardien de lâcher le ballon.

-   Est coupable de dissidence, langage ou gestes offensants, insultants ou abusifs.

Un coup franc indirect est également accordé à l'équipe adverse si le gardien :

-   Contrôle le ballon avec les mains, bras ou pieds dans sa propre moitié de terrain pendant plus de quatre (4) secondes.

-   Touche le ballon avec les mains ou les bras à l'intérieur de sa surface de réparation après qu'il a été délibérément botté par un coéquipier (règle de la passe en retour).

-   Reçoit directement dans les mains une rentrée de touche effectuée au pied par un coéquipier.

Le gardien est considéré comme en contrôle du ballon lorsque : il le tient dans ses mains, le fait rebondir sur le sol ou le projette en l'air.

Sur un coup franc indirect, un but ne peut être accordé que si le ballon a touché un autre joueur avant de pénétrer dans le but.

## 11.3 Le mur et la distance réglementaire

Les règles suivantes s'appliquent à tout coup franc, direct ou indirect :

-   Lors d'un coup franc adverse, les joueurs formant le mur doivent se placer à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Lorsque le coup franc est sifflé dans la propre moitié de terrain de l'équipe qui en bénéficie, aucun mur n'est autorisé : les adversaires doivent simplement se tenir à cinq (5) mètres du ballon.

-   Tout joueur qui ne respecte pas la distance réglementaire est passible d'un carton jaune (voir Article 11.5).

## 11.4 Le penalty

Un penalty est accordé lorsqu'un joueur commet, dans sa propre surface de réparation, l'une des infractions passibles d'un coup franc direct, que le ballon soit en jeu ou non.

Procédure d'exécution d'un penalty :

-   Le ballon est placé sur le point de penalty tracé sur le terrain.

-   Le gardien adverse se place sur sa ligne de but, entre les poteaux, et ne peut pas avancer avant que le ballon soit frappé.

-   Tous les autres joueurs (des deux équipes) se placent en dehors de la surface de réparation et derrière le ballon (ou sur la ligne de but adjacente) jusqu'à ce que le ballon soit frappé.

-   Le tireur désigné frappe le ballon vers l'avant en un seul mouvement. Tout arrêt complet du mouvement lors de l'élan est sanctionné par un coup franc indirect en faveur de l'équipe défendante.

-   Si le gardien avance prématurément et que le tir est manqué ou repoussé, le penalty est retiré. Si le tir est transformé, le but est accordé.

-   Si le ballon rebondit sur les poteaux ou la barre et revient en jeu, tout joueur peut jouer le ballon, y compris le tireur.

-   Si le temps réglementaire expire avant l'exécution du penalty, celui-ci est tout de même tiré et le match se termine à l'issue de son exécution.

## 11.5 Cartons jaunes — Avertissements

Un carton jaune est délivré à un joueur, remplaçant ou officiel d'équipe pour l'une des raisons suivantes :

-   Comportement antisportif (simulation, protestation excessive, jeu déloyal).

-   Dissidence par les mots ou les gestes envers l'arbitre.

-   Infractions répétées aux règles du jeu.

-   Retarder la reprise du jeu.

-   Ne pas respecter la distance requise lors d'un coup franc, corner ou remise en jeu.

-   Entrer ou quitter le terrain sans autorisation.

-   Imprudence dans un tacle ou une charge.

Deux (2) cartons jaunes dans le même match entraînent automatiquement un carton rouge (expulsion).

**Cumul de cartons jaunes :** les cartons jaunes reçus par un même joueur se cumulent d'un match à l'autre sur l'ensemble de la compétition. Trois (3) cartons jaunes cumulés entraînent automatiquement un (1) match de suspension, à purger lors du match suivant de son équipe. Le compteur de cartons jaunes du joueur est remis à zéro une fois la suspension purgée. Les deux cartons jaunes reçus dans un même match et ayant entraîné une expulsion ne sont pas comptés dans ce cumul, l'expulsion étant sanctionnée selon l'Article 11.6.

## 11.6 Cartons rouges — Expulsions

Un carton rouge est délivré pour l'une des raisons suivantes, entraînant l'expulsion immédiate du joueur :

-   Faute grossière (tacle ou charge mettant en danger l'intégrité physique d'un adversaire).

-   Comportement violent (coup, tentative de coup, morsure, crachat).

-   Déni d'une occasion de but manifeste par une faute de main volontaire (hors gardien dans sa surface).

-   Déni d'une occasion de but manifeste par une faute physique.

-   Langage ou gestes offensants, insultants ou abusifs envers quiconque.

-   Deux cartons jaunes dans le même match.

Un joueur expulsé quitte le terrain immédiatement. Son équipe joue en infériorité numérique pendant deux (2) minutes (voir Article 2.7). Le joueur expulsé ne peut plus participer au match.

**Suspension après un carton rouge :** tout carton rouge entraîne au minimum un (1) match de suspension, à purger lors du match suivant de l'équipe du joueur. Ardentia peut alourdir cette suspension en fonction de la gravité du comportement (violence, insultes, menaces envers l'arbitre ou un adversaire, refus de quitter le terrain, etc.), sur la base du rapport de l'arbitre. La décision d'Ardentia est communiquée au capitaine de l'équipe concernée avant le match suivant.

## 11.7 Erreur d'identification lors d'un carton

Si l'arbitre se rend compte, avant la reprise du jeu, qu'il a attribué un carton au mauvais joueur, il annule la sanction envers ce joueur et l'attribue au joueur fautif. Toute réclamation pour erreur d'identification doit être soulevée immédiatement et avant la reprise du jeu.

# ARTICLE 12 — LES BUTS

## 12.1 But valide

Un but est accordé lorsque la totalité du ballon franchit entièrement la ligne de but, entre les poteaux et sous la barre transversale, à condition qu'aucune infraction n'ait été commise par l'équipe marquant le but. Un but est accordé si le gardien lance le ballon directement dans le but adverse.

## 12.2 But refusé

Un but est refusé dans les cas suivants :

-   Une infraction a été commise par l'équipe attaquante avant ou pendant l'action menant au but.

-   Une personne supplémentaire appartenant à l'équipe attaquante se trouvait sur le terrain (voir Article 2.8).

-   Le ballon a été touché par un agent extérieur appartenant à l'équipe attaquante avant d'entrer dans le but.

# ARTICLE 13 — LES TIRS AU BUT

## 13.1 Quand sont-ils organisés ?

Les tirs au but sont organisés exclusivement lors des phases éliminatoires en cas d'égalité à l'issue du temps réglementaire. Ils ne font pas partie du match et les statistiques de la série de tirs au but ne sont pas comptabilisées dans les buts du match.

## 13.2 Désignation du but et ordre de tir

-   L'arbitre effectue un tirage au sort en présence des deux capitaines pour désigner le but dans lequel les tirs seront effectués.

-   Un second tirage au sort détermine l'équipe qui tire en premier.

-   Chaque équipe désigne cinq (5) tireurs parmi les joueurs qui se trouvaient sur le terrain au coup de sifflet final. Un joueur expulsé ne peut pas participer aux tirs au but.

-   L'ordre de passage des tireurs est librement choisi par chaque équipe.

## 13.3 Procédure de chaque tir

-   Les joueurs qui ne tirent pas se regroupent au centre du terrain, à au moins dix (10) mètres des tireurs.

-   Seul le tireur désigné et les deux gardiens sont autorisés dans la moitié de terrain des buts.

-   Le gardien doit rester sur sa ligne de but jusqu'à ce que le ballon soit frappé.

-   Les mêmes règles que pour un penalty en cours de match s'appliquent (voir Article 11.4).

## 13.4 Issue de la série initiale

L'équipe qui marque le plus de tirs sur les cinq tentatives de chaque côté est déclarée vainqueur. Si les deux équipes sont toujours à égalité après la série de cinq tirs chacune, la séance se poursuit en mort subite : les mêmes cinq joueurs tirent à nouveau, dans le même ordre ou un ordre différent choisi par l'équipe, jusqu'à ce qu'une équipe marque et que l'autre manque sur le même numéro de tir.

# ARTICLE 14 — FORFAIT ET MATCHS NON JOUÉS

## 14.1 Non-présentation et délai de carence

Si une équipe ne se présente pas ou ne réunit pas le nombre minimum de joueurs (4) dans un délai de quinze (15) minutes après l'heure officielle de début du match, le match lui est attribué par forfait. Le score officiel est fixé à 3-0 en faveur de l'équipe présente.

En cas de force majeure dûment justifiée et communiquée à Ardentia avant le début du délai de carence, Ardentia se réserve le droit d'examiner la situation, étant entendu que les reports de matchs ne sont pas acceptés en règle générale (voir Article 17.5).

## 14.2 Équipe avec un effectif en dessous du minimum en cours de match

Si, en cours de match, une équipe se retrouve avec moins de quatre (4) joueurs suite à des expulsions ou blessures sans remplaçants disponibles, le match est arrêté. L'équipe concernée est déclarée perdante par forfait. Le score retenu est 3-0 en sa défaveur, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 14.3 Forfait général (retrait d'une équipe de la compétition)

Une équipe qui déclare forfait pour le reste de la compétition est retirée de celle-ci. Cette règle s'applique au championnat et à la phase de groupes du tournoi. Tous les matchs déjà disputés par l'équipe forfait sont annulés, et ses matchs restants ne sont pas joués. Les conséquences sont les suivantes :

-   **Points :** chaque équipe qui avait battu l'équipe forfait perd les trois (3) points de cette victoire. Chaque équipe qui avait fait match nul contre elle perd un (1) point. Les équipes qui avaient perdu contre elle ne perdent aucun point.

-   **Buteurs :** les buts marqués par des joueurs contre l'équipe forfait sont retirés de leur total personnel et du classement des buteurs.

-   **Buts marqués contre l'équipe forfait :** ils sont retirés du total de buts marqués de chaque équipe adverse concernée.

-   **Buts marqués par l'équipe forfait :** ils sont retirés du total de buts encaissés de chaque équipe adverse concernée.

-   **Cartons :** les cartons jaunes et rouges reçus lors des matchs annulés ne sont plus comptés pour le départage des équipes (Article 17.3, critères 5 et 6). En revanche, les sanctions disciplinaires individuelles qui en découlent (suspensions, expulsions) restent applicables aux joueurs concernés.

La différence de buts, le classement général des équipes et le classement des buteurs sont recalculés en conséquence par Ardentia.

**Forfait en phase à élimination directe :** si une équipe déclare forfait ou abandonne la compétition pendant la phase à élimination directe du tournoi, son adversaire est qualifié d'office pour le tour suivant, sur le score de 3-0. Les résultats de la phase de groupes ne sont pas modifiés.

# ARTICLE 15 — RÈGLES SPÉCIFIQUES AU GARDIEN DE BUT

## 15.1 Dans sa surface de réparation

Le gardien peut utiliser ses mains et ses bras pour jouer le ballon exclusivement à l'intérieur de sa propre surface de réparation. En dehors de sa surface, il est soumis aux mêmes règles que n'importe quel joueur de champ et ne peut en aucun cas utiliser ses mains ou ses bras pour jouer le ballon.

## 15.2 Hors de sa surface de réparation

Le gardien peut se déplacer librement en dehors de sa surface et jouer le ballon au pied comme tout joueur de champ. Toute utilisation des mains hors de la surface est sanctionnée par un coup franc direct accordé à l'équipe adverse.

## 15.3 Règle des quatre secondes

Le gardien dispose de quatre (4) secondes maximum pour mettre le ballon en jeu à partir du moment où il en prend le contrôle (avec les mains, en le faisant rebondir ou en le projetant en l'air). Au-delà, un corner est accordé à l'équipe adverse.

## 15.4 Règle de la passe en retour

Si un coéquipier botte délibérément le ballon vers son propre gardien, celui-ci ne peut pas le toucher avec les mains ou les bras à l'intérieur de sa surface. Une infraction à cette règle est sanctionnée par un coup franc indirect accordé à l'équipe adverse à l'endroit où le gardien a touché le ballon. La même règle s'applique si le ballon est directement remis en jeu (touche au pied) vers le gardien par un coéquipier.

# ARTICLE 16 — FAIR-PLAY ET COMPORTEMENT

## 16.1 Comportement envers l'arbitre

Tout joueur, remplaçant ou officiel d'équipe doit respecter l'arbitre à tout moment. Seul le capitaine est autorisé à s'adresser à l'arbitre pour demander des explications, calmement et avec respect.

-   Contestation verbale légère : avertissement verbal.

-   Contestation persistante ou irrespectueuse : carton jaune.

-   Langage offensant, insultant ou abusif envers l'arbitre : carton rouge direct et potentiellement une suspension supplémentaire décidée par Ardentia.

## 16.2 Comportement général

Les règles de fair-play et de respect mutuel s'appliquent à tout moment, y compris en dehors du terrain (abords du terrain, zone de spectateurs, vestiaires, avant et après le match). Tout incident survenant dans ces zones est traité avec les mêmes sanctions disciplinaires que s'il s'était produit sur le terrain.

Les comportements suivants sont passibles de sanctions, y compris de suspension ou d'exclusion de la compétition par Ardentia :

-   Insultes ou provocations à l'égard des adversaires, arbitres ou spectateurs.

-   Comportements discriminatoires (racisme, sexisme, etc.).

-   Comportements violents ou menaçants.

## 16.3 Substances interdites

Il est strictement interdit de participer à un match sous l'influence d'alcool, de drogues ou de toute substance altérant les facultés physiques ou mentales. Tout joueur suspecté d'être sous l'influence d'une telle substance peut être exclu du match par l'arbitre, en concertation avec Ardentia, sans que cela n'entraîne de sanction numérique pour son équipe (le joueur est simplement considéré comme indisponible).

## 16.4 Respect du matériel

Les joueurs et officiels d'équipe sont tenus de respecter les installations d'Ardentia : terrain, buts, filets, vestiaires et tout autre équipement. Tout dommage causé intentionnellement ou par négligence grave peut faire l'objet d'une indemnisation financière et/ou d'une exclusion de la compétition, selon la décision d'Ardentia.

# ARTICLE 17 — ORGANISATION DE LA COMPÉTITION

## 17.1 Format de la compétition

Ardentia organise deux types de compétitions :

-   Le Championnat : compétition basée sur un système de points, avec des matchs disputés selon un calendrier établi par Ardentia.

-   Le Tournoi : compétition comportant une phase de groupes suivie d'une phase à élimination directe.

Les modalités détaillées de chaque compétition (nombre de journées, format de poules, etc.) sont communiquées par Ardentia avant le début de chaque édition.

## 17.2 Système de points — Championnat

-   Victoire : 3 points.

-   Match nul : 1 point pour chaque équipe.

-   Défaite : 0 point.

-   Forfait : 0 point pour l'équipe forfait, 3 points et score 3-0 pour l'équipe présente.

-   Forfait général (retrait d'une équipe en cours de compétition) : voir Article 14.3.

## 17.3 Critères de classement des équipes

Le classement des équipes (championnat ou phase de groupes) est établi selon les critères suivants, par ordre de priorité. Chaque critère n'est appliqué que si l'égalité persiste après le critère précédent :

1.  **Points :** 3 points pour une victoire, 1 point pour un match nul, 0 point pour une défaite (voir Article 17.2).

2.  **Confrontation directe :** résultat du ou des matchs ayant opposé les équipes à égalité. Si plus de deux équipes sont à égalité, un mini-classement est établi entre elles sur la base des seuls matchs qui les ont opposées.

3.  **Différence de buts :** buts marqués moins buts encaissés, sur l'ensemble des matchs de la saison ou du groupe.

4.  **Buts marqués :** nombre total de buts inscrits sur l'ensemble des matchs.

5.  **Cartons jaunes :** l'équipe ayant reçu le moins de cartons jaunes est classée devant.

6.  **Cartons rouges :** l'équipe ayant reçu le moins de cartons rouges est classée devant.

Si l'égalité persiste après l'application de l'ensemble de ces critères, les équipes sont départagées par un tirage au sort organisé par Ardentia.

## 17.4 Réclamations et litiges

Si une équipe souhaite formuler une réserve ou une réclamation concernant un match, elle doit la soumettre à Ardentia dans les vingt-quatre (24) heures suivant le coup de sifflet final du match concerné. La réclamation peut être transmise par WhatsApp ou par email à l'adresse communiquée par Ardentia. Toute réclamation formulée après ce délai sera irrecevable.

Ardentia examinera la réclamation et communiquera sa décision dans un délai raisonnable. La décision d'Ardentia est définitive.

## 17.5 Reports de matchs

Les demandes de report de match ne sont pas acceptées. Tout match non disputé à la date et à l'heure prévues est attribué par forfait à l'équipe absente (voir Article 14.1), sauf décision contraire et exceptionnelle d'Ardentia.

## 17.6 Conditions météorologiques

La décision de maintenir, reporter ou annuler un match en raison des conditions météorologiques appartient exclusivement à Ardentia. Cette décision est communiquée aux équipes dans un délai d'au moins vingt-quatre (24) heures avant le match concerné, sauf si les conditions météorologiques se dégradent de manière imprévisible dans les heures précédant le match, auquel cas la décision peut être prise plus tardivement.

-   En cas de forte pluie ou de conditions dangereuses : le match est annulé ou reporté par Ardentia.

-   En cas de pluie légère : le match se déroule comme prévu, sauf si l'arbitre, en concertation avec Ardentia, juge les conditions dangereuses ou le terrain impraticable.

# ARTICLE 18 — AUTRES CAS DE FIGURES

## 18.1 Abandon d'un match

Si une équipe abandonne son match sous forme de protestation contre une décision d'un arbitre ou d'un officiel du match, celle-ci sera qualifiée de perdante par forfait. Ainsi, elle perd son match 3-0.
`,N=`# PRÉAMBULE

Le présent règlement régit l'ensemble des matchs et compétitions organisés par Ardentia sur ses terrains de football en gazon synthétique à 6 joueurs. Son objectif est d'assurer la sécurité des participants, la fluidité du jeu et le respect du fair-play. Tout participant — joueur, remplaçant, officiel d'équipe ou spectateur — est réputé avoir pris connaissance de ce règlement et s'engage à le respecter.

En cas de situation non prévue par le présent règlement, l'arbitre tranche en accord avec les principes généraux du football à 6 et, si nécessaire, en concertation avec le comité organisateur Ardentia. Sa décision est définitive.

# ARTICLE 1 — LE TERRAIN ET LE MATÉRIEL

## 1.1 Le terrain

Les matchs se déroulent sur les terrains en gazon synthétique mis à disposition par le partenaire d’Ardentia. Les terrains abritent des matchs de 6 joueurs contre 6 joueurs.

## 1.2 Le ballon

Le ballon officiel utilisé lors de tous les matchs est de taille 5. Il est fourni par Ardentia. En cas de dommage au ballon en cours de jeu, l'arbitre arrête le jeu, fait remplacer le ballon et reprend avec une balle à terre à l'endroit où le ballon a été endommagé.

## 1.3 La zone de remplacement

Les remplaçants et le staff technique doivent se tenir dans la zone qui leur est réservée, à l'intérieur de l'enceinte du terrain. Cette zone est délimitée par des plots visibles. Il est interdit aux remplaçants et au staff technique de sortir de cette zone sans l'autorisation de l'arbitre.

Les remplacements s'effectuent exclusivement par la porte du terrain. Aucun remplacement ne peut se faire directement depuis la zone des remplaçants vers la pelouse. Tout joueur sortant du terrain est tenu de fermer la porte derrière lui afin d'éviter tout risque de blessure. Le non-respect de cette consigne constitue une faute de sécurité pouvant être sanctionnée par un avertissement verbal.

# ARTICLE 2 — LES JOUEURS

## 2.1 Composition des équipes

Un match se joue entre deux équipes, chacune composée d'un maximum de six (6) joueurs sur le terrain, dont obligatoirement un gardien de but.

Chaque équipe peut disposer d'un maximum de six (6) remplaçants.

## 2.2 Nombre minimum de joueurs

Le nombre minimum de joueurs requis pour débuter et poursuivre un match est de quatre (4) joueurs par équipe, gardien de but compris.

-   Si, avant le coup d'envoi, une équipe ne dispose pas d'au moins quatre (4) joueurs après l'expiration du délai de carence (voir Article 14.1), le match est déclaré perdu par forfait pour cette équipe.

-   Si, en cours de match, une équipe tombe en dessous de quatre (4) joueurs suite à des expulsions ou blessures ne pouvant être remplacées, le match est définitivement arrêté. L'équipe concernée est déclarée perdante par forfait sur le score de 3-0, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 2.3 Inscription et liste des joueurs

Les noms complets des joueurs et remplaçants, tels qu'ils figurent sur leur carte d'identité nationale (CIN), doivent être communiqués à Ardentia lors de la période des inscriptions, avant le début de la compétition. Ces listes servent à garantir la couverture d'assurance et à assurer le fair-play.

Tout joueur dont le nom n'est pas mentionné sur la liste de l'équipe est strictement interdit de participation. Si un joueur non inscrit est découvert en cours de match, l'arbitre l'expulse immédiatement. Tout but marqué par ce joueur non inscrit est refusé rétroactivement, et le joueur est expulsé du terrain.

Un joueur peut être ajouté ou retiré de la liste de l'équipe sur demande écrite (email) du capitaine auprès d'Ardentia, au moins 48 heures avant le prochain match, afin de permettre la mise à jour de la couverture d'assurance. Sans le respect de ce délai, le joueur ne peut faire partie du match.

## 2.4 Procédure de remplacement

Un nombre illimité de remplacements peut être effectué au cours d'un match. Un remplacement ne peut avoir lieu que lorsque le ballon n'est pas en jeu. Les règles suivantes s'appliquent :

-   Le joueur qui souhaite être remplacé fait appel à l'arbitre et lui demande l'autorisation d'être remplacé.

-   L'arbitre accorde le remplacement. Le joueur remplacé sort alors du terrain par la porte, puis rejoint la zone des remplaçants.

-   Le remplaçant entre ensuite sur la pelouse par la porte, uniquement après la sortie complète du joueur remplacé.

-   À partir du moment où le remplaçant entre sur le terrain, il devient joueur et le joueur remplacé devient remplaçant.

-   L'autorisation de procéder à un remplacement peut être refusée par l'arbitre si l'équipement du remplaçant n'est pas conforme.

-   Tous les joueurs, remplaçants et staff technique sont soumis à l'autorité de l'arbitre.

Si un joueur de champ effectue un remplacement sans aviser l'arbitre, il reçoit un avertissement verbal. En cas de récidive, l'arbitre lui adresse un carton jaune, voire rouge selon la gravité.

Si un remplaçant entre sur la pelouse avant le départ complet du joueur remplacé :

-   L'arbitre arrête le jeu (sauf application de la règle de l'avantage).

-   Le remplaçant est averti et invité à quitter immédiatement la pelouse.

-   Le jeu reprend par un coup franc indirect accordé à l'équipe adverse, à l'endroit où se trouvait le remplaçant irrégulier.

## 2.5 Sanctions impliquant les remplaçants et officiels d'équipe

Si un remplaçant ou un officiel du staff technique reçoit un carton rouge, son équipe doit retirer un joueur de champ pendant deux (2) minutes, sauf si un but est marqué par l'équipe adverse avant la fin de cette période, auquel cas un remplaçant peut entrer pour rétablir la parité numérique. Le remplaçant ou officiel expulsé ne peut plus participer au match sous quelque forme que ce soit.

Si un remplaçant reçoit un carton jaune alors qu'il est sur le banc, il portera cette sanction lorsqu'il entrera sur le terrain.

## 2.6 Changement de gardien de but

-   Tout joueur ou remplaçant peut prendre le rôle de gardien de but, à condition d'en informer l'arbitre lors d'un arrêt de jeu et de revêtir un dossard de couleur distincte.

-   Le changement doit obligatoirement se faire lors d'un arrêt du jeu et avec l'autorisation expresse de l'arbitre.

-   Si un joueur assume le rôle de gardien sans en informer l'arbitre et touche le ballon de la main dans sa surface, son équipe est sanctionnée d'un penalty.

-   Aucun changement de gardien n'est autorisé après le sifflement d'un penalty, sauf en cas de blessure grave constatée et validée par l'arbitre et Ardentia.

-   Lors des phases éliminatoires, si un match est décidé aux tirs au but, le gardien en place au moment du coup de sifflet final ne peut pas être changé, sauf blessure grave.

## 2.7 Joueurs et remplaçants expulsés

Un joueur expulsé (carton rouge) doit quitter immédiatement le terrain. Il ne peut plus participer au match.

Son équipe joue en infériorité numérique pendant deux (2) minutes de temps de jeu effectif. Un remplaçant peut entrer pour combler cette infériorité selon les conditions suivantes :

-   6 joueurs contre 5, ou 5 contre 4 : si l'équipe la plus nombreuse marque un but, l'équipe réduite peut faire entrer un remplaçant.

-   Si les deux équipes jouent à effectifs réduits égaux (ex : 5 contre 5, 4 contre 4) et qu'un but est marqué, aucune équipe ne récupère un joueur avant la fin de la réduction numérique respective de deux minutes.

-   6 joueurs contre 4 : si l'équipe à 6 marque, l'équipe à 4 ne peut faire entrer qu'un seul remplaçant (portant à 5 son effectif).

-   Si l'équipe en infériorité marque un but, le jeu continue sans modification du nombre de joueurs jusqu'à l'écoulement des deux minutes.

**Tout joueur expulsé par l’arbitre doit quitter immédiatement le terrain. En cas de refus de sortie, l’arbitre accorde un délai maximal de 5 minutes pour que le ou les joueurs concernés quittent le terrain. À défaut d’exécution dans ce délai, la rencontre est arrêtée et l’équipe du ou des joueurs expulsés est déclarée perdante par forfait.**

## 2.8 But marqué avec une personne supplémentaire sur le terrain

Si, après qu'un but est marqué et que le jeu a repris, l'arbitre constate qu'une personne supplémentaire se trouvait sur le terrain au moment du but, le but ne peut pas être refusé rétroactivement.

Si l'arbitre constate la présence d'une personne supplémentaire avant la reprise du jeu :

-   Le but est refusé si la personne supplémentaire appartenait à l'équipe ayant marqué (joueur, remplaçant, expulsé ou officiel). Le jeu reprend par un coup franc direct pour l’équipe adverse à l'endroit où se trouvait cette personne.

-   Le but est refusé si la personne supplémentaire était un agent extérieur ayant gêné le jeu. Le jeu reprend par une balle à terre.

Dans tous les cas, l'arbitre fait sortir la personne supplémentaire de la pelouse.

## 2.9 Capitaine d'équipe

Chaque équipe désigne un capitaine avant le début du match. Le capitaine est identifiable par un brassard. Il est le seul joueur autorisé à s'adresser à l'arbitre pour demander des éclaircissements sur une décision, et ce, de manière respectueuse et calme. Toute autre forme d'interpellation de l'arbitre par d'autres joueurs est passible d'avertissement.

Le capitaine est responsable du comportement de son équipe et de ses supporters. En cas d'incidents répétés, l'arbitre peut tenir le capitaine pour responsable disciplinairement.

# ARTICLE 3 — L'ÉQUIPEMENT DES JOUEURS

## 3.1 Sécurité

Aucun joueur ne peut utiliser ou porter un équipement ou objet dangereux pour lui-même ou pour autrui. Sont notamment interdits :

-   Tous bijoux : colliers, bagues, bracelets, boucles d'oreilles, élastiques métalliques. L'usage de ruban adhésif pour couvrir les bijoux n'est pas autorisé.

-   Chaussures à crampons métalliques ou tout autre équipement susceptible d'endommager le gazon synthétique ou de blesser un adversaire.

Si un joueur porte un équipement non autorisé, l'arbitre lui ordonne de le retirer. Si le joueur ne peut ou ne veut pas s'y conformer, il quitte le terrain au prochain arrêt. Un refus de se conformer, ou le port répété d'un article interdit, est sanctionné par un carton jaune.

## 3.2 Couleurs et tenues

Les deux équipes doivent porter des couleurs qui les distinguent l'une de l'autre ainsi que des officiels de match. Si les deux équipes portent des couleurs similaires, l'arbitre procède à un tirage au sort en présence des deux capitaines pour désigner l'équipe devant revêtir des dossards distinctifs fournis par Ardentia.

Le gardien de but doit obligatoirement porter un dossard d'une couleur distincte de celle de ses coéquipiers et de celle de l'équipe adverse.

## 3.3 Équipements de protection autorisés

Les équipements de protection non dangereux sont autorisés : masques de protection, lunettes de sport homologuées, genouillères et coudières en matériau rembourré souple. Ces équipements doivent être présentés à l'arbitre avant le match pour validation.

# ARTICLE 4 — L'ARBITRE

## 4.1 Autorité de l'arbitre

Chaque match est dirigé par un arbitre désigné par Ardentia. L'arbitre a pleine autorité pour faire respecter le présent règlement durant toute la durée du match, depuis son entrée sur le terrain jusqu'à sa sortie après le coup de sifflet final (y compris pendant les tirs au but).

## 4.2 Décisions de l'arbitre

Les décisions de l'arbitre sur les faits de jeu y compris l'attribution d'un but et le résultat du match sont définitives et sans appel immédiat. Elles prévalent sur celles des organisateurs présents sur place.

Si un assistant de match signale une infraction mais que l'arbitre ne l'observe qu'après la reprise du jeu, l'arbitre peut prendre les mesures disciplinaires appropriées, mais la sanction de reprise de jeu liée à la faute ne s'applique pas.

Toute protestation excessive contre une décision arbitrale y compris de la part du capitaine peut entraîner un avertissement verbal ou un carton jaune, selon l'appréciation de l'arbitre.

## 4.3 Pouvoirs et devoirs de l'arbitre

L'arbitre est investi des missions suivantes :

-   Appliquer le présent règlement Ardentia.

-   Vérifier l'équipement des joueurs avant le coup d'envoi.

-   Tenir un registre des incidents du match (cartons, buts, expulsions).

-   Agir comme chronométreur officiel du match.

-   Arrêter, suspendre ou abandonner le match en cas de problème (interférence extérieure, projecteurs défaillants, animal sur le terrain, conditions météorologiques dangereuses). En cas d'interférence extérieure affectant le jeu, le jeu reprend par une balle à terre, sauf si le ballon pénètre dans le but sans intervention de l'agent extérieur, auquel cas le but est accordé.

-   Arrêter le jeu en cas de blessure grave et veiller à ce que le joueur blessé soit retiré du terrain. Un joueur blessé ne peut pas être soigné sur le terrain sauf dans les cas suivants : collision entre gardien et joueur de champ, collision entre deux joueurs de la même équipe, blessure grave, penalty accordé au joueur blessé (qu'il soit tireur ou gardien).

-   Décider, avec l'aide des organisateurs, des incidents dont il n'a pas été directement témoin.

-   Garantir qu'aucune personne non autorisée ne pénètre sur le terrain.

-   Demander au capitaine de l'une ou l'autre équipe de calmer ses spectateurs lorsque leur comportement perturbe le bon déroulement du match. Si nécessaire, l'arbitre arrête le jeu jusqu'au retour au calme.

-   En cas de défaillance du chronomètre, aviser immédiatement Ardentia pour en obtenir un de remplacement.

## 4.4 Équipement obligatoire de l'arbitre

-   Au moins un sifflet.

-   Cartons rouges et jaunes.

-   Un carnet (ou tout autre support) pour la tenue du registre du match.

-   Au moins une montre ou chronomètre.

# ARTICLE 5 — LA DURÉE DU MATCH

## 5.1 Périodes de jeu

Un match se compose de deux (2) périodes de vingt (20) minutes chacune de temps de jeu effectif. Le chronomètre est arrêté à chaque interruption de jeu (blessures, remplacements, litiges, etc.) et repris à la reprise du jeu.

## 5.2 Temps morts et arrêts de jeu

L'arbitre est responsable du décompte de tous les temps morts et s'assure qu'ils sont ajoutés au temps officiel du match. La durée totale cumulée des arrêts de jeu ne peut excéder dix (10) minutes par match. Au-delà de ce seuil, l'arbitre peut, à sa discrétion et après concertation avec Ardentia, suspendre ou arrêter le match.

## 5.3 Intervalle à la mi-temps

Les joueurs ont droit à une pause à la mi-temps ne dépassant pas cinq (5) minutes. À l'issue de la pause, les équipes changent de côté de terrain. Les officiels d'équipe et remplaçants changent également de banc.

## 5.4 Fin des périodes

L'arbitre siffle la fin de chaque période de vingt minutes. Il peut prolonger une période pour permettre l'exécution d'un coup franc, d'un penalty ou d'un corner accordé juste avant le coup de sifflet final.

## 5.5 Prolongation

Il n'y a pas de prolongation dans le cadre de ce règlement. En phases éliminatoires, en cas d'égalité à l'issue du temps réglementaire, les équipes passent directement aux tirs au but (voir Article 13).

# ARTICLE 6 — LE COUP D'ENVOI ET LA REPRISE DU JEU

## 6.1 Coup d'envoi

Avant le début du match, l'arbitre effectue un tirage au sort (pièce de monnaie) en présence des deux capitaines. L'équipe gagnante choisit le sens d'attaque pour la première période ; l'équipe perdante effectue le coup d'envoi. À la mi-temps, les rôles s'inversent.

Le coup d'envoi est effectué depuis le centre du terrain au coup de sifflet de l'arbitre. Le ballon doit être stationnaire au centre. Les joueurs de l'équipe adverse doivent se trouver dans leur propre moitié de terrain. Le ballon est en jeu dès qu'il est touché. Un but peut être marqué directement sur un coup d'envoi.

## 6.2 Reprise après un but

Après qu'un but est accordé, le jeu reprend par un coup d'envoi effectué par l'équipe qui a encaissé le but, depuis le centre du terrain.

## 6.3 Balle à terre

Une balle à terre est accordée lorsque l'arbitre a arrêté le jeu sans qu'aucune infraction n'ait été commise (blessure, objet sur le terrain, etc.). La procédure est la suivante :

-   L'arbitre lâche le ballon à l'endroit où il se trouvait au moment de l'arrêt (ou à l'endroit le plus proche en jeu).

-   Le ballon est en jeu dès qu'il touche le sol.

-   Les joueurs adverses doivent se tenir à au moins un (1) mètre du ballon jusqu'à ce qu'il soit en jeu.

-   Si la balle à terre doit être donnée dans la surface de réparation, elle est donnée sur la ligne de surface de réparation la plus proche du point d'arrêt.

# ARTICLE 7 — LE HORS-JEU

La règle du hors-jeu ne s'applique pas dans ce format de jeu. Aucun joueur ne peut être sanctionné pour hors-jeu, quelle que soit sa position sur le terrain.

# ARTICLE 8 — LES REMISES EN JEU (TOUCHES)

## 8.1 Accord d'une remise en jeu

Une remise en jeu est accordée lorsque le ballon franchit entièrement la ligne de touche (latérale) — que ce soit au sol ou en l'air — au dernier contact d'un joueur de l'équipe adverse.

## 8.2 Procédure

La remise en jeu se fait au pied (coup de pied de touche). Les règles suivantes s'appliquent :

-   Le ballon doit être posé, immobile, sur la ligne de touche, à l'endroit exact où il est sorti.

-   Le joueur effectuant la remise dispose de cinq (5) secondes pour jouer le ballon, à partir du moment où celui-ci est posé sur la ligne.

-   Les adversaires doivent se tenir à au moins cinq (5) mètres du point de remise en jeu.

-   Le joueur effectuant la remise ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

-   Un but ne peut pas être marqué directement depuis une remise en jeu en touche.

Si le joueur dépasse le délai de cinq (5) secondes, ou s'il ne pose pas le ballon sur la ligne de touche, la remise en jeu est accordée à l'équipe adverse.

## 8.3 Ballon sorti en fond de terrain

Si le ballon sort entièrement par la ligne de fond (ligne de but) sans qu'un but ne soit marqué, les règles suivantes s'appliquent selon le dernier contact :

-   Dernier contact d'un défenseur : corner accordé à l'équipe attaquante (voir Article 9).

-   Dernier contact d'un attaquant : coup de pied de but accordé à l'équipe défendante (voir Article 10).

# ARTICLE 9 — LES CORNERS

## 9.1 Accord d'un corner

Un corner est accordé à l'équipe attaquante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe défendante.

## 9.2 Procédure

-   Le ballon est posé, immobile, dans l'arc de corner le plus proche du point de sortie.

-   Le tireur dispose de huit (8) secondes pour frapper le ballon, à partir du moment où celui-ci est posé dans l'arc de corner.

-   Les joueurs adverses doivent se tenir à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Le ballon est en jeu dès qu'il est frappé.

-   Un but peut être marqué directement depuis un corner.

-   Le tireur ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

## 9.3 Infractions

Si le tireur dépasse le délai de huit (8) secondes ou ne respecte pas la procédure, le jeu reprend par un coup de pied de but en faveur de l'équipe adverse. Si un adversaire pénètre dans la zone des cinq mètres avant la frappe, le corner est retiré.

# ARTICLE 10 — LES COUPS DE PIED DE BUT

## 10.1 Accord d'un coup de pied de but

Un coup de pied de but est accordé à l'équipe défendante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe attaquante.

## 10.2 Procédure

-   Le gardien de but (ou tout joueur défenseur désigné) effectue le coup de pied de but depuis n'importe quel point à l'intérieur de la surface de réparation.

-   Le ballon est en jeu dès qu'il sort de la surface de réparation.

-   Les joueurs adverses doivent se trouver hors de la surface de réparation jusqu'à ce que le ballon soit en jeu.

-   Le gardien dispose de quatre (4) secondes pour mettre le ballon en jeu après l'avoir récupéré.

-   Un but peut être marqué directement depuis un coup de pied de but.

-   Le joueur effectuant le coup de pied ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

# ARTICLE 11 — FAUTES ET INCONDUITES

## 11.1 Coup franc direct

Toute infraction impliquant un contact avec un adversaire est sanctionnée par un coup franc direct ou, si elle est commise par un joueur dans sa propre surface de réparation, par un penalty (voir Article 11.4).

Un coup franc direct est accordé à l'équipe adverse lorsqu'un joueur commet l'une des infractions suivantes de manière jugée insouciante, imprudente ou avec usage excessif de la force :

-   Tacler ou défier un adversaire de manière dangereuse.

-   Sauter sur un adversaire.

-   Charger un adversaire.

-   Frapper ou tenter de frapper un adversaire.

-   Pousser un adversaire.

-   Mordre ou cracher sur quelqu'un.

-   Tenir un adversaire.

-   Faire trébucher ou tenter de faire trébucher un adversaire.

-   Toucher intentionnellement le ballon avec la main ou le bras (sauf le gardien dans sa surface).

L'évaluation de la faute suit les degrés suivants :

-   **Insouciance :** le joueur fait preuve d'un manque d'attention ou de considération en disputant le ballon, ou agit sans précaution. Coup franc direct, sans sanction disciplinaire.

-   **Imprudence :** le joueur agit sans tenir compte du danger ou des conséquences de son geste pour l'adversaire. Coup franc direct et carton jaune obligatoire.

-   **Usage excessif de la force :** le joueur dépasse la force nécessaire et/ou met en danger la sécurité d'un adversaire. Coup franc direct et carton rouge obligatoire (expulsion).

## 11.2 Coup franc indirect

Un coup franc indirect sanctionne une infraction commise sans contact avec un adversaire. Il est accordé à l'équipe adverse si un joueur :

-   Joue de manière dangereuse sans contact (ex. : tenter une tête alors qu'un adversaire s'apprête à botter le ballon à hauteur de la tête).

-   Fait obstruction à la progression d'un adversaire sans contact.

-   Empêche le gardien de lâcher le ballon.

-   Est coupable de dissidence, langage ou gestes offensants, insultants ou abusifs.

Un coup franc indirect est également accordé à l'équipe adverse si le gardien :

-   Touche le ballon avec les mains ou les bras à l'intérieur de sa surface de réparation après qu'il a été délibérément botté par un coéquipier (règle de la passe en retour).

-   Reçoit directement dans les mains une rentrée de touche effectuée au pied par un coéquipier.

Le gardien est considéré comme en contrôle du ballon lorsque : il le tient dans ses mains, le fait rebondir sur le sol ou le projette en l'air.

Sur un coup franc indirect, un but ne peut être accordé que si le ballon a touché un autre joueur avant de pénétrer dans le but.

## 11.3 Le mur et la distance réglementaire

Les règles suivantes s'appliquent à tout coup franc, direct ou indirect :

-   Lors d'un coup franc adverse, les joueurs formant le mur doivent se placer à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Lorsque le coup franc est sifflé dans la propre moitié de terrain de l'équipe qui en bénéficie, aucun mur n'est autorisé : les adversaires doivent simplement se tenir à cinq (5) mètres du ballon.

-   Tout joueur qui ne respecte pas la distance réglementaire est passible d'un carton jaune (voir Article 11.5).

## 11.4 Le penalty

Un penalty est accordé lorsqu'un joueur commet, dans sa propre surface de réparation, l'une des infractions passibles d'un coup franc direct, que le ballon soit en jeu ou non.

Procédure d'exécution d'un penalty :

-   Le ballon est placé sur le point de penalty tracé sur le terrain.

-   Le gardien adverse se place sur sa ligne de but, entre les poteaux, et ne peut pas avancer avant que le ballon soit frappé.

-   Tous les autres joueurs (des deux équipes) se placent en dehors de la surface de réparation et derrière le ballon (ou sur la ligne de but adjacente) jusqu'à ce que le ballon soit frappé.

-   Le tireur désigné frappe le ballon vers l'avant en un seul mouvement. Tout arrêt complet du mouvement lors de l'élan est sanctionné par un coup franc indirect en faveur de l'équipe défendante.

-   Si le gardien avance prématurément et que le tir est manqué ou repoussé, le penalty est retiré. Si le tir est transformé, le but est accordé.

-   Si le ballon rebondit sur les poteaux ou la barre et revient en jeu, tout joueur peut jouer le ballon, y compris le tireur.

-   Si le temps réglementaire expire avant l'exécution du penalty, celui-ci est tout de même tiré et le match se termine à l'issue de son exécution.

## 11.5 Cartons jaunes — Avertissements

Un carton jaune est délivré à un joueur, remplaçant ou officiel d'équipe pour l'une des raisons suivantes :

-   Comportement antisportif (simulation, protestation excessive, jeu déloyal).

-   Dissidence par les mots ou les gestes envers l'arbitre.

-   Infractions répétées aux règles du jeu.

-   Retarder la reprise du jeu.

-   Ne pas respecter la distance requise lors d'un coup franc, corner ou remise en jeu.

-   Entrer ou quitter le terrain sans autorisation.

-   Imprudence dans un tacle ou une charge.

Deux (2) cartons jaunes dans le même match entraînent automatiquement un carton rouge (expulsion).

Les cartons jaunes ne se cumulent pas d'un match à l'autre. Aucun joueur ne peut être suspendu en raison d'un cumul de cartons jaunes.

## 11.6 Cartons rouges — Expulsions

Un carton rouge est délivré pour l'une des raisons suivantes, entraînant l'expulsion immédiate du joueur :

-   Faute grossière (tacle ou charge mettant en danger l'intégrité physique d'un adversaire).

-   Comportement violent (coup, tentative de coup, morsure, crachat).

-   Déni d'une occasion de but manifeste par une faute de main volontaire (hors gardien dans sa surface).

-   Déni d'une occasion de but manifeste par une faute physique.

-   Langage ou gestes offensants, insultants ou abusifs envers quiconque.

-   Deux cartons jaunes dans le même match.

Un joueur expulsé quitte le terrain immédiatement. Son équipe joue en infériorité numérique pendant deux (2) minutes (voir Article 2.7). Le joueur expulsé ne peut plus participer au match.

**Après un carton rouge :** un carton rouge n'entraîne pas de suspension automatique. Un joueur expulsé peut jouer le match suivant de son équipe, sauf si le conseil de discipline décide de le suspendre (voir Article 19). Seul le conseil de discipline peut prononcer une suspension.

## 11.7 Erreur d'identification lors d'un carton

Si l'arbitre se rend compte, avant la reprise du jeu, qu'il a attribué un carton au mauvais joueur, il annule la sanction envers ce joueur et l'attribue au joueur fautif. Toute réclamation pour erreur d'identification doit être soulevée immédiatement et avant la reprise du jeu.

# ARTICLE 12 — LES BUTS

## 12.1 But valide

Un but est accordé lorsque la totalité du ballon franchit entièrement la ligne de but, entre les poteaux et sous la barre transversale, à condition qu'aucune infraction n'ait été commise par l'équipe marquant le but. Un but est accordé si le gardien lance le ballon directement dans le but adverse.

## 12.2 But refusé

Un but est refusé dans les cas suivants :

-   Une infraction a été commise par l'équipe attaquante avant ou pendant l'action menant au but.

-   Une personne supplémentaire appartenant à l'équipe attaquante se trouvait sur le terrain (voir Article 2.8).

-   Le ballon a été touché par un agent extérieur appartenant à l'équipe attaquante avant d'entrer dans le but.

# ARTICLE 13 — LES TIRS AU BUT

## 13.1 Quand sont-ils organisés ?

Les tirs au but sont organisés exclusivement lors des phases éliminatoires en cas d'égalité à l'issue du temps réglementaire. Ils ne font pas partie du match et les statistiques de la série de tirs au but ne sont pas comptabilisées dans les buts du match.

## 13.2 Désignation du but et ordre de tir

-   L'arbitre effectue un tirage au sort en présence des deux capitaines pour désigner le but dans lequel les tirs seront effectués.

-   Un second tirage au sort détermine l'équipe qui tire en premier.

-   Chaque équipe désigne cinq (5) tireurs parmi les joueurs qui se trouvaient sur le terrain au coup de sifflet final. Un joueur expulsé ne peut pas participer aux tirs au but.

-   L'ordre de passage des tireurs est librement choisi par chaque équipe.

## 13.3 Procédure de chaque tir

-   Les joueurs qui ne tirent pas se regroupent au centre du terrain, à au moins dix (10) mètres des tireurs.

-   Seul le tireur désigné et les deux gardiens sont autorisés dans la moitié de terrain des buts.

-   Le gardien doit rester sur sa ligne de but jusqu'à ce que le ballon soit frappé.

-   Les mêmes règles que pour un penalty en cours de match s'appliquent (voir Article 11.4).

## 13.4 Issue de la série initiale

L'équipe qui marque le plus de tirs sur les cinq tentatives de chaque côté est déclarée vainqueur. Si les deux équipes sont toujours à égalité après la série de cinq tirs chacune, la séance se poursuit en mort subite : les mêmes cinq joueurs tirent à nouveau, dans le même ordre ou un ordre différent choisi par l'équipe, jusqu'à ce qu'une équipe marque et que l'autre manque sur le même numéro de tir.

# ARTICLE 14 — FORFAIT ET MATCHS NON JOUÉS

## 14.1 Non-présentation et délai de carence

Si une équipe ne se présente pas ou ne réunit pas le nombre minimum de joueurs (4) dans un délai de quinze (15) minutes après l'heure officielle de début du match, le match lui est attribué par forfait. Le score officiel est fixé à 3-0 en faveur de l'équipe présente.

En cas de force majeure dûment justifiée et communiquée à Ardentia avant le début du délai de carence, Ardentia se réserve le droit d'examiner la situation, étant entendu que les reports de matchs ne sont pas acceptés en règle générale (voir Article 17.5).

## 14.2 Équipe avec un effectif en dessous du minimum en cours de match

Si, en cours de match, une équipe se retrouve avec moins de quatre (4) joueurs suite à des expulsions ou blessures sans remplaçants disponibles, le match est arrêté. L'équipe concernée est déclarée perdante par forfait. Le score retenu est 3-0 en sa défaveur, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 14.3 Forfait général (retrait d'une équipe de la compétition)

Une équipe qui déclare forfait pour le reste de la compétition est retirée de celle-ci. Cette règle s'applique au championnat et à la phase de groupes du tournoi. Tous les matchs déjà disputés par l'équipe forfait sont annulés, et ses matchs restants ne sont pas joués. Les conséquences sont les suivantes :

-   **Points :** chaque équipe qui avait battu l'équipe forfait perd les trois (3) points de cette victoire. Chaque équipe qui avait fait match nul contre elle perd un (1) point. Les équipes qui avaient perdu contre elle ne perdent aucun point.

-   **Buteurs :** les buts marqués par des joueurs contre l'équipe forfait sont retirés de leur total personnel et du classement des buteurs.

-   **Buts marqués contre l'équipe forfait :** ils sont retirés du total de buts marqués de chaque équipe adverse concernée.

-   **Buts marqués par l'équipe forfait :** ils sont retirés du total de buts encaissés de chaque équipe adverse concernée.

-   **Cartons :** les cartons jaunes et rouges reçus lors des matchs annulés ne sont plus comptés pour le départage des équipes (Article 17.3, critères 5 et 6). En revanche, les sanctions décidées par le conseil de discipline (Article 19) restent applicables aux joueurs concernés.

La différence de buts, le classement général des équipes et le classement des buteurs sont recalculés en conséquence par Ardentia.

**Forfait en phase à élimination directe :** si une équipe déclare forfait ou abandonne la compétition pendant la phase à élimination directe du tournoi, son adversaire est qualifié d'office pour le tour suivant, sur le score de 3-0. Les résultats de la phase de groupes ne sont pas modifiés.

# ARTICLE 15 — RÈGLES SPÉCIFIQUES AU GARDIEN DE BUT

## 15.1 Dans sa surface de réparation

Le gardien peut utiliser ses mains et ses bras pour jouer le ballon exclusivement à l'intérieur de sa propre surface de réparation. En dehors de sa surface, il est soumis aux mêmes règles que n'importe quel joueur de champ et ne peut en aucun cas utiliser ses mains ou ses bras pour jouer le ballon.

## 15.2 Hors de sa surface de réparation

Le gardien peut se déplacer librement en dehors de sa surface et jouer le ballon au pied comme tout joueur de champ. Toute utilisation des mains hors de la surface est sanctionnée par un coup franc direct accordé à l'équipe adverse.

## 15.3 Règle des quatre secondes

Le gardien dispose de quatre (4) secondes maximum pour mettre le ballon en jeu à partir du moment où il en prend le contrôle (avec les mains, en le faisant rebondir ou en le projetant en l'air). Au-delà, un corner est accordé à l'équipe adverse.

## 15.4 Règle de la passe en retour

Si un coéquipier botte délibérément le ballon vers son propre gardien, celui-ci ne peut pas le toucher avec les mains ou les bras à l'intérieur de sa surface. Une infraction à cette règle est sanctionnée par un coup franc indirect accordé à l'équipe adverse à l'endroit où le gardien a touché le ballon. La même règle s'applique si le ballon est directement remis en jeu (touche au pied) vers le gardien par un coéquipier.

# ARTICLE 16 — FAIR-PLAY ET COMPORTEMENT

## 16.1 Comportement envers l'arbitre

Tout joueur, remplaçant ou officiel d'équipe doit respecter l'arbitre à tout moment. Seul le capitaine est autorisé à s'adresser à l'arbitre pour demander des explications, calmement et avec respect.

-   Contestation verbale légère : avertissement verbal.

-   Contestation persistante ou irrespectueuse : carton jaune.

-   Langage offensant, insultant ou abusif envers l'arbitre : carton rouge direct et potentiellement une suspension décidée par le conseil de discipline (voir Article 19).

## 16.2 Comportement général

Les règles de fair-play et de respect mutuel s'appliquent à tout moment, y compris en dehors du terrain (abords du terrain, zone de spectateurs, vestiaires, avant et après le match). Tout incident survenant dans ces zones est traité avec les mêmes sanctions disciplinaires que s'il s'était produit sur le terrain.

Les comportements suivants sont passibles de sanctions, y compris de suspension (décidée par le conseil de discipline, voir Article 19) ou d'exclusion de la compétition par Ardentia :

-   Insultes ou provocations à l'égard des adversaires, arbitres ou spectateurs.

-   Comportements discriminatoires (racisme, sexisme, etc.).

-   Comportements violents ou menaçants.

## 16.3 Substances interdites

Il est strictement interdit de participer à un match sous l'influence d'alcool, de drogues ou de toute substance altérant les facultés physiques ou mentales. Tout joueur suspecté d'être sous l'influence d'une telle substance peut être exclu du match par l'arbitre, en concertation avec Ardentia, sans que cela n'entraîne de sanction numérique pour son équipe (le joueur est simplement considéré comme indisponible).

## 16.4 Respect du matériel

Les joueurs et officiels d'équipe sont tenus de respecter les installations d'Ardentia : terrain, buts, filets, vestiaires et tout autre équipement. Tout dommage causé intentionnellement ou par négligence grave peut faire l'objet d'une indemnisation financière et/ou d'une exclusion de la compétition, selon la décision d'Ardentia.

# ARTICLE 17 — ORGANISATION DE LA COMPÉTITION

## 17.1 Format de la compétition

Ardentia organise deux types de compétitions :

-   Le Championnat : compétition basée sur un système de points, avec des matchs disputés selon un calendrier établi par Ardentia.

-   Le Tournoi : compétition comportant une phase de groupes suivie d'une phase à élimination directe.

Les modalités détaillées de chaque compétition (nombre de journées, format de poules, etc.) sont communiquées par Ardentia avant le début de chaque édition.

**Saison 2026/2027 :** la saison commence par une pré-saison, puis les équipes sont réparties en deux divisions, MASTER et CHALLENGER.

**Pré-saison (système suisse) :**

-   Chaque équipe joue quatre (4) matchs.

-   Journée 1 : les rencontres sont tirées au sort par Ardentia. Le tirage est enregistré et peut être rejoué à l'identique.

-   Journées 2 à 4 : chaque équipe affronte une équipe qui a le même nombre de points, ou le nombre le plus proche. Deux équipes ne peuvent pas se rencontrer deux fois.

-   Avec un nombre impair d'équipes, une équipe est au repos à chaque journée : en principe l'équipe la moins bien classée qui n'a pas encore été au repos.

-   Rattrapage : après la journée 4, les équipes qui ont été au repos se rencontrent entre elles, afin que chaque équipe ait joué quatre (4) matchs.

**Répartition :** à l'issue de la pré-saison, les équipes classées de la 1re à la 12e place forment la division MASTER ; les équipes classées de la 13e à la 23e place forment la division CHALLENGER. Chaque division dispute ensuite son propre championnat.

## 17.2 Système de points — Championnat

-   Victoire : 3 points.

-   Match nul : 1 point pour chaque équipe.

-   Défaite : 0 point.

-   Forfait : 0 point pour l'équipe forfait, 3 points et score 3-0 pour l'équipe présente.

-   Forfait général (retrait d'une équipe en cours de compétition) : voir Article 14.3.

## 17.3 Critères de classement des équipes

Le classement des équipes en MASTER, en CHALLENGER et en phase de groupes est établi selon les critères suivants, par ordre de priorité. Chaque critère n'est appliqué que si l'égalité persiste après le critère précédent :

1.  **Points :** 3 points pour une victoire, 1 point pour un match nul, 0 point pour une défaite (voir Article 17.2).

2.  **Confrontation directe :** résultat du ou des matchs ayant opposé les équipes à égalité. Si plus de deux équipes sont à égalité, un mini-classement est établi entre elles sur la base des seuls matchs qui les ont opposées.

3.  **Différence de buts :** buts marqués moins buts encaissés, sur l'ensemble des matchs de la saison ou du groupe.

4.  **Buts marqués :** nombre total de buts inscrits sur l'ensemble des matchs.

5.  **Cartons jaunes :** l'équipe ayant reçu le moins de cartons jaunes est classée devant.

6.  **Cartons rouges :** l'équipe ayant reçu le moins de cartons rouges est classée devant.

Si l'égalité persiste après l'application de l'ensemble de ces critères, les équipes sont départagées par un tirage au sort organisé par Ardentia.

**Classement de la pré-saison :** les critères ci-dessus ne s'appliquent pas à la pré-saison, dont le classement est établi selon : 1) Points 2) Différence de buts 3) Buts marqués 4) Force des adversaires (total des points des adversaires rencontrés) 5) Tirage au sort. Pour former les journées 2 à 4, le classement provisoire utilise les critères 1, 2, 3 et 5.

## 17.4 Réclamations et litiges

Si une équipe souhaite formuler une réserve ou une réclamation concernant un match, elle doit la soumettre à Ardentia dans les vingt-quatre (24) heures suivant le coup de sifflet final du match concerné. La réclamation peut être transmise par WhatsApp ou par email à l'adresse communiquée par Ardentia. Toute réclamation formulée après ce délai sera irrecevable.

Ardentia examinera la réclamation et communiquera sa décision dans un délai raisonnable. La décision d'Ardentia est définitive.

## 17.5 Reports de matchs

Les demandes de report de match ne sont pas acceptées. Tout match non disputé à la date et à l'heure prévues est attribué par forfait à l'équipe absente (voir Article 14.1), sauf décision contraire et exceptionnelle d'Ardentia.

## 17.6 Conditions météorologiques

La décision de maintenir, reporter ou annuler un match en raison des conditions météorologiques appartient exclusivement à Ardentia. Cette décision est communiquée aux équipes dans un délai d'au moins vingt-quatre (24) heures avant le match concerné, sauf si les conditions météorologiques se dégradent de manière imprévisible dans les heures précédant le match, auquel cas la décision peut être prise plus tardivement.

-   En cas de forte pluie ou de conditions dangereuses : le match est annulé ou reporté par Ardentia.

-   En cas de pluie légère : le match se déroule comme prévu, sauf si l'arbitre, en concertation avec Ardentia, juge les conditions dangereuses ou le terrain impraticable.

## 17.7 Procès-verbaux (PV)

Toutes les réunions, les discussions au sujet d'incidents et les décisions prises par Ardentia ou par le conseil de discipline (sanctions disciplinaires, suspensions, traitement des réclamations, forfaits, etc.) sont documentées par des procès-verbaux (PV) écrits.

-   Chaque PV est envoyé dans le groupe WhatsApp des capitaines.

-   Sur demande, le PV est également envoyé par email à toute personne concernée.

# ARTICLE 18 — AUTRES CAS DE FIGURES

## 18.1 Abandon d’un match

Si une équipe abandonne son match sous forme de protestation contre une décision d’un arbitre ou d’un officiel du match, celle-ci sera qualifiée de perdante par forfait. Ainsi, elle perd son match 3-0.

# ARTICLE 19 — CONSEIL DE DISCIPLINE

## 19.1 Rôle

Le conseil de discipline décide des sanctions en cas de comportement antisportif. Il est la seule instance pouvant suspendre un joueur, notamment après un carton rouge (voir Article 11.6).

## 19.2 Composition

Le conseil de discipline compte trois (3) voix :

-   Ardentia : 1 voix ;

-   l'Association Sifflé d'Or : 1 voix ;

-   les capitaines : 1 voix, qui est le résultat de leur vote.

## 19.3 Capitaines qui votent

Seuls les capitaines de la ligue qui n'est pas concernée par l'affaire votent :

-   si l'équipe concernée joue en MASTER, ce sont les capitaines de CHALLENGER qui votent ;

-   si l'équipe concernée joue en CHALLENGER, ce sont les capitaines de MASTER qui votent.

## 19.4 Sanctions possibles

Avant chaque vote, les deux seules sanctions possibles sont fixées :

-   un avertissement ;

-   une suspension, dont le nombre de matchs est fixé avant le vote.

## 19.5 Organisation du vote

Le vote est lancé dans le groupe WhatsApp du conseil, par un lien vers un formulaire de vote.

Le vote est ouvert pendant huit (8) heures à partir de la publication du lien. Les votes reçus après ce délai ne sont pas comptés.

Chaque membre doit suivre le groupe WhatsApp du conseil. Ni la ligue ni le conseil ne sont responsables si un membre n'a pas vu le vote à temps.

## 19.6 Vote anonyme

Tous les votes sont anonymes. Personne ne peut savoir ce qu'un membre a voté.

## 19.7 Voix des capitaines

La voix des capitaines va à la sanction qui a obtenu le plus de votes parmi les capitaines ayant voté dans le délai.

En cas d'égalité, ou si aucun capitaine n'a voté, la voix des capitaines va à l'avertissement.

## 19.8 Décision finale

Le résultat est arrêté à la fin des huit (8) heures, quel que soit le nombre de votants.

La sanction qui obtient le plus de voix est retenue.

En cas d'égalité entre les voix exprimées, l'avertissement est retenu.

## 19.9 Communication

La décision est annoncée par écrit à l'équipe concernée et consignée dans un procès-verbal (voir Article 17.7). Seule la sanction retenue est communiquée, sans le détail des votes. Cette décision est définitive.
`,P=`Règlement officiel — Football 6 contre 6`;function F(){return[{id:`rulebook_v9`,version:`v9`,title:P,date:`2026-11-11`,season_id:M,content:N,pdf_url:`/reglement/reglement-ardentia-v9.pdf`,docx_url:`/reglement/REGLEMENT_DE_JEU_ARDENTIA_FOOTBALL_v9.docx`,status:`current`,changes:`Règlement v8 d’Ardentia complété du fonctionnement de la plateforme : pré-saison en système suisse et répartition MASTER / CHALLENGER (Art. 17.1), classement de la pré-saison (Art. 17.3), capitaines votants MASTER / CHALLENGER (Art. 19.3), coquilles corrigées (Art. 2.3). Nouveautés du v8 : plus de cumul de jaunes ni de suspension automatique, conseil de discipline (Art. 19), procès-verbaux (Art. 17.7), remplacements par la porte après accord de l’arbitre (Art. 2.4), règle des 4 secondes retirée de l’Art. 11.2.`},{id:`rulebook_v4`,version:`v4`,title:P,date:`2026-11-09`,content:se,pdf_url:`/reglement/reglement-ardentia-v4.pdf`,status:`archived`,changes:`Version remplacée par la v9 (elle prévoyait le cumul des jaunes et une suspension automatique après un rouge). Cumul des cartons jaunes : 3 jaunes = 1 match de suspension (Art. 11.5). Suspension d’au moins 1 match après un carton rouge, alourdie possible par Ardentia (Art. 11.6). Gardien : 4 secondes dans sa moitié de terrain (Art. 4.3).`},{id:`rulebook_v3`,version:`v3`,title:P,date:`2026-11-09`,content:oe,pdf_url:`/reglement/reglement-ardentia-v3.pdf`,status:`archived`,changes:`Version remplacée par la v4 (les cartons ne se cumulaient pas d’un match à l’autre).`}]}var I=l.format.playersOnPitch;I-1,`${I}${I}`;function L(e,t){let n=e.starter_ids??[];if(n.length<=I)return e;let r=new Map;for(let n of t)if(n.match_id===e.match_id)for(let e of[n.player_id,n.related_player_id])e&&r.set(e,(r.get(e)??0)+1);let i=e.goalkeeper_id&&n.includes(e.goalkeeper_id)?e.goalkeeper_id:void 0,a=n.filter(e=>e!==i).map((e,t)=>({id:e,i:t})).sort((e,t)=>(r.get(t.id)??0)-(r.get(e.id)??0)||e.i-t.i).map(e=>e.id),o=new Set([...i?[i]:[],...a].slice(0,I));return{...e,starter_ids:n.filter(e=>o.has(e)),substitute_ids:[...n.filter(e=>!o.has(e)),...(e.substitute_ids??[]).filter(e=>!o.has(e))]}}var ce=[{number:`PS-01`,day:`2026-11-16`,time:`21:00`,a:`Distra`,b:`BMCI`},{number:`PS-02`,day:`2026-11-16`,time:`21:00`,a:`Crédit Agricole`,b:`Pharmaprom`},{number:`PS-03`,day:`2026-11-16`,time:`22:00`,a:`CAC`,b:`Taqeef (Midea)`},{number:`PS-04`,day:`2026-11-17`,time:`20:00`,a:`L'Heure Joyeuse`,b:`ALD Automotive`},{number:`PS-05`,day:`2026-11-17`,time:`20:00`,a:`G3C`,b:`Mega Post Tension`},{number:`PS-06`,day:`2026-11-17`,time:`21:00`,a:`Michoc`,b:`Atelier Vert Casa`},{number:`PS-07`,day:`2026-11-17`,time:`21:00`,a:`JTI`,b:`Cobco`},{number:`PS-09`,day:`2026-11-19`,time:`21:00`,a:`Arrow ECS`,b:`Marjane Market`},{number:`PS-10`,day:`2026-11-19`,time:`21:00`,a:`Atelier Vert Rabat`,b:`Attijariwafa bank`},{number:`PS-11`,day:`2026-11-19`,time:`22:00`,a:`Parebrise Express`,b:`CTR`}],le=`Wafasalaf`,R=`Tirage au sort officiel (saisie manuelle)`,z=(e,t=[])=>{let n=O([e]);if(!n)throw Error(`Équipe inconnue : ${e}`);return t.find(e=>e.season_id===`season_2026`&&e.short_name===n.short)?.id??`t26_${n.short.toLowerCase()}`};function B(e,t,n,r=new Date().toISOString(),a=[]){let l=new Map,u=ce.map(n=>{let o=`${n.day}T${n.time}`,s=l.get(o)??0;return l.set(o,s+1),{id:`m26_${n.number.toLowerCase().replace(`-`,``)}`,season_id:t,competition_id:e,round:1,stage:`league_phase`,number:n.number,date:c(n.day,n.time),pitch:i[s],home_team_id:z(n.a,a),away_team_id:z(n.b,a),status:`scheduled`,published:!0,pairing_reason:`Tirage au sort`,created_date:r}}),d=z(le,a),f=u.flatMap(e=>[e.home_team_id,e.away_team_id]),p=[];for(let e of n){let t=f.filter(t=>t===e).length;(e===d?t!==0:t!==1)&&p.push(`${e} apparaît ${t} fois`)}for(let e of f)n.includes(e)||p.push(`${e} ne fait pas partie de la pré-saison`);if(n.length!==f.length+1&&p.push(`${n.length} équipes en pré-saison pour ${f.length} équipes tirées + 1 au repos`),p.length)throw Error(`Tirage officiel incohérent : ${p.join(` ; `)}`);let m={draw_source:`manual`,seed:void 0,draw_order:[...f,d],drawn_at:`2026-11-13T12:00:00.000Z`,drawn_by:R,revealed:f.length+1,rests:{1:d},created_rounds:[1],published_rounds:[1],number_counter:Math.max(...u.map(e=>o(e.number)))};return{matches:u,rest:d,preseason:m,nextNumber:s(m.number_counter+1)}}var V=[`orange`,`bleue`],H={orange:`#F05A22`,bleue:`#1F6FE0`},U=e=>e===`orange`?`bleue`:`orange`;function W(){return[{id:`cap_orange`,side:`orange`,name:`Équipe Orange`,color:H.orange,player_ids:[]},{id:`cap_bleue`,side:`bleue`,name:`Équipe Bleue`,color:H.bleue,player_ids:[]}]}function ue(e=[]){let t=W();return{orange:e.find(e=>e.side===`orange`)??t[0],bleue:e.find(e=>e.side===`bleue`)??t[1]}}function de(e){if(e.logo_url)return e.logo_url;let t=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${e.color??H[e.side]}"/><stop offset="1" stop-color="#0B2E73"/></linearGradient></defs><path d="M50 4 90 18v30c0 24-17 40-40 48C27 88 10 72 10 48V18z" fill="url(#g)" stroke="#fff" stroke-width="4"/><text x="50" y="66" font-family="Arial Black,Arial,sans-serif" font-size="44" font-weight="900" fill="#fff" text-anchor="middle">${e.side===`orange`?`O`:`B`}</text></svg>`;return`data:image/svg+xml;utf8,${encodeURIComponent(t)}`}var G=e=>e.status===`finished`;function K(e){let t=t=>e.lines.filter(e=>e.side===t).reduce((e,t)=>e+t.goals,0)+e.lines.filter(e=>e.side===U(t)).reduce((e,t)=>e+t.og,0);return{orange:t(`orange`),bleue:t(`bleue`)}}function fe(e,t){if(!G(e))return null;let n=K(e);return n[t]>n[U(t)]?`W`:n[t]<n[U(t)]?`L`:`D`}function pe(e){let t=K(e);return t.orange!==t.bleue||e.orange_pens==null||e.bleue_pens==null||e.orange_pens===e.bleue_pens?null:e.orange_pens>e.bleue_pens?`orange`:`bleue`}function me(e){let t=()=>({played:0,won:0,drawn:0,lost:0,gf:0,ga:0}),n={orange:t(),bleue:t()};for(let t of e.filter(G)){let e=K(t);for(let r of V){let i=n[r];i.played++,i.gf+=e[r],i.ga+=e[U(r)];let a=fe(t,r);a===`W`?i.won++:a===`D`?i.drawn++:i.lost++}}return n}var he=e=>e.slice(0,7);function ge(e){let t=new Map;for(let n of[...e].filter(e=>e.status!==`cancelled`).sort((e,t)=>t.date.localeCompare(e.date))){let e=he(n.date);t.has(e)||t.set(e,[]),t.get(e).push(n)}return[...t.entries()].map(([e,t])=>({month:e,matches:t}))}function _e(e,t=new Date){let n=t.toISOString();return[...e].filter(e=>e.status===`scheduled`&&e.date>=n).sort((e,t)=>e.date.localeCompare(t.date))[0]}function ve(e){return[...e].filter(G).sort((e,t)=>t.date.localeCompare(e.date))[0]}function ye(e){let t=new Map;for(let n of e.filter(G)){let e=K(n);for(let r of n.lines.filter(e=>e.played||e.goals||e.assists||e.yc||e.rc||e.og)){let n=t.get(r.player_id)??{player_id:r.player_id,side:r.side,played:0,goals:0,assists:0,og:0,yc:0,rc:0,motm:0,gk_matches:0,saves:0,conceded:0,clean_sheets:0};if(n.side=r.side,n.played++,n.goals+=r.goals,n.assists+=r.assists,n.og+=r.og,n.yc+=r.yc,n.rc+=r.rc,r.gk){n.gk_matches++,n.saves+=r.saves;let t=e[U(r.side)];n.conceded+=t,t===0&&n.clean_sheets++}t.set(r.player_id,n)}if(n.motm_player_id){let e=t.get(n.motm_player_id);e&&e.motm++}}return[...t.values()]}var be=e=>e.filter(e=>e.goals>0).sort((e,t)=>t.goals-e.goals||e.played-t.played),xe=e=>e.filter(e=>e.assists>0).sort((e,t)=>t.assists-e.assists||e.played-t.played),Se=e=>e.filter(e=>e.gk_matches>0).sort((e,t)=>t.clean_sheets-e.clean_sheets||t.saves-e.saves||e.conceded-t.conceded),Ce=(e,t)=>({side:e,player_id:t,played:!1,goals:0,og:0,assists:0,yc:0,rc:0,saves:0});function we(e,t=6){let n=[];for(let r of V){let i=e.lines.filter(e=>e.side===r),a=i.reduce((e,t)=>e+t.goals,0)+e.lines.filter(e=>e.side===U(r)).reduce((e,t)=>e+t.og,0),o=i.reduce((e,t)=>e+t.assists,0),s=r===`orange`?`Orange`:`Bleue`;o>a&&n.push(`${s} : plus de passes décisives (${o}) que de buts (${a}).`),i.filter(e=>e.gk).length>1&&n.push(`${s} : un seul gardien par équipe.`),e.status===`finished`&&i.filter(e=>e.played).length<t&&i.length>=t&&n.push(`${s} : moins de ${t} joueurs cochés « A joué ».`)}let r=K(e);return(e.orange_pens!=null||e.bleue_pens!=null)&&r.orange!==r.bleue&&n.push(`Tirs au but saisis alors que le score n’est pas nul.`),n}var Te=e({MIGRATION_COUNT:()=>qe,migrateStoreFrom:()=>$});function q(e,t){let n={...e};return delete n[t],n}var J=new Set([`best_defender`,`best_midfielder`,`best_forward`]);function Ee(e){let t={};e.Player?.some(e=>e.position!==`GK`&&e.position!==`FIELD`)&&(t.Player=e.Player.map(e=>e.position===`GK`||e.position===`FIELD`?e:{...e,position:d(e.position)})),e.MatchEvent?.some(e=>e.type===`offside`)&&(t.MatchEvent=e.MatchEvent.filter(e=>e.type!==`offside`)),e.MatchTeamStats?.some(e=>`offsides`in e)&&(t.MatchTeamStats=e.MatchTeamStats.map(e=>q(e,`offsides`))),e.Award?.some(e=>J.has(e.category))&&(t.Award=e.Award.filter(e=>!J.has(e.category))),e.TeamOfWeek?.some(e=>`formation`in e||e.slots.some((e,t)=>e.position!==(t===0?`GK`:`FIELD`)))&&(t.TeamOfWeek=e.TeamOfWeek.map(e=>({...q(e,`formation`),slots:e.slots.slice(0,6).map((e,t)=>({...e,position:t===0?`GK`:`FIELD`}))}))),e.Lineup?.some(e=>`formation`in e)&&(t.Lineup=e.Lineup.map(e=>q(e,`formation`)));let n=e.Page?.find(e=>e.slug===`reglement`);if(n&&!/hors-jeu/i.test(n.content??``)){let r=`- **Pas de postes** : les seuls rôles sont **Gardien** et **Capitaine**.
- **Pas de hors-jeu.**
`,i=n.content??``,a=i.indexOf(`
`,i.indexOf(`## 1.`)+1),o=i.includes(`## 1.`)?i.slice(0,a+1)+r+i.slice(a+1):`${i}\n\n## Règles de jeu\n- 6 contre 6 (5 joueurs de champ + 1 gardien).\n${r}`;t.Page=e.Page.map(e=>e===n?{...e,content:o}:e)}return t}function De(e){let t={};if(e.Award?.some(e=>e.category===`best_young`)&&(t.Award=e.Award.filter(e=>e.category!==`best_young`)),e.Settings?.some(e=>`young_max_age`in e)&&(t.Settings=e.Settings.map(e=>q(e,`young_max_age`))),e.Player&&e.Team){let n=new Map;for(let t of e.Team){let r=e.Player.filter(e=>e.team_id===t.id),i=r.find(e=>e.id===t.captain_player_id)??r.find(e=>e.is_captain);n.set(t.id,i?.id??null)}e.Player.some(e=>!!e.is_captain!=(n.get(e.team_id)===e.id))&&(t.Player=e.Player.map(e=>!!e.is_captain==(n.get(e.team_id)===e.id)?e:{...e,is_captain:n.get(e.team_id)===e.id})),e.Team.some(e=>(e.captain_player_id??null)!==n.get(e.id))&&(t.Team=e.Team.map(e=>{let t=n.get(e.id);return(e.captain_player_id??null)===t?e:t?{...e,captain_player_id:t}:q(e,`captain_player_id`)}))}if(e.Lineup&&e.MatchEvent){let n=e.MatchEvent,r=e.Lineup.map(e=>L(e,n));r.some((t,n)=>t!==e.Lineup[n])&&(t.Lineup=r)}let n=e.Page?.find(e=>e.slug===`reglement`);return n&&/,? ?Meilleur jeune/.test(n.content??``)&&(t.Page=e.Page.map(e=>e===n?{...e,content:(e.content??``).replace(/,? ?Meilleur jeune/,``)}:e)),t}function Oe(e){let t={},n=F(),r=new Set((e.Rulebook??[]).map(e=>e.version));e.Rulebook&&n.some(e=>!r.has(e.version))&&(t.Rulebook=[...(e.Rulebook??[]).map(e=>e.status===`current`?{...e,status:`archived`}:e),...n.filter(e=>!r.has(e.version))]),e.Season?.some(e=>e.id===`season_2026`&&!e.rulebook_version)&&(t.Season=e.Season.map(e=>e.id===`season_2026`&&!e.rulebook_version?{...e,rulebook_version:`v9`}:e));let i=l.duration.halfMin;return e.Competition?.some(e=>e.season_id===`season_2026`&&e.half_duration_min!==i)&&(t.Competition=e.Competition.map(e=>e.season_id===`season_2026`&&e.half_duration_min!==i?{...e,half_duration_min:i}:e)),e.Match?.some(e=>e.season_id===`season_2026`&&!a(e)&&e.status!==`live`&&e.half_duration_min!==i)&&(t.Match=e.Match.map(e=>e.season_id===`season_2026`&&!a(e)&&e.status!==`live`&&e.half_duration_min!==i?{...e,half_duration_min:i}:e)),e.Settings?.some(e=>`tiebreakers`in e||`points_win`in e)&&(t.Settings=e.Settings.map(e=>q(q(q(q(e,`tiebreakers`),`points_win`),`points_draw`),`points_loss`))),t}function ke(e){let t={},n=(e,t)=>t&&r[e].includes(t)?u[e]:t,i=e=>{let t=e;return(e.phase===`gold`||e.phase===`silver`)&&n(e.phase,e.name)!==e.name&&(t={...t,name:n(e.phase,e.name)}),e.split&&(n(`gold`,e.split.gold_name)!==e.split.gold_name||n(`silver`,e.split.silver_name)!==e.split.silver_name)&&(t={...t,split:{...e.split,gold_name:n(`gold`,e.split.gold_name),silver_name:n(`silver`,e.split.silver_name)}}),t};e.Competition?.some(e=>i(e)!==e)&&(t.Competition=e.Competition.map(i));let a=e=>e.id===`div_gold`&&n(`gold`,e.name)!==e.name?{...e,name:u.gold}:e.id===`div_silver`&&n(`silver`,e.name)!==e.name?{...e,name:u.silver}:e;return e.Division?.some(e=>a(e)!==e)&&(t.Division=e.Division.map(a)),e.Settings?.some(e=>e.tagline===`Le championnat de football inter-entreprises`)&&(t.Settings=e.Settings.map(e=>e.tagline===`Le championnat de football inter-entreprises`?{...e,tagline:f.tagline}:e)),t}function Ae(e){if(!e.Team||!e.Competition)return{};let t=[...e.Season??[]].sort((e,t)=>(e.start_date??``).localeCompare(t.start_date??``)).map(e=>e.id),n=new Map;for(let t of e.Competition)for(let e of t.team_ids??[]){let r=n.get(e)??[];r.includes(t.season_id)||r.push(t.season_id),n.set(e,r)}let r=new Set(e.Team.map(e=>e.id)),i=new Map,a=[];for(let o of e.Team){let s=(n.get(o.id)??[]).sort((e,n)=>t.indexOf(e)-t.indexOf(n));if(!(s.length<2))for(let t of s.slice(1)){let n=(e.Season??[]).find(e=>e.id===t)?.start_date?.slice(0,4)??t,s=`t${n.slice(2)}_${(o.short_name||o.id).toLowerCase()}`;r.has(s)&&(s=`${o.id}_${n}`),r.add(s),a.push({...o,id:s,season_id:t,club_id:void 0,link:void 0,link_dismissed:void 0,captain_player_id:void 0}),i.has(t)||i.set(t,new Map),i.get(t).set(o.id,s)}}if(!a.length)return{};let o={},s=(e,t)=>e&&i.get(e)?.get(t)||t,c=new Map((e.Match??[]).map(e=>[e.id,e.season_id]));return o.Team=[...e.Team.map(e=>(n.get(e.id)?.length??0)>1?{...e,season_id:[...n.get(e.id)].sort((e,n)=>t.indexOf(e)-t.indexOf(n))[0]}:e),...a],o.Competition=e.Competition.map(e=>i.has(e.season_id)?{...e,team_ids:e.team_ids?.map(t=>s(e.season_id,t))}:e),e.Match&&(o.Match=e.Match.map(e=>i.has(e.season_id)?{...e,home_team_id:s(e.season_id,e.home_team_id),away_team_id:s(e.season_id,e.away_team_id),forfeit_team_id:e.forfeit_team_id?s(e.season_id,e.forfeit_team_id):e.forfeit_team_id}:e)),e.MatchEvent&&(o.MatchEvent=e.MatchEvent.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.Lineup&&(o.Lineup=e.Lineup.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.MatchTeamStats&&(o.MatchTeamStats=e.MatchTeamStats.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.Suspension&&(o.Suspension=e.Suspension.map(e=>e.team_id&&i.has(e.season_id)?{...e,team_id:s(e.season_id,e.team_id)}:e)),e.Draw&&(o.Draw=e.Draw.map(t=>{let n=e.Competition.find(e=>e.id===t.competition_id)?.season_id;return n&&i.has(n)?{...t,pots:t.pots?.map(e=>({...e,team_ids:e.team_ids.map(e=>s(n,e))})),groups:t.groups?.map(e=>({...e,team_ids:e.team_ids.map(e=>s(n,e))}))}:t})),e.Player&&(o.Player=e.Player.map(e=>{let t=e.season_ids?.find(t=>i.get(t)?.has(e.team_id));return t&&(e.season_ids?.length??0)===1?{...e,team_id:s(t,e.team_id)}:e})),o}function je(e){let t={};if(!e.Team||!e.Club)return t;let n=e.Competition??[],r=new Map((e.Club??[]).map(e=>[e.id,e])),i=!1,a=e.Team.map(e=>{let t=e.season_id??n.find(t=>t.team_ids?.includes(e.id))?.season_id,a=e.club_id??`club_${e.id}`;return r.has(a)||r.set(a,{id:a,name:e.name,logo_url:e.logo_url}),t===e.season_id&&a===e.club_id?e:(i=!0,{...e,season_id:t,club_id:a})});return i&&(t.Team=a),r.size!==(e.Club??[]).length&&(t.Club=[...r.values()]),t}function Me(e){return!e.CaptainTeam||e.CaptainTeam.length?{}:{CaptainTeam:W()}}function Ne(e){if(!e.Team||!e.Club||!e.Competition||!e.Season?.some(e=>e.id===`season_2026`))return{};let t={Team:e.Team,Player:e.Player??[],Match:e.Match??[],MatchEvent:e.MatchEvent??[],Lineup:e.Lineup??[],MatchTeamStats:e.MatchTeamStats??[],Competition:e.Competition,Club:e.Club},n=k(t,M);n.removed=n.removed.filter(e=>!e.players.length&&!e.matches.some(e=>e.status===`finished`));let r=e.Competition.some(e=>e.id===`comp_2026_selection`&&e.name===`Phase de sélection`);if(A(n)&&!r)return{};let i=A(n)?{}:j(t,n);return r&&(i.Competition=(i.Competition??e.Competition).map(e=>e.id===`comp_2026_selection`&&e.name===`Phase de sélection`?{...e,name:`Pré-saison`}:e)),i}function Pe(e){let t=e=>!e||e===`v4`;return e.Season?.some(e=>e.id===`season_2026`&&t(e.rulebook_version))?{Season:e.Season.map(e=>e.id===`season_2026`&&t(e.rulebook_version)?{...e,rulebook_version:`v8`}:e)}:{}}function Fe(e){let t={},n=F(),r=new Set((e.Rulebook??[]).map(e=>e.version));return e.Rulebook&&n.some(e=>!r.has(e.version))&&(t.Rulebook=[...n.filter(e=>!r.has(e.version)),...e.Rulebook.map(e=>e.status===`current`?{...e,status:`archived`,changes:n.find(t=>t.version===e.version)?.changes??e.changes}:e)]),e.Season?.some(e=>e.id===`season_2026`&&(!e.rulebook_version||[`v4`,`v8`].includes(e.rulebook_version)))&&(t.Season=e.Season.map(e=>e.id===`season_2026`&&(!e.rulebook_version||[`v4`,`v8`].includes(e.rulebook_version))?{...e,rulebook_version:`v9`}:e)),t}function Ie(e){if(!e.Team||!e.Club||!e.Competition||!e.Season?.some(e=>e.id===`season_2026`))return{};let t={Team:e.Team,Player:e.Player??[],Match:e.Match??[],MatchEvent:e.MatchEvent??[],Lineup:e.Lineup??[],MatchTeamStats:e.MatchTeamStats??[],Competition:e.Competition,Club:e.Club},n=k(t,M),r=e=>e.id===`t26_sim`||/^simulation fc$/i.test(e.name.trim());n.removed=n.removed.filter(e=>r(e.team)),n.created=[];let i=new Set(n.kept.map(e=>e.team.id)),a=e.Competition.some(e=>e.season_id===`season_2026`&&e.phase===`league_phase`&&(e.team_ids??[]).some(e=>!i.has(e)));if(!n.removed.length&&!a)return{};let o=j(t,{...n,kept:n.kept.map(e=>({...e,rename:void 0,logo:!1}))});return o.Competition=o.Competition.map(e=>{let t=e.preseason;if(e.season_id!==`season_2026`||e.phase!==`league_phase`||!t?.draw_order||t.published_rounds?.length||t.draw_order.every(e=>i.has(e))&&t.draw_order.length===i.size)return e;let n={...t};for(let e of[`seed`,`draw_order`,`drawn_at`,`drawn_by`,`revealed`,`pending`,`rests`])delete n[e];return{...e,preseason:n}}),o}function Le(e){let t=e.Competition?.find(e=>e.id===`comp_2026_selection`||e.season_id===`season_2026`&&e.phase===`league_phase`&&e.format===`swiss`);if(!t||!e.Match||!e.Team)return{};let n={},r=e.Team.find(e=>e.season_id===`season_2026`&&e.short_name===`MID`);r&&r.name!==`Taqeef (Midea)`&&(n.Team=e.Team.map(e=>e.id===r.id?{...e,name:`Taqeef (Midea)`,company:e.company??`Taqeef (Midea)`}:e));let i;try{i=B(t.id,t.season_id,t.team_ids??[],void 0,e.Team)}catch{return n}let a=e.Match.filter(e=>e.competition_id===t.id&&e.round===1);if(a.length===i.matches.length&&i.matches.every(e=>a.some(t=>t.number===e.number&&t.home_team_id===e.home_team_id&&t.away_team_id===e.away_team_id))&&t.preseason?.draw_source===`manual`)return n;let o=new Set(a.map(e=>e.id)),s=a.some(e=>e.status===`finished`||e.status===`live`||e.validated)||(e.MatchEvent??[]).some(e=>o.has(e.match_id)),c=new Date().toISOString(),l=(e,n)=>({id:`log_${e}_${Date.now().toString(36)}`,created_date:c,action:e,entity:`Competition`,entity_id:t.id,entity_label:t.name,author_email:`systeme`,author_name:`Mise à jour du site`,details:n});if(s)return n.AuditLog=[l(`preseason_official_draw_blocked`,{message:`Tirage officiel NON appliqué : des matchs de la journée 1 ont déjà été joués. À corriger à la main.`}),...e.AuditLog??[]],n;let u={competition:t.id,preseason:t.preseason??null,matches:a};n.Match=[...e.Match.filter(e=>!o.has(e.id)&&!i.matches.some(t=>t.id===e.id)),...i.matches.map(e=>({...e,created_date:c}))],e.Lineup?.some(e=>o.has(e.match_id))&&(n.Lineup=e.Lineup.filter(e=>!o.has(e.match_id)));let{pending:d,seed:f,...p}=t.preseason??{};return n.Competition=e.Competition.map(e=>e.id===t.id?{...e,status:`active`,rounds:[...new Set([...e.rounds??[],1])].sort((e,t)=>e-t),preseason:{...p,...i.preseason}}:e),n.AuditLog=[l(`preseason_official_draw`,{message:`Tirage J1 remplacé par le tirage officiel`,anciens_matchs:a.length,nouveaux_matchs:i.matches.length,repos:`Canpack 2`,sauvegarde_json:JSON.stringify(u)}),...e.AuditLog??[]],n}function Re(e){if(!e.Player||!e.Team)return{};let t=e.Competition??[],n=e=>e.season_id??t.find(t=>t.team_ids?.includes(e.id))?.season_id,r=new Map(e.Team.map(e=>[e.id,e])),i=0,a=e.Player.map(t=>{let a=r.get(t.team_id);if(!a||t.season_ids?.length!==1)return t;let o=t.season_ids[0],s=n(a);if(!s||s===o)return t;let c=e.Team.find(e=>e.short_name===a.short_name&&e.id!==a.id&&n(e)===o);return c?(i++,{...t,team_id:c.id}):t});return i?{Player:a}:{}}function ze(e){return e.Season?.some(e=>e.id===`season_2025`&&!e.hidden)?{Season:e.Season.map(e=>e.id===`season_2025`?{...e,hidden:!0,is_active:!1}:e)}:{}}function Be(e){let t={},n=e=>{for(let t of Object.keys(E)){let n=`/logos/${t.toLowerCase()}`,r=D({short:t}),i=e=>!!e&&(e===`${n}.png`||e===`${n}-full.png`||e.startsWith(`${n}.png?`)||e.startsWith(`${n}-full.png?`));i(e.logo_url)&&e.logo_url!==r.logo_url&&(e={...e,logo_url:e.logo_url.includes(`-full`)?r.company_logo_url:r.logo_url}),`company_logo_url`in e&&i(e.company_logo_url)&&e.company_logo_url!==r.company_logo_url&&(e={...e,company_logo_url:r.company_logo_url})}return e};if(e.Team){let r=e.Team.map(n);r.some((t,n)=>t!==e.Team[n])&&(t.Team=r)}if(e.Club){let r=e.Club.map(n);r.some((t,n)=>t!==e.Club[n])&&(t.Club=r)}return t}function Ve(e){let t=M,n=e.Competition??[],r=e=>e.season_id??n.find(t=>t.team_ids?.includes(e.id))?.season_id,i=new Set((e.Team??[]).filter(e=>r(e)===t&&/^canpack\s*[12]$/i.test(e.name.trim())).map(e=>e.id));if(!i.size)return{};let o=(e.Match??[]).filter(e=>e.season_id===t&&(i.has(e.home_team_id)||i.has(e.away_team_id)));if(o.some(e=>a(e)))return{};let s={},c=new Set(o.map(e=>e.id));s.Team=e.Team.filter(e=>!i.has(e.id));let l=new Set(e.Team.filter(e=>i.has(e.id)).map(e=>e.club_id).filter(Boolean));for(let e of s.Team)e.club_id&&l.delete(e.club_id);e.Club?.some(e=>l.has(e.id))&&(s.Club=e.Club.filter(e=>!l.has(e.id))),e.Player?.some(e=>i.has(e.team_id))&&(s.Player=e.Player.flatMap(e=>{if(!i.has(e.team_id))return[e];let n=(e.season_ids??[]).filter(e=>e!==t);return n.length?[{...e,season_ids:n}]:[]})),o.length&&(s.Match=e.Match.filter(e=>!c.has(e.id)),e.MatchEvent?.some(e=>c.has(e.match_id))&&(s.MatchEvent=e.MatchEvent.filter(e=>!c.has(e.match_id))),e.Lineup?.some(e=>c.has(e.match_id))&&(s.Lineup=e.Lineup.filter(e=>!c.has(e.match_id))),e.MatchTeamStats?.some(e=>c.has(e.match_id))&&(s.MatchTeamStats=e.MatchTeamStats.filter(e=>!c.has(e.match_id))));let u=o.filter(e=>e.round===1).flatMap(e=>[e.home_team_id,e.away_team_id]).filter(e=>!i.has(e));s.Competition=n.map(e=>{if(e.season_id!==t||!e.team_ids?.some(e=>i.has(e)))return e;let n=e.team_ids.filter(e=>!i.has(e));if(!e.preseason)return{...e,team_ids:n};let r=e.preseason,a={...r.rests??{}};for(let e of Object.keys(a))a[e]&&i.has(a[e])&&delete a[e];u.length===1&&(a[1]=u[0]);let o=(r.draw_order??[]).filter(e=>!i.has(e));return a[1]&&(o=[...o.filter(e=>e!==a[1]),a[1]]),{...e,team_ids:n,preseason:{...r,rests:a,draw_order:o,revealed:r.revealed==null?r.revealed:o.length,final_ranking:r.final_ranking?.filter(e=>!i.has(e)),config:{...r.config??{},masterSize:11}}}}),e.Draw?.some(e=>e.season_id===t)&&(s.Draw=e.Draw.map(e=>e.season_id===t?{...e,pots:e.pots?.map(e=>({...e,team_ids:e.team_ids.filter(e=>!i.has(e))})),groups:e.groups?.map(e=>({...e,team_ids:e.team_ids.filter(e=>!i.has(e))})),fixtures:e.fixtures?.filter(e=>!i.has(e.home_team_id??``)&&!i.has(e.away_team_id??``)),picks:e.picks?.filter(e=>!i.has(e.team_id??``))}:e));let d=new Date().toISOString();return s.AuditLog=[{id:`log_remove_canpack_${Date.now().toString(36)}`,created_date:d,action:`teams_removed`,entity:`Team`,entity_label:`Canpack 1, Canpack 2`,author_email:`systeme`,author_name:`Mise à jour du site`,details:{message:`Canpack 1 et Canpack 2 retirées de la saison 2026-2027 ; PS-08 supprimé ; Wafasalaf au repos à la J1`,equipes:[...i],matchs_supprimes:o.map(e=>e.number??e.id),equipe_au_repos_j1:u[0]}},...e.AuditLog??[]],s}function He(e){let t={AVC:2,CAC:3},n=t=>e.Team?.find(e=>e.season_id===`season_2026`&&e.short_name===t)?.club_id,r=Object.entries(t).map(([e,t])=>({short:e,n:t,club:n(e)})).filter(t=>t.club&&e.Club?.find(e=>e.id===t.club)?.seasons_override!==t.n);if(!r.length||!e.Club)return{};let i=new Date().toISOString();return{Club:e.Club.map(e=>{let t=r.find(t=>t.club===e.id);return t?{...e,seasons_override:t.n,seasons_override_reason:`correction manuelle Ardentia`,seasons_override_at:i}:e}),AuditLog:[...r.map(t=>({id:`log_tier_${t.short}_${Date.now().toString(36)}`,created_date:i,action:`seniority_override`,entity:`Club`,entity_id:t.club,entity_label:t.short,author_email:`systeme`,author_name:`Mise à jour du site`,details:{motif:`correction manuelle Ardentia`,avant:e.Club.find(e=>e.id===t.club)?.seasons_override??`calcul automatique`,apres:t.n}})),...e.AuditLog??[]]}}function Ue(e){let t=[`Le premier championnat inter-entreprises au Maroc`],n=[`الدوري الوطني للشركات المغربية`];return e.Settings?.some(e=>t.includes(e.tagline??``)||n.includes(e.tagline_ar??``))?{Settings:e.Settings.map(e=>({...e,tagline:t.includes(e.tagline??``)?f.tagline:e.tagline,tagline_ar:n.includes(e.tagline_ar??``)?f.taglineAr:e.tagline_ar}))}:{}}var We=`Les joueurs doivent obligatoirement être salariés de l'entreprise qu'ils représentent. Ardentia peut demander un justificatif (attestation de travail ou document équivalent).`,Y=`Si une réserve est déposée contre une équipe qui a fait jouer un joueur non salarié de l'entreprise et qu'elle est confirmée par Ardentia, l'équipe fautive perd le match sur le score de 3-0.`;function X(e){if(e.includes(`obligatoirement être salariés`))return e;let t=t=>{let n=e.match(t);if(!n||n.index==null)return null;let r=n.index,i=e.slice(r+n[0].length).search(/\n#{1,2} /);return{start:r,end:i<0?e.length:r+n[0].length+i}},n=e,r=t(/^## 2\.3[^\n]*$/m);if(r){let e=n.slice(r.start,r.end).split(/\n\n/);e.splice(2,0,We);let t=e.join(`

`).replace(/\s*$/,``)+`\n\n${Y}\n`;n=n.slice(0,r.start)+t+n.slice(r.end)}let i=(()=>{let e=n.match(/^## 17\.4[^\n]*$/m);if(!e||e.index==null)return null;let t=n.slice(e.index+e[0].length).search(/\n#{1,2} /);return{start:e.index,end:t<0?n.length:e.index+e[0].length+t}})();if(i){let e=n.slice(i.start,i.end).split(/\n\n/);e.splice(2,0,Y),n=n.slice(0,i.start)+e.join(`

`)+n.slice(i.end)}return n}function Ge(e){let t=e.Rulebook?.find(e=>e.status===`current`);if(!t||t.content.includes(`obligatoirement être salariés`))return{};let n=new Date().toISOString();return{Rulebook:e.Rulebook.map(e=>e.id===t.id?{...e,content:X(e.content),changes:[e.changes,`Nov. 2026 : joueurs salariés de l’entreprise obligatoires (Art. 2.3) ; réserve confirmée pour joueur non salarié = défaite 3-0 (Art. 2.3 et 17.4).`].filter(Boolean).join(`
`)}:e),AuditLog:[{id:`log_rules_salaries_${Date.now().toString(36)}`,created_date:n,action:`rulebook_update`,entity:`Rulebook`,entity_id:t.id,entity_label:t.version,author_email:`systeme`,author_name:`Mise à jour du site`,details:{articles:`2.3, 17.4`,validation:`Ardentia (14/11/2026)`}},...e.AuditLog??[]]}}var Z=[Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ve,He,Ue,Ge],Q=`data-version`;function Ke(e,t=0){let n={...e},r={};for(let e of Z.slice(t)){let t=e(n);Object.assign(r,t),n={...n,...t}}return r}var qe=Z.length,Je=[`Player`,`MatchEvent`,`MatchTeamStats`,`Award`,`TeamOfWeek`,`Lineup`,`Page`,`Team`,`Settings`,`Rulebook`,`Season`,`Competition`,`Match`,`Division`,`Club`,`Suspension`,`Draw`,`CaptainTeam`,`AuditLog`];function $(e){if(e>=Z.length)return;let t=Ke(Object.fromEntries(Je.map(e=>[e,S.all(e)])),e);S.batch(()=>{for(let[e,n]of Object.entries(t))S.replace(e,n)})}function Ye(){let e=+!!S.getFlag(`migrated-6v6`),t=Number(S.getFlag(Q)??e)||e;t>=Z.length||($(t),S.setFlag(Q,String(Z.length)))}export{A,B as C,ae as D,F as E,S as F,re as M,C as N,w as O,ee as P,R as S,I as T,we as _,de as a,Se as b,me as c,W as d,Ce as f,U as g,_e as h,V as i,k as j,j as k,K as l,ve as m,Te as n,ge as o,G as p,H as r,ye as s,Ye as t,ue as u,pe as v,L as w,be as x,xe as y};