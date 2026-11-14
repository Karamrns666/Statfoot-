// ============================================================================
//  Badges, défis de journée, série et note de match — fonctions PURES.
//  Tout est recalculé depuis les événements de match (même source que l'XP).
// ============================================================================
import type { Match, MatchEvent } from '@/types/entities'
import { isPlayed } from './standings'
import { keeperMatchStats, participants } from './matchEngine'
import { matchInScope, teamRankBefore, type XPData } from './xp'

// ---------------------------------------------------------------------------
//  Journal de matchs d'un joueur
// ---------------------------------------------------------------------------
export interface PlayerMatchLine {
  match: Match
  round: number
  team_id: string
  opponent_id: string
  opponent_rank: number | null
  goals: number
  assists: number
  yellow: number
  red: number
  saves: number
  conceded: number
  keeper: boolean
  clean_sheet: boolean
  result: 'W' | 'D' | 'L'
  motm: boolean
  rating: number
}

/**
 * Note de match sur 10 (une décimale), calculée à partir des actions enregistrées :
 * base 6,0 · but +0,8 · passe décisive +0,5 · victoire +0,4 / défaite −0,4 · homme du match +0,5 ·
 * jaune −0,4 · rouge −1,5 · gardien : arrêt +0,1, but encaissé −0,15, clean sheet +1,0 · bornée entre 3,0 et 10,0.
 */
export function matchRating(l: Omit<PlayerMatchLine, 'rating'>): number {
  let raw = 0.8 * l.goals + 0.5 * l.assists + (l.result === 'W' ? 0.4 : l.result === 'L' ? -0.4 : 0) + (l.motm ? 0.5 : 0) - 0.4 * l.yellow - 1.5 * l.red
  if (l.keeper) raw += 0.1 * l.saves - 0.15 * l.conceded + (l.clean_sheet ? 1 : 0)
  // au-dessus de 6 : courbe qui se rapproche de 10 sans jamais l'atteindre (les gros scores restent départagés)
  const r = raw >= 0 ? 6 + 4 * (1 - Math.exp(-raw / 3)) : Math.max(3, 6 + raw)
  return Math.round(Math.min(9.9, r) * 10) / 10
}
export const RATING_RULES = 'Note sur 10 calculée à partir des actions du match : but +0,8 ; passe décisive +0,5 ; victoire +0,4, défaite −0,4 ; homme du match +0,5 ; carton jaune −0,4, rouge −1,5 ; gardien : arrêt +0,1, but encaissé −0,15, clean sheet +1,0. Le total part de 6,0 et se rapproche de 10 sans l’atteindre, pour départager les grosses performances.'

export function playerMatchLog(data: XPData, playerId: string, seasonId?: string | null): PlayerMatchLine[] {
  return allPlayerLogs(data, seasonId, playerId).get(playerId) ?? []
}

