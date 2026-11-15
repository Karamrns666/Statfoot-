// /api/snapshot — toutes les données PUBLIQUES de la ligue en une seule réponse, compressée et mise en cache 10 s par
// le réseau Vercel. Premier chargement des visiteurs : 1 requête proche d'eux au lieu de plusieurs appels à Supabase.
// Lecture avec la clé publique (anon) : la sécurité Supabase (RLS) exclut d'office tout ce qui est privé.
// Les nouveautés arrivent ensuite par le rafraîchissement habituel (toutes les 4 s, depuis la date la plus récente).
export default async function handler(req, res) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!url || !anon) { res.status(503).json({ error: 'snapshot indisponible' }); return }
  const q = (offset) => `${url}/rest/v1/entity_rows?select=entity,id,data,deleted,updated_at&deleted=is.false&order=updated_at.asc,entity.asc,id.asc&limit=1000&offset=${offset}`
  const get = async (offset) => {
    const r = await fetch(q(offset), { headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
    if (!r.ok) throw new Error(`Supabase ${r.status}`)
    return r.json()
  }
  try {
    const rows = []
    for (let offset = 0, more = true; more; offset += 4000) {
      const pages = await Promise.all([0, 1, 2, 3].map((k) => get(offset + k * 1000)))
      for (const p of pages) { rows.push(...p); if (p.length < 1000) { more = false; break } }
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=60')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).send(JSON.stringify(rows))
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    res.status(502).json({ error: String(e?.message || e) })
  }
}
