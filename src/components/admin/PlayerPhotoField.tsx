// Photo joueur dans l'admin (création / modification) :
// import de la photo prise sur le terrain → détourage automatique avec barre de progression →
// avant / après côte à côte + aperçu de la carte joueur finale.
// Boutons : Valider · Relancer le détourage · Utiliser la photo originale (secours) · Importer un PNG détouré.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ImageOff, RefreshCw, Upload } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { saveFile } from '@/api/fileStore'
import { cutoutPlayerPhoto } from '@/api/playerPhotos'
import { trimTransparent } from '@/lib/bgRemoval'
import { useData } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { usePlayerXP } from '@/hooks/useStats'
import { PlayerCard } from '@/components/players/PlayerCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Player } from '@/types/entities'

type Patch = (p: Record<string, unknown>) => void
export const CHECKER = 'repeating-conic-gradient(#ffffff1a 0 25%, transparent 0 50%) 0 0 / 16px 16px'

export function PlayerPhotoField({ value, patch }: { value: Record<string, unknown>; patch: Patch }) {
  const v = value as Partial<Player>
  const photo = v.photo_url, cutout = v.photo_cutout_url
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const busy = !!progress

  const runCutout = async (url: string) => {
    setError(null); setProgress({ pct: 1, label: 'Préparation…' })
    try {
      setWarning(null)
      const res = await cutoutPlayerPhoto(url, (pct, label) => { if (alive.current) setProgress({ pct, label }) }, (w) => alive.current && setWarning(w))
      patch(res)
    } catch (e) {
      patch({ photo_cutout_url: undefined, photo_cutout_status: 'failed', photo_cutout_source: url, photo_cutout_tries: 1 })
      if (alive.current) setError(`Détourage impossible (${(e as Error).message || 'erreur'}). Relancez-le, importez un PNG détouré ou utilisez la photo originale.`)
    } finally { if (alive.current) setProgress(null) }
  }
  const upload = async (f?: File) => {
    if (!f) return
    setError(null); setProgress({ pct: 1, label: 'Compression de la photo…' })
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f, maxSize: 1600, hint: 'photo' })
    patch({ photo_url: file_url, photo_cutout_url: undefined, photo_cutout_status: undefined, photo_cutout_source: undefined, photo_cutout_tries: 0, photo_cutout_disabled: undefined, photo_cutout_validated: undefined, photo_face_x: undefined, photo_face_y: undefined })
    await runCutout(file_url)
  }
  const uploadCutout = async (f?: File) => {
    if (!f) return
    setError(null); setProgress({ pct: 50, label: 'Finition du PNG détouré…' })
    try {
      const url = await saveFile(await trimTransparent(f), 'cutout')
      patch({ photo_cutout_url: url, photo_cutout_status: 'ok', photo_cutout_source: photo, photo_cutout_tries: 0, photo_cutout_disabled: undefined, photo_cutout_validated: true })
    } catch (e) { setError(`Image refusée : ${(e as Error).message}`) } finally { setProgress(null) }
  }
  const useOriginal = () => patch({ photo_cutout_url: undefined, photo_cutout_status: undefined, photo_cutout_disabled: true, photo_cutout_validated: true })
  const validate = () => patch({ photo_cutout_validated: true })

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_minmax(0,170px)]">
        <Figure label="Avant — photo originale" sub="avatars ronds, équipe type">
          {photo ? <img src={photo} alt="Photo originale" className="size-full object-cover" /> : <Empty>Aucune photo</Empty>}
        </Figure>
        <Figure label="Après — joueur détouré" sub={v.photo_cutout_disabled ? 'photo originale choisie' : 'fond transparent'} checker>
          {cutout ? <img src={cutout} alt="Joueur détouré" className="max-h-full max-w-full object-contain object-bottom" />
            : <Empty>{v.photo_cutout_disabled ? 'La carte utilise la photo originale' : v.photo_cutout_status === 'failed' ? 'Échec du détourage' : photo ? 'En attente du détourage' : '—'}</Empty>}
          {progress && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night-950/80 px-4 text-center text-xs" role="status">
              <span>{progress.label}</span>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label="Avancement du détourage">
                <div className="h-full rounded-full bg-neon transition-[width] duration-300" style={{ width: `${progress.pct}%` }} />
              </div>
              <span className="num text-base">{progress.pct} %</span>
            </div>
          )}
        </Figure>
        <CardPreview v={v} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 text-xs font-semibold hover:bg-white/5', busy && 'pointer-events-none opacity-50')}>
          <Upload className="size-4" />{photo ? 'Changer la photo' : 'Importer une photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {photo && cutout && !v.photo_cutout_validated && <Button type="button" size="sm" className="h-8" disabled={busy} onClick={validate}><Check />Valider</Button>}
        {photo && cutout && v.photo_cutout_validated && <span className="inline-flex items-center gap-1 text-xs font-semibold text-win"><Check className="size-4" />Détourage validé</span>}
        {photo && <Button type="button" size="sm" variant="outline" className="h-8" disabled={busy} onClick={() => runCutout(photo)}><RefreshCw />Relancer le détourage</Button>}
        {photo && !v.photo_cutout_disabled && <Button type="button" size="sm" variant="ghost" className="h-8" disabled={busy} onClick={useOriginal}><ImageOff />Utiliser la photo originale</Button>}
        <label className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:bg-white/5 hover:text-white', busy && 'pointer-events-none opacity-50')} title="PNG ou WebP déjà détouré (fond transparent), préparé dans un autre outil">
          <Upload className="size-3.5" />Importer un PNG détouré
          <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => { void uploadCutout(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {error && <p className="text-xs text-amber-300" role="alert">{error}</p>}
      {warning && !error && <p className="text-xs text-amber-200/90" role="note">⚠ {warning}</p>}
      <p className="text-[11px] leading-snug text-muted-foreground">Le fond est supprimé dans votre navigateur (la photo n’est envoyée à aucun service extérieur) : seul le joueur au premier plan est gardé, cadré en buste, bords lissés, fond transparent. Le tout premier détourage télécharge le modèle (~80 Mo, une seule fois) ; les suivants prennent quelques secondes.</p>
    </div>
  )
}

function Figure({ label, sub, checker, children }: { label: string; sub: string; checker?: boolean; children: ReactNode }) {
  return (
    <figure className="min-w-0 rounded-xl border border-white/10 bg-night-950/40 p-2 text-center">
      <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-lg bg-white/5" style={checker ? { background: CHECKER } : undefined}>{children}</div>
      <figcaption className="mt-1 text-[11px] font-semibold">{label}</figcaption>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </figure>
  )
}
const Empty = ({ children }: { children: ReactNode }) => <span className="m-auto px-2 text-xs text-muted-foreground">{children}</span>

/** Aperçu de la carte joueur finale avec les valeurs du formulaire (et l'XP réel si le joueur existe). */
function CardPreview({ v }: { v: Partial<Player> }) {
  const { db } = useData()
  const { seasonId } = useAdminScope()
  const xp = usePlayerXP({ seasonId }).get(v.id ?? '')
  const team = db.Team.find((t) => t.id === v.team_id)
  return (
    <figure className="min-w-0 text-center">
      <PlayerCard className="pointer-events-none mx-auto max-w-[170px]" firstName={v.first_name || 'Prénom'} lastName={v.last_name || 'Nom'} position={v.position} captain={v.is_captain} team={team}
        photoUrl={v.photo_url} cutoutUrl={v.photo_cutout_disabled ? undefined : v.photo_cutout_url} faceX={v.photo_face_x} faceY={v.photo_face_y}
        rating={xp?.xp ?? 0} ratingLabel="XP" front={[{ label: 'MJ', value: xp?.matches ?? 0 }, { label: 'BUT', value: xp?.goals ?? 0 }, { label: 'PAS', value: xp?.assists ?? 0 }, { label: 'CJ', value: xp?.yellow ?? 0 }]}
        backTitle="Aperçu" back={[]} />
      <figcaption className="mt-1 text-[11px] font-semibold">Aperçu de la carte</figcaption>
    </figure>
  )
}
