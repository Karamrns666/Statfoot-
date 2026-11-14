// Fichiers importés (images) : stockés dans IndexedDB (pas de limite de 5 Mo comme localStorage)
// et servis par le service worker public/files-sw.js sous /_files/<id>.<ext>.
// Sans service worker / IndexedDB (navigation privée…), repli sur une data URL.
const DB = 'statfoot-files', STORE = 'files'
export const FILE_PREFIX = '/_files/'

let swReady: Promise<boolean> | null = null
/** Enregistre le service worker des fichiers (une fois). */
export function registerFileWorker(): Promise<boolean> {
  if (swReady) return swReady
  swReady = (async () => {
    try {
      if (!('serviceWorker' in navigator) || !('indexedDB' in window)) return false
      await navigator.serviceWorker.register('/files-sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      return true
    } catch { return false }
  })()
  return swReady
}

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((res, rej) => {
    const q = fn(db.transaction(STORE, mode).objectStore(STORE))
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}

const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/gif': 'gif', 'image/avif': 'avif' }
const toDataUrl = (blob: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(blob) })

/** Range un fichier et renvoie son URL (/_files/… ou data URL en secours). */
export async function saveFile(blob: Blob, hint = 'f'): Promise<string> {
  if (await registerFileWorker()) {
    try {
      const id = `${hint}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${EXT[blob.type] ?? 'bin'}`
      await tx('readwrite', (s) => s.put({ blob, type: blob.type, created: Date.now() }, id))
      return FILE_PREFIX + id
    } catch { /* repli */ }
  }
  return toDataUrl(blob)
}

/** Range une image là où TOUS les visiteurs la verront : stockage Supabase sur le site en ligne, sinon IndexedDB (mode local). */
export async function storeFile(blob: Blob, hint = 'f'): Promise<string> {
  const { cloudEnabled, uploadMedia } = await import('./cloud')
  return cloudEnabled ? uploadMedia(blob, hint) : saveFile(blob, hint)
}

/** Supprime un fichier rangé par saveFile (sans effet sur les autres URL). */
export async function deleteFile(url?: string | null) {
  if (!url?.startsWith(FILE_PREFIX)) return
  try { await tx('readwrite', (s) => s.delete(decodeURIComponent(url.slice(FILE_PREFIX.length)))) } catch { /* déjà supprimé */ }
}

/** Récupère le contenu d'une URL d'image (fichier rangé, data URL ou URL classique). */
export async function loadBlob(url: string): Promise<Blob> {
  if (url.startsWith(FILE_PREFIX)) {
    const rec = await tx<{ blob: Blob } | undefined>('readonly', (s) => s.get(decodeURIComponent(url.slice(FILE_PREFIX.length))))
    if (rec) return rec.blob
  }
  return (await fetch(url)).blob()
}
