// Admin — photos collectives et posters d'une équipe : import multiple (compressé), choix de l'image
// d'en-tête, point de recadrage ordinateur / mobile (clic ou glisser sur l'image), suppression.
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Check, ImagePlus, Loader2, Monitor, Smartphone, Star, Trash2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { newId } from '@/api/localStore'
import { deleteFile } from '@/api/fileStore'
import { decodeImage } from '@/lib/imageOptimize'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { focusPos, teamCover } from '@/components/league/TeamBanner'
import type { Team, TeamMedia } from '@/types/entities'
import { cn } from '@/lib/utils'

const KIND: Record<TeamMedia['kind'], string> = { team_photo: 'Photo collective', poster: 'Poster' }

export function TeamMediaManager({ team, open, onOpenChange }: { team: Team; open: boolean; onOpenChange: (o: boolean) => void }) {
  const media = team.media ?? []
  const cover = teamCover(team)
  const [kind, setKind] = useState<TeamMedia['kind']>('team_photo')
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const save = (patch: Partial<Team>) => base44.entities.Team.update(team.id, patch)
  const current = media.find((m) => m.id === (editing ?? cover?.id))

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const added: TeamMedia[] = []
    let i = 0
    for (const f of Array.from(files)) {
      setBusy(`Compression ${++i} / ${files.length}…`)
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f, maxSize: 2400, hint: kind === 'poster' ? 'poster' : 'equipe' })
        const img = await decodeImage(await (await fetch(file_url)).blob()).catch(() => null)
        added.push({ id: newId(), url: file_url, kind, focus_x: 50, focus_y: 40, width: img ? ('naturalWidth' in img ? img.naturalWidth : img.width) : undefined, height: img ? ('naturalHeight' in img ? img.naturalHeight : img.height) : undefined, created_at: new Date().toISOString() })
      } catch { toast.error(`${f.name} : image illisible`) }
    }
    setBusy(null)
    if (!added.length) return
    await save({ media: [...media, ...added], cover_media_id: team.cover_media_id ?? added[0].id })
    setEditing(added[0].id)
    toast.success(`${added.length} image(s) ajoutée(s) et optimisée(s)`)
  }
  const remove = async (m: TeamMedia) => {
    const rest = media.filter((x) => x.id !== m.id)
    await save({ media: rest, cover_media_id: team.cover_media_id === m.id ? rest[0]?.id : team.cover_media_id })
    void deleteFile(m.url)
    if (editing === m.id) setEditing(null)
    toast.success('Image supprimée')
  }
  const setFocus = (m: TeamMedia, x: number, y: number) => {
    const k = device === 'mobile' ? { focus_x_mobile: x, focus_y_mobile: y } : { focus_x: x, focus_y: y }
    void save({ media: media.map((it) => (it.id === m.id ? { ...it, ...k } : it)) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Photos & poster — {team.name}</DialogTitle>
          <DialogDescription>Images de l’en-tête de la page équipe. Elles sont compressées automatiquement à l’import. Choisissez celle à afficher et le point à garder visible.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-input p-0.5" role="radiogroup" aria-label="Type d’image">
            {(Object.keys(KIND) as TeamMedia['kind'][]).map((k) => (
              <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn('cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold', kind === k ? 'bg-neon/20 text-neon' : 'text-muted-foreground')}>{KIND[k]}</button>
            ))}
          </div>
          <label className={cn('inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-neon px-3 text-sm font-bold text-white hover:bg-neon/90', busy && 'pointer-events-none opacity-60')}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ?? `Ajouter ${kind === 'poster' ? 'des posters' : 'des photos'}`}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void upload(e.target.files); e.target.value = '' }} />
          </label>
          <span className="text-xs text-muted-foreground">JPG, PNG ou WebP — plusieurs fichiers possibles. Idéal : 2400 px de large.</span>
        </div>

        {media.length === 0 ? <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">Aucune image. Sans image, l’en-tête utilise les couleurs et le logo de l’équipe.</p> : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* recadrage */}
            {current && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Point de recadrage</span>
                  <div className="ml-auto flex rounded-lg border border-input p-0.5">
                    {([['desktop', Monitor, 'Ordinateur'], ['mobile', Smartphone, 'Mobile']] as const).map(([d, Icon, l]) => (
                      <button key={d} onClick={() => setDevice(d)} aria-pressed={device === d} className={cn('flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold', device === d ? 'bg-neon/20 text-neon' : 'text-muted-foreground')}><Icon className="size-3.5" />{l}</button>
                    ))}
                  </div>
                </div>
                <FocusPicker media={current} device={device} onChange={(x, y) => setFocus(current, x, y)} />
                <p className="text-xs text-muted-foreground">Cliquez ou faites glisser le point sur la zone à garder visible (visages, logo…). Les aperçus montrent le rendu réel.</p>
                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <Preview m={current} label="Ordinateur" className="aspect-[16/7]" />
                  <Preview m={current} label="Mobile" mobile className="aspect-[9/14] w-28" />
                </div>
              </div>
            )}
            {/* galerie */}
            <ul className="grid content-start grid-cols-2 gap-2 lg:grid-cols-1">
              {media.map((m) => {
                const isCover = cover?.id === m.id
                return (
                  <li key={m.id} className={cn('overflow-hidden rounded-xl border bg-night-950/40', (editing ?? cover?.id) === m.id ? 'border-neon' : 'border-white/10')}>
                    <button onClick={() => setEditing(m.id)} className="block w-full cursor-pointer" title="Régler le recadrage">
                      <img src={m.url} alt="" className="aspect-[16/9] w-full object-cover" style={{ objectPosition: focusPos(m) }} />
                    </button>
                    <div className="flex items-center gap-1 p-1.5">
                      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{KIND[m.kind]}{m.width ? ` · ${m.width}×${m.height}` : ''}</span>
                      <Button size="sm" variant={isCover ? 'default' : 'outline'} className="h-7 px-2 text-[11px]" disabled={isCover} onClick={() => save({ cover_media_id: m.id })}>{isCover ? <Check className="size-3.5" /> : <Star className="size-3.5" />}{isCover ? 'En-tête' : 'Afficher'}</Button>
                      <Button size="icon" variant="ghost" className="size-7 text-red-300" onClick={() => remove(m)} title="Supprimer" aria-label="Supprimer l’image"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FocusPicker({ media, device, onChange }: { media: TeamMedia; device: 'desktop' | 'mobile'; onChange: (x: number, y: number) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const fx = drag?.x ?? (device === 'mobile' ? media.focus_x_mobile ?? media.focus_x ?? 50 : media.focus_x ?? 50)
  const fy = drag?.y ?? (device === 'mobile' ? media.focus_y_mobile ?? media.focus_y ?? 50 : media.focus_y ?? 50)
  const at = (e: RPointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    return { x: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))), y: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))) }
  }
  return (
    <div ref={box} className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-xl"
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDrag(at(e)) }}
      onPointerMove={(e) => drag && setDrag(at(e))}
      onPointerUp={(e) => { const p = at(e); setDrag(null); onChange(p.x, p.y) }}
      role="slider" aria-label={`Point de recadrage (${device === 'mobile' ? 'mobile' : 'ordinateur'})`} aria-valuetext={`${fx} % horizontal, ${fy} % vertical`} tabIndex={0}
      onKeyDown={(e) => {
        const d = ({ ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] } as Record<string, [number, number]>)[e.key]
        if (d) { e.preventDefault(); onChange(Math.min(100, Math.max(0, fx + d[0])), Math.min(100, Math.max(0, fy + d[1]))) }
      }}>
      <img src={media.url} alt="" className="pointer-events-none block max-h-[50vh] w-full object-contain" draggable={false} />
      <div className="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_#F85A00,0_0_20px_rgba(0,0,0,.6)]" style={{ left: `${fx}%`, top: `${fy}%` }} />
    </div>
  )
}

function Preview({ m, label, mobile, className }: { m: TeamMedia; label: string; mobile?: boolean; className?: string }) {
  return (
    <figure className={className}>
      <div className="relative size-full overflow-hidden rounded-lg border border-white/10">
        <img src={m.url} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: focusPos(m, mobile) }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night-950 to-transparent" />
      </div>
      <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">{label}</figcaption>
    </figure>
  )
}
