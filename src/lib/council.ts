// Conseil de discipline (Art. 19) et procès-verbaux (Art. 17.7) — fonctions pures (testées dans council.test.ts).
// Seule la sanction RETENUE apparaît dans un PV ou sur le site : jamais les voix ni le détail des votes (Art. 19.6, 19.9).
import { COUNCIL, sanctionLabel, voteClosesAt, votingTeams } from './reglement'
import type { Competition, DisciplineCase, Match, Player, ProcesVerbal, Team } from '@/types/entities'

export const PV_KIND_LABEL: Record<ProcesVerbal['kind'], string> = {
  discipline: 'Conseil de discipline', reclamation: 'Réclamation', forfait: 'Forfait', autre: 'Décision d’Ardentia',
}

/** Équipes MASTER / CHALLENGER de la saison (compétitions créées à la répartition de la pré-saison). */
export function seasonDivisions(comps: Pick<Competition, 'season_id' | 'phase' | 'team_ids'>[], seasonId: string) {
  const of = (phase: Competition['phase']) => comps.filter((c) => c.season_id === seasonId && c.phase === phase).flatMap((c) => c.team_ids ?? [])
  const master = of('gold'), challenger = of('silver')
  return master.length || challenger.length ? { master, challenger } : {}
}

/** Capitaine d'une équipe : capitaine désigné sur la fiche équipe, sinon le joueur marqué capitaine. */
export function captainOf<P extends Pick<Player, 'id' | 'team_id' | 'is_captain'>>(team: Pick<Team, 'id' | 'captain_player_id'>, players: P[]): P | undefined {
  return players.find((p) => p.id === team.captain_player_id) ?? players.find((p) => p.team_id === team.id && p.is_captain)
}

/** Capitaines appelés à voter pour une affaire (Art. 19.3). */
export function councilVoters(teamId: string, seasonTeams: string[], comps: Pick<Competition, 'season_id' | 'phase' | 'team_ids'>[], seasonId: string) {
  return votingTeams(teamId, seasonTeams, seasonDivisions(comps, seasonId))
}

/** Numéro de PV : année de la saison + rang chronologique (« PV 2026-03 »). */
export function pvNumber(pv: Pick<ProcesVerbal, 'id' | 'date'>, all: Pick<ProcesVerbal, 'id' | 'date'>[], year: string) {
  const i = [...all].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).findIndex((x) => x.id === pv.id)
  return `PV ${year}-${String(i + 1).padStart(2, '0')}`
}

const longDate = (iso?: string) => (iso ? new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const longDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—')

export interface PvContext {
  season: string
  player?: Pick<Player, 'first_name' | 'last_name'>
  team?: Pick<Team, 'name'>
  match?: Pick<Match, 'date'> & { label: string }
}

/** Texte du PV d'une décision du conseil (format WhatsApp : *gras*). Ne contient que la sanction retenue. */
export function councilPvText(c: DisciplineCase, ctx: PvContext): string {
  const who = `${ctx.player ? `${ctx.player.first_name} ${ctx.player.last_name}` : 'Joueur'}${ctx.team ? ` (${ctx.team.name})` : ''}`
  const decision = c.decision ? sanctionLabel(c.decision, c.decision_matches ?? c.proposed_matches) : 'en attente'
  const lines = [
    `*PROCÈS-VERBAL — CONSEIL DE DISCIPLINE*`,
    `Ardentia Football · ${ctx.season}`,
    `Décision du ${longDate(c.decided_at)}`,
    '',
    `*Joueur concerné* : ${who}`,
    ctx.match ? `*Match* : ${ctx.match.label}, ${longDate(ctx.match.date)}` : '',
    `*Faits* : ${c.incident.trim()}`,
    '',
    `*Sanctions soumises au vote* (Art. ${COUNCIL.artSanctions}) : avertissement ou suspension de ${c.proposed_matches} match${c.proposed_matches > 1 ? 's' : ''}.`,
    c.vote_opened_at ? `*Vote* : ouvert le ${longDateTime(c.vote_opened_at)}, clos le ${longDateTime(voteClosesAt(c.vote_opened_at))} (${COUNCIL.voteHours} h, Art. ${COUNCIL.artVote}).` : '',
    '',
    `*DÉCISION RETENUE : ${decision.toUpperCase()}*`,
    c.decision === 'suspension' ? `La suspension se purge sur les prochains matchs disputés par l’équipe à partir de cette décision. Le joueur ne peut pas figurer sur la feuille de match pendant ce temps.` : '',
    '',
    `Seule la sanction retenue est communiquée, sans le détail des votes (Art. ${COUNCIL.artCommunication}). Cette décision est définitive.`,
  ]
  return lines.filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== '')).join('\n').trim()
}

/** Gabarit d'un PV hors conseil (réclamation, forfait…). */
export function blankPvText(kind: ProcesVerbal['kind'], season: string, date: string, title: string) {
  return [`*PROCÈS-VERBAL — ${PV_KIND_LABEL[kind].toUpperCase()}*`, `Ardentia Football · ${season}`, `${longDate(date)}`, '', `*Objet* : ${title}`, '', '*Faits* : ', '', '*Décision* : ', '', `PV établi conformément à l’Art. ${COUNCIL.artPv} et envoyé dans le groupe WhatsApp des capitaines.`].join('\n')
}

/** Texte sans mise en forme WhatsApp (PDF, e-mail). */
export const plainPv = (t: string) => t.replace(/\*([^*\n]+)\*/g, '$1')
