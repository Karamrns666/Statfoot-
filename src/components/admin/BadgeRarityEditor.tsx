// Rareté des badges modifiable par l'admin (Settings.badge_rarity) — « par défaut » reprend la répartition du catalogue.
import { useState } from 'react'
import { Save } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { BADGES } from '@/lib/badges'
import { BADGE_META, RARITY_LABEL, RARITY_ORDER, type Rarity } from '@/lib/badgeCatalog'
import { BadgeEmblem, RARITY_ACCENT } from '@/components/badges/BadgeEmblem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'

export function BadgeRarityEditor() {
  const { settings } = useData()
  const [v, setV] = useState<Record<string, Rarity>>({ ...(settings.badge_rarity ?? {}) })
  const save = async () => {
    const clean = Object.fromEntries(Object.entries(v).filter(([id, r]) => r && r !== BADGE_META[id]?.rarity))
    await base44.entities.Settings.update(settings.id, { badge_rarity: clean })
    toast.success('Raretés des badges enregistrées')
  }
  return (
    <Card>
      <CardHeader><CardTitle>Rareté des badges</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        <p className="mb-2 text-xs text-muted-foreground">Change l’habillage (bronze, saphir, améthyste, or) et l’ordre d’affichage sur les cartes. Les conditions de déblocage ne changent pas.</p>
        {BADGES.map((d) => {
          const def = BADGE_META[d.id]?.rarity ?? 'common'
          const cur = v[d.id] ?? def
          return (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <BadgeEmblem pictogram={BADGE_META[d.id]?.pictogram ?? 'star_medal'} rarity={cur} size={30} simple title={d.name} />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <select value={cur} onChange={(e) => setV({ ...v, [d.id]: e.target.value as Rarity })} aria-label={`Rareté de ${d.name}`}
                className="min-h-9 rounded-lg border border-white/15 bg-night-950 px-2 text-xs font-bold" style={{ color: RARITY_ACCENT[cur] }}>
                {RARITY_ORDER.map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}{r === def ? ' (défaut)' : ''}</option>)}
              </select>
            </label>
          )
        })}
        <Button size="sm" className="mt-2 w-full" onClick={save}><Save />Enregistrer les raretés</Button>
      </CardContent>
    </Card>
  )
}
