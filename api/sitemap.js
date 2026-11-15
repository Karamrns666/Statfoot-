// /sitemap.xml — pages publiques uniquement (jamais l'admin ni la simulation), avec les fiches équipes, joueurs et matchs.
import { config, sb } from './_lib/supabaseAdmin.js'

const SITE = 'https://www.ardentia-foot.com'
const STATIC = ['/', '/matchs', '/classement', '/equipes', '/joueurs', '/statistiques', '/trophees', '/pre-saison', '/equipe-type', '/match-des-capitaines', '/badges', '/glossaire', '/media', '/historique', '/reglement', '/discipline']

export default async function handler(req, res) {
  const urls = STATIC.map((p) => ({ loc: p, pri: p === '/' ? '1.0' : '0.8' }))
  try {
    const cfg = config()
    const rows = []
    for (let o = 0; ; o += 1000) {
      const r = await sb(cfg, `/rest/v1/entity_rows?select=entity,id,data&deleted=is.false&entity=in.(Season,Team,Player,Match)&order=entity,id&limit=1000&offset=${o}`)
      rows.push(...r); if (r.length < 1000) break
    }
    const sim = (d) => d && (d.simulation_id || d.simulationId || d.is_simulation)
    const visible = new Set(rows.filter((r) => r.entity === 'Season' && !r.data?.hidden && !sim(r.data)).map((r) => r.id))
    const inSeason = (d) => (d.season_id ? visible.has(d.season_id) : (d.season_ids ?? []).some((s) => visible.has(s)))
    for (const r of rows) {
      if (sim(r.data) || !inSeason(r.data ?? {})) continue
      if (r.entity === 'Team') urls.push({ loc: `/equipes/${encodeURIComponent(r.id)}`, pri: '0.6', mod: r.data.updated_date })
      if (r.entity === 'Player') urls.push({ loc: `/joueurs/${encodeURIComponent(r.id)}`, pri: '0.5', mod: r.data.updated_date })
      if (r.entity === 'Match') urls.push({ loc: `/matchs/${encodeURIComponent(r.id)}`, pri: '0.6', mod: r.data.updated_date })
    }
  } catch { /* base indisponible : pages principales seulement */ }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc>${u.mod ? `<lastmod>${String(u.mod).slice(0, 10)}</lastmod>` : ''}<priority>${u.pri}</priority></url>`).join('\n')}\n</urlset>\n`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
