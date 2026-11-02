import { useEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'

/** Signature au doigt / à la souris → data URL PNG */
export function SignaturePad({ value, onChange, disabled }: { value?: string; onChange: (v: string | undefined) => void; disabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = value }
  }, [value])
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * ref.current!.width, y: ((e.clientY - r.top) / r.height) * ref.current!.height } }
  return (
    <div className="relative">
      <canvas ref={ref} width={600} height={180} className="h-28 w-full touch-none rounded-lg border border-white/20 bg-white"
        onPointerDown={(e) => { if (disabled) return; drawing.current = true; const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#0b1426' }}
        onPointerMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }}
        onPointerUp={() => { if (!drawing.current) return; drawing.current = false; onChange(ref.current!.toDataURL('image/png')) }} />
      {!disabled && <button type="button" className="no-print absolute right-2 top-2 rounded bg-night-900/80 p-1 text-white" onClick={() => onChange(undefined)} title="Effacer"><Eraser className="size-4" /></button>}
    </div>
  )
}
