// Contrôle des logos d'équipes sur une page déjà chargée (utilisé par logos.spec.mjs et par la vérification en ligne).
// Renvoie la liste des problèmes :
//  • chevauchement : un logo d'équipe recouvre un texte ou un badge (rectangles des glyphes, pas des boîtes entières) ;
//  • tailles : deux logos d'une même liste (tbody / ol / ul / grille de cartes) n'ont pas la même taille ;
//  • alignement : les noms d'équipes d'une même liste ne commencent pas au même x ;
//  • coupé : un nom d'équipe coupé par « … » ;
//  • image : logo absent, déformé (pas object-fit: contain) ou affiché plus grand que sa résolution (flou).

/** Fait défiler toute la page (chargement des images « lazy »), puis revient en haut. */
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, innerHeight * 0.8)
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(600)
}

export async function checkLogos(page) {
  return page.evaluate(() => {
    const issues = []
    const visible = (el) => {
      if (el.closest('.sr-only,[hidden],[inert]')) return false
      if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
      const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1
    }
    // rectangle réellement visible : coupé par les conteneurs défilants / masqués (carrousels, tableaux à défilement)
    const clipRect = (el, r) => {
      let out = { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a)
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
        const c = a.getBoundingClientRect()
        out = { left: Math.max(out.left, c.left), right: Math.min(out.right, c.right), top: Math.max(out.top, c.top), bottom: Math.min(out.bottom, c.bottom) }
      }
      return out
    }
    const label = (el) => el.getAttribute('aria-label') || el.dataset.teamLogo || '?'
    // tuile actuelle (data-team-logo) ; ancienne version du site : span role="img" contenant l'image du logo
    const logos = [...document.querySelectorAll('[data-team-logo], span[role="img"][aria-label]:has(> img)')].filter(visible)
    // 1. chevauchement logo ↔ texte / badge (glyphes réels via Range)
    const texts = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue
      const el = n.parentElement
      if (!el || !visible(el) || el.closest('[data-team-logo], span[role="img"]') || el.closest('[aria-hidden="true"]')) continue
      const rg = document.createRange(); rg.selectNodeContents(n)
      for (const r0 of rg.getClientRects()) { const r = clipRect(el, r0); if (r.right - r.left > 1 && r.bottom - r.top > 1) texts.push({ r, t: n.textContent.trim().slice(0, 30), el }) }
    }
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    for (const lg of logos) {
      const lr = clipRect(lg, lg.getBoundingClientRect())
      if (lr.right - lr.left < 4 || lr.bottom - lr.top < 4) continue
      const inner = { left: lr.left + 2, right: lr.right - 2, top: lr.top + 2, bottom: lr.bottom - 2 }
      for (const tx of texts) {
        // texte réellement visible à cet endroit (pas un texte d'un autre plan masqué par un fond opaque)
        if (inter(inner, tx.r) < 6) continue
        issues.push(`chevauchement : logo « ${label(lg)} » sur le texte « ${tx.t} »`)
        break
      }
    }
    // 2-3. même taille et noms alignés dans une même liste
    const groups = new Map()
    for (const lg of logos) {
      const list = lg.closest('tbody, ol, ul, [data-logo-list]')
      if (!list) continue
      if (!groups.has(list)) groups.set(list, [])
      groups.get(list).push(lg)
    }
    for (const [list, lgs] of groups) {
      if (lgs.length < 2) continue
      const sizes = new Set(lgs.map((l) => Math.round(l.getBoundingClientRect().width) + 'x' + Math.round(l.getBoundingClientRect().height)))
      if (sizes.size > 1) issues.push(`tailles différentes dans une liste (${[...sizes].join(', ')}) : ${lgs.slice(0, 3).map(label).join(', ')}…`)
      // noms : un par ligne (tr / li) — x de départ identiques
      const rows = [...new Set(lgs.map((l) => l.closest('tr, li')).filter(Boolean))]
      const xs = rows.map((row) => row.querySelector('[data-team-name]')).filter((n) => n && visible(n)).map((n) => Math.round(n.getBoundingClientRect().left))
      if (xs.length > 1 && Math.max(...xs) - Math.min(...xs) > 1) issues.push(`noms non alignés dans une liste (x de ${Math.min(...xs)} à ${Math.max(...xs)} px) : ${list.tagName.toLowerCase()}`)
    }
    // 4. noms d'équipes coupés par « … »
    const names = new Set(logos.map((l) => l.getAttribute('aria-label')).filter(Boolean))
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length || !visible(el)) continue
      const cs = getComputedStyle(el)
      const txt = (el.textContent || '').trim()
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && names.has(txt)) issues.push(`nom coupé par « … » : ${txt}`)
    }
    // 5. image du logo
    for (const lg of logos) {
      const img = lg.querySelector('img')
      if (!img) { issues.push(`logo sans image : ${label(lg)}`); continue }
      if (!img.complete) continue
      if (!img.naturalWidth) { issues.push(`image de logo absente : ${label(lg)} (${img.currentSrc.slice(0, 80)})`); continue }
      if (getComputedStyle(img).objectFit !== 'contain') issues.push(`logo déformé (object-fit ≠ contain) : ${label(lg)}`)
      const b = img.getBoundingClientRect(), ratio = img.naturalWidth / img.naturalHeight
      const shownW = Math.min(b.width, b.height * ratio)
      const svg = /\.svg(\?|#|$)/i.test(img.currentSrc) || img.currentSrc.startsWith('data:image/svg')
      if (!svg && img.naturalWidth + 1 < shownW) issues.push(`logo flou (${img.naturalWidth} px affichés sur ${Math.round(shownW)} px) : ${label(lg)}`)
    }
    return [...new Set(issues)]
  })
}
