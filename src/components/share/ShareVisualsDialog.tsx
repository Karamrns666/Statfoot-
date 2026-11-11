// Visuels Instagram 1080×1350 générés côté navigateur (html-to-image) : BUT !, score final, homme du match.
import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Loader2 } from 'lucide-react'
import type { Match, MatchEvent } from '@/types/entities'
import { useData, useLookup } from '@/hooks/useData'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/league/FilterSelect'
import { fmtMinute, fmtScore } from '@/lib/matchEngine'
import { playerName } from '@/lib/format'
import { computePlayerXP, matchScorers } from '@/lib/stats'
import { VisualFrame, VisualTeam } from './VisualFrame'

type Kind = 'goal' | 'final' | 'motm'

export function ShareVisualsDialog({ open, onOpenChange, match }: { open: boolean; onOpenChange: (o: boolean) => void; match: Match }) {
  const { db, settings } = useData()
  const L = useLookup()
  const goals = db.MatchEvent.filter((e) => e.match_id === match.id && (e.type === 'goal' || e.type === 'own_goal'))
  const [kind, setKind] = useState<Kind>(match.status === 'live' ? 'goal' : 'final')
  const [goalId, setGoalId] = useState(goals.at(-1)?.id ?? '')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const download = async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const url = await toPng(ref.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true })
      const a = document.createElement('a'); a.href = url; a.download = `${settings.short_name ?? 'mbl'}-${kind}-${match.id}.png`; a.click()
    } finally { setBusy(false) }
  }
  const scale = 0.3
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Visuels à partager</DialogTitle><DialogDescription>Format Instagram 1080 × 1350, prêt à télécharger.</DialogDescription></DialogHeader>
        <div className="flex flex-wrap gap-2">
          {([['goal', 'BUT !'], ['final', 'Score final'], ['motm', 'Homme du match']] as const).map(([k, l]) => <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)} disabled={(k === 'goal' && !goals.length) || (k === 'motm' && !match.motm_player_id)}>{l}</Button>)}
        </div>
        {kind === 'goal' && goals.length > 0 && (
          <FilterSelect value={goalId} onChange={setGoalId} allLabel={null} className="sm:w-full" options={goals.map((g) => ({ value: g.id, label: `${fmtMinute(g.minute, g.added_minute)} · ${playerName(L.player.get(g.player_id ?? ''))}${g.type === 'own_goal' ? ' (csc)' : ''}` }))} />
        )}
        <div className="mx-auto overflow-hidden rounded-xl border border-white/10" style={{ width: 1080 * scale, height: 1350 * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1080, height: 1350 }}>
            <div ref={ref}><Visual kind={kind} match={match} goal={goals.find((g) => g.id === goalId)} /></div>
          </div>
        </div>
        <Button size="lg" onClick={download} disabled={busy} className="w-full">{busy ? <><Loader2 className="animate-spin" />Génération…</> : <><Download />Télécharger le PNG</>}</Button>
      </DialogContent>
    </Dialog>
  )
}

