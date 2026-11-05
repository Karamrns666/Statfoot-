// Détourage automatique des photos joueurs, dans le navigateur, avec @imgly/background-removal.
// La bibliothèque est intégrée au site mais chargée seulement quand un détourage est nécessaire (admin) ;
// son modèle IA (~80 Mo) est téléchargé une fois puis gardé en cache par le navigateur.
// La photo ne quitte jamais le navigateur.
import { canvasToBlob, decodeImage, fitSize } from './imageOptimize'
import { bustCrop, keepMainSubject, refineEdges, rowsExtent, subjectBox } from './matte'

type RemoveFn = (image: Blob, config?: { output?: { format?: string; quality?: number }; progress?: (key: string, current: number, total: number) => void }) => Promise<Blob>
let lib: Promise<RemoveFn> | null = null

function loadLib(): Promise<RemoveFn> {
  if (!lib) {
    lib = import('@imgly/background-removal').then((m) => {
      const fn = (m.removeBackground ?? m.default) as unknown as RemoveFn
      if (typeof fn !== 'function') throw new Error('Bibliothèque de détourage indisponible')
      return fn
    })
    lib.catch(() => { lib = null }) // nouvel essai possible plus tard
  }
  return lib
}

/** Avancement global en % (chargement du modèle puis analyse), avec une étiquette lisible. */
export type CutoutProgress = (pct: number, label: string) => void

export interface CutoutResult {
  blob: Blob
  /** centre du visage dans la photo originale, en % (sert au recadrage des avatars ronds) */
  face: { x: number; y: number }
  /** personnes / objets d'arrière-plan effacés (pixels) */
  removed: number
  /** conseil si la photo se prête mal à une carte (joueur trop petit, trop loin…) */
  warning?: string
}

/** Supprime le fond, ne garde que le joueur, cadre en buste et produit un WebP transparent de 800 px de haut. */
export async function removePhotoBackground(photo: Blob, onProgress?: CutoutProgress, timeoutMs = 240_000): Promise<CutoutResult> {
  onProgress?.(2, 'Chargement de l’outil de détourage…')
  const run = (async () => {
    const remove = await loadLib()
    const seen = new Map<string, number>()
    const out = await remove(photo, {
      output: { format: 'image/png' },
      progress: (key, cur, total) => {
        if (!total) return
        seen.set(key, cur / total)
        if (key.startsWith('fetch')) {
          const avg = [...seen].filter(([k]) => k.startsWith('fetch')).reduce((a, [, v]) => a + v, 0) / Math.max(1, [...seen.keys()].filter((k) => k.startsWith('fetch')).length)
          onProgress?.(Math.round(2 + avg * 68), 'Chargement du modèle (une seule fois)…')
        } else onProgress?.(Math.round(70 + (cur / total) * 22), 'Suppression du fond…')
      },
    })
    onProgress?.(93, 'Finitions : bords, cadrage…')
    const res = await refineCutout(out)
    onProgress?.(100, 'Terminé')
    return res
  })()
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Détourage trop long')), timeoutMs))
  return Promise.race([run, timeout])
}

/**
 * Post-traitement : seul le joueur au premier plan, bords lissés sans halo, cadrage buste / mi-corps
 * (tête en haut, centré), 800 px de haut, WebP avec transparence (PNG si le navigateur ne sait pas encoder le WebP).
 */
export async function refineCutout(png: Blob, targetH = 800): Promise<CutoutResult> {
  const img = await decodeImage(png)
  const W = 'naturalWidth' in img ? img.naturalWidth : img.width, H = 'naturalHeight' in img ? img.naturalHeight : img.height
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const px = ctx.getImageData(0, 0, W, H)
  const { removed } = keepMainSubject(px)
  refineEdges(px)
  const subj = subjectBox(px)
  if (!subj) throw new Error('Aucun joueur détecté sur la photo')
  ctx.putImageData(px, 0, 0)
  const crop = bustCrop(subj.box, subj.head.x, H, (y0, y1) => rowsExtent(px, y0, y1))
  const sh = subj.box.y1 - subj.box.y0 + 1
  const warning = sh < H * 0.35 || crop.h < 360
    ? 'Le joueur est petit sur cette photo (pris de loin) : la carte sera moins nette. Idéal : joueur seul, cadré en pied ou en buste, de face.'
    : undefined
  const { w, h } = fitSize(crop.w, crop.h, Math.round(targetH * 0.8 * 2), targetH)
  const k = w / crop.w
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const o = out.getContext('2d')!
  o.imageSmoothingQuality = 'high'
  // partie de la zone de cadrage qui est dans l'image (le reste reste transparent)
  const sx = Math.max(0, crop.x), sy = Math.max(0, crop.y), ex = Math.min(W, crop.x + crop.w), ey = Math.min(H, crop.y + crop.h)
  if (ex > sx && ey > sy) o.drawImage(c, sx, sy, ex - sx, ey - sy, (sx - crop.x) * k, (sy - crop.y) * k, (ex - sx) * k, (ey - sy) * k)
  let blob = await canvasToBlob(out, 'image/webp', 0.9)
  if (blob.type !== 'image/webp') blob = await canvasToBlob(out, 'image/png')
  return { blob, face: { x: Math.round((subj.head.x / W) * 1000) / 10, y: Math.round((subj.head.y / H) * 1000) / 10 }, removed, warning }
}

/** PNG / WebP déjà détouré fourni par l'admin : même finition (cadrage, taille, format). */
export async function trimTransparent(file: Blob): Promise<Blob> {
  return (await refineCutout(file)).blob
}
