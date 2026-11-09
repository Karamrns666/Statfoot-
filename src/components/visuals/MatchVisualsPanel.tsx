// Visuels réseaux sociaux d'un match terminé : aperçu « Résultat » + « Homme du match » côte à côte,
// téléchargement PNG (carré ou story), régénération, choix du modèle homme du match, texte de publication à copier.
import { useState } from 'react'
import { Check, Copy, Download, Image as ImageIcon, Loader2, RefreshCw, Smartphone } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { generateAndStoreVisuals, useVisualPreview, useVisualsConfig } from '@/hooks/useMatchVisuals'
import { downloadBlob, renderMatchPng, visualFileName } from '@/lib/visuals'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/entities'

export function MatchVisualsPanel({ match, compact }: { match: Match; compact?: boolean }) {
  const { league } = useData()
  const cfg = useVisualsConfig()
  const res = useVisualPreview('resultat', match)
  const mvp = useVisualPreview('mvp', match)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const caption = res.plan?.caption ?? ''
  const upToDate = match.visuals?.hash === res.plan?.hash

  const download = async (kind: 'resultat' | 'mvp', story = false) => {
    setBusy(`${kind}${story}`)
    try { const b = await renderMatchPng(kind, league, match, cfg, { story }); if (b) downloadBlob(b, visualFileName(kind, league, match, story)) }
    catch (e) { toast.error(`Image impossible : ${(e as Error).message}`) } finally { setBusy(null) }
  }
  const regenerate = async () => {
    setBusy('regen')
    try { const r = await generateAndStoreVisuals(league, match, cfg); toast.success(`Visuels régénérés (version ${r.version})`) }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(caption); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { toast.error('Copie impossible : sélectionnez le texte') } }

  return (
    <div className="space-y-3">
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
        <Preview title="Résultat" url={res.url} busy={res.busy} error={res.error}>
          <Button size="sm" onClick={() => download('resultat')} disabled={!!busy}>{busy === 'resultatfalse' ? <Loader2 className="animate-spin" /> : <Download />}Télécharger PNG</Button>
          <Button size="sm" variant="outline" onClick={() => download('resultat', true)} disabled={!!busy} title="Format story 1080 × 1920"><Smartphone />Story</Button>
        </Preview>
        <Preview title="Homme du match" url={mvp.url} busy={mvp.busy} error={mvp.error} empty={!match.motm_player_id ? 'Désignez l’homme du match pour générer ce visuel.' : undefined}>
          <Button size="sm" onClick={() => download('mvp')} disabled={!!busy || !match.motm_player_id}>{busy === 'mvpfalse' ? <Loader2 className="animate-spin" /> : <Download />}Télécharger PNG</Button>
          <Button size="sm" variant="outline" onClick={() => download('mvp', true)} disabled={!!busy || !match.motm_player_id}><Smartphone />Story</Button>
          <div className="flex rounded-lg border border-input p-0.5" role="radiogroup" aria-label="Modèle homme du match">
            {(['mvp', 'mvp2'] as const).map((v, i) => (
              <button key={v} role="radio" aria-checked={(match.visual_mvp_template ?? 'mvp') === v} onClick={() => base44.entities.Match.update(match.id, { visual_mvp_template: v })}
                className={cn('cursor-pointer rounded-md px-2 py-1 text-xs font-semibold', (match.visual_mvp_template ?? 'mvp') === v ? 'bg-neon/20 text-neon' : 'text-muted-foreground')}>Modèle {i + 1}</button>
            ))}
          </div>
        </Preview>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Button size="sm" variant="outline" onClick={regenerate} disabled={!!busy}>{busy === 'regen' ? <Loader2 className="animate-spin" /> : <RefreshCw />}Régénérer</Button>
        <span>{match.visuals ? (upToDate ? `Version ${match.visuals.version} à jour` : `Version ${match.visuals.version} — mise à jour automatique en cours…`) : 'Générés à la demande pour ce match.'}</span>
      </div>
      <div className="rounded-xl border border-white/10 bg-night-950/40 p-3">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Texte de publication (Instagram / LinkedIn)</span>
          <Button size="sm" variant="outline" onClick={copy}>{copied ? <Check className="text-win" /> : <Copy />}{copied ? 'Copié' : 'Copier'}</Button></div>
        <textarea readOnly value={caption} rows={Math.min(8, caption.split('\n').length + 1)} className="w-full resize-y rounded-lg bg-transparent font-mono text-xs leading-relaxed outline-none" aria-label="Texte de publication" onFocus={(e) => e.currentTarget.select()} />
      </div>
    </div>
  )
}

function Preview({ title, url, busy, error, empty, children }: { title: string; url?: string; busy: boolean; error?: string; empty?: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-xl border border-white/10 bg-night-950/40 p-2">
      <figcaption className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><ImageIcon className="size-4 text-neon" />{title}</figcaption>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
        {url && <img src={url} alt={`Visuel ${title}`} className="size-full object-contain" />}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-night-950/50"><Loader2 className="size-6 animate-spin text-neon" /></div>}
        {!url && !busy && <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted-foreground">{error ? `Erreur : ${error}` : empty ?? '—'}</p>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">{children}</div>
    </figure>
  )
}
