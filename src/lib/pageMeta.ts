// Titre et description de chaque page (onglet du navigateur, résultats Google, partage sur les réseaux).
import { useEffect } from 'react'

const SITE = 'Morocco Business League'
export const DEFAULT_DESC = 'Morocco Business League — 1ère ligue de football inter-entreprises au Maroc. Résultats, classements, joueurs et meilleures performances, organisé par Ardentia.'

const ROUTES: [RegExp, string, string][] = [
  [/^\/$/, `${SITE} — 1ère ligue de football inter-entreprises au Maroc`, DEFAULT_DESC],
  [/^\/matchs\/?$/, 'Calendrier et résultats', 'Tous les matchs de la Morocco Business League : programme, horaires, terrains et résultats en direct.'],
  [/^\/classement/, 'Classements', 'Classements de la Morocco Business League : pré-saison, MASTER et CHALLENGER, mis à jour en direct.'],
  [/^\/equipes\/?$/, 'Équipes', 'Les 21 entreprises engagées dans la Morocco Business League, leurs effectifs et leurs statistiques.'],
  [/^\/joueurs\/?$/, 'Joueurs', 'Cartes et statistiques des joueurs de la Morocco Business League : buts, passes, XP et badges.'],
  [/^\/statistiques/, 'Statistiques', 'Meilleurs buteurs, passeurs, gardiens et statistiques d’équipes de la Morocco Business League.'],
  [/^\/trophees/, 'Trophées', 'Trophées et meilleures performances de la Morocco Business League.'],
  [/^\/pre-saison/, 'Pré-saison', 'Pré-saison de la Morocco Business League : matchs, classement et répartition MASTER / CHALLENGER.'],
  [/^\/equipe-type/, 'Équipe type', 'L’équipe type de la journée de la Morocco Business League.'],
  [/^\/match-des-capitaines/, 'Match des capitaines', 'Le match des capitaines de la Morocco Business League.'],
  [/^\/badges/, 'Badges', 'Les badges des joueurs de la Morocco Business League et comment les obtenir.'],
  [/^\/glossaire/, 'Glossaire', 'Les termes de la Morocco Business League expliqués : XP, niveaux, badges, classements.'],
  [/^\/media/, 'Médias', 'Photos et vidéos de la Morocco Business League.'],
  [/^\/historique/, 'Historique', 'L’historique des saisons de la Morocco Business League.'],
  [/^\/reglement/, 'Règlement', 'Le règlement officiel de la Morocco Business League.'],
  [/^\/discipline/, 'Discipline', 'Suspensions et décisions disciplinaires de la Morocco Business League.'],
]

function meta(name: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
  return el
}

export function setPageMeta(title: string, desc = DEFAULT_DESC) {
  const full = title.includes(SITE) ? title : `${title} — ${SITE}`
  document.title = full
  meta('description').content = desc
  meta('og:title', 'property').content = full
  meta('og:description', 'property').content = desc
  meta('og:url', 'property').content = location.origin + location.pathname
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
  link.href = 'https://www.ardentia-foot.com' + location.pathname
}

/** Pages de liste : titre selon l'adresse (les fiches match / équipe / joueur posent le leur) */
export function routeMeta(pathname: string) {
  if (/^\/(matchs|equipes|joueurs)\/[^/]+/.test(pathname)) return
  const r = ROUTES.find(([re]) => re.test(pathname))
  setPageMeta(r ? r[1] : 'Page introuvable', r ? r[2] : DEFAULT_DESC)
}

export function usePageMeta(title: string | undefined, desc?: string) {
  useEffect(() => { if (title) setPageMeta(title, desc) }, [title, desc])
}
