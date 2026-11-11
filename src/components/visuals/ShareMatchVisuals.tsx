// Fiche match publique : « Partager » ouvre le partage natif du téléphone avec l'image (post / story),
// « Télécharger l'image » en secours. Images générées dans le navigateur du visiteur, à la charte officielle.
import { useState } from 'react'
import { Download, Loader2, Share2, Smartphone } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useVisualPreview, useVisualsConfig } from '@/hooks/useMatchVisuals'
import { downloadBlob, renderMatchPng, visualFileName } from '@/lib/visuals'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/entities'

export function ShareMatchButton({ match }: { match: Match }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Share2 />Partager</Button>
      {open && <ShareDialog match={match} open={open} onOpenChange={setOpen} />}
    </>
  )
}

function ShareDialog({ match, open, onOpenChange }: { match: Match; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { league } = useData()
  const cfg = useVisualsConfig()
  const [kind, setKind] = useState<'resultat' | 'mvp'>('resultat')
  const prev = useVisualPreview(kind, match)
  const [busy, setBusy] = useState<string | null>(null)
  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] })

  const getFile = async (story: boolean) => {
    const b = await renderMatchPng(kind, league, match, cfg, { story })
    if (!b) throw new Error('Image indisponible')
    return new File([b], visualFileName(kind, league, match, story), { type: 'image/png' })
  }
  const share = async (story = false) => {
    setBusy(story ? 'story' : 'share')
    try {
      const file = await getFile(story)
      if (canShareFiles && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Morocco Business League', text: prev.plan?.caption })
      else downloadBlob(file, file.name)
    } catch (e) { if ((e as Error).name !== 'AbortError') toast.error('Partage impossible : téléchargez l’image') } finally { setBusy(null) }
  }
  const download = async (story = false) => {
    setBusy(story ? 'dls' : 'dl')
    try { const f = await getFile(story); downloadBlob(f, f.name) } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Partager le match</DialogTitle><DialogDescription>Image 1080 × 1080 aux couleurs officielles, prête pour un post ou une story.</DialogDescription></DialogHeader>
        <div className="flex rounded-lg border border-input p-0.5" role="radiogroup" aria-label="Visuel">
          {([['resultat', 'Résultat'], ['mvp', 'Homme du match']] as const).map(([k, l]) => (
            <button key={k} role="radio" aria-checked={kind === k} disabled={k === 'mvp' && !match.motm_player_id} onClick={() => setKind(k)} className={cn('flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40', kind === k ? 'bg-neon/20 text-neon' : 'text-muted-foreground')}>{l}</button>
          ))}
        </div>
        {/* aperçu limité en hauteur : les boutons restent visibles même sur un petit écran */}
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,34dvh)] overflow-hidden rounded-xl bg-white/5">
          {prev.url && <img src={prev.url} alt={kind === 'resultat' ? 'Visuel du résultat' : 'Visuel homme du match'} className="size-full" />}
          {(prev.busy || !prev.url) && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-white/80"><Loader2 className="size-6 animate-spin text-neon" />Préparation de l’image…</div>}
        </div>
        <div className="sticky bottom-0 -mx-5 -mb-5 grid gap-2 border-t border-white/10 bg-night-800 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:grid-cols-2" aria-busy={!!busy}>
          <Button size="lg" onClick={() => share()} disabled={!!busy || !prev.url} className="w-full">{busy === 'share' ? <><Loader2 className="animate-spin" />Génération…</> : <>{canShareFiles ? <Share2 /> : <Download />}{canShareFiles ? 'Partager' : 'Télécharger l’image'}</>}</Button>
          {canShareFiles
            ? <Button size="lg" variant="contrast" onClick={() => share(true)} disabled={!!busy || !prev.url} className="w-full">{busy === 'story' ? <><Loader2 className="animate-spin" />Génération…</> : <><Smartphone />Partager en story</>}</Button>
            : <Button size="lg" variant="contrast" onClick={() => download(true)} disabled={!!busy || !prev.url} className="w-full">{busy === 'dls' ? <><Loader2 className="animate-spin" />Génération…</> : <><Smartphone />Format story</>}</Button>}
          {canShareFiles && <Button variant="ghost" size="sm" onClick={() => download()} disabled={!!busy} className="text-white/85 sm:col-span-2">{busy === 'dl' ? <><Loader2 className="animate-spin" />Génération…</> : <><Download />Télécharger l’image</>}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
