// Visuels réseaux sociaux : configuration, aperçu (URL d'objet), génération + mise en cache, génération automatique.
import { useEffect, useMemo, useRef, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { deleteFile } from '@/api/fileStore'
import { useData } from './useData'
import { configFromSettings, matchVisualPlan, renderMatchPng, renderMatchVisual } from '@/lib/visuals'
import { canvasToPng } from '@/lib/visuals/render'
import type { VisualsConfig } from '@/lib/visuals/config'
import type { LeagueData } from '@/lib/stats'
import type { Match } from '@/types/entities'

/** Les visuels sont générés automatiquement pour les matchs clôturés à partir de cette date (les plus anciens : à la demande). */
export const AUTO_VISUALS_SINCE = '2026-11-09'

export function useVisualsConfig(): VisualsConfig {
  const { settings } = useData()
  return useMemo(() => configFromSettings(settings), [settings])
}

/** Aperçu d'un visuel (rendu dans le navigateur) — URL d'objet, régénérée quand le contenu change. */
export function useVisualPreview(kind: 'resultat' | 'mvp', match: Match | undefined, opts: { showZones?: boolean; cfg?: VisualsConfig; enabled?: boolean } = {}) {
  const { league } = useData()
  const base = useVisualsConfig()
  const cfg = opts.cfg ?? base
  const plan = useMemo(() => (match ? matchVisualPlan(league, match, cfg) : undefined), [league, match, cfg])
  const [state, setState] = useState<{ url?: string; busy: boolean; error?: string }>({ busy: false })
  const key = `${kind}:${plan?.hash}:${opts.showZones ? 1 : 0}:${JSON.stringify(cfg).length}:${match?.visual_mvp_template}`
  useEffect(() => {
    if (!match || opts.enabled === false || (kind === 'mvp' && !plan?.mvp)) { setState({ busy: false }); return }
    let alive = true, url: string | undefined
    setState((s) => ({ ...s, busy: true, error: undefined }))
    renderMatchVisual(kind, league, match, cfg, { showZones: opts.showZones })
      .then((c) => (c ? canvasToPng(c) : null))
      .then((b) => { if (!alive) return; url = b ? URL.createObjectURL(b) : undefined; setState({ url, busy: false }) })
      .catch((e: Error) => alive && setState({ busy: false, error: e.message }))
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [key, opts.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, plan }
}

const bare = (u?: string) => u?.split('?')[0]

/** Génère les 2 visuels, les range (IndexedDB) et note la version dans le match (URL …?v=N contre les vieux caches). */
export async function generateAndStoreVisuals(league: LeagueData, match: Match, cfg: VisualsConfig) {
  const plan = matchVisualPlan(league, match, cfg)
  const [res, mvp] = await Promise.all([renderMatchPng('resultat', league, match, cfg), plan.mvp ? renderMatchPng('mvp', league, match, cfg) : Promise.resolve(null)])
  const { storeFile } = await import('@/api/fileStore')
  const version = (match.visuals?.version ?? 0) + 1
  const resultat_url = res ? `${await storeFile(res, 'visuel-resultat')}?v=${version}` : undefined
  const mvp_url = mvp ? `${await storeFile(mvp, 'visuel-mvp')}?v=${version}` : undefined
  const old = match.visuals
  await base44.entities.Match.update(match.id, { visuals: { hash: plan.hash, version, resultat_url, mvp_url, generated_at: new Date().toISOString() } })
  void deleteFile(bare(old?.resultat_url)); void deleteFile(bare(old?.mvp_url))
  return { resultat_url, mvp_url, version }
}

/** À (re)générer : match terminé dont le contenu affiché a changé depuis la dernière génération. */
export function needsVisuals(m: Match, hash: string) {
  if (m.status !== 'finished' || m.published === false) return false
  if (m.visuals) return m.visuals.hash !== hash
  return (m.validated_at ?? '') >= AUTO_VISUALS_SINCE
}

/** Génération automatique (admin connecté) : dès qu'un match passe « Terminé », et à chaque correction de score / buteurs / homme du match. */
export function useAutoVisuals(enabled: boolean) {
  const { db, league } = useData()
  const cfg = useVisualsConfig()
  const running = useRef(false)
  const [tick, setTick] = useState(0)
  const todo = useMemo(() => (enabled ? db.Match.filter((m) => m.status === 'finished' && (m.visuals || (m.validated_at ?? '') >= AUTO_VISUALS_SINCE)).filter((m) => needsVisuals(m, matchVisualPlan(league, m, cfg).hash)) : []), [enabled, db.Match, league, cfg])
  useEffect(() => {
    if (!enabled || running.current || !todo.length) return
    running.current = true
    const m = todo[0]
    // petite attente : laisse l'admin finir ses corrections avant de dessiner
    const t = window.setTimeout(() => {
      generateAndStoreVisuals(league, m, cfg).catch(() => undefined).finally(() => { running.current = false; setTick((x) => x + 1) })
    }, 1500)
    return () => { window.clearTimeout(t); running.current = false }
  }, [enabled, todo.length, todo[0]?.id, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  return { pending: todo.length }
}
