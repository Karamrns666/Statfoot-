import { isSimActive } from '@/sim/simMode'
// Fenêtre générique : aperçu d'un visuel PNG + « Télécharger » / « Partager » (Web Share avec le fichier),
// boutons toujours visibles (pied collant) et état de chargement.
import { useEffect, useState } from 'react'
import { Download, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { downloadBlob } from '@/lib/visuals'

export function VisualShareDialog({ open, onOpenChange, title, description, fileName, caption, render, aspect = '1 / 1' }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; fileName: string; caption?: string
  render: () => Promise<Blob | null>; aspect?: string
}) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<'dl' | 'share' | null>(null)
  useEffect(() => {
    if (!open) return
    let alive = true, u: string | undefined
    setBlob(null); setUrl(undefined); setError(undefined)
    render().then((b) => { if (!alive || !b) return; u = URL.createObjectURL(b); setBlob(b); setUrl(u) }).catch((e) => alive && setError((e as Error).message))
    return () => { alive = false; if (u) URL.revokeObjectURL(u) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const file = () => new File([blob!], fileName, { type: 'image/png' })
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare && !!blob && navigator.canShare({ files: [file()] })
  const share = async () => {
    setBusy('share')
    try { if (isSimActive()) { toast.error('Mode simulation : partage désactivé (téléchargement seulement)'); downloadBlob(blob!, fileName) } else if (canShare) await navigator.share({ files: [file()], title, text: caption }); else downloadBlob(blob!, fileName) }
    catch (e) { if ((e as Error).name !== 'AbortError') toast.error('Partage impossible : téléchargez l’image') } finally { setBusy(null) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>
        <div className="relative mx-auto w-full max-w-[min(100%,40dvh)] overflow-hidden rounded-xl bg-white/5" style={{ aspectRatio: aspect }}>
          {url && <img src={url} alt={title} className="size-full object-contain" />}
          {!url && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-white/80">{error ? `Erreur : ${error}` : <><Loader2 className="size-6 animate-spin text-neon" />Préparation de l’image…</>}</div>}
        </div>
        <div className="sticky bottom-0 -mx-5 -mb-5 grid gap-2 border-t border-white/10 bg-night-800 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:grid-cols-2">
          <Button size="lg" className="w-full" disabled={!blob || !!busy} onClick={() => { setBusy('dl'); downloadBlob(blob!, fileName); setBusy(null) }}>{busy === 'dl' ? <Loader2 className="animate-spin" /> : <Download />}Télécharger</Button>
          <Button size="lg" variant="contrast" className="w-full" disabled={!blob || !!busy} onClick={share}>{busy === 'share' ? <><Loader2 className="animate-spin" />Génération…</> : <><Share2 />{canShare ? 'Partager' : 'Publier (télécharger)'}</>}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
