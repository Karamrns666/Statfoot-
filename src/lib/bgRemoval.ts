// Détourage automatique des photos joueurs, dans le navigateur, avec @imgly/background-removal.
// La bibliothèque (et son modèle IA, ~80 Mo mis en cache par le navigateur après le 1er usage)
// est chargée à la demande depuis un CDN : rien n'alourdit le site public.
// En cas d'échec (hors ligne, navigateur trop ancien…), l'appelant garde la photo originale.
import { canvasToBlob, decodeImage, fitSize } from './imageOptimize'

const LIB_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm'
type RemoveFn = (image: Blob, config?: { output?: { format?: string; quality?: number }; progress?: (key: string, current: number, total: number) => void }) => Promise<Blob>
let lib: Promise<RemoveFn> | null = null

function loadLib(): Promise<RemoveFn> {
  if (!lib) {
    lib = import(/* @vite-ignore */ LIB_URL).then((m: { removeBackground?: RemoveFn; default?: RemoveFn }) => {
      const fn = m.removeBackground ?? m.default
      if (typeof fn !== 'function') throw new Error('Bibliothèque de détourage indisponible')
      return fn
    })
    lib.catch(() => { lib = null }) // nouvel essai possible plus tard
  }
  return lib
}

export type CutoutProgress = (step: 'chargement' | 'analyse' | 'finition', pct?: number) => void

/** Supprime le fond d'une photo → PNG transparent recadré sur le joueur (marges vides retirées). */
export async function removePhotoBackground(photo: Blob, onProgress?: CutoutProgress, timeoutMs = 180_000): Promise<Blob> {
  onProgress?.('chargement')
  const run = (async () => {
    const remove = await loadLib()
    const out = await remove(photo, {
      output: { format: 'image/png' },
      progress: (key, cur, total) => onProgress?.(key.startsWith('fetch') ? 'chargement' : 'analyse', total ? Math.round((cur / total) * 100) : undefined),
    })
    onProgress?.('finition')
    return trimTransparent(out)
  })()
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Détourage trop long')), timeoutMs))
  return Promise.race([run, timeout])
}

/** Recadre une image transparente sur son contenu (+ petite marge) et limite sa taille à 1000 px de haut. */
export async function trimTransparent(png: Blob, maxH = 1000, margin = 0.02): Promise<Blob> {
  const img = await decodeImage(png)
  const W = 'naturalWidth' in img ? img.naturalWidth : img.width, H = 'naturalHeight' in img ? img.naturalHeight : img.height
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, W, H)
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  if (x1 < 0) throw new Error('Aucun joueur détecté sur la photo')
  const m = Math.round(Math.max(x1 - x0, y1 - y0) * margin)
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const { w, h } = fitSize(cw, ch, maxH, maxH)
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const o = out.getContext('2d')!
  o.imageSmoothingQuality = 'high'
  o.drawImage(c, x0, y0, cw, ch, 0, 0, w, h)
  return canvasToBlob(out, 'image/png')
}
