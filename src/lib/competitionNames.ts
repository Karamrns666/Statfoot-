// Noms des compétitions (MASTER / CHALLENGER / Pré-saison) : valeurs par défaut ici, modifiables dans
// Admin → Paramètres (Settings.competition_names). Aucun nom n'est écrit en dur ailleurs.
import type { Competition, CompetitionPhase, Settings } from '@/types/entities'

export interface CompetitionNames { gold: string; silver: string; league_phase: string }
export const DEFAULT_COMPETITION_NAMES: CompetitionNames = { gold: 'MASTER', silver: 'CHALLENGER', league_phase: 'Pré-saison' }
/** anciens noms (avant renommage) → pour migrer les données et rediriger les anciennes URLs */
export const LEGACY_COMPETITION_NAMES: Record<'gold' | 'silver', string[]> = { gold: ['Gold Cup', 'Gold'], silver: ['Silver Cup', 'Silver'] }

let current: CompetitionNames = DEFAULT_COMPETITION_NAMES
export function resolveCompetitionNames(s?: Pick<Settings, 'competition_names'> | null): CompetitionNames {
  const o = s?.competition_names ?? {}
  const pick = (v: string | undefined, d: string) => (v && v.trim() ? v.trim() : d)
  return { gold: pick(o.gold, DEFAULT_COMPETITION_NAMES.gold), silver: pick(o.silver, DEFAULT_COMPETITION_NAMES.silver), league_phase: pick(o.league_phase, DEFAULT_COMPETITION_NAMES.league_phase) }
}
/** Appelé par le fournisseur de données à chaque changement des réglages. */
export function applyCompetitionNames(s?: Pick<Settings, 'competition_names'> | null) { current = resolveCompetitionNames(s) }
export const competitionNames = () => current
/** Nom d'une phase (gold → « MASTER », silver → « CHALLENGER ») ; les autres phases gardent leur libellé. */
export function phaseName(phase: CompetitionPhase | 'gold' | 'silver' | string): string {
  if (phase === 'gold') return current.gold
  if (phase === 'silver') return current.silver
  return ({ league_phase: 'Phase de ligue', knockout: 'Phase finale', groups: 'Groupes', other: 'Autre' } as Record<string, string>)[phase] ?? phase
}
export const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
/** Adresse du classement d'une compétition : /classement/master, /classement/challenger… */
export const competitionSlug = (c: Pick<Competition, 'phase' | 'name'>) => (c.phase === 'gold' ? slugify(current.gold) : c.phase === 'silver' ? slugify(current.silver) : slugify(c.name))
export const standingsPath = (c: Pick<Competition, 'phase' | 'name'>) => `/classement/${competitionSlug(c)}`
/** Anciennes adresses → phase (gold-cup, silver-cup, gold, silver) */
export function legacySlugPhase(slug: string): 'gold' | 'silver' | undefined {
  const s = slug.toLowerCase()
  if (LEGACY_COMPETITION_NAMES.gold.map(slugify).includes(s)) return 'gold'
  if (LEGACY_COMPETITION_NAMES.silver.map(slugify).includes(s)) return 'silver'
  return undefined
}
