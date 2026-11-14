// Sélecteur « Prix de la Ligue » (Pré-saison / MASTER / CHALLENGER) · « Prix du Tournoi », partagé par
// Trophées, Statistiques et Historique.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/permissions'
import type { Section, SectionKey } from '@/hooks/useSections'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/league/Bits'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function useSectionState(initial: SectionKey = 'preseason') {
  const [key, setKey] = useState<SectionKey>(() => { try { return (sessionStorage.getItem('statfoot:section') as SectionKey) || initial } catch { return initial } })
  const set = (k: SectionKey) => { setKey(k); try { sessionStorage.setItem('statfoot:section', k) } catch { /* indisponible */ } }
  return [key, set] as const
}

export function SectionPicker({ sections, value, onChange }: { sections: Record<SectionKey, Section>; value: SectionKey; onChange: (k: SectionKey) => void }) {
  const ligue = value !== 'tournament'
  const big = (on: boolean) => cn('min-h-11 flex-1 cursor-pointer rounded-xl px-4 font-display text-lg font-black uppercase tracking-wide transition sm:flex-none', on ? 'bg-neon text-night-950' : 'text-muted-foreground hover:text-white')
  const chip = (on: boolean, off?: boolean) => cn('min-h-9 cursor-pointer rounded-full border px-4 font-display text-sm font-bold uppercase tracking-wide transition', on ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground hover:text-white', off && 'opacity-50')
  const leagueKeys: SectionKey[] = ['preseason', 'master', 'challenger']
  return (
    <div className="mb-5 space-y-3">
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-night-950/50 p-1 sm:inline-flex" role="tablist" aria-label="Prix">
        <button role="tab" aria-selected={ligue} className={big(ligue)} onClick={() => onChange(ligue ? value : 'preseason')}>Prix de la Ligue</button>
        <button role="tab" aria-selected={!ligue} className={big(!ligue)} onClick={() => onChange('tournament')}>Prix du Tournoi</button>
      </div>
      {ligue && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Phase de la ligue">
          {leagueKeys.map((k) => <button key={k} role="tab" aria-selected={value === k} className={chip(value === k, !sections[k].available)} onClick={() => onChange(k)}>{sections[k].label}</button>)}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{sections[value].note}</p>
    </div>
  )
}

/** Section indisponible : tournoi pas encore créé, ou divisions pas encore formées */
export function SectionPending({ section, seasonId }: { section: Section; seasonId: string | null }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  if (section.key === 'tournament') {
    const create = async () => {
      if (!seasonId) return
      setBusy(true)
      try {
        const c = await base44.entities.Competition.create({ season_id: seasonId, name: 'Tournoi MBL', phase: 'knockout', format: 'groups_knockout', status: 'upcoming', team_ids: [], order: 10, color: '#22C55E', description: 'Tournoi : compétition à part, hors classement de la ligue' } as never)
        base44.logActivity('create_tournament', 'Competition', c as never)
        toast.success('Tournoi créé : configurez-le dans Admin → Compétitions')
      } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
    }
    return (
      <EmptyState title="Le tournoi sera annoncé prochainement">
        Le tournoi est une compétition à part : ses prix, statistiques et palmarès apparaîtront ici dès qu’il sera lancé.
        {can(user, 'sport') && <div className="mt-4"><Button onClick={create} disabled={busy || !seasonId}><Plus />Créer le tournoi</Button></div>}
      </EmptyState>
    )
  }
  return <EmptyState title={section.key === 'preseason' ? 'Pas de pré-saison cette saison' : `${section.label} pas encore formée`}>{section.key === 'preseason' ? '' : 'Les divisions sont formées à la fin de la pré-saison, selon son classement.'}</EmptyState>
}
