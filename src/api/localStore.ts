// Implémentation localStorage d'un "store" d'entités.
// ⚠️ C'est le SEUL fichier qui sait que les données vivent en localStorage.
// Dans Base44, il disparaît : base44Client.ts sera remplacé par le SDK officiel.
import type { BaseEntity, EntityName } from '@/types/entities'

const PREFIX = 'statfoot:v1:'
const hasLS = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const memory = new Map<EntityName, BaseEntity[]>()
type Listener = (entity: EntityName) => void
const listeners = new Set<Listener>()

function read<T extends BaseEntity>(name: EntityName): T[] {
  if (!memory.has(name)) {
    let rows: BaseEntity[] = []
    if (hasLS) {
      try { rows = JSON.parse(window.localStorage.getItem(PREFIX + name) || '[]') } catch { rows = [] }
    }
    memory.set(name, rows)
  }
  return memory.get(name) as T[]
}

function write(name: EntityName, rows: BaseEntity[]) {
  memory.set(name, rows)
  if (hasLS) {
    try { window.localStorage.setItem(PREFIX + name, JSON.stringify(rows)) } catch (e) { console.error('localStorage plein ?', e) }
  }
  emit(name)
}

let batchDepth = 0
const pending = new Set<EntityName>()
function emit(name: EntityName) {
  if (batchDepth > 0) { pending.add(name); return }
  listeners.forEach((l) => l(name))
}

export const store = {
  all<T extends BaseEntity>(name: EntityName): T[] { return read<T>(name) },
  replace(name: EntityName, rows: BaseEntity[]) { write(name, rows) },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } },
  /** regroupe plusieurs écritures en une seule notification par entité */
  batch<R>(fn: () => R): R {
    batchDepth++
    try { return fn() } finally {
      batchDepth--
      if (batchDepth === 0) { const names = [...pending]; pending.clear(); names.forEach(emit) }
    }
  },
  getFlag(key: string) { return hasLS ? window.localStorage.getItem(PREFIX + key) : null },
  setFlag(key: string, v: string | null) {
    if (!hasLS) return
    if (v === null) window.localStorage.removeItem(PREFIX + key)
    else window.localStorage.setItem(PREFIX + key, v)
  },
  clearAll() {
    memory.clear()
    if (hasLS) Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => window.localStorage.removeItem(k))
  },
}

// Synchronisation entre onglets (ex. mode TV ouvert dans un autre onglet que le Match Center)
if (hasLS) {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return
    const name = e.key.slice(PREFIX.length) as EntityName
    memory.delete(name)
    listeners.forEach((l) => l(name))
  })
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
