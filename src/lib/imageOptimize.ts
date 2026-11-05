// Compression des images à l'upload (navigateur) : redimensionnement + WebP.
// La transparence est conservée (WebP la gère). SVG et GIF animés sont gardés tels quels.

export interface OptimizeOptions { maxWidth?: number; maxHeight?: number; quality?: number; type?: 'image/webp' | 'image/png' | 'image/jpeg' }

export async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) { try { return await createImageBitmap(blob) } catch { /* repli */ } }
  const url = URL.createObjectURL(blob)
  try {
    return await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}

export function canvasToBlob(c: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encodage impossible'))), type, quality))
}

/** Taille cible en respectant le ratio. */
export function fitSize(w: number, h: number, maxW: number, maxH: number) {
  const k = Math.min(1, maxW / w, maxH / h)
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

export async function optimizeImage(file: Blob, o: OptimizeOptions = {}): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  const img = await decodeImage(file)
  const sw = 'naturalWidth' in img ? img.naturalWidth : img.width, sh = 'naturalHeight' in img ? img.naturalHeight : img.height
  const { w, h } = fitSize(sw, sh, o.maxWidth ?? 2000, o.maxHeight ?? 2000)
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  const out = await canvasToBlob(c, o.type ?? 'image/webp', o.quality ?? 0.84)
  // si l'original est déjà plus léger et pas plus grand, on le garde
  return out.size < file.size || w < sw ? out : file
}
