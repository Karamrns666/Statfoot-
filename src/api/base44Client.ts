// Client qui imite l'API du SDK Base44 :
//   base44.entities.Team.list(sort?, limit?)
//   base44.entities.Team.filter(query, sort?, limit?)
//   base44.entities.Team.get(id) / create(data) / bulkCreate(rows) / update(id, data) / delete(id)
//   base44.auth.me() / login() / logout()
//   base44.integrations.Core.UploadFile({ file })
// Pour migrer : remplacer ce fichier par
//   import { createClient } from '@base44/sdk'; export const base44 = createClient({ appId: '...' })
import { store, newId } from './localStore'
import { ENTITY_NAMES, type BaseEntity, type EntityMap, type EntityName } from '@/types/entities'
import { getSessionUser } from './session'
import { assertWritable, isSimActive } from '@/sim/simMode'

export type Query<T> = { [K in keyof T]?: T[K] | { $in: T[K][] } | { $ne: T[K] } }

function matches<T>(row: T, query: Query<T>): boolean {
  return Object.entries(query).every(([k, cond]) => {
    const v = (row as Record<string, unknown>)[k]
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$in' in cond) return (cond.$in as unknown[]).includes(v)
      if ('$ne' in cond) return v !== cond.$ne
    }
    return v === cond
  })
}

function sortRows<T>(rows: T[], sort?: string): T[] {
  if (!sort) return rows
  const desc = sort.startsWith('-')
  const key = desc ? sort.slice(1) : sort
  return [...rows].sort((a, b) => {
    const va = (a as Record<string, unknown>)[key] as string | number | undefined
    const vb = (b as Record<string, unknown>)[key] as string | number | undefined
    if (va === vb) return 0
    if (va === undefined || va === null) return 1
    if (vb === undefined || vb === null) return -1
    return (va < vb ? -1 : 1) * (desc ? -1 : 1)
  })
}

const NOT_LOGGED: EntityName[] = ['AuditLog', 'MotmVote', 'LiveState']

function log(action: string, entity: EntityName, row: BaseEntity | undefined, details?: Record<string, unknown>) {
  if (NOT_LOGGED.includes(entity)) return
  const user = getSessionUser()
  const r = row as unknown as Record<string, unknown> | undefined
  const label = r ? String(r.name ?? r.title ?? (r.first_name ? `${r.first_name} ${r.last_name}` : r.type ?? r.email ?? r.id)) : undefined
  const entry = {
    id: newId(), created_date: new Date().toISOString(), action, entity, entity_id: row?.id, entity_label: label,
    details, author_email: user?.email ?? 'public', author_name: user?.full_name ?? 'Public',
  }
  store.replace('AuditLog', [entry, ...store.all('AuditLog')].slice(0, 3000))
}

function diff(before: Record<string, unknown>, patch: Record<string, unknown>) {
  const changes: Record<string, { avant: unknown; apres: unknown }> = {}
  for (const k of Object.keys(patch)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(patch[k])) changes[k] = { avant: before[k], apres: patch[k] }
  }
  return changes
}

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)))

export function entityApi<N extends EntityName>(name: N) {
  type T = EntityMap[N]
  return {
    async list(sort?: string, limit?: number): Promise<T[]> {
      const rows = sortRows(store.all<T>(name), sort)
      return clone(limit ? rows.slice(0, limit) : rows)
    },
    async filter(query: Query<T>, sort?: string, limit?: number): Promise<T[]> {
      const rows = sortRows(store.all<T>(name).filter((r) => matches(r, query)), sort)
      return clone(limit ? rows.slice(0, limit) : rows)
    },
    async get(id: string): Promise<T> {
      const row = store.all<T>(name).find((r) => r.id === id)
      if (!row) throw new Error(`${name} ${id} introuvable`)
      return clone(row)
    },
    async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
      assertWritable()
      const now = new Date().toISOString()
      const row = { ...data, id: data.id ?? newId(), created_date: now, updated_date: now, created_by: getSessionUser()?.email } as T
      store.replace(name, [...store.all(name), row])
      log('create', name, row)
      return clone(row)
    },
    async bulkCreate(rows: (Omit<T, 'id'> & { id?: string })[]): Promise<T[]> {
      assertWritable()
      const now = new Date().toISOString()
      const created = rows.map((d) => ({ ...d, id: d.id ?? newId(), created_date: now, updated_date: now } as T))
      store.replace(name, [...store.all(name), ...created])
      log('bulk_create', name, undefined, { count: created.length })
      return clone(created)
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      assertWritable()
      const rows = store.all<T>(name)
      const idx = rows.findIndex((r) => r.id === id)
      if (idx < 0) throw new Error(`${name} ${id} introuvable`)
      const before = rows[idx]
      const next = { ...before, ...patch, id, updated_date: new Date().toISOString() } as T
      const copy = [...rows]; copy[idx] = next
      store.replace(name, copy)
      const keys = Object.keys(patch)
      if (!(name === 'Lineup' && keys.every((k) => k === 'updated_date'))) {
        log('update', name, next, diff(before as unknown as Record<string, unknown>, patch as Record<string, unknown>))
      }
      return clone(next)
    },
    async delete(id: string): Promise<void> {
      assertWritable()
      const rows = store.all<T>(name)
      const row = rows.find((r) => r.id === id)
      store.replace(name, rows.filter((r) => r.id !== id))
      log('delete', name, row, row ? { supprime: row as unknown as Record<string, unknown> } : undefined)
    },
  }
}

type Entities = { [N in EntityName]: ReturnType<typeof entityApi<N>> }
const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, entityApi(n)])) as Entities

import { auth } from './auth'
import { integrations } from './integrations'

export const base44 = { entities, auth, integrations, logActivity: (action: string, entity: EntityName, row?: BaseEntity, details?: Record<string, unknown>) => { if (!isSimActive()) log(action, entity, row, details) } }
export { store }