/** Journaux de tous les joueurs d'un périmètre en une seule passe (ou d'un seul joueur avec `only`). */
export function allPlayerLogs(data: XPData, seasonId?: string | null, only?: string): Map<string, PlayerMatchLine[]> {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const ms = data.matches.filter((m) => isPlayed(m) && matchInScope(m, comps, { seasonId })).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.round ?? 0) - (b.round ?? 0))
  const evByMatch = new Map<string, MatchEvent[]>()
  for (const e of data.events) { if (!evByMatch.has(e.match_id)) evByMatch.set(e.match_id, []); evByMatch.get(e.match_id)!.push(e) }
  const cache = new Map<string, Map<string, number>>()
  const out = new Map<string, PlayerMatchLine[]>()
  for (const m of ms) {
    const evs = evByMatch.get(m.id) ?? []
    for (const teamId of [m.home_team_id, m.away_team_id]) {
      const lu = data.lineups.find((l) => l.match_id === m.id && l.team_id === teamId)
      let ps = participants(lu, evs, teamId)
      if (ps.size === 0) ps = new Set(evs.filter((e) => e.team_id === teamId).flatMap((e) => [e.player_id, e.type === 'goal' ? e.related_player_id : undefined]).filter(Boolean) as string[])
      if (only && !ps.has(only)) continue
      const opp = teamId === m.home_team_id ? m.away_team_id : m.home_team_id
      const gf = teamId === m.home_team_id ? m.home_score! : m.away_score!, ga = teamId === m.home_team_id ? m.away_score! : m.home_score!
      const keepers = keeperMatchStats(m, lu, evs, teamId)
      const mine = evs.filter((e) => e.team_id === teamId)
      const oppRank = teamRankBefore(data, m, opp, cache)
      for (const playerId of ps) {
      if (only && playerId !== only) continue
      const k = keepers.find((x) => x.player_id === playerId)
      const base = {
        match: m, round: m.round ?? 0, team_id: teamId, opponent_id: opp, opponent_rank: oppRank,
        goals: mine.filter((e) => e.type === 'goal' && e.player_id === playerId).length,
        assists: mine.filter((e) => e.type === 'goal' && e.related_player_id === playerId && e.player_id !== playerId).length,
        yellow: mine.filter((e) => (e.type === 'yellow_card' || e.type === 'second_yellow') && e.player_id === playerId).length,
        red: mine.filter((e) => (e.type === 'red_card' || e.type === 'second_yellow') && e.player_id === playerId).length,
        saves: k?.saves ?? 0, conceded: k?.conceded ?? 0, keeper: !!k, clean_sheet: !!k?.clean_sheet,
        result: (gf > ga ? 'W' : gf < ga ? 'L' : 'D') as PlayerMatchLine['result'],
        motm: m.motm_player_id === playerId,
      }
      if (!out.has(playerId)) out.set(playerId, [])
      out.get(playerId)!.push({ ...base, rating: matchRating(base) })
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
//  Badges
// ---------------------------------------------------------------------------
/** Matière d'un badge — du plus courant au plus rare. La carte du joueur prend la matière de son meilleur badge. */
export type BadgeTier = 'bronze' | 'argent' | 'or' | 'platine' | 'black'
export const TIER_ORDER: BadgeTier[] = ['bronze', 'argent', 'or', 'platine', 'black']
export const TIER_LABEL: Record<BadgeTier, string> = { bronze: 'Bronze', argent: 'Argent', or: 'Or', platine: 'Platine', black: 'Black' }
export interface TierStyle { edge: string; light: string; dark: string; deep: string; text: string }
export const TIER_STYLE: Record<BadgeTier, TierStyle> = {
  bronze: { edge: '#C47A3A', light: '#F2B27A', dark: '#5C3415', deep: '#1E1009', text: '#F6C9A0' },
  argent: { edge: '#B8C4D0', light: '#F4F7FA', dark: '#4E5A66', deep: '#141A21', text: '#E6ECF2' },
  or: { edge: '#E8B931', light: '#FFE58A', dark: '#6E5210', deep: '#201703', text: '#FFE08A' },
  platine: { edge: '#7FD6DF', light: '#E8FCFE', dark: '#2D6B73', deep: '#081D22', text: '#C9F4F8' },
  black: { edge: '#5A5A66', light: '#C8C8D2', dark: '#1B1B21', deep: '#030304', text: '#F1F1F4' },
}
/** Couleur d'accent (texte, barres de progression) — le black utilise un gris clair pour rester lisible sur fond sombre */
export const TIER_COLOR: Record<BadgeTier, string> = { bronze: '#D08A4A', argent: '#C9D3DD', or: '#E8B931', platine: '#7FD6DF', black: '#A8A8B4' }
export type BadgeGroup = 'Buts' | 'Passes' | 'Polyvalence' | 'Régularité' | 'Exploits' | 'Défis' | 'Gardien'
export type BadgeIcon = 'ball' | 'boot' | 'target' | 'flame' | 'star' | 'shield' | 'hand' | 'crown' | 'bolt' | 'medal' | 'gem' | 'link' | 'lock'

export interface BadgeDef {
  id: string
  name: string
  group: BadgeGroup
  tier: BadgeTier
  icon: BadgeIcon
  description: string
  target: number
  secret?: boolean
  keeperOnly?: boolean
  /** valeur cumulée après chaque match du journal (même longueur que le journal) */
  progress: (log: PlayerMatchLine[]) => number[]
}

const cumul = (f: (l: PlayerMatchLine) => number) => (log: PlayerMatchLine[]) => { let s = 0; return log.map((l) => (s += f(l))) }
const bestStreak = (f: (l: PlayerMatchLine) => boolean) => (log: PlayerMatchLine[]) => { let cur = 0, best = 0; return log.map((l) => { cur = f(l) ? cur + 1 : 0; best = Math.max(best, cur); return best }) }
const decisive = (l: PlayerMatchLine) => l.goals + l.assists > 0

export const BADGES: BadgeDef[] = [
  { id: 'first_goal', name: 'Premier but', group: 'Buts', tier: 'bronze', icon: 'ball', description: 'Marquer 1 but', target: 1, progress: cumul((l) => l.goals) },
  { id: 'scorer', name: 'Buteur confirmé', group: 'Buts', tier: 'bronze', icon: 'ball', description: 'Marquer 5 buts', target: 5, progress: cumul((l) => l.goals) },
  { id: 'finisher', name: 'Finisseur', group: 'Buts', tier: 'argent', icon: 'target', description: 'Marquer 10 buts', target: 10, progress: cumul((l) => l.goals) },
  { id: 'goal_machine', name: 'Machine à buts', group: 'Buts', tier: 'or', icon: 'crown', description: 'Marquer 20 buts', target: 20, progress: cumul((l) => l.goals) },
  { id: 'first_assist', name: 'Premier service', group: 'Passes', tier: 'bronze', icon: 'boot', description: 'Délivrer 1 passe décisive', target: 1, progress: cumul((l) => l.assists) },
  { id: 'creator', name: 'Créateur', group: 'Passes', tier: 'bronze', icon: 'boot', description: 'Délivrer 5 passes décisives', target: 5, progress: cumul((l) => l.assists) },
  { id: 'maestro', name: 'Maestro', group: 'Passes', tier: 'argent', icon: 'link', description: 'Délivrer 10 passes décisives', target: 10, progress: cumul((l) => l.assists) },
  { id: 'architect', name: 'Architecte', group: 'Passes', tier: 'or', icon: 'gem', description: 'Délivrer 20 passes décisives', target: 20, progress: cumul((l) => l.assists) },
  { id: 'versatile', name: 'Polyvalent', group: 'Polyvalence', tier: 'argent', icon: 'star', description: '3 matchs avec au moins 1 but et 1 passe décisive', target: 3, progress: cumul((l) => (l.goals > 0 && l.assists > 0 ? 1 : 0)) },
  { id: 'double_threat', name: 'Double menace', group: 'Polyvalence', tier: 'or', icon: 'bolt', description: '5 matchs avec au moins 1 but et 1 passe décisive', target: 5, progress: cumul((l) => (l.goals > 0 && l.assists > 0 ? 1 : 0)) },
  { id: 'total_football', name: 'Total football', group: 'Polyvalence', tier: 'platine', icon: 'gem', description: '10 matchs avec au moins 1 but et 1 passe décisive', target: 10, progress: cumul((l) => (l.goals > 0 && l.assists > 0 ? 1 : 0)) },
  { id: 'solid', name: 'Solide', group: 'Régularité', tier: 'bronze', icon: 'shield', description: '3 matchs notés 7,0 ou plus', target: 3, progress: cumul((l) => (l.rating >= 7 ? 1 : 0)) },
  { id: 'reliable', name: 'Fiable', group: 'Régularité', tier: 'argent', icon: 'shield', description: '5 matchs notés 7,0 ou plus', target: 5, progress: cumul((l) => (l.rating >= 7 ? 1 : 0)) },
  { id: 'boss', name: 'Patron', group: 'Régularité', tier: 'or', icon: 'medal', description: '8 matchs notés 7,5 ou plus', target: 8, progress: cumul((l) => (l.rating >= 7.5 ? 1 : 0)) },
  { id: 'untouchable', name: 'Intouchable', group: 'Régularité', tier: 'black', icon: 'crown', description: '10 matchs notés 8,0 ou plus', target: 10, progress: cumul((l) => (l.rating >= 8 ? 1 : 0)) },
  { id: 'brace', name: 'Doublé', group: 'Exploits', tier: 'bronze', icon: 'ball', description: 'Marquer 2 buts dans un match', target: 1, progress: cumul((l) => (l.goals >= 2 ? 1 : 0)) },
  { id: 'hat_trick', name: 'Hat-trick', group: 'Exploits', tier: 'argent', icon: 'target', description: 'Marquer 3 buts dans un match', target: 1, progress: cumul((l) => (l.goals >= 3 ? 1 : 0)) },
  { id: 'motm', name: 'Homme du match', group: 'Exploits', tier: 'argent', icon: 'star', description: 'Être élu homme du match', target: 1, progress: cumul((l) => (l.motm ? 1 : 0)) },
  { id: 'poker', name: 'Poker', group: 'Exploits', tier: 'or', icon: 'crown', description: 'Marquer 4 buts dans un match', target: 1, secret: true, progress: cumul((l) => (l.goals >= 4 ? 1 : 0)) },
  { id: 'on_fire', name: 'En feu', group: 'Défis', tier: 'argent', icon: 'flame', description: 'Être décisif (but ou passe) 3 matchs de suite', target: 3, progress: bestStreak(decisive) },
  { id: 'perfectionist', name: 'Perfectionniste', group: 'Défis', tier: 'argent', icon: 'medal', description: 'Réussir les 3 défis d’une même journée', target: 3, progress: (log) => { let best = 0; return log.map((_, i) => (best = Math.max(best, challengeResult(log, i)?.done ?? 0))) } },
  { id: 'hunter', name: 'Chasseur', group: 'Défis', tier: 'or', icon: 'target', description: 'Marquer 3 buts contre une équipe du top 3', target: 3, progress: cumul((l) => (l.opponent_rank != null && l.opponent_rank <= 3 ? l.goals : 0)) },
  { id: 'safe_hands', name: 'Mains sûres', group: 'Gardien', tier: 'argent', icon: 'hand', description: 'Réaliser 25 arrêts', target: 25, keeperOnly: true, progress: cumul((l) => l.saves) },
  { id: 'wall', name: 'Muraille', group: 'Gardien', tier: 'or', icon: 'shield', description: 'Réaliser 75 arrêts', target: 75, keeperOnly: true, progress: cumul((l) => l.saves) },
  { id: 'clean_sheet', name: 'Clean Sheet', group: 'Gardien', tier: 'platine', icon: 'shield', description: 'Ne pas encaisser de but sur un match complet (clean sheet)', target: 1, keeperOnly: true, progress: cumul((l) => (l.clean_sheet ? 1 : 0)) },
  { id: 'clean_sheets_3', name: '3 Clean Sheets', group: 'Gardien', tier: 'black', icon: 'lock', description: 'Atteindre 3 matchs sans encaisser de but dans la saison', target: 3, keeperOnly: true, progress: cumul((l) => (l.clean_sheet ? 1 : 0)) },
]

export interface BadgeState { def: BadgeDef; value: number; unlocked: boolean; unlocked_round?: number; pct: number }

export function playerBadges(log: PlayerMatchLine[], opts: { keeper?: boolean } = {}): BadgeState[] {
  return BADGES.filter((b) => !b.keeperOnly || opts.keeper).map((def) => {
    const p = def.progress(log)
    const value = p.at(-1) ?? 0
    const idx = p.findIndex((v) => v >= def.target)
    return { def, value: Math.min(value, def.target), unlocked: idx >= 0, unlocked_round: idx >= 0 ? log[idx].round : undefined, pct: Math.min(100, Math.round((value / def.target) * 100)) }
  })
}
/** Matière de la carte = matière du meilleur badge débloqué (null si aucun badge) */
export function cardMaterial(bs: BadgeState[]): BadgeTier | null {
  let best = -1
  for (const b of bs) if (b.unlocked) best = Math.max(best, TIER_ORDER.indexOf(b.def.tier))
  return best >= 0 ? TIER_ORDER[best] : null
}
/** Badges débloqués, du plus rare au plus courant */
export const unlockedByRarity = (bs: BadgeState[]) => bs.filter((b) => b.unlocked).sort((a, b) => TIER_ORDER.indexOf(b.def.tier) - TIER_ORDER.indexOf(a.def.tier))

/** Prochains badges : non débloqués, les plus avancés d'abord */
export const nextBadges = (bs: BadgeState[], n = 3) => bs.filter((b) => !b.unlocked && !b.def.secret && b.value > 0).sort((a, b) => b.pct - a.pct).slice(0, n)

// ---------------------------------------------------------------------------
//  Défis de journée (objectifs calculés sur les 5 matchs précédents)
// ---------------------------------------------------------------------------
export interface Challenge { id: string; label: string; target: number; value?: number; done?: boolean }
export interface ChallengeSet { round: number; items: Challenge[]; done?: number }

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0)
const fmt1 = (n: number) => n.toFixed(1).replace('.', ',')

/** Objectifs à partir d'un historique (5 derniers matchs) */
export function challengeTargets(prev: PlayerMatchLine[], keeper: boolean): Challenge[] {
  const last = prev.slice(-5)
  const rating = Math.min(9.5, Math.max(6.5, Math.round((avg(last.map((l) => l.rating)) + 0.2) * 10) / 10 || 6.5))
  if (keeper) {
    const saves = Math.max(3, Math.round(avg(last.map((l) => l.saves))))
    const conceded = Math.max(0, Math.round(avg(last.map((l) => l.conceded))) - 1)
    return [
      { id: 'saves', label: `Réaliser ${saves} arrêts`, target: saves },
      { id: 'conceded', label: conceded === 0 ? 'Ne pas encaisser de but' : `Encaisser ${conceded} buts ou moins`, target: conceded },
      { id: 'rating', label: `Note de ${fmt1(rating)} ou plus`, target: rating },
    ]
  }
  const g = Math.max(1, Math.round(avg(last.map((l) => l.goals))))
  const a = Math.max(1, Math.round(avg(last.map((l) => l.assists))))
  return [
    { id: 'goals', label: `Marquer ${g} but${g > 1 ? 's' : ''}`, target: g },
    { id: 'assists', label: `Délivrer ${a} passe${a > 1 ? 's' : ''} décisive${a > 1 ? 's' : ''}`, target: a },
    { id: 'rating', label: `Note de ${fmt1(rating)} ou plus`, target: rating },
  ]
}

function evaluate(c: Challenge, l: PlayerMatchLine): Challenge {
  const value = c.id === 'goals' ? l.goals : c.id === 'assists' ? l.assists : c.id === 'saves' ? l.saves : c.id === 'conceded' ? l.conceded : l.rating
  const done = c.id === 'conceded' ? value <= c.target : value >= c.target
  return { ...c, value, done }
}

/** Résultat des défis pour le match i du journal (objectifs fixés par les 5 matchs précédents) */
export function challengeResult(log: PlayerMatchLine[], i: number): ChallengeSet | null {
  if (i < 1) return null
  const l = log[i]
  const items = challengeTargets(log.slice(0, i), l.keeper).map((c) => evaluate(c, l))
  return { round: l.round, items, done: items.filter((c) => c.done).length }
}

// ---------------------------------------------------------------------------
//  Série (matchs décisifs consécutifs)
// ---------------------------------------------------------------------------
export function decisiveStreak(log: PlayerMatchLine[]) {
  let cur = 0, best = 0
  for (const l of log) { cur = decisive(l) ? cur + 1 : 0; best = Math.max(best, cur) }
  return { current: cur, record: best }
}
