import { PlayerCard } from './PlayerCard'
import { RookieBadge } from '@/components/league/Bits'
import { useLookup } from '@/hooks/useData'
import { isRookie, type PlayerXP, type Ranked } from '@/lib/stats'
import { POSITION_LONG } from '@/lib/format'
import { splitName, type IPGEntry } from '@/lib/ipg'
import type { Player, Team } from '@/types/entities'

/** Carte d'un joueur au classement XP */
export function XPCard({ r, player: p, team: t, className }: { r: Ranked<PlayerXP>; player: Player; team?: Team | null; className?: string }) {
  const s = r.item
  const gk = p.position === 'GK'
  return (
    <PlayerCard
      className={className}
      firstName={p.first_name} lastName={p.last_name} position={p.position} team={t} photoUrl={p.photo_url}
      rating={s.xp} ratingLabel="XP" rank={r.rank} delta={r.delta}
      badge={isRookie(p) ? <RookieBadge /> : undefined}
      front={gk
        ? [{ label: 'MJ', value: s.matches }, { label: 'ARR', value: s.saves, hint: 'Arrêts' }, { label: 'CS', value: s.clean_sheets, hint: 'Clean sheets' }, { label: 'BE', value: s.conceded, hint: 'Buts encaissés' }]
        : [{ label: 'MJ', value: s.matches }, { label: 'BUT', value: s.goals }, { label: 'PAS', value: s.assists, hint: 'Passes décisives' }, { label: 'CJ', value: s.yellow, hint: 'Cartons jaunes' }]}
      backTitle={`${POSITION_LONG[p.position]} · rang XP n°${r.rank}`}
      back={[
        { label: 'Matchs avec stats', value: s.matches },
        { label: 'Victoires / nuls / défaites', value: `${s.wins} / ${s.draws} / ${s.losses}` },
        { label: 'Buts', value: s.goals },
        { label: 'Passes décisives', value: s.assists },
        ...(gk || s.gk_matches ? [{ label: 'Arrêts', value: s.saves }, { label: 'Clean sheets', value: s.clean_sheets }, { label: 'Buts encaissés', value: s.conceded }] : []),
        { label: 'Cartons jaunes / rouges', value: `${s.yellow} / ${s.red}` },
      ]}
      href={`/joueurs/${p.id}`}
    />
  )
}

/** Carte d'un joueur au classement IPG */
export function IPGCard({ e, className }: { e: IPGEntry; className?: string }) {
  const { player, team } = useIPGLinks(e)
  const n = splitName(e.name)
  return (
    <PlayerCard
      className={className}
      firstName={player?.first_name ?? n.first} lastName={player?.last_name ?? n.last} position={player?.position}
      team={team} teamName={e.team.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase())} photoUrl={player?.photo_url}
      rating={e.ipg.toFixed(1)} ratingLabel="IPG" rank={e.rank}
      front={[{ label: 'BUT', value: e.goals }, { label: 'PAS', value: e.assists, hint: 'Passes décisives' }, { label: 'CONT', value: `${Math.round(e.contribution)}%`, hint: 'Part des buts de l’équipe' }, { label: 'VIC', value: `${Math.round(e.win_pct)}%`, hint: 'Victoires de l’équipe' }]}
      backTitle={`Indice de performance · n°${e.rank}`}
      back={[
        { label: 'Buts / passes', value: `${e.goals} / ${e.assists}` },
        { label: 'Contribution aux buts', value: `${e.contribution.toFixed(1)} %` },
        { label: 'Victoires de l’équipe', value: `${e.win_pct.toFixed(1)} %` },
        { label: 'Buts / passes décisifs', value: `${e.clutch_goals} / ${e.clutch_assists}`, hint: 'Actions « clutch »' },
        { label: 'Score décisif', value: e.clutch_score },
        { label: 'Adversité', value: `${e.adversity.toFixed(0)} %` },
        { label: 'Pénalité cartons', value: `−${e.card_penalty}` },
        { label: 'IPG brut', value: Math.round(e.raw) },
      ]}
      backNote="IPG ramené sur 100 (le meilleur joueur = 100)."
      href={player ? `/joueurs/${player.id}` : undefined}
    />
  )
}

function useIPGLinks(e: IPGEntry) {
  const L = useLookup()
  const player = e.player_id ? L.player.get(e.player_id) : undefined
  return { player, team: player ? L.team.get(player.team_id) : undefined }
}

