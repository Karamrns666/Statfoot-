import { store } from '../localStore'
import { generateLeagueData } from './generate'
import { migrateStoredData } from './migrations'
import type { EntityName } from '@/types/entities'

const SEED_VERSION = '9-selection-2026'

/** Charge les données de la ligue au premier lancement (ou si la version des données change). */
export function ensureSeeded() {
  if (store.getFlag('seeded') === SEED_VERSION) { migrateStoredData(); return false }
  resetLeagueData()
  return true
}

export function resetLeagueData() {
  const session = store.getFlag('session')
  store.clearAll()
  const db = generateLeagueData()
  store.batch(() => {
    for (const [name, rows] of Object.entries(db)) store.replace(name as EntityName, rows)
  })
  store.setFlag('seeded', SEED_VERSION)
  if (session) store.setFlag('session', session)
}

/** @deprecated */
export const resetDemoData = resetLeagueData
