// /api/img?u=<url> : sert une image du stockage Supabase du site depuis le MÊME domaine (ardentia-foot.com), pour que
// l'export PNG des cartes et visuels (canvas / html-to-image) puisse l'intégrer sur tous les navigateurs, Safari compris.
// Limité aux fichiers publics du stockage du projet : ce n'est pas un proxy ouvert.
const MAX = 15 * 1024 * 1024

export default async function handler(req, res) {
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const u = String(req.query?.u || '')
  if (!base || !u.startsWith(`${base}/storage/v1/object/public/`) || u.includes('..')) { res.status(400).send('URL non autorisée'); return }
  try {
    const r = await fetch(u)
    if (!r.ok) { res.status(r.status).send('Image introuvable'); return }
    const type = r.headers.get('content-type') || 'application/octet-stream'
    if (!type.startsWith('image/')) { res.status(415).send('Pas une image'); return }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > MAX) { res.status(413).send('Image trop lourde'); return }
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.status(200).send(buf)
  } catch { res.status(502).send('Stockage indisponible') }
}
