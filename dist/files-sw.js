// Service worker des fichiers importés (photos, posters, logos) : les images sont rangées dans IndexedDB
// et servies sous /_files/<id>.<ext>, comme de vraies URL — utilisables partout dans <img>.
// (Avec Base44, l'upload renvoie une URL hébergée et ce mécanisme n'est plus utilisé.)
const DB = 'statfoot-files', STORE = 'files'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function get(id) {
  const db = await open()
  return new Promise((res, rej) => {
    const q = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/_files/')) return
  const id = decodeURIComponent(url.pathname.slice('/_files/'.length))
  e.respondWith(get(id).then((rec) => rec
    ? new Response(rec.blob, { headers: { 'content-type': rec.type || rec.blob.type || 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable' } })
    : new Response('Fichier introuvable', { status: 404 })).catch(() => new Response('Erreur', { status: 500 })))
})
