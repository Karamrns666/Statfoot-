// Mini système de notifications (équivalent "sonner" de shadcn)
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
type T = { id: number; msg: string; kind: 'success' | 'error' | 'info' }
let push: ((t: T) => void) | null = null
let n = 0
export const toast = {
  success: (msg: string) => push?.({ id: ++n, msg, kind: 'success' }),
  error: (msg: string) => push?.({ id: ++n, msg, kind: 'error' }),
  info: (msg: string) => push?.({ id: ++n, msg, kind: 'info' }),
}
export function Toaster() {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    push = (t) => { setItems((x) => [...x, t]); setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 3500) }
    return () => { push = null }
  }, [])
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 no-print">
      {items.map((t) => (
        <div key={t.id} className="glass flex items-center gap-2 rounded-xl bg-night-800/95 px-4 py-3 text-sm shadow-2xl">
          {t.kind === 'success' ? <CheckCircle2 className="size-4 text-win" /> : t.kind === 'error' ? <AlertTriangle className="size-4 text-loss" /> : <Info className="size-4 text-neon" />}
          {t.msg}
        </div>
      ))}
    </div>
  )
}