function Visual({ kind, match, goal }: { kind: Kind; match: Match; goal?: MatchEvent }) {
  const { db, league } = useData()
  const L = useLookup()
  const home = L.team.get(match.home_team_id), away = L.team.get(match.away_team_id)
  const comp = L.competition.get(match.competition_id)
  const subtitle = `${comp?.name ?? ''} · Journée ${match.round} · ${match.pitch ?? ''}`
  const scorers = matchScorers(match, db.MatchEvent)
  const motmX = useMemo(() => match.motm_player_id ? computePlayerXP({ ...league, matches: [match], suspensions: [], monthlyAwards: [] }, { seasonId: match.season_id }).get(match.motm_player_id) : undefined, [league, match])
  if (kind === 'goal' && goal) {
    const p = L.player.get(goal.player_id ?? ''), t = L.team.get(goal.type === 'own_goal' ? (goal.team_id === match.home_team_id ? match.away_team_id : match.home_team_id) : goal.team_id)
    const upTo = db.MatchEvent.filter((e) => e.match_id === match.id && (e.type === 'goal' || e.type === 'own_goal') && ((e.period ?? '') < (goal.period ?? '') || ((e.period === goal.period) && ((e.minute ?? 0) < (goal.minute ?? 0) || e.id === goal.id))))
    const hs = upTo.filter((e) => (e.type === 'goal' && e.team_id === match.home_team_id) || (e.type === 'own_goal' && e.team_id !== match.home_team_id)).length
    const as = upTo.length - hs
    return (
      <VisualFrame accent={t?.primary_color} subtitle={subtitle}>
        <div style={{ fontSize: 230, lineHeight: 0.9, color: '#F85A00', textShadow: '0 0 60px #F85A00aa' }} className="title-caps">BUT !</div>
        <div className="title-caps mt-6 text-white" style={{ fontSize: 86 }}>{p ? `${p.first_name} ${p.last_name}` : goal.player_name_free ?? 'Joueur inconnu'}</div>
        <div className="mt-2 font-display font-bold text-white/70" style={{ fontSize: 48 }}>{fmtMinute(goal.minute, goal.added_minute)}{goal.type === 'own_goal' ? ' · contre son camp' : goal.goal_kind === 'penalty' ? ' · penalty' : ''}</div>
        <div className="mt-16 flex items-center gap-10"><VisualTeam team={home} /><div className="num text-white" style={{ fontSize: 180 }}>{hs}-{as}</div><VisualTeam team={away} /></div>
      </VisualFrame>
    )
  }
  if (kind === 'motm' && match.motm_player_id) {
    const p = L.player.get(match.motm_player_id), t = L.team.get(p?.team_id ?? '')
    return (
      <VisualFrame accent="#facc15" subtitle={subtitle}>
        <div className="title-caps" style={{ fontSize: 80, color: '#facc15' }}>Homme du match</div>
        <div className="mt-10 flex items-center justify-center rounded-full" style={{ width: 360, height: 360, background: `radial-gradient(circle at 35% 30%, ${t?.primary_color}, #04163D)`, boxShadow: '0 0 120px #facc1588', border: '10px solid #facc15' }}>
          <span className="title-caps text-white" style={{ fontSize: 150 }}>{p?.first_name[0]}{p?.last_name[0]}</span>
        </div>
        <div className="title-caps mt-10 text-white" style={{ fontSize: 96 }}>{p?.first_name} {p?.last_name}</div>
        <div className="mt-2 font-display font-bold text-white/70" style={{ fontSize: 44 }}>{t?.name}</div>
        {motmX && <div className="mt-10 flex gap-14 font-display font-black text-white" style={{ fontSize: 64 }}><span>⚽ {motmX.goals}</span><span>🅰 {motmX.assists}</span><span style={{ color: '#F85A00' }}>{motmX.xp > 0 ? '+' : ''}{motmX.xp} XP</span></div>}
      </VisualFrame>
    )
  }
  return (
    <VisualFrame accent="#F85A00" subtitle={subtitle}>
      <div className="title-caps text-white/80" style={{ fontSize: 64 }}>{match.status === 'finished' ? 'Score final' : 'En direct'}</div>
      <div className="mt-16 flex items-center gap-12"><VisualTeam team={home} big /><VisualTeam team={away} big /></div>
      <div className="num mt-6 text-white" style={{ fontSize: 260, lineHeight: 1 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
      {match.penalties && <div className="font-display font-bold text-white/70" style={{ fontSize: 48 }}>{fmtScore(match)}</div>}
      <div className="mt-8 grid w-full grid-cols-2 gap-10 px-10 font-display font-semibold text-white/80" style={{ fontSize: 34 }}>
        <div className="text-right">{scorers.home.map((e) => <div key={e.id}>{L.player.get(e.player_id ?? '')?.last_name} {fmtMinute(e.minute, e.added_minute)}</div>)}</div>
        <div>{scorers.away.map((e) => <div key={e.id}>{L.player.get(e.player_id ?? '')?.last_name} {fmtMinute(e.minute, e.added_minute)}</div>)}</div>
      </div>
    </VisualFrame>
  )
}
