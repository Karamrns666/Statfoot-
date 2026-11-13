// Mode simulation : l'admin connecté voit tout le site avec les données simulées, rangées À PART des vraies
// (table sim_rows dans Supabase, lisible uniquement par les admins). Le mode est propre à l'onglet (sessionStorage),
// jamais actif pour un visiteur, et le site passe en LECTURE SEULE tant qu'il est actif (aucune écriture possible,
// ni dans les vraies données ni ailleurs).
import { adminRest, cloudAuth, cloudEnabled } from '@/api/cloud'
import type { BaseEntity } from '@/types/entities'
import { SIM_ID } from './constants'
import type { SimReport, SimRows } from './simulation'

const FLAG = 'statfoot:sim-mode'
export interface SimMeta { id: 'info'; generated_at: string; generated_by?: string; seed: number; report: SimReport; baseline?: Record<string, number>; is_simulation: true; simulation_id: string }
interface State { active: boolean; loading: boolean; rows: SimRows | null; meta: SimMeta | null; error: string | null }
let state: State = { active: false, loading: false, rows: null, meta: null, error: null }
const listeners = new Set<() => void>()
const set = (p: Partial<State>) => { state = { ...state, ...p }; listeners.forEach((l) => l()) }
export const simState = () => state
export const onSimChange = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
/** vrai quand le site affiche la simulation : toute écriture est alors refusée */
export const isSimActive = () => state.active
export function assertWritable() {
  if (state.active) throw new Error('Mode simulation : le site est en lecture seule. Quittez le mode simulation pour modifier les vraies données.')
}

// ---------------------------------------------------------------------------------------------------------
//  Stockage : Supabase (sim_rows) — en local sans Supabase : mémoire de l'onglet (développement uniquement)
// ---------------------------------------------------------------------------------------------------------
let memory: { entity: string; id: string; data: unknown }[] = []
type Row = { entity: string; id: string; data: BaseEntity & { is_simulation?: boolean; simulation_id?: string } }

export async function pullSimRows(): Promise<Row[]> {
  if (!cloudEnabled) return memory as Row[]
  const out: Row[] = []
  for (let offset = 0; ; offset += 1000) {
    const rows = await adminRest(`/rest/v1/sim_rows?sim_id=eq.${SIM_ID}&is_simulation=eq.true&select=entity,id,data&order=entity.asc,id.asc&limit=1000&offset=${offset}`) as Row[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}
export async function pushSimRows(rows: { entity: string; id: string; data: unknown }[], onProgress?: (done: number) => void) {
  if (!cloudEnabled) { memory = [...rows]; onProgress?.(rows.length); return }
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => ({ sim_id: SIM_ID, entity: r.entity, id: r.id, data: r.data, is_simulation: true }))
    await adminRest('/rest/v1/sim_rows?on_conflict=sim_id,entity,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(chunk) })
    onProgress?.(Math.min(rows.length, i + 500))
  }
}
/** Suppression définitive (super-admin) : uniquement les lignes de CETTE simulation, dans la table de simulation. */
export async function deleteSimRows(): Promise<Record<string, number>> {
  if (!cloudEnabled) { const c = countBy(memory.filter(isDeletableSimRow)); memory = memory.filter((r) => !isDeletableSimRow(r)); return c }
  return (await adminRest('/rest/v1/rpc/delete_simulation', { method: 'POST', body: JSON.stringify({ p_sim_id: SIM_ID }) }) ?? {}) as Record<string, number>
}
export async function realCounts(local?: () => Record<string, number>): Promise<Record<string, number>> {
  if (!cloudEnabled) return local?.() ?? {}
  return (await adminRest('/rest/v1/rpc/real_row_counts', { method: 'POST', body: '{}' }) ?? {}) as Record<string, number>
}
export async function simCounts(): Promise<Record<string, number>> {
  if (!cloudEnabled) return countBy(memory)
  return (await adminRest('/rest/v1/rpc/sim_row_counts', { method: 'POST', body: JSON.stringify({ p_sim_id: SIM_ID }) }) ?? {}) as Record<string, number>
}
const countBy = (rows: { entity: string }[]) => rows.reduce<Record<string, number>>((a, r) => { a[r.entity] = (a[r.entity] ?? 0) + 1; return a }, {})

/**
 * Règle de suppression (identique à la fonction SQL delete_simulation) : une ligne n'est supprimable que si elle
 * appartient à la simulation demandée ET porte le drapeau is_simulation. Une vraie donnée (sans drapeau) ne l'est jamais.
 */
export function isDeletableSimRow(r: { data: unknown; sim_id?: string; is_simulation?: boolean }, simId = SIM_ID) {
  const d = r.data as { is_simulation?: unknown; simulation_id?: unknown } | null
  return !!d && d.is_simulation === true && d.simulation_id === simId && (r.sim_id === undefined || r.sim_id === simId) && r.is_simulation !== false
}

// ---------------------------------------------------------------------------------------------------------
//  Activation (admin connecté uniquement)
// ---------------------------------------------------------------------------------------------------------
const isAdmin = () => (cloudEnabled ? !!cloudAuth.me() : true)
export async function enterSimulation() {
  if (!isAdmin()) throw new Error('Réservé aux admins connectés')
  set({ loading: true, error: null })
  try {
    const rows = await pullSimRows()
    const data = rows.filter((r) => r.data?.is_simulation === true && r.data?.simulation_id === SIM_ID)
    const meta = (data.find((r) => r.entity === '__meta')?.data ?? null) as unknown as SimMeta | null
    if (!data.some((r) => r.entity === 'Match')) throw new Error('Aucune simulation enregistrée : générez-la d’abord.')
    const out: Record<string, BaseEntity[]> = {}
    for (const r of data) if (r.entity !== '__meta') (out[r.entity] ??= []).push(r.data)
    try { sessionStorage.setItem(FLAG, '1') } catch { /* indisponible */ }
    set({ active: true, loading: false, rows: out as SimRows, meta })
  } catch (e) { set({ loading: false, error: (e as Error).message }); throw e }
}
export function leaveSimulation() {
  try { sessionStorage.removeItem(FLAG) } catch { /* indisponible */ }
  set({ active: false, rows: null, meta: null })
}
/** Au chargement : reprend le mode simulation de l'onglet si un admin est connecté */
export function resumeSimulation() {
  let on = false
  try { on = sessionStorage.getItem(FLAG) === '1' } catch { /* indisponible */ }
  if (on && isAdmin()) enterSimulation().catch(() => leaveSimulation())
  else if (on) leaveSimulation()
}
