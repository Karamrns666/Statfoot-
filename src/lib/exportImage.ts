// Export PNG fiable d'un bloc HTML (cartes joueur / équipe, visuels 1080 × 1350) sur tous les navigateurs.
// 1. animations / transitions coupées pendant la capture (html-to-image les rejoue sinon à l'image 0 : photo invisible) ;
// 2. polices et photos préparées attendues ;
// 3. chaque <img> convertie en data: URL (via /api/img, même domaine, si le stockage ne l'autorise pas en direct) puis décodée ;
// 4. Safari (WebKit) : 2e rendu complet, le 1er peut sortir sans les images.
import { toBlob } from 'html-to-image'

const isWebKit = () => typeof navigator !== 'undefined' && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent)
const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b) })

/** URL du même domaine pour une image du stockage (évite tout blocage CORS au moment de l'export) */
export function sameOriginImage(url: string): string {
  if (!/^https?:/.test(url) || url.startsWith(location.origin)) return url
  if (url.includes('/storage/v1/object/public/')) return `/api/img?u=${encodeURIComponent(url)}`
  return url
}

/** SVG → PNG data URL, 1200 px de large (net dans un visuel 1080 px) */
async function svgToPng(b: Blob, width = 1200): Promise<string | null> {
  const url = URL.createObjectURL(b.type.includes('svg') ? b : new Blob([b], { type: 'image/svg+xml' }))
  try {
    const img = new Image(); img.decoding = 'async'; img.src = url
    await img.decode()
    const r = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 0.25
    const c = document.createElement('canvas'); c.width = width; c.height = Math.max(1, Math.round(width * r))
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/png')
  } catch { return null } finally { URL.revokeObjectURL(url) }
}

const dataCache = new Map<string, Promise<string | null>>()
/** Image → data: URL (directe, sinon via le proxy du site) ; null si impossible */
export function imageDataUrl(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return Promise.resolve(url)
  if (!dataCache.has(url)) {
    dataCache.set(url, (async () => {
      for (const u of [url, sameOriginImage(url)]) {
        try {
          const r = await fetch(u, { mode: 'cors', credentials: 'omit' })
          if (!r.ok) continue
          const b = await r.blob()
          // logo vectoriel : converti en PNG haute définition (Safari dessine mal un SVG imbriqué dans l'export)
          if (b.type.includes('svg') || /\.svg(\?|$)/.test(u)) { const png = await svgToPng(b); if (png) return png }
          return await blobToDataUrl(b)
        } catch { /* essai suivant */ }
      }
      return null
    })())
  }
  return dataCache.get(url)!
}

const waitFor = async (ok: () => boolean, ms: number) => { const t = Date.now(); while (!ok() && Date.now() - t < ms) await new Promise((r) => setTimeout(r, 80)) }

export async function exportNodeBlob(node: HTMLElement, opts: { width: number; height: number; fontEmbedCSS?: string; pixelRatio?: number }): Promise<Blob> {
  node.setAttribute('data-exporting', '')
  try {
    await document.fonts?.ready
    // photo du joueur en cours de préparation (fondu, détourage) : on l'attend
    await waitFor(() => !node.querySelector('[data-photo-state="loading"]'), 8000)
    const imgs = [...node.querySelectorAll('img')]
    await Promise.all(imgs.map(async (img) => {
      const src = img.currentSrc || img.src
      if (src && !src.startsWith('data:')) { const d = await imageDataUrl(src); if (d) { img.removeAttribute('srcset'); img.src = d } }
      img.loading = 'eager'
      try { await img.decode() } catch { /* image vide : ignorée */ }
    }))
    const o = { width: opts.width, height: opts.height, pixelRatio: opts.pixelRatio ?? 1, cacheBust: false, fontEmbedCSS: opts.fontEmbedCSS }
    let blob = await toBlob(node, o)
    if (isWebKit()) blob = (await toBlob(node, o)) ?? blob
    if (!blob) throw new Error('Image impossible à générer')
    return blob
  } finally { node.removeAttribute('data-exporting') }
}

export async function exportNodePng(node: HTMLElement, opts: { width: number; height: number; fontEmbedCSS?: string; pixelRatio?: number }): Promise<string> {
  return blobToDataUrl(await exportNodeBlob(node, opts))
}
