// Photo joueur dans l'admin (création et modification) :
//  import de la photo prise au bord du terrain → détourage automatique (barre de progression) →
//  avant / après côte à côte + aperçu de la carte finale → « Valider », « Relancer le détourage »,
//  « Utiliser la photo originale » (secours), ou import d'un PNG déjà détouré.
//  Les deux fichiers sont gardés : photo_url (originale) et photo_cutout_url (détourée).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ImageOff, Loader2, RefreshCw, Upload } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { usePlayerXP } from '@/hooks/useStats'
import { cutoutFromFile, cutoutFromUrl, releaseCutoutLock, takeCutoutLock } from '@/lib/playerCutout'
import { useTeamSeniority } from '@/hooks/useSeniority'
import { PlayerCard } from '@/components/players/PlayerCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Player } from '@/types/entities'

type Patch = (p: Record<string, unknown>) => void
export const CHECKER = 'repeating-conic-gradient(#ffffff14 0 25%, transparent 0 50%) 0 0 / 14px 14px'
export { cutoutFromUrl }

export function PlayerPhotoField({ value, patch }: { value: Record<string, unknown>; patch: Patch }) {
  const v = value as Partial<Player>
  const photo = v.photo_url, cutout = v.photo_cutout_url
  const mode = v.photo_card_mode ?? 'cutout'
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const owner = useRef(`form-${Math.random().toString(36).slice(2)}`)

  const runCutout = async (url: string) => {
    setError(null); setValidated(false); setProgress({ pct: 1, label: 'Préparation…' })
    takeCutoutLock(owner.current, 300_000)
    try {
      const out = await cutoutFromUrl(url, (pct, label) => alive.current && setProgress({ pct, label }))
      patch({ photo_cutout_url: out, photo_cutout_status: 'ok', photo_cutout_source: url, photo_cutout_tries: 0, photo_card_mode: 'cutout' })
    } catch (e) {
      patch({ photo_cutout_status: 'failed', photo_cutout_source: url, photo_cutout_tries: 1 })
      if (alive.current) setError(`Détourage impossible (${(e as Error).message || 'erreur'}). Relancez-le, importez un PNG détouré, ou utilisez la photo originale.`)
    } finally { releaseCutoutLock(owner.current); if (alive.current) setProgress(null) }
  }
  const upload = async (f?: File) => {
    if (!f) return
    setProgress({ pct: 1, label: 'Compression de la photo…' })
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f, maxSize: 1800, hint: 'photo' })
    // anciens fichiers conservés : le formulaire peut encore être annulé
    patch({ photo_url: file_url, photo_cutout_url: undefined, photo_cutout_status: undefined, photo_cutout_source: undefined, photo_cutout_tries: 0, photo_card_mode: 'cutout' })
    await runCutout(file_url)
  }
  const uploadCutout = async (f?: File) => {
    if (!f) return
    setError(null); setProgress({ pct: 90, label: 'Recadrage et nettoyage des bords…' })
    try { patch({ photo_cutout_url: await cutoutFromFile(f), photo_cutout_status: 'ok', photo_cutout_source: photo, photo_cutout_tries: 0, photo_card_mode: 'cutout' }) }
    catch (e) { setError(`Image refusée : ${(e as Error).message}`) } finally { setProgress(null) }
  }
  const busy = !!progress

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_.9fr]">
        <Frame title="Avant — photo originale" note="Avatars ronds et équipe type">
          {photo ? <img src={photo} alt="Photo originale" className="size-full object-cover" /> : <Empty>Aucune photo</Empty>}
        </Frame>
        <Frame title="Après — joueur détouré" note="Fond transparent" checker active={mode === 'cutout' && !!cutout}>
          {cutout ? <img src={cutout} alt="Photo détourée" className="max-h-full max-w-full self-end object-contain" /> : <Empty>{v.photo_cutout_status === 'failed' ? 'Échec du détourage' : photo ? 'Pas encore détourée' : '—'}</Empty>}
          {progress && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night-950/80 px-4 text-center text-xs" role="status">
              <Loader2 className="size-6 animate-spin text-neon" />
              <span>{progress.label}</span>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label="Progression du détourage">
                <div className="h-full rounded-full bg-neon transition-[width] duration-300" style={{ width: `${Math.max(3, progress.pct)}%` }} />
              </div>
              <span className="num text-sm">{progress.pct} %</span>
            </div>
          )}
        </Frame>
        <CardPreview value={v} />
      </div>

      <div className="flex flex-wrap gap-2">
        <label className={cn('inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-neon px-3 text-sm font-bold text-white hover:bg-neon/90', busy && 'pointer-events-none opacity-60')}>
          <Upload className="size-4" />{photo ? 'Changer la photo' : 'Importer une photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {cutout && <Button type="button" size="sm" className="h-9" variant={validated && mode === 'cutout' ? 'default' : 'outline'} disabled={busy} onClick={() => { patch({ photo_card_mode: 'cutout' }); setValidated(true) }}><Check />{validated && mode === 'cutout' ? 'Détourage validé' : 'Valider'}</Button>}
        {photo && <Button type="button" size="sm" variant="outline" className="h-9" disabled={busy} onClick={() => runCutout(photo)}><RefreshCw />Relancer le détourage</Button>}
        {photo && <Button type="button" size="sm" variant={mode === 'original' ? 'default' : 'ghost'} className="h-9" disabled={busy} onClick={() => { patch({ photo_card_mode: 'original' }); setValidated(false) }}><ImageOff />{mode === 'original' ? 'Photo originale utilisée' : 'Utiliser la photo originale'}</Button>}
        <label className={cn('inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 text-xs hover:bg-white/5', busy && 'pointer-events-none opacity-60')} title="PNG ou WebP avec fond transparent, préparé dans un autre outil">
          <Upload className="size-4" />Importer un PNG détouré
          <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => { void uploadCutout(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {error && <p className="text-xs text-amber-300" role="alert">{error}</p>}
      <p className="text-[11px] text-muted-foreground">Le fond est supprimé dans votre navigateur (la photo n’est envoyée à aucun service). Seul le joueur au premier plan est gardé, cadré en buste, 800 px de haut, fond transparent. Le premier détourage télécharge l’outil (~80 Mo, une seule fois).</p>
    </div>
  )
}

function Frame({ title, note, checker, active, children }: { title: string; note: string; checker?: boolean; active?: boolean; children: ReactNode }) {
  return (
    <figure className={cn('rounded-xl border bg-night-950/40 p-2', active ? 'border-neon/60' : 'border-white/10')}>
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-white/5" style={checker ? { background: CHECKER } : undefined}>{children}</div>
      <figcaption className="mt-1 text-center text-[11px] leading-tight"><span className="font-semibold">{title}</span><br /><span className="text-muted-foreground">{note}</span></figcaption>
    </figure>
  )
}
const Empty = ({ children }: { children: ReactNode }) => <span className="m-auto px-2 text-center text-xs text-muted-foreground">{children}</span>

/** Aperçu de la carte joueur telle qu'elle sera affichée sur le site. */
function CardPreview({ value: v }: { value: Partial<Player> }) {
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const s = usePlayerXP({ seasonId }).get(v.id ?? '')
  const team = v.team_id ? L.team.get(v.team_id) : undefined
  const tier = useTeamSeniority(team?.id)?.tier
  return (
    <figure className="rounded-xl border border-white/10 bg-night-950/40 p-2">
      <div className="mx-auto w-full max-w-[200px]">
        <PlayerCard tier={tier} firstName={v.first_name || 'Prénom'} lastName={v.last_name || 'NOM'} position={v.position} captain={v.is_captain} team={team}
          photoUrl={v.photo_url} cutoutUrl={(v.photo_card_mode ?? 'cutout') === 'cutout' ? v.photo_cutout_url : undefined}
          rating={s?.xp ?? 0} ratingLabel="XP"
          front={[{ label: 'MJ', value: s?.matches ?? 0 }, { label: 'BUT', value: s?.goals ?? 0 }, { label: 'PAS', value: s?.assists ?? 0 }, { label: 'CJ', value: s?.yellow ?? 0 }]}
          backTitle="Aperçu" back={[]} />
      </div>
      <figcaption className="mt-1 text-center text-[11px] leading-tight"><span className="font-semibold">Carte finale</span><br /><span className="text-muted-foreground">Aperçu (cliquer pour retourner)</span></figcaption>
    </figure>
  )
}
