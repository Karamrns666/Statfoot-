// Clubs permanents et équipes / joueurs de saison (fonctions PURES, testées).
//  - Une équipe appartient à UNE saison ; son club fait le lien d'une saison à l'autre.
//  - Une équipe nouvelle a son propre club. Le lien vers une équipe d'une saison précédente n'existe
//    qu'après approbation de l'admin (suggestion automatique par nom proche).
//  - Même principe pour les joueurs : person_id commun une fois le lien approuvé.
import type { Competition, Player, Season, Team } from '@/types/entities'

// ---------------------------------------------------------------------------
//  Saison d'une équipe / d'un joueur
// ---------------------------------------------------------------------------
export function teamSeasonId(t: Pick<Team, 'id' | 'season_id'>, competitions: Pick<Competition, 'season_id' | 'team_ids'>[]): string | undefined {
  return t.season_id ?? competitions.find((c) => c.team_ids?.includes(t.id))?.season_id
}
export const playerSeasonId = (p: Pick<Player, 'season_ids'>) => p.season_ids?.[0]
export const clubKey = (t: Pick<Team, 'id' | 'club_id'>) => t.club_id ?? `club_${t.id}`
export const personKey = (p: Pick<Player, 'id' | 'person_id'>) => p.person_id ?? p.id

/** Saisons triées du plus ancien au plus récent */
export const seasonOrder = (seasons: Pick<Season, 'id' | 'start_date'>[]) => [...seasons].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')).map((s) => s.id)
export function previousSeasons(seasonId: string | undefined, seasons: Pick<Season, 'id' | 'start_date'>[]) {
  const order = seasonOrder(seasons)
  const i = seasonId ? order.indexOf(seasonId) : -1
  return i <= 0 ? [] : order.slice(0, i).reverse()
}

// ---------------------------------------------------------------------------
//  Similarité de noms (suggestion de lien)
// ---------------------------------------------------------------------------
const STOP = new Set(['fc', 'sa', 'sarl', 'maroc', 'morocco', 'groupe', 'group', 'the', 'de', 'du', 'des', 'la', 'le', 'les', 'et', 'team', 'equipe'])
export const normName = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const tokens = (s: string) => normName(s).split(' ').filter((w) => w && !STOP.has(w))
function bigrams(s: string) { const x = normName(s).replace(/ /g, ''); const out: string[] = []; for (let i = 0; i < x.length - 1; i++) out.push(x.slice(i, i + 2)); return out }
/** 0–1 : mots communs, bigrammes (fautes de frappe), égalité exacte */
export function nameSimilarity(a: string, b: string) {
  if (!a || !b) return 0
  if (normName(a) === normName(b)) return 1
  const ta = new Set(tokens(a)), tb = new Set(tokens(b))
  const inter = [...ta].filter((w) => tb.has(w)).length
  const jac = ta.size + tb.size ? inter / (ta.size + tb.size - inter) : 0
  const ba = bigrams(a), bb = bigrams(b)
  const pool = [...bb]
  let common = 0
  for (const g of ba) { const k = pool.indexOf(g); if (k >= 0) { common++; pool.splice(k, 1) } }
  const dice = ba.length + bb.length ? (2 * common) / (ba.length + bb.length) : 0
  return Math.round(Math.max(jac, dice) * 100) / 100
}

export interface LinkSuggestion<T> { item: T; score: number; seasonId?: string }
export const SUGGESTION_MIN = 0.55

/** Équipes des saisons précédentes au nom proche (le lien reste à approuver par l'admin). */
export function suggestTeamLinks(team: Team, allTeams: Team[], competitions: Competition[], seasons: Season[], min = SUGGESTION_MIN): LinkSuggestion<Team>[] {
  const sid = teamSeasonId(team, competitions)
  const prev = new Set(previousSeasons(sid, seasons))
  return allTeams
    .filter((t) => t.id !== team.id && prev.has(teamSeasonId(t, competitions) ?? '') && !team.link_dismissed?.includes(t.id) && clubKey(t) !== clubKey(team))
    .map((t) => ({ item: t, seasonId: teamSeasonId(t, competitions), score: Math.max(nameSimilarity(team.name, t.name), nameSimilarity(team.company ?? team.name, t.company ?? t.name), team.short_name && team.short_name === t.short_name ? 0.6 : 0) }))
    .filter((s) => s.score >= min)
    .sort((a, b) => b.score - a.score || seasonOrder(seasons).indexOf(b.seasonId ?? '') - seasonOrder(seasons).indexOf(a.seasonId ?? ''))
}

/** Joueurs des saisons précédentes au nom proche ; bonus si leur ancienne équipe est le même club. */
export function suggestPlayerLinks(player: Player, allPlayers: Player[], teams: Team[], seasons: Season[], min = SUGGESTION_MIN): LinkSuggestion<Player>[] {
  const prev = new Set(previousSeasons(playerSeasonId(player), seasons))
  const club = (p: Player) => { const t = teams.find((x) => x.id === p.team_id); return t ? clubKey(t) : undefined }
  const full = (p: Player) => `${p.first_name} ${p.last_name}`
  return allPlayers
    .filter((p) => p.id !== player.id && prev.has(playerSeasonId(p) ?? '') && !player.link_dismissed?.includes(p.id) && personKey(p) !== personKey(player))
    .map((p) => {
      const base = Math.max(nameSimilarity(full(player), full(p)), nameSimilarity(`${player.last_name} ${player.first_name}`, full(p)))
      const sameClub = club(p) && club(p) === club(player) ? 0.1 : 0
      return { item: p, seasonId: playerSeasonId(p), score: Math.min(1, Math.round((base + sameClub) * 100) / 100) }
    })
    .filter((s) => s.score >= min)
    .sort((a, b) => b.score - a.score)
}

// ---------------------------------------------------------------------------
//  Historique d'un club / d'un joueur
// ---------------------------------------------------------------------------
/** Équipes du même club, de la plus ancienne à la plus récente (liens approuvés uniquement). */
export function clubTeams(team: Team, allTeams: Team[], competitions: Competition[], seasons: Season[]) {
  const order = seasonOrder(seasons)
  return allTeams.filter((t) => clubKey(t) === clubKey(team)).map((t) => ({ team: t, seasonId: teamSeasonId(t, competitions) })).sort((a, b) => order.indexOf(a.seasonId ?? '') - order.indexOf(b.seasonId ?? ''))
}
/** Nombre de saisons MBL du club (correction manuelle de l'admin prioritaire). */
export function clubSeasonCount(team: Team, allTeams: Team[], competitions: Competition[], seasons: Season[], override?: number) {
  if (override && override > 0) return override
  return Math.max(1, new Set(clubTeams(team, allTeams, competitions, seasons).map((x) => x.seasonId).filter(Boolean)).size)
}
export function personPlayers(player: Player, allPlayers: Player[], seasons: Season[]) {
  const order = seasonOrder(seasons)
  return allPlayers.filter((p) => personKey(p) === personKey(player)).sort((a, b) => order.indexOf(playerSeasonId(a) ?? '') - order.indexOf(playerSeasonId(b) ?? ''))
}

/** Version d'une équipe / d'un joueur dans une saison donnée (via le club / l'identité approuvés). */
export function teamInSeason(team: Team, seasonId: string, allTeams: Team[], competitions: Competition[]) {
  return allTeams.find((t) => clubKey(t) === clubKey(team) && teamSeasonId(t, competitions) === seasonId)
}
export function playerInSeason(player: Player, seasonId: string, allPlayers: Player[]) {
  return allPlayers.find((p) => personKey(p) === personKey(player) && p.season_ids?.includes(seasonId))
}
