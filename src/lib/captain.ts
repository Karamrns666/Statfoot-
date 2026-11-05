// Un seul capitaine par équipe : la fiche joueur (is_captain) fait foi, l'équipe (captain_player_id) est synchronisée.
import { base44 } from '@/api/base44Client'
import type { Player, Team } from '@/types/entities'

export interface CaptainUpdates { players: { id: string; is_captain: boolean }[]; teams: { id: string; captain_player_id: string | null }[] }

/**
 * Mises à jour pour refléter « le joueur `playerId` (équipe `teamId`) est / n'est pas capitaine ». Fonction pure.
 * Si oui : il devient le seul capitaine de son équipe. Dans tous les cas, une autre équipe qui le désignait est libérée.
 */
export function captainUpdates(players: Player[], teams: Team[], playerId: string, teamId: string, isCaptain: boolean): CaptainUpdates {
  const out: CaptainUpdates = { players: [], teams: [] }
  for (const p of players) {
    const should = p.id === playerId ? isCaptain : p.team_id === teamId && isCaptain ? false : !!p.is_captain
    if (!!p.is_captain !== should) out.players.push({ id: p.id, is_captain: should })
  }
  for (const t of teams) {
    const cur = t.captain_player_id ?? null
    const next = t.id === teamId ? (isCaptain ? playerId : cur === playerId ? null : cur) : cur === playerId ? null : cur
    if (cur !== next) out.teams.push({ id: t.id, captain_player_id: next })
  }
  return out
}

export async function syncCaptain(playerId: string, teamId: string, isCaptain: boolean) {
  const [players, teams] = await Promise.all([base44.entities.Player.list(), base44.entities.Team.list()])
  const u = captainUpdates(players, teams, playerId, teamId, isCaptain)
  for (const p of u.players) await base44.entities.Player.update(p.id, { is_captain: p.is_captain })
  for (const t of u.teams) await base44.entities.Team.update(t.id, { captain_player_id: t.captain_player_id ?? undefined })
}
