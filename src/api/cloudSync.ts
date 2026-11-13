// Synchronisation du store local avec Supabase (table entity_rows).
//  · au démarrage (et après connexion) : copie complète depuis Supabase → le store local ;
//  · toutes les 4 s : changements récents (site public, mode TV, autres admins) ;
//  · chaque écriture d'un admin connecté : envoi immédiat (regroupé) ; suppression = ligne marquée deleted.
//  · migrations de données : appliquées une fois sur Supabase par le premier admin connecté (version dans __meta).
import { store, setWriteHook } from './localStore'
import { META, canWrite, cloudEnabled, isSynced, onAuthChange, pullRows, pushRows, type CloudRow } from './cloud'
import { ENTITY_NAMES, type BaseEntity, type EntityName } from '@/types/entities'

type Pending = { entity: string; id: string; data: unknown; deleted: boolean }
const queue = new Map<string, Pending>()
let applying = false
let pulled = false
let cursor = ''
let timer: ReturnType<typeof setTimeout> | null = null
let started: Promise<void> | null = null
export const cloudState = { initialized: false, lastSync: '', error: '', pending: 0, migrations: 0 }
const listeners = new Set<() => void>()
export const onCloudState = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const emit = () => { cloudState.pending = queue.size; listeners.forEach((l) => l()) }
const key = (e: string, id: string) => `${e}\u0000${id}`

function onWrite(name: EntityName, before: BaseEntity[], after: BaseEntity[]) {
  if (applying || !pulled || !cloudState.initialized || !isSynced(name) || !canWrite()) return
  const prev = new Map(before.map((r) => [r.id, r]))
  for (const r of after) {
    if (prev.get(r.id) !== r) queue.set(key(name, r.id), { entity: name, id: r.id, data: r, deleted: false })
    prev.delete(r.id)
  }
  for (const [id, r] of prev) queue.set(key(name, id), { entity: name, id, data: r, deleted: true })
  if (queue.size) schedule(250)
}

function schedule(ms: number) { if (timer) clearTimeout(timer); timer = setTimeout(flush, ms); emit() }
async function flush() {
  timer = null
  if (!queue.size) return
  const batch = [...queue.values()]
  try {
    await pushRows(batch)
    for (const b of batch) if (queue.get(key(b.entity, b.id)) === b) queue.delete(key(b.entity, b.id))
    cloudState.error = ''; cloudState.lastSync = new Date().toISOString()
  } catch (e) {
    cloudState.error = (e as Error).message
    schedule(5000) // nouvel essai
  }
  emit()
}

function apply(rows: CloudRow[], full: boolean) {
  const by = new Map<string, CloudRow[]>()
  for (const r of rows) if (r.entity !== META.entity) { const l = by.get(r.entity) ?? []; l.push(r); by.set(r.entity, l) }
  applying = true
  try {
    store.batch(() => {
      for (const name of ENTITY_NAMES) {
        if (!isSynced(name)) continue
        const list = by.get(name) ?? []
        if (full) { store.replace(name, list.filter((r) => !r.deleted).map((r) => r.data)); continue }
        if (!list.length) continue
        const cur = new Map(store.all(name).map((r) => [r.id, r]))
        for (const r of list) {
          if (queue.has(key(name, r.id))) continue // modification locale pas encore envoyée : elle gagne
          if (r.deleted) cur.delete(r.id); else cur.set(r.id, r.data)
        }
        store.replace(name, [...cur.values()])
      }
    })
  } finally { applying = false }
}

async function fullPull() {
  const rows = await pullRows()
  const meta = (id: string) => rows.find((r) => r.entity === META.entity && r.id === id && !r.deleted)
  cloudState.initialized = !!meta(META.init)
  if (cloudState.initialized) {
    apply(rows, true)
    cloudState.migrations = Number((meta(META.migrations)?.data as { version?: number } | undefined)?.version ?? 0)
  }
  cursor = rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), cursor)
  pulled = true
  cloudState.lastSync = new Date().toISOString(); cloudState.error = ''
  emit()
  if (cloudState.initialized) await migrateCloud()
}

async function migrateCloud() {
  const { MIGRATION_COUNT, migrateStoreFrom } = await import('./seed/migrations')
  if (cloudState.migrations >= MIGRATION_COUNT) return
  if (canWrite()) {
    migrateStoreFrom(cloudState.migrations) // les changements partent vers Supabase via onWrite
    await flush()
    await pushRows([{ entity: META.entity, id: META.migrations, data: { id: META.migrations, version: MIGRATION_COUNT }, deleted: false }])
    cloudState.migrations = MIGRATION_COUNT
  } else {
    applying = true
    try { migrateStoreFrom(cloudState.migrations) } finally { applying = false } // affichage seulement
  }
}

async function poll() {
  if (!pulled || document.hidden) return
  try {
    const rows = await pullRows(cursor)
    if (!rows.length) return
    cursor = rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), cursor)
    if (rows.some((r) => r.entity === META.entity)) { await fullPull(); return }
    apply(rows, false)
    cloudState.lastSync = new Date().toISOString(); cloudState.error = ''
  } catch (e) { cloudState.error = (e as Error).message }
  emit()
}

/** Démarre la synchronisation ; la promesse se résout après la première copie depuis Supabase. */
export function startCloudSync(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve()
  started ??= (async () => {
    setWriteHook(onWrite)
    onAuthChange(() => { fullPull().catch((e) => { cloudState.error = (e as Error).message; emit() }) })
    setInterval(poll, 4000)
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll() })
    await fullPull().catch((e) => { cloudState.error = (e as Error).message; pulled = true; emit() })
  })()
  return started
}

/** Super-admin : envoie toutes les données de ce navigateur vers Supabase (première mise en service). */
export async function initializeCloud(onProgress?: (done: number, total: number) => void) {
  if (!canWrite()) throw new Error('Connexion super-admin requise.')
  // sécurité : ne jamais écraser une base déjà initialisée avec les données (peut-être anciennes) d'un navigateur
  if ((await pullRows()).some((r) => r.entity === META.entity && r.id === META.init && !r.deleted)) {
    await fullPull()
    throw new Error('La base Supabase est déjà initialisée : rien n’a été envoyé.')
  }
  const { MIGRATION_COUNT } = await import('./seed/migrations')
  const rows: Pending[] = []
  for (const name of ENTITY_NAMES) if (isSynced(name)) for (const r of store.all(name)) rows.push({ entity: name, id: r.id, data: r, deleted: false })
  for (let i = 0; i < rows.length; i += 400) { await pushRows(rows.slice(i, i + 400)); onProgress?.(Math.min(i + 400, rows.length), rows.length) }
  await pushRows([
    { entity: META.entity, id: META.migrations, data: { id: META.migrations, version: MIGRATION_COUNT }, deleted: false },
    { entity: META.entity, id: META.init, data: { id: META.init, at: new Date().toISOString() }, deleted: false },
  ])
  await fullPull()
  return rows.length
}
