import { assertWritable } from '@/sim/simMode'
// Équivalent de base44.integrations.Core.UploadFile.
// Les images sont compressées (WebP, 2000 px max) puis :
//  · site en ligne (Supabase) : envoyées dans le stockage partagé → URL publique visible par tous ;
//  · mode local (sans Supabase) : rangées dans IndexedDB et servies sous /_files/… (ce navigateur uniquement).
import { storeFile } from './fileStore'
import { optimizeImage } from '@/lib/imageOptimize'

export const integrations = {
  Core: {
    async UploadFile({ file, maxSize = 2000, hint }: { file: Blob; maxSize?: number; hint?: string }): Promise<{ file_url: string }> {
      assertWritable() // mode simulation : aucun fichier stocké
      let blob: Blob = file
      try { blob = await optimizeImage(file, { maxWidth: maxSize, maxHeight: maxSize }) } catch { /* image non décodable : on garde l'original */ }
      return { file_url: await storeFile(blob, hint) }
    },
  },
}
