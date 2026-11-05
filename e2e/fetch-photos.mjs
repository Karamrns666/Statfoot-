// Récupère quelques photos libres (Wikimedia Commons) de joueurs sur un terrain avec du monde derrière.
import fs from 'node:fs'
const UA = { 'User-Agent': 'StatFootCI/1.0 (tests de detourage; non publie)' }
const queries = ['amateur football player pitch spectators', 'soccer player standing field crowd', 'youth football match player', 'futsal player court']
fs.mkdirSync('e2e/photos', { recursive: true })
const picked = []
for (const q of queries) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=25&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1400`
  const j = await (await fetch(u, { headers: UA })).json()
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index)
  for (const p of pages) {
    const ii = p.imageinfo?.[0]
    if (!ii || ii.mime !== 'image/jpeg' || ii.width < 900 || picked.some((x) => x.title === p.title)) continue
    picked.push({ title: p.title, url: ii.thumburl ?? ii.url, page: ii.descriptionurl })
    if (picked.filter((x) => x.q === q).length >= 1) break
  }
  picked.at(-1).q = q
}
const out = []
for (const [i, p] of picked.slice(0, 4).entries()) {
  const buf = Buffer.from(await (await fetch(p.url, { headers: UA })).arrayBuffer())
  fs.writeFileSync(`e2e/photos/photo${i + 1}.jpg`, buf)
  out.push({ file: `photo${i + 1}.jpg`, title: p.title, page: p.page })
}
fs.writeFileSync('e2e/photos/sources.json', JSON.stringify(out, null, 1))
console.log(JSON.stringify(out, null, 1))
