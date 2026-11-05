// Photo joueur dans l'admin : import de l'originale → détourage automatique (fond supprimé) →
// aperçu côte à côte. L'admin peut relancer le détourage, importer son propre PNG détouré
// ou revenir à la photo originale. En cas d'échec, l'originale reste utilisée partout.
import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw, Scissors, Upload, Undo2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { loadBlob, saveFile } from '@/api/fileStore'
import { removePhotoBackground, trimTransparent } from '@/lib/bgRemoval'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Patch = (p: Record<string, unknown>) => void
const STEP: Record<string, string> = { chargement: 'Chargement de l’outil de détourage…', analyse: 'Suppression du fond…', finition: 'Recadrage…' }

/** Détoure une photo enregistrée et renvoie l'URL du PNG (lève une erreur si impossible). */
export async function cutoutFromUrl(url: string, onStep?: (s: string, pct?: number) => void) {
  const png = await removePhotoBackground(await loadBlob(url), (s, pct) => onStep?.(s, pct))
  return saveFile(png, 'cutout')
}

export const CHECKER = 'repeating-conic-gradient(#ffffff14 0 25%, transparent 0 50%) 0 0 / 14px 14px'

export function PlayerPhotoField({ value, patch }: { value: Record<string, unknown>; patch: Patch }) {
  const photo = value.photo_url as string | undefined
  const cutout = value.photo_cutout_url as string | undefined
  const status = value.photo_cutout_status as 'ok' | 'failed' | undefined
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(patch)
  useEffect(() => { latest.current = patch })
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const runCutout = async (url: string) => {
    setError(null); setBusy(STEP.chargement)
    try {
      const out = await cutoutFromUrl(url, (s, pct) => alive.current && setBusy(`${STEP[s] ?? s}${pct != null && s === 'chargement' ? ` ${pct} %` : ''}`))
      latest.current({ photo_cutout_url: out, photo_cutout_status: 'ok' })
    } catch (e) {
      latest.current({ photo_cutout_status: 'failed' })
      if (alive.current) setError(`Détourage impossible (${(e as Error).message || 'erreur'}) — la photo originale sera utilisée.`)
    } finally { if (alive.current) setBusy(null) }
  }
  const upload = async (f?: File) => {
    if (!f) return
    setBusy('Compression de la photo…')
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f, maxSize: 1600, hint: 'photo' })
    latest.current({ photo_url: file_url, photo_cutout_url: undefined, photo_cutout_status: undefined })
    await runCutout(file_url)
  }
  const uploadCutout = async (f?: File) => {
    if (!f) return
    setBusy('Import du PNG détouré…'); setError(null)
    try {
      const png = await trimTransparent(f)
      const url = await saveFile(png, 'cutout')
      latest.current({ photo_cutout_url: url, photo_cutout_status: 'ok' })
    } catch (e) { setError(`PNG refusé : ${(e as Error).message}`) } finally { setBusy(null) }
  }
  // (les anciens fichiers ne sont pas supprimés : le formulaire peut encore être annulé)
  const useOriginal = () => patch({ photo_cutout_url: undefined, photo_cutout_status: undefined })

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <figure className="rounded-xl border border-white/10 bg-night-950/40 p-2 text-center">
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-white/5">
            {photo ? <img src={photo} alt="Photo originale" className="size-full object-cover" /> : <span className="text-xs text-muted-foreground">Aucune photo</span>}
          </div>
          <figcaption className="mt-1 text-[11px] text-muted-foreground">Originale (avatars ronds, équipe type)</figcaption>
        </figure>
        <figure className="rounded-xl border border-white/10 bg-night-950/40 p-2 text-center">
          <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-lg" style={{ background: CHECKER }}>
            {cutout ? <img src={cutout} alt="Photo détourée" className="max-h-full max-w-full object-contain" /> : <span className="m-auto px-2 text-xs text-muted-foreground">{status === 'failed' ? 'Échec du détourage' : 'Pas encore détourée'}</span>}
            {busy && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night-950/75 px-3 text-xs"><Loader2 className="size-6 animate-spin text-neon" />{busy}</div>}
          </div>
          <figcaption className="mt-1 text-[11px] text-muted-foreground">Détourée (carte joueur)</figcaption>
        </figure>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-neon px-3 text-xs font-bold text-white hover:bg-neon/90', busy && 'pointer-events-none opacity-60')}>
          <Upload className="size-4" />{photo ? 'Changer la photo' : 'Importer une photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {photo && <Button type="button" size="sm" variant="outline" className="h-8" disabled={!!busy} onClick={() => runCutout(photo)}>{cutout ? <RefreshCw /> : <Scissors />}{cutout ? 'Relancer le détourage' : 'Détourer'}</Button>}
        <label className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 text-xs hover:bg-white/5', busy && 'pointer-events-none opacity-60')} title="PNG avec fond transparent, préparé dans un autre outil">
          <Upload className="size-4" />Importer un PNG détouré
          <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => { void uploadCutout(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {cutout && <Button type="button" size="sm" variant="ghost" className="h-8" disabled={!!busy} onClick={useOriginal}><Undo2 />Utiliser l’originale</Button>}
      </div>
      {error && <p className="text-xs text-amber-300">{error}</p>}
      <p className="text-[11px] text-muted-foreground">Le fond est supprimé automatiquement dans votre navigateur (aucune photo n’est envoyée à un service extérieur). Le premier détourage télécharge l’outil (~80 Mo), les suivants sont rapides.</p>
    </div>
  )
}
