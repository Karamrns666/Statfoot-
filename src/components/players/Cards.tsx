import { PlayerCard } from './PlayerCard'
import { RookieBadge } from '@/components/league/Bits'
import { useLookup } from '@/hooks/useData'
import { usePlayerBadges } from '@/hooks/useStats'
import { SEASON_2025_ID } from '@/api/seed/season2025'
import type { PlayerXP, Ranked } from '@/lib/stats'
import { IPG_RANKING, splitName, type IPGEntry } from '@/lib/ipg'
import { useSeason } from '@/hooks/useSeason'
import type { Player, Team } from '@/types/entities'
import { useRookie, useTeamSeniority } from '@/hooks/useSeniority'
import { SeniorityLegend } from '@/components/league/SeniorityBadge'

/** Carte d'un joueur au classement XP */
export function XPCard({ r, player: p, team: t, className, faceOnly, ipg: ipgOverride }: { r: Ranked<PlayerXP>; player: Player; team?: Team | null; className?: string; faceOnly?: boolean; ipg?: number | string }) {
  const s = r.item
  const gk = p.position === 'GK'
  const bs = usePlayerBadges().get(p.id)
  const { scopeSeasonId } = useSeason()
  const tier = useTeamSeniority(t?.id)?.tier
  const rookie = useRookie()
  // l'IPG n'existe que pour la saison 2025-2026 (fichier de la ligue)
  const ipg = ipgOverride ?? (scopeSeasonId === SEASON_2025_ID ? IPG_RANKING.find((e) => e.player_id === p.id)?.ipg : undefined)
  return (
    <PlayerCard
      className={className} faceOnly={faceOnly}
      tier={tier} medals={bs?.unlocked} badgeTotal={bs?.total}
      firstName={p.first_name} lastName={p.last_name} position={p.position} captain={p.is_captain || t?.captain_player_id === p.id} team={t} photoUrl={p.photo_url} cutoutUrl={p.photo_card_mode === 'original' ? undefined : p.photo_cutout_url} ipg={ipg}
      rating={s.xp} ratingLabel="XP" rank={r.rank || undefined} delta={r.delta}
      badge={rookie(p) ? <RookieBadge /> : undefined}
      front={gk
        ? [{ label: 'MJ', value: s.matches }, { label: 'ARR', value: s.saves, hint: 'Arrêts' }, { label: 'CS', value: s.clean_sheets, hint: 'Clean sheets' }, { label: 'BE', value: s.conceded, hint: 'Buts encaissés' }]
        : [{ label: 'MJ', value: s.matches }, { label: 'BUT', value: s.goals }, { label: 'PAS', value: s.assists, hint: 'Passes décisives' }, { label: 'CJ', value: s.yellow, hint: 'Cartons jaunes' }]}
      backTitle={gk ? 'Gardien' : 'Statistiques'}
      back={[
        { label: 'V / N / D', value: `${s.wins} / ${s.draws} / ${s.losses}`, hint: 'Victoires / nuls / défaites' },
        { label: 'Buts', value: s.goals },
        { label: 'Passes décisives', value: s.assists },
        ...(gk || s.gk_matches ? [{ label: 'Arrêts', value: s.saves }, { label: 'Clean sheets', value: s.clean_sheets }, { label: 'Buts encaissés', value: s.conceded }] : []),
        { label: 'Cartons J / R', value: `${s.yellow} / ${s.red}`, hint: 'Cartons jaunes / rouges' },
      ]}
      href={`/joueurs/${p.id}`}
    />
  )
}

/** Carte d'un joueur au classement IPG */
export function IPGCard({ e, className }: { e: IPGEntry; className?: string }) {
  const { player, team } = useIPGLinks(e)
  const n = splitName(e.name)
  const bs = usePlayerBadges(SEASON_2025_ID).get(player?.id ?? '')
  const tier = useTeamSeniority(team?.id)?.tier
  return (
    <PlayerCard
      className={className}
      tier={tier} medals={bs?.unlocked} badgeTotal={bs?.total}
      firstName={player?.first_name ?? n.first} lastName={player?.last_name ?? n.last} position={player?.position}
      team={team} teamName={e.team.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase())} photoUrl={player?.photo_url} cutoutUrl={player?.photo_card_mode === 'original' ? undefined : player?.photo_cutout_url}
      rating={e.ipg.toFixed(1)} ratingLabel="IPG" rank={e.rank}
      front={[{ label: 'BUT', value: e.goals }, { label: 'PAS', value: e.assists, hint: 'Passes décisives' }, { label: 'CONT', value: `${Math.round(e.contribution)}%`, hint: 'Part des buts de l’équipe' }, { label: 'VIC', value: `${Math.round(e.win_pct)}%`, hint: 'Victoires de l’équipe' }]}
      backTitle="Indice de performance"
      back={[
        { label: 'Buts / passes', value: `${e.goals} / ${e.assists}` },
        { label: 'Contribution aux buts', value: `${e.contribution.toFixed(1)} %` },
        { label: 'Victoires de l’équipe', value: `${e.win_pct.toFixed(1)} %` },
        { label: 'Buts / passes décisifs', value: `${e.clutch_goals} / ${e.clutch_assists}`, hint: 'Actions « clutch »' },
        { label: 'Adversité', value: `${e.adversity.toFixed(0)} %` },
        { label: 'Pénalité cartons', value: `−${e.card_penalty}` },
        { label: 'IPG brut', value: Math.round(e.raw) },
      ]}
      backNote={bs?.unlocked.length ? undefined : 'IPG ramené sur 100 (le meilleur joueur = 100).'}
      href={player ? `/joueurs/${player.id}` : undefined}
    />
  )
}

function useIPGLinks(e: IPGEntry) {
  const L = useLookup()
  const player = e.player_id ? L.player.get(e.player_id) : undefined
  return { player, team: player ? L.team.get(player.team_id) : undefined }
}


/** Légende des couleurs de carte : ancienneté du club */
export function MaterialLegend({ className }: { className?: string }) {
  return <SeniorityLegend cards className={className} />
}
