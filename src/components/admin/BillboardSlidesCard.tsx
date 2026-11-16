// Réglage du billboard de l'accueil : ordre et activation de chaque panneau (enregistré dans Settings.billboard_slides).
import { useState } from 'react'
import { ArrowDown, ArrowUp, Save } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { BILLBOARD_SLIDES, billboardLayout, type BillboardLayout } from '@/lib/billboard'
import { cn } from '@/lib/utils'

export function BillboardSlidesCard() {
  const { settings } = useData()
  const [rows, setRows] = useState<BillboardLayout>(() => billboardLayout(settings.billboard_slides))
  const move = (i: number, d: -1 | 1) => setRows((r) => { const x = [...r]; const j = i + d; if (j < 0 || j >= x.length) return r; [x[i], x[j]] = [x[j], x[i]]; return x })
  const toggle = (i: number) => setRows((r) => r.map((x, k) => (k === i ? { ...x, enabled: !x.enabled } : x)))
  const save = async () => { await base44.entities.Settings.update(settings.id, { billboard_slides: rows }); toast.success('Billboard de l’accueil mis à jour') }
  return (
    <Card>
      <CardHeader><CardTitle>Billboard de l’accueil</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">Ordre et activation des panneaux. Les panneaux de statistiques n’apparaissent que lorsque la donnée existe (saison en cours).</p>
        <ol className="space-y-1">
          {rows.map((r, i) => {
            const d = BILLBOARD_SLIDES.find((s) => s.key === r.key)
            return (
              <li key={r.key} className={cn('flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-sm', !r.enabled && 'opacity-55')}>
                <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={r.enabled} onChange={() => toggle(i)} className="size-4 accent-[#F26B1D]" />
                  <span><b>{d?.label}</b>{d?.help && <span className="block text-xs text-muted-foreground">{d.help}</span>}</span>
                </label>
                <Button variant="ghost" size="icon" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button variant="ghost" size="icon" aria-label="Descendre" disabled={i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
              </li>
            )
          })}
        </ol>
        <Button className="w-full" onClick={save}><Save />Enregistrer l’ordre des panneaux</Button>
      </CardContent>
    </Card>
  )
}
