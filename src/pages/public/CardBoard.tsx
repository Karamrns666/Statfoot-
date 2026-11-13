// Planche de comparaison des cartes (aperçu non référencé) : une carte joueur et une carte équipe de chaque
// niveau, en grand et en taille mobile. Sert à valider le design ; pas de lien depuis le site.
import { useEffect, useMemo } from 'react'
import { useData } from '@/hooks/useData'
import { useSeasonCompetitions } from '@/hooks/useStats'
import { useSeniorityMap } from '@/hooks/useSeniority'
import { PlayerCard } from '@/components/players/PlayerCard'
import { TeamCard, useTeamCardData } from '@/components/cards/TeamCard'
import { TierLegendCards } from '@/components/cards/TierLegend'
import { SENIORITY_LABEL, SENIORITY_ORDER, type SeniorityTier } from '@/lib/seniority'
import type { Player, Team } from '@/types/entities'

function Pair({ tier, team, player, width }: { tier: SeniorityTier; team: Team; player?: Player; width: number }) {
  const d = useTeamCardData(team.id)
  return (
    <div className="flex items-start gap-3">
      <div style={{ width }}>
        <PlayerCard tier={tier} team={team} firstName={player?.first_name ?? 'Yassine'} lastName={player?.last_name ?? 'Benali'} position={player?.position} captain={player?.is_captain}
          photoUrl={player?.photo_url} cutoutUrl={player?.photo_cutout_url} rating={tier === 'platinum' ? 312 : tier === 'gold' ? 248 : 176} ratingLabel="XP" rank={tier === 'platinum' ? 1 : tier === 'gold' ? 7 : 15}
          front={[{ label: 'MJ', value: 9 }, { label: 'BUT', value: tier === 'platinum' ? 14 : 6 }, { label: 'PAS', value: 5 }, { label: 'CJ', value: 1 }]} backTitle="Statistiques" back={[]} />
      </div>
      <div style={{ width }}><TeamCard team={team} {...d} tier={tier} /></div>
    </div>
  )
}

export default function CardBoard() {
  const { db } = useData()
  const comps = useSeasonCompetitions()
  const sen = useSeniorityMap()
  useEffect(() => { const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m); return () => m.remove() }, [])
  const picks = useMemo(() => {
    const teams = db.Team.filter((t) => comps.some((c) => c.team_ids?.includes(t.id)))
    return SENIORITY_ORDER.map((tier, i) => {
      const team = teams.find((t) => sen.get(t.id)?.tier === tier) ?? teams[i]
      const roster = db.Player.filter((p) => p.team_id === team?.id)
      return { tier, team, player: roster.find((p) => p.photo_cutout_url) ?? roster[0] }
    }).filter((x) => x.team)
  }, [db.Team, db.Player, comps, sen])
  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl font-black">Planche des cartes · Platinum / Gold / Silver</h1>
      <TierLegendCards />
      <section>
        <h2 className="mb-4 text-lg font-bold">Taille réelle (ordinateur)</h2>
        <div className="flex flex-wrap gap-8">
          {picks.map((x) => <div key={x.tier}><p className="mb-2 text-sm text-muted-foreground">{SENIORITY_LABEL[x.tier]}</p><Pair tier={x.tier} team={x.team!} player={x.player} width={260} /></div>)}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-bold">Taille mobile (grille 2 colonnes, 375 px)</h2>
        <div className="flex flex-wrap gap-6">
          {picks.map((x) => <div key={x.tier}><p className="mb-2 text-sm text-muted-foreground">{SENIORITY_LABEL[x.tier]}</p><Pair tier={x.tier} team={x.team!} player={x.player} width={160} /></div>)}
        </div>
      </section>
    </div>
  )
}
