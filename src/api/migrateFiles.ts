// Images importées AVANT le stockage partagé : elles n'existaient que dans le navigateur de l'admin qui les avait
// importées (/_files/…), d'où des photos cassées (carré bleu « ? ») chez tous les autres visiteurs.
// Sur l'appareil qui possède encore ces fichiers, on les envoie dans le stockage Supabase et on remplace les URL
// dans les données. Sur les autres appareils, on se contente de compter les images introuvables.
import { base44 } from './base44Client'
import { cloudEnabled, uploadMedia } from './cloud'
import { FILE_PREFIX, loadBlob } from './fileStore'
import { ENTITY_NAMES, type EntityName } from '@/types/entities'

type Db = Record<string, { id: string }[]>
const isLocal = (v: unknown): v is string => typeof v === 'string' && v.startsWith(FILE_PREFIX)
function collect(v: unknown, out: Set<string>) {
  if (isLocal(v)) out.add(v.split('?')[0])
  else if (Array.isArray(v)) v.forEach((x) => collect(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, out))
}
function replace(v: unknown, map: Map<string, string>): unknown {
  if (isLocal(v)) { const [base, q] = v.split('?'); return map.has(base) ? map.get(base)! + (q ? `?${q}` : '') : v }
  if (Array.isArray(v)) return v.map((x) => replace(x, map))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replace(x, map)]))
  return v
}

/** Liste des images locales référencées (entité, enregistrement, URL) */
export function localFileRefs(db: Db) {
  const refs: { entity: EntityName; id: string; urls: string[] }[] = []
  for (const e of ENTITY_NAMES) for (const r of db[e] ?? []) { const s = new Set<string>(); collect(r, s); if (s.size) refs.push({ entity: e, id: r.id, urls: [...s] }) }
  return refs
}

export async function migrateLocalFiles(db: Db): Promise<{ uploaded: number; missing: number; rows: number }> {
  if (!cloudEnabled) return { uploaded: 0, missing: 0, rows: 0 }
  const refs = localFileRefs(db)
  const urls = [...new Set(refs.flatMap((r) => r.urls))]
  const map = new Map<string, string>()
  let missing = 0
  for (const u of urls) {
    let blob: Blob | null = null
    try { const b = await loadBlob(u); if (b.size && b.type.startsWith('image/')) blob = b } catch { /* absent de cet appareil */ }
    if (!blob) { missing++; continue }
    try { map.set(u, await uploadMedia(blob, 'reprise')) } catch { missing++ }
  }
  let rows = 0
  for (const r of refs) {
    if (!r.urls.some((u) => map.has(u))) continue
    const row = (db[r.entity] ?? []).find((x) => x.id === r.id); if (!row) continue
    const patch = Object.fromEntries(Object.entries(row).filter(([, v]) => { const s = new Set<string>(); collect(v, s); return [...s].some((u) => map.has(u)) }).map(([k, v]) => [k, replace(v, map)]))
    await (base44.entities as Record<string, { update: (id: string, d: object) => Promise<unknown> }>)[r.entity].update(r.id, patch)
    rows++
  }
  return { uploaded: map.size, missing, rows }
}
