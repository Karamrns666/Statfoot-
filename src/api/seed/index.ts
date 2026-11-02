import { store } from '../localStore'
import { generateDemoData } from './generate'
import type { EntityName } from '@/types/entities'

const SEED_VERSION = '3-mbl-2025'

/** Charge les données de démo au premier lancement (ou si la version du seed change). */
export function ensureSeeded() {
  if (store.getFlag('seeded') === SEED_VERSION) return false
  resetDemoData()
  return true
}

export function resetDemoData() {
  const session = store.getFlag('session')
  store.clearAll()
  const db = generateDemoData()
  store.batch(() => {
    for (const [name, rows] of Object.entries(db)) store.replace(name as EntityName, rows)
  })
  store.setFlag('seeded', SEED_VERSION)
  if (session) store.setFlag('session', session)
}
