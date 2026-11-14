// Export de l'équipe type en image : post Instagram 1080×1350 ou story 1080×1920 (html-to-image, dans le navigateur).
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLookup } from '@/hooks/useData'
import { useLeague } from '@/hooks/useLeague'
import { VisualFrame } from '@/components/share/VisualFrame'
import { TeamOfWeekPitch, fmtRating } from './TeamOfWeekPitch'
import type { TeamOfWeekResult } from '@/lib/rewards'

const FORMATS = { post: { w: 1080, h: 1350, label: 'Post 1080 × 1350' }, story: { w: 1080, h: 1920, label: 'Story 1080 × 1920' } } as const
type Fmt = keyof typeof FORMATS

export function TeamOfWeekShare({ open, onOpenChange, result, title }: { open: boolean; onOpenChange: (o: boolean) => void; result: TeamOfWeekResult; title: string }) {
  const [fmt, setFmt] = useState<Fmt>('post')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const L = useLookup()
  const league = useLeague()
  const f = FORMATS[fmt]
  const scale = fmt === 'post' ? 0.3 : 0.22
  const best = result.player_of_round ? L.player.get(result.player_of_round.player_id) : undefined
  const download = async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const url = await toPng(ref.current, { width: f.w, height: f.h, pixelRatio: 1, cacheBust: true })
      const a = document.createElement('a'); a.href = url; a.download = `${league.shortName.toLowerCase()}-equipe-type-j${result.round}-${fmt}.png`; a.click()
    } finally { setBusy(false) }
  }
  // le terrain est dessiné à 390 px de large puis agrandi : textes et proportions identiques au site
  const pitchW = fmt === 'post' ? 390 : 420, zoom = fmt === 'post' ? 1.62 : 2.2
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Partager l’équipe type</DialogTitle><DialogDescription>Image prête à publier sur Instagram.</DialogDescription></DialogHeader>
        <div className="flex gap-2">{(Object.keys(FORMATS) as Fmt[]).map((k) => <Button key={k} size="sm" variant={fmt === k ? 'default' : 'outline'} onClick={() => setFmt(k)}>{FORMATS[k].label}</Button>)}</div>
        <div className="mx-auto overflow-hidden rounded-xl border border-white/10" style={{ width: f.w * scale, height: f.h * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: f.w, height: f.h }}>
            <div ref={ref}>
              <VisualFrame accent="#E8B931" subtitle={title} height={f.h}>
                <div className="title-caps text-white" style={{ fontSize: fmt === 'post' ? 84 : 110, lineHeight: 1 }}>Équipe type</div>
                <div className="font-display font-bold text-white/70" style={{ fontSize: 40 }}>Journée {result.round}</div>
                <div className="mt-6" style={{ width: pitchW * zoom, height: (pitchW * 4 / 3) * zoom }}>
                  <div style={{ width: pitchW, transform: `scale(${zoom})`, transformOrigin: 'top left' }}><TeamOfWeekPitch result={result} link={false} className="!aspect-[3/4]" /></div>
                </div>
                {best && result.player_of_round && (
                  <div className="mt-6 font-display font-black text-white" style={{ fontSize: fmt === 'post' ? 36 : 48 }}>
                    <span style={{ color: '#E8B931' }}>Joueur de la journée :</span> {best.first_name} {best.last_name} · {fmtRating(result.player_of_round.rating)}
                  </div>
                )}
              </VisualFrame>
            </div>
          </div>
        </div>
        <Button onClick={download} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />}Télécharger le PNG</Button>
      </DialogContent>
    </Dialog>
  )
}
