// Catalogue des badges (source UNIQUE pour la collection, les cartes, la fiche joueur et le glossaire) :
// rareté (Commun / Rare / Épique / Légendaire — noms distincts des niveaux d'équipe Platinum / Gold / Silver),
// catégorie, famille + palier (I à IV) pour les badges cumulatifs, pictogramme SVG original.
// Les conditions de déblocage restent celles du moteur (src/lib/badges.ts : BADGES).
import { BADGES, type BadgeDef } from './badges'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common']
export const RARITY_LABEL: Record<Rarity, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' }
export const RARITY_RANK: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }

export type BadgeCategory = 'Attaque' | 'Création' | 'Gardien' | 'Discipline / Fair-play' | 'Équipe' | 'Régularité' | 'Spécial'
export const CATEGORY_ORDER: BadgeCategory[] = ['Attaque', 'Création', 'Gardien', 'Régularité', 'Discipline / Fair-play', 'Équipe', 'Spécial']

export type Pictogram =
  | 'ball' | 'ball_net' | 'ball_target' | 'ball_fire' | 'boot' | 'pass' | 'baton' | 'compass' | 'ball_boot' | 'bolts' | 'orbit'
  | 'shield_check' | 'metronome' | 'armband' | 'crown' | 'balls2' | 'balls3' | 'star_medal' | 'balls4' | 'flame' | 'bullseye'
  | 'crosshair' | 'glove' | 'wall' | 'lock_net' | 'lock3'

export interface BadgeMeta {
  rarity: Rarity
  category: BadgeCategory
  pictogram: Pictogram
  /** famille de badges cumulatifs (même emblème qui évolue) et palier 1…4 */
  family?: string
  level?: number
  /** justification de la rareté (tableau de la planche) */
  why: string
}

export const BADGE_META: Record<string, BadgeMeta> = {
  first_goal: { rarity: 'common', category: 'Attaque', pictogram: 'ball', family: 'Buteur', level: 1, why: '1 but : accessible dès le premier match' },
  scorer: { rarity: 'rare', category: 'Attaque', pictogram: 'ball_net', family: 'Buteur', level: 2, why: '5 buts : régularité devant le but sur plusieurs matchs' },
  finisher: { rarity: 'epic', category: 'Attaque', pictogram: 'ball_target', family: 'Buteur', level: 3, why: '10 buts : réservé aux attaquants de pointe (environ 2 par match en pré-saison)' },
  goal_machine: { rarity: 'legendary', category: 'Attaque', pictogram: 'ball_fire', family: 'Buteur', level: 4, why: '20 buts : niveau des meilleurs buteurs d’une saison complète' },
  first_assist: { rarity: 'common', category: 'Création', pictogram: 'boot', family: 'Passeur', level: 1, why: '1 passe décisive : accessible dès le premier match' },
  creator: { rarity: 'rare', category: 'Création', pictogram: 'pass', family: 'Passeur', level: 2, why: '5 passes décisives' },
  maestro: { rarity: 'epic', category: 'Création', pictogram: 'baton', family: 'Passeur', level: 3, why: '10 passes décisives : meneur de jeu confirmé' },
  architect: { rarity: 'legendary', category: 'Création', pictogram: 'compass', family: 'Passeur', level: 4, why: '20 passes décisives : rarissime sur une saison' },
  versatile: { rarity: 'rare', category: 'Création', pictogram: 'ball_boot', family: 'Polyvalent', level: 1, why: '3 matchs avec but ET passe : demande d’être décisif des deux façons' },
  double_threat: { rarity: 'epic', category: 'Création', pictogram: 'bolts', family: 'Polyvalent', level: 2, why: '5 matchs avec but ET passe' },
  total_football: { rarity: 'legendary', category: 'Création', pictogram: 'orbit', family: 'Polyvalent', level: 3, why: '10 matchs avec but ET passe : presque chaque match d’une saison' },
  solid: { rarity: 'common', category: 'Régularité', pictogram: 'shield_check', family: 'Régularité', level: 1, why: '3 matchs notés 7,0 ou plus' },
  reliable: { rarity: 'rare', category: 'Régularité', pictogram: 'metronome', family: 'Régularité', level: 2, why: '5 matchs notés 7,0 ou plus' },
  boss: { rarity: 'epic', category: 'Régularité', pictogram: 'armband', family: 'Régularité', level: 3, why: '8 matchs notés 7,5 ou plus : constance de haut niveau' },
  untouchable: { rarity: 'legendary', category: 'Régularité', pictogram: 'crown', family: 'Régularité', level: 4, why: '10 matchs notés 8,0 ou plus : le sommet de la régularité' },
  brace: { rarity: 'common', category: 'Attaque', pictogram: 'balls2', why: '2 buts dans un match : fréquent en 6 contre 6' },
  hat_trick: { rarity: 'rare', category: 'Attaque', pictogram: 'balls3', why: '3 buts dans un match' },
  poker: { rarity: 'epic', category: 'Attaque', pictogram: 'balls4', why: '4 buts dans un match (badge secret)' },
  motm: { rarity: 'rare', category: 'Spécial', pictogram: 'star_medal', why: 'Homme du match : 1 seul joueur par match' },
  on_fire: { rarity: 'rare', category: 'Spécial', pictogram: 'flame', why: 'Décisif 3 matchs de suite : demande une série' },
  perfectionist: { rarity: 'rare', category: 'Spécial', pictogram: 'bullseye', why: 'Les 3 défis d’une même journée' },
  hunter: { rarity: 'epic', category: 'Attaque', pictogram: 'crosshair', why: '3 buts contre le top 3 : face aux meilleures défenses' },
  safe_hands: { rarity: 'rare', category: 'Gardien', pictogram: 'glove', family: 'Arrêts', level: 1, why: '25 arrêts (gardiens uniquement)' },
  wall: { rarity: 'epic', category: 'Gardien', pictogram: 'wall', family: 'Arrêts', level: 2, why: '75 arrêts : une saison entière dans les buts' },
  clean_sheet: { rarity: 'rare', category: 'Gardien', pictogram: 'lock_net', family: 'Clean Sheet', level: 1, why: 'Un match sans encaisser : rare en 6 contre 6 (≈ 10 buts par match)' },
  clean_sheets_3: { rarity: 'legendary', category: 'Gardien', pictogram: 'lock3', family: 'Clean Sheet', level: 2, why: '3 clean sheets dans la saison : exceptionnel avec ≈ 10 buts par match' },
}

const FALLBACK: BadgeMeta = { rarity: 'common', category: 'Spécial', pictogram: 'star_medal', why: '' }
/** Rareté, catégorie, pictogramme d'un badge — avec la rareté éventuellement corrigée dans l'admin */
export function badgeMeta(id: string, overrides?: Record<string, Rarity> | null): BadgeMeta {
  const m = BADGE_META[id] ?? FALLBACK
  const r = overrides?.[id]
  return r ? { ...m, rarity: r } : m
}
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V']

export interface CatalogEntry { def: BadgeDef; meta: BadgeMeta }
export function badgeCatalog(overrides?: Record<string, Rarity> | null): CatalogEntry[] {
  return BADGES.map((def) => ({ def, meta: badgeMeta(def.id, overrides) }))
}
