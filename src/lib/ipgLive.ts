// IPG (Indice de Performance Globale) calculé automatiquement pour la saison en cours, avec la formule EXISTANTE
// (glossaire « IPG brut », reconstituée du fichier 2025 de la ligue — inchangée) :
//   IPG brut = 3 × buts + 2 × passes + 2 × contribution (%) + victoires (%) − pénalité cartons
//              + 2 × score gagnant + adversité (%),   score gagnant = 3 × buts gagnants + passes gagnantes
//   IPG = IPG brut ÷ IPG brut le plus élevé × 100 (le meilleur vaut 100).
// Le fichier 2025 ne détaille pas deux composantes ; elles sont calculées ainsi (à confirmer par Ardentia) :
//   • pénalité cartons : 1 point par carton jaune, 3 par carton rouge (2e jaune = jaune + rouge) ;
//   • adversité : moyenne, sur les matchs où le joueur a marqué ou fait une passe décisive, du % de points
//     obtenus par l'adversaire dans la compétition (points ÷ (3 × matchs) × 100).
// Buts / passes « gagnants » : but ou passe de l'équipe dans un match gagné d'un but ou nul (sans lui, le résultat
// aurait été moins bon).
// Données : uniquement les matchs RÉELS joués ET validés de la saison (aucune simulation), dans le périmètre choisi
// (Pré-saison, ou MASTER / CHALLENGER = pré-saison + division). Aucun minimum de matchs : tout joueur ayant joué compte.
import { computePlayerXP, matchInScope, type XPData, type XPScope } from './xp'
import { isPlayed } from './standings'
import type { Match } from '@/types/entities'

export const CARD_PENALTY = { yellow: 1, red: 3 }

export interface LiveIPG {
  rank: number; player_id: string; team_id: string; name: string
  matches: number; goals: number; assists: number
  contribution: number; win_pct: number; card_penalty: number
  clutch_goals: number; clutch_assists: number; clutch_score: number; adversity: number
  raw: number; ipg: number
}
export interface LiveIPGResult { rows: LiveIPG[]; matches: number; updatedAt?: string }

const r1 = (n: number) => Math.round(n * 10) / 10
/** match réel (pas une simulation) joué et validé */
export const realValidated = (m: Match) => isPlayed(m) && !!m.validated && !(m as { is_simulation?: boolean }).is_simulation && !m.id.startsWith('sim_')

export function computeSeasonIPG(data: XPData, scope: XPScope): LiveIPGResult {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const M = data.matches.filter((m) => realValidated(m) && matchInScope(m, comps, scope))
  if (!M.length) return { rows: [], matches: 0 }
  const ids = new Set(M.map((m) => m.id))
  const xp = computePlayerXP({ ...data, matches: M, events: data.events.filter((e) => ids.has(e.match_id)) }, scope)
  // équipes : matchs, victoires, points, buts (hors forfait)
  const team = new Map<string, { played: number; wins: number; points: number; goals: number }>()
  const T = (id: string) => { if (!team.has(id)) team.set(id, { played: 0, wins: 0, points: 0, goals: 0 }); return team.get(id)! }
  for (const m of M) {
    const hs = m.home_score ?? 0, as = m.away_score ?? 0
    for (const [id, gf, ga] of [[m.home_team_id, hs, as], [m.away_team_id, as, hs]] as const) {
      const t = T(id); t.played++
      if (gf > ga) { t.wins++; t.points += 3 } else if (gf === ga) t.points += 1
      if (!m.forfeit_team_id) t.goals += gf
    }
  }
  // par joueur : buts / passes gagnants, matchs décisifs (adversité)
  const clutch = new Map<string, { g: number; a: number; adv: number[] }>()
  const C = (id: string) => { if (!clutch.has(id)) clutch.set(id, { g: 0, a: 0, adv: [] }); return clutch.get(id)! }
  const evBy = new Map<string, typeof data.events>()
  for (const e of data.events) if (ids.has(e.match_id)) { const l = evBy.get(e.match_id) ?? []; l.push(e); evBy.set(e.match_id, l) }
  for (const m of M) {
    if (m.forfeit_team_id) continue
    const evs = (evBy.get(m.id) ?? []).filter((e) => e.type === 'goal' && e.period !== 'PENS')
    const decisive = new Map<string, Set<string>>() // joueur → équipes adverses
    for (const e of evs) {
      const gf = e.team_id === m.home_team_id ? m.home_score ?? 0 : m.away_score ?? 0
      const ga = e.team_id === m.home_team_id ? m.away_score ?? 0 : m.home_score ?? 0
      const opp = e.team_id === m.home_team_id ? m.away_team_id : m.home_team_id
      const tight = gf - ga === 0 || gf - ga === 1
      const assist = e.related_player_id && e.related_player_id !== e.player_id ? e.related_player_id : undefined
      if (e.player_id) { if (tight) C(e.player_id).g++; decisive.set(e.player_id, new Set([opp])) }
      if (assist) { if (tight) C(assist).a++; decisive.set(assist, new Set([opp])) }
    }
    for (const [pid, opps] of decisive) for (const o of opps) { const t = team.get(o); if (t?.played) C(pid).adv.push(t.points / (3 * t.played) * 100) }
  }
  const names = new Map(data.players.map((p) => [p.id, `${p.last_name} ${p.first_name}`.trim()]))
  const rows: LiveIPG[] = []
  for (const s of xp.values()) {
    if (!s.matches) continue
    const t = team.get(s.team_id)
    const c = clutch.get(s.player_id) ?? { g: 0, a: 0, adv: [] }
    const contribution = t?.goals ? r1((s.goals + s.assists) / t.goals * 100) : 0
    const win_pct = t?.played ? r1(t.wins / t.played * 100) : 0
    const card_penalty = s.yellow * CARD_PENALTY.yellow + s.red * CARD_PENALTY.red
    const clutch_score = 3 * c.g + c.a
    const adversity = c.adv.length ? r1(c.adv.reduce((x, y) => x + y, 0) / c.adv.length) : 0
    const raw = r1(3 * s.goals + 2 * s.assists + 2 * contribution + win_pct - card_penalty + 2 * clutch_score + adversity)
    rows.push({ rank: 0, player_id: s.player_id, team_id: s.team_id, name: names.get(s.player_id) ?? '', matches: s.matches, goals: s.goals, assists: s.assists, contribution, win_pct, card_penalty, clutch_goals: c.g, clutch_assists: c.a, clutch_score, adversity, raw, ipg: 0 })
  }
  const max = Math.max(0, ...rows.map((r) => r.raw))
  for (const r of rows) r.ipg = max > 0 ? Math.round(r.raw / max * 1000) / 10 : 0
  rows.sort((a, b) => b.ipg - a.ipg || b.raw - a.raw || (b.goals + b.assists) - (a.goals + a.assists) || b.matches - a.matches || a.name.localeCompare(b.name, 'fr'))
  rows.forEach((r, i) => { r.rank = i + 1 })
  const updatedAt = M.map((m) => m.validated_at ?? m.date ?? '').filter(Boolean).sort().at(-1)
  return { rows, matches: M.length, updatedAt }
}

/** Top 25 (les joueurs sans match n'y figurent pas) */
export const top25 = (r: LiveIPGResult) => r.rows.slice(0, 25)
