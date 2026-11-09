// Génération des visuels d'un match (navigateur) : données → modèles → canvas → PNG.
import type { Match, Settings } from '@/types/entities'
import type { LeagueData } from '@/lib/stats'
import { LEAGUE } from '@/config/league'
import { resolveVisualsConfig, type VisualsConfig } from './config'
import { buildMvpModel, buildResultModel, captionText, matchVisualHash, type VisualData } from './model'
import { canvasToPng, renderMvp, renderResult, renderStory } from './render'

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
