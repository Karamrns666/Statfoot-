// Équivalent local de base44.integrations.Core.UploadFile.
// Les images sont compressées (WebP, 2000 px max) puis rangées dans IndexedDB et servies sous /_files/…
// Dans Base44, l'appel renvoie une vraie URL hébergée.
import { saveFile } from './fileStore'
import { optimizeImage } from '@/lib/imageOptimize'

export const integrations = {
  Core: {
    async UploadFile({ file, maxSize = 2000, hint }: { file: Blob; maxSize?: number; hint?: string }): Promise<{ file_url: string }> {
      let blob: Blob = file
      try { blob = await optimizeImage(file, { maxWidth: maxSize, maxHeight: maxSize }) } catch { /* image non décodable : on garde l'original */ }
      return { file_url: await saveFile(blob, hint) }
    },
  },
}
