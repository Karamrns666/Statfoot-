// Ajout de plusieurs photos d'un coup (glisser-déposer ou sélection) : chaque photo est réduite dans le navigateur
// (1920 px max, WebP) avec une miniature légère (480 px) pour que la galerie publique reste fluide.
import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { storeFile } from '@/api/fileStore'
import { optimizeImage } from '@/lib/imageOptimize'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const MAX_FILES = 60
const MAX_INPUT = 30 * 1024 * 1024 // 30 Mo par photo d'origine

type Item = { name: string; state: 'wait' | 'run' | 'ok' | 'err'; size?: number }

export function MediaDropzone({ seasonId, round }: { seasonId?: string; round?: number }) {
  const [over, setOver] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const run = async (list: File[]) => {
    const files = list.filter((f) => f.type.startsWith('image/') && f.size <= MAX_INPUT).slice(0, MAX_FILES)
    const skipped = list.length - files.length
    if (!files.length) { toast.error('Aucune photo valide (JPG, PNG, WebP, HEIC non pris en charge, 30 Mo max)'); return }
    if (skipped) toast.error(`${skipped} fichier(s) ignoré(s) (pas une image, trop lourd ou plus de ${MAX_FILES})`)
    setBusy(true)
    setItems(files.map((f) => ({ name: f.name, state: 'wait' })))
    const set = (i: number, p: Partial<Item>) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, ...p } : x)))
    let ok = 0, next = 0
    const worker = async () => {
      while (next < files.length) {
        const i = next++, f = files[i]
        set(i, { state: 'run' })
        try {
          const full = await optimizeImage(f, { maxWidth: 1920, maxHeight: 1920, quality: 0.8 })
          const thumb = await optimizeImage(f, { maxWidth: 480, maxHeight: 480, quality: 0.72 })
          const [url, thumbnail_url] = await Promise.all([storeFile(full, 'media'), storeFile(thumb, 'media-mini')])
          await base44.entities.Media.create({ title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 80), type: 'photo', url, thumbnail_url, source: 'upload', season_id: seasonId, round, published: true } as never)
          set(i, { state: 'ok', size: full.size }); ok++
        } catch { set(i, { state: 'err' }) }
      }
    }
    await Promise.all([worker(), worker()]) // 2 envois à la fois : rapide sans saturer le téléphone
    setBusy(false)
    if (ok) toast.success(`${ok} photo(s) ajoutée(s) à la médiathèque`)
    if (ok < files.length) toast.error(`${files.length - ok} photo(s) en échec : réessayez`)
  }

  const done = items.filter((x) => x.state === 'ok').length
  return (
    <div className="mb-4">
      <div
        role="button" tabIndex={0}
        onClick={() => !busy && input.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) input.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) run([...e.dataTransfer.files]) }}
        className={cn('flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition',
          over ? 'border-neon bg-neon/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5', busy && 'cursor-wait opacity-80')}>
        {busy ? <Loader2 className="size-7 animate-spin text-neon" /> : <ImagePlus className="size-7 text-neon" />}
        <div className="font-semibold">{busy ? `Envoi en cours… ${done} / ${items.length}` : 'Glissez vos photos ici ou touchez pour les choisir'}</div>
        <div className="text-xs text-muted-foreground">Plusieurs photos à la fois (60 max). Elles sont réduites automatiquement (1920 px, miniature 480 px) et publiées dans la saison en cours.</div>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { run([...(e.target.files ?? [])]); e.target.value = '' }} />
      </div>
      {items.length > 0 && (
        <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
          {items.map((x, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
              <span className="truncate">{x.name}</span>
              <span className={cn('shrink-0', x.state === 'ok' && 'text-emerald-300', x.state === 'err' && 'text-red-300')}>
                {x.state === 'wait' ? 'en attente' : x.state === 'run' ? 'réduction…' : x.state === 'ok' ? `ok · ${Math.round((x.size ?? 0) / 1024)} Ko` : 'échec'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
