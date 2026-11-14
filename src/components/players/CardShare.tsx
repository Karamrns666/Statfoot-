// « Télécharger ma carte » (PNG 1080 × 1350) et « Partager » : partage natif du téléphone avec le fichier
// (Web Share API), sinon liens WhatsApp / Facebook / LinkedIn / X et copie du lien de la fiche.
import { useRef, useState, type ReactNode } from 'react'
import { toBlob } from 'html-to-image'
import { Check, Copy, Download, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { VisualFrame } from '@/components/share/VisualFrame'
import { isSimActive } from '@/sim/simMode'

const W = 1080, H = 1350, CARD_W = 660

// Polices du site (hébergées sur le site, /fonts) intégrées en data: dans l'image — sans ça html-to-image
// sortirait le texte en police système.
let fontCss: Promise<string> | null = null
const toDataUrl = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(b) })
export const SITE_FONTS = [
  { family: 'Big Shoulders Display', file: '/fonts/big-shoulders-display-var.woff', weight: '100 900' },
  { family: 'Manrope', file: '/fonts/manrope-var.woff', weight: '200 800' },
]
export function embeddedFontCss(): Promise<string> {
  fontCss ??= (async () => {
    let out = ''
    for (const f of SITE_FONTS) {
      try { out += `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};src:url(${await toDataUrl(await (await fetch(f.file)).blob())}) format('woff');}` } catch { /* hors ligne : police système */ }
    }
    return out
  })()
  return fontCss
}

/** Liens de partage de secours (sans fichier : lien vers la fiche du joueur) */
export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url), t = encodeURIComponent(text)
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, color: '#25D366' },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, color: '#1877F2' },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, color: '#0A66C2' },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, color: '#000000' },
  ]
}

export function CardShareActions({ card, fileName, url, text, subtitle, downloadLabel = 'Télécharger ma carte', cardWidth = CARD_W }: { card: ReactNode; fileName: string; url: string; text: string; subtitle?: string; downloadLabel?: string; cardWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'dl' | 'share' | null>(null)
  const sim = isSimActive()
  const [fallback, setFallback] = useState(false)
  const [copied, setCopied] = useState(false)

  const render = async () => {
    if (!ref.current) throw new Error('Carte indisponible')
    await document.fonts?.ready
    const b = await toBlob(ref.current, { width: W, height: H, pixelRatio: 1, cacheBust: true, fontEmbedCSS: await embeddedFontCss() })
    if (!b) throw new Error('Image impossible à générer')
    return new File([b], fileName, { type: 'image/png' })
  }
  const save = (f: File) => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) }
  const download = async () => {
    setBusy('dl')
    try { save(await render()); toast.success('Carte téléchargée') } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const share = async () => {
    setBusy('share')
    try {
      const file = await render()
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: text, text: `${text} ${url}` })
      else setFallback(true)
    } catch (e) { if ((e as Error).name !== 'AbortError') setFallback(true) } finally { setBusy(null) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { toast.error('Copie impossible') }
  }
  return (
    <>
      <div className="grid w-full gap-2">
        <Button size="sm" onClick={download} disabled={!!busy} className="w-full">{busy === 'dl' ? <Loader2 className="animate-spin" /> : <Download />}{downloadLabel}</Button>
        {sim ? <p className="text-center text-xs text-amber-300">Mode simulation : partage désactivé</p> : <Button size="sm" variant="outline" onClick={share} disabled={!!busy} className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20">{busy === 'share' ? <Loader2 className="animate-spin" /> : <Share2 />}Partager</Button>}
      </div>
      {/* composition 1080 × 1350 rendue hors écran pour l'export */}
      <div aria-hidden className="pointer-events-none fixed left-[-20000px] top-0" style={{ width: W, height: H }}>
        <div ref={ref} style={{ width: W, height: H }}>
          <VisualFrame accent="#F05A22" subtitle={sim ? `SIMULATION — données fictives${subtitle ? ` · ${subtitle}` : ''}` : subtitle} height={H}>
            <div style={{ width: cardWidth }}>{card}</div>
          </VisualFrame>
        </div>
      </div>
      <Dialog open={fallback} onOpenChange={setFallback}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Partager la carte</DialogTitle><DialogDescription>Le partage direct de l’image n’est pas disponible sur cet appareil. Partagez le lien de la fiche, ou téléchargez la carte puis publiez-la.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {shareLinks(url, text).map((l) => (
              <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:brightness-110" style={{ background: l.color }}>{l.label}</a>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? 'Lien copié' : 'Copier le lien'}</Button>
            <Button className="flex-1" onClick={download} disabled={!!busy}>{busy === 'dl' ? <Loader2 className="animate-spin" /> : <Download />}Télécharger</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
