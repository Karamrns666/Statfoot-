// Génération des visuels d'un match (navigateur) : données → modèles → canvas → PNG.
import type { Match, Settings } from '@/types/entities'
import type { LeagueData } from '@/lib/stats'
import { LEAGUE } from '@/config/league'
import { resolveVisualsConfig, type VisualsConfig } from './config'
import { buildMvpModel, buildResultModel, captionText, matchVisualHash, type VisualData } from './model'
import { canvasToPng, renderMvp, renderResult, renderStory } from './render'
import { competitionTitle, roundMatches, TOP_LABEL, weeklyCaption, weeklyResults, weeklyStandings, weeklyTop, type TopKind } from './weekly'
import { renderTop10, renderWeeklyResults, renderWeeklyStandings } from './weeklyRender'
import type { SeniorityTier } from '@/lib/seniority'
import { isPlayed } from '@/lib/standings'

export function visualData(league: LeagueData, match: Match): VisualData {
  return {
    match,
    teams: new Map(league.teams.map((t) => [t.id, t])),
    players: new Map(league.players.map((p) => [p.id, p])),
    competition: league.competitions.find((c) => c.id === match.competition_id),
    events: league.events.filter((e) => e.match_id === match.id),
  }
}

export const configFromSettings = (settings?: Partial<Settings>) => resolveVisualsConfig(settings?.visuals_config)
export const mvpTemplateOf = (m: Match) => m.visual_mvp_template ?? 'mvp'

/** Tout ce qu'il faut pour un match : modèles, empreinte, texte de publication. */
export function matchVisualPlan(league: LeagueData, match: Match, cfg: VisualsConfig) {
  const d = visualData(league, match)
  const result = buildResultModel(d)
  const mvp = match.motm_player_id ? buildMvpModel({ ...d, xp: league }, match.motm_player_id) : undefined
  const motm = match.motm_player_id ? d.players.get(match.motm_player_id) : undefined
  return { d, result, mvp, caption: captionText(d, motm), hash: matchVisualHash(d, cfg.version, mvpTemplateOf(match), mvp) }
}

export async function renderMatchVisual(kind: 'resultat' | 'mvp', league: LeagueData, match: Match, cfg: VisualsConfig, opts: { showZones?: boolean; story?: boolean; leagueLogo?: string } = {}) {
  const plan = matchVisualPlan(league, match, cfg)
  let c: HTMLCanvasElement
  if (kind === 'resultat') c = await renderResult(plan.result, cfg, { leagueLogo: opts.leagueLogo ?? LEAGUE.logo, showZones: opts.showZones })
  else if (plan.mvp) c = await renderMvp(plan.mvp, cfg, mvpTemplateOf(match), { showZones: opts.showZones })
  else return null
  if (opts.story) c = await renderStory(c, kind === 'resultat' ? cfg.templates.resultat : cfg.templates[mvpTemplateOf(match)])
  return c
}

export async function renderMatchPng(kind: 'resultat' | 'mvp', league: LeagueData, match: Match, cfg: VisualsConfig, opts: { story?: boolean } = {}) {
  const c = await renderMatchVisual(kind, league, match, cfg, opts)
  return c ? canvasToPng(c) : null
}

export function visualFileName(kind: 'resultat' | 'mvp', league: LeagueData, match: Match, story = false) {
  const t = (id: string) => (league.teams.find((x) => x.id === id)?.short_name ?? 'eq').toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `mbl-j${match.round ?? 0}-${t(match.home_team_id)}-${t(match.away_team_id)}-${kind === 'resultat' ? 'resultat' : 'homme-du-match'}${story ? '-story' : ''}.png`
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// ---------------------------------------------------------------------------
//  Visuels de la semaine (compétition + journée)
// ---------------------------------------------------------------------------
export interface WeeklyVisual { key: string; label: string; fileName: string; caption: string; aspect: string; render: (opts?: { showZones?: boolean }) => Promise<HTMLCanvasElement> }

/** Tous les visuels d'une journée : résultats, classement, 3 Top 10 (+ résultat et homme du match de chaque match). */
export function weeklyPlan(league: LeagueData, competitionId: string, round: number, cfg: VisualsConfig, tierOf: (teamId: string) => SeniorityTier | undefined = () => undefined): WeeklyVisual[] {
  const comp = league.competitions.find((c) => c.id === competitionId)
  const title = competitionTitle(comp)
  const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const results = weeklyResults(league, competitionId, round)
  const standings = weeklyStandings(league, competitionId, round).map((r) => ({ ...r, tier: tierOf(r.team_id) }))
  const out: WeeklyVisual[] = [
    { key: 'resultats', label: 'Résultats de la journée', aspect: '4 / 5', fileName: `mbl-${slug}-j${round}-resultats.png`,
      caption: weeklyCaption('resultats', title, round, results.map((r) => `${r.home.name} ${r.score} ${r.away.name}${r.sub ? ` (${r.sub})` : ''}`)),
      render: (o) => renderWeeklyResults(results, cfg, { title: 'RÉSULTATS', subtitle: `${title} · J${round}`, barLabel: `RÉSULTATS · J${round}`, showZones: o?.showZones }) },
    { key: 'classement', label: 'Classement', aspect: '4 / 5', fileName: `mbl-${slug}-j${round}-classement.png`,
      caption: weeklyCaption('classement', title, round, standings.slice(0, 3).map((r) => `${r.rank}. ${r.name} — ${r.points} pts`)),
      render: (o) => renderWeeklyStandings(standings, cfg, { title: 'CLASSEMENT', subtitle: `${title} · APRÈS LA J${round}`, showZones: o?.showZones }) },
  ]
  for (const kind of ['xp', 'assists', 'keepers'] as TopKind[]) {
    const top = weeklyTop(league, competitionId, round, kind)
    out.push({ key: `top-${kind}`, label: kind === 'xp' ? 'Top 10 joueurs (XP)' : kind === 'assists' ? 'Top 10 passeurs' : 'Top 10 gardiens', aspect: '4 / 5', fileName: `mbl-${slug}-j${round}-${TOP_LABEL[kind].toLowerCase().replace(/ /g, '-')}.png`,
      caption: weeklyCaption(kind, title, round, top.slice(0, 3).map((e) => `${e.rank}. ${e.player.first_name} ${e.player.last_name} (${e.team?.short_name ?? ''}) — ${e.display}`)),
      render: (o) => renderTop10(top, cfg, { title: TOP_LABEL[kind], subtitle: `${title} · J${round}`, showZones: o?.showZones }) })
  }
  for (const m of roundMatches(league, competitionId, round).filter(isPlayed)) {
    const plan = matchVisualPlan(league, m, cfg)
    const vs = `${plan.result.home.short || plan.result.home.name} ${plan.result.homeScore}-${plan.result.awayScore} ${plan.result.away.short || plan.result.away.name}`
    out.push({ key: `res-${m.id}`, label: `Résultat · ${vs}`, aspect: '1 / 1', fileName: visualFileName('resultat', league, m), caption: plan.caption, render: async (o) => (await renderMatchVisual('resultat', league, m, cfg, { showZones: o?.showZones }))! })
    if (m.motm_player_id) out.push({ key: `mvp-${m.id}`, label: `Homme du match · ${vs}`, aspect: '1 / 1', fileName: visualFileName('mvp', league, m), caption: plan.caption, render: async (o) => (await renderMatchVisual('mvp', league, m, cfg, { showZones: o?.showZones }))! })
  }
  return out
}
