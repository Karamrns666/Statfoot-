// Migrations NON destructives des données déjà enregistrées dans le navigateur.
// Elles adaptent les anciennes données aux règles en vigueur sans effacer ce que l'admin a saisi.
import type { Award, Lineup, Page, Position, MatchEvent, MatchTeamStats, Player, TeamOfWeek } from '@/types/entities'
import { toRole } from '@/lib/format'
import { store } from '../localStore'

/** copie sans la clé donnée */
function omit<T extends object>(o: T, key: string): T { const c = { ...o } as Record<string, unknown>; delete c[key]; return c as T }

const REMOVED_AWARDS = new Set(['best_defender', 'best_midfielder', 'best_forward'])

export interface Rules6Data {
  Player?: Player[]
  MatchEvent?: MatchEvent[]
  MatchTeamStats?: MatchTeamStats[]
  Award?: Award[]
  TeamOfWeek?: TeamOfWeek[]
  Lineup?: Lineup[]
  Page?: Page[]
}

/**
 * Règle 6 contre 6 (5 joueurs de champ + 1 gardien) :
 * - pas de postes : un joueur est soit gardien (GK) soit joueur de champ (FIELD) ;
 * - pas de hors-jeu : événements et statistiques de hors-jeu supprimés ;
 * - trophées par poste (défenseur, milieu, attaquant) retirés ;
 * - équipe type : 1 gardien + 5 joueurs de champ, sans formation.
 * Renvoie uniquement les entités modifiées.
 */
export function applyRules6v6(db: Rules6Data): Rules6Data {
  const out: Rules6Data = {}
  if (db.Player?.some((p) => p.position !== 'GK' && p.position !== 'FIELD'))
    out.Player = db.Player.map((p) => (p.position === 'GK' || p.position === 'FIELD' ? p : { ...p, position: toRole(p.position) }))
  if (db.MatchEvent?.some((e) => (e.type as string) === 'offside'))
    out.MatchEvent = db.MatchEvent.filter((e) => (e.type as string) !== 'offside')
  if (db.MatchTeamStats?.some((s) => 'offsides' in s))
    out.MatchTeamStats = db.MatchTeamStats.map((s) => omit(s, 'offsides'))
  if (db.Award?.some((a) => REMOVED_AWARDS.has(a.category)))
    out.Award = db.Award.filter((a) => !REMOVED_AWARDS.has(a.category))
  if (db.TeamOfWeek?.some((t) => 'formation' in t || t.slots.some((s, i) => s.position !== (i === 0 ? 'GK' : 'FIELD'))))
    out.TeamOfWeek = db.TeamOfWeek.map((t) => {
      return { ...omit(t, 'formation'), slots: t.slots.slice(0, 6).map((s, i) => ({ ...s, position: (i === 0 ? 'GK' : 'FIELD') as Position })) }
    })
  if (db.Lineup?.some((l) => 'formation' in l))
    out.Lineup = db.Lineup.map((l) => omit(l, 'formation'))
  // règlement : ajoute les deux règles si le texte ne les mentionne pas encore (le reste du texte saisi est conservé)
  const rules = db.Page?.find((p) => p.slug === 'reglement')
  if (rules && !/hors-jeu/i.test(rules.content ?? '')) {
    const add = '- **Pas de postes** : les seuls rôles sont **Gardien** et **Capitaine**.\n- **Pas de hors-jeu.**\n'
    const c = rules.content ?? ''
    const at = c.indexOf('\n', c.indexOf('## 1.') + 1)
    const content = c.includes('## 1.') ? c.slice(0, at + 1) + add + c.slice(at + 1) : `${c}\n\n## Règles de jeu\n- 6 contre 6 (5 joueurs de champ + 1 gardien).\n${add}`
    out.Page = db.Page!.map((p) => (p === rules ? { ...p, content } : p))
  }
  return out
}

const MIGRATION_FLAG = 'migrated-6v6'

/** Applique la migration une seule fois sur les données du navigateur. */
export function migrateStoredData() {
  if (store.getFlag(MIGRATION_FLAG)) return
  const names = ['Player', 'MatchEvent', 'MatchTeamStats', 'Award', 'TeamOfWeek', 'Lineup', 'Page'] as const
  const db = Object.fromEntries(names.map((n) => [n, store.all(n)])) as Rules6Data
  const changed = applyRules6v6(db)
  store.batch(() => { for (const [name, rows] of Object.entries(changed)) store.replace(name as (typeof names)[number], rows as never) })
  store.setFlag(MIGRATION_FLAG, '1')
}
