// ============================================================================
//  Match Center — écran live opérateur (mobile au bord du terrain, 2 colonnes sur desktop)
//  Toute la logique de calcul vient de src/lib/matchEngine.ts (même moteur que le public et le mode TV).
// ============================================================================
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Pause, Play, Undo2, Sun, Moon, Lock, Hand, Flag, RotateCcw, Pencil, Trash2, Check, CloudOff, Cloud, Plus, ClipboardList, AlertTriangle, ArrowRightLeft, ExternalLink,
} from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { addAction, closeMatch, getOrCreateLive, heartbeat, lockHolder, outbox, removeEvent, reopenMatch, saveLive, takeLock, updateEvent } from '@/api/matchOps'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useNow } from '@/hooks/useNow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamLogo } from '@/components/league/Identity'
import { TeamStatsBars } from '@/components/match/TeamStatsBars'
import { LineupEditor } from '@/components/matchcenter/LineupEditor'
import { toast } from '@/components/ui/toast'
import {
  closureChecklist, currentMinute, durationsFor, elapsedMs, endPeriod, fmtClock, fmtMinute, foulsInPeriod, footballMinute, goalkeeperAt, isPlaying, nextStep,
  pause, periodLength, playerBadges, possession, possessionAfter, resume, setAddedTime, setPossession, shootout, sortEvents, startPeriod, timelineByPeriod, PERIOD_LABEL, scoreFromEvents,
} from '@/lib/matchEngine'
import { isKnockout, matchXPLines, xpConfig, XP_LABELS } from '@/lib/stats'
import { REGLEMENT, inferiorityAt, rulesForSeason } from '@/lib/reglement'
import { suggestMotm } from '@/lib/visuals/model'
import { MatchVisualsPanel } from '@/components/visuals/MatchVisualsPanel'
import { InferiorityBar } from '@/components/reglement/InferiorityBar'
import { ArtLink } from '@/components/reglement/ArtLink'
import { EVENT_LABEL, fmtDate, fmtTime, playerShort } from '@/lib/format'
import { STAGE_LABELS } from '@/lib/schedule'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { EventType, GoalKind, LiveState, Match, MatchEvent, Period, Player } from '@/types/entities'

const PAD: { type: EventType; label: string; short: string }[] = [
  { type: 'shot_on_target', label: 'Tir cadré', short: 'Cadré' }, { type: 'shot_off_target', label: 'Tir non cadré', short: 'Non cadré' },
  { type: 'save', label: 'Arrêt gardien', short: 'Arrêt' }, { type: 'corner', label: 'Corner', short: 'Corner' },
  { type: 'throw_in', label: 'Touche', short: 'Touche' }, { type: 'free_kick', label: 'Coup franc', short: 'Coup franc' },
  { type: 'yellow_card', label: 'Carton jaune', short: '🟨 Jaune' }, { type: 'red_card', label: 'Carton rouge', short: '🟥 Rouge' },
  { type: 'foul', label: 'Faute', short: 'Faute' },
]
const vibrate = () => { try { navigator.vibrate?.(25) } catch { /* */ } }

type Flow =
  | { kind: 'goal'; team: string; step: 'type' | 'scorer' | 'assist'; goal_kind?: GoalKind | 'own_goal'; scorer?: string; free?: string }
  | { kind: 'card'; team: string; type: 'yellow_card' | 'red_card' }
  | { kind: 'shot'; team: string; type: 'shot_on_target' | 'shot_off_target' }
  | { kind: 'player_menu'; team: string; player: string }
  | { kind: 'sub'; team: string; out?: string }
  | { kind: 'gk'; team: string }
  | { kind: 'more'; team: string }
  | { kind: 'player_for'; team: string; type: EventType }
  | { kind: 'suspension'; player: string; event: string }
  | { kind: 'edit'; event: MatchEvent }
  | { kind: 'close' }
  | { kind: 'shootout'; team: string }

export default function MatchCenter() {
  const { id } = useParams()
  const { db, league } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const now = useNow(500)
  const m = db.Match.find((x) => x.id === id)
  const comp = m ? L.competition.get(m.competition_id) : undefined
  const d = durationsFor(m, comp)
  const ls = db.LiveState.find((l) => l.match_id === id)
  const events = useMemo(() => sortEvents(db.MatchEvent.filter((e) => e.match_id === id)), [db.MatchEvent, id])
  const [flow, setFlow] = useState<Flow | null>(null)
  const [bright, setBright] = useState(false)
  const [pending, setPending] = useState(outbox.size())
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [undo, setUndo] = useState<{ id: string; label: string; until: number } | null>(null)
  const [tab, setTab] = useState('input')
  const [lineupsOpen, setLineupsOpen] = useState(false)

  // --- verrou opérateur + heartbeat -----------------------------------------
  useEffect(() => { if (m && user && can(user, 'match_center')) getOrCreateLive(m.id) }, [m?.id, user]) // eslint-disable-line react-hooks/exhaustive-deps
  const holder = lockHolder(ls, now)
  const isMine = !!user && holder?.id === user.id
  useEffect(() => { if (ls && user && can(user, 'match_center') && !holder && (user.role !== 'operator' || !m?.operator_user_id || m.operator_user_id === user.id)) takeLock(ls, user) }, [ls?.id, holder?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!ls || !user || !isMine) return; const t = setInterval(() => heartbeat(ls, user), 20_000); return () => clearInterval(t) }, [ls?.id, isMine, user]) // eslint-disable-line react-hooks/exhaustive-deps
  const canWrite = !!user && can(user, 'match_center') && isMine && m?.status !== 'finished'
  // --- réseau, file, écran allumé ---------------------------------------------
  useEffect(() => outbox.subscribe(setPending), [])
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) } }, [])
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then((l) => { lock = l }).catch(() => undefined)
    return () => { lock?.release().catch(() => undefined) }
  }, [])

  const mutateLive = useCallback(async (fn: (s: LiveState, t: number) => LiveState) => {
    const cur = db.LiveState.find((l) => l.match_id === id) ?? (await getOrCreateLive(id!))
    await saveLive(fn(cur, Date.now()))
  }, [db.LiveState, id])

  const act = useCallback(async (team: string, type: EventType, extra: Partial<MatchEvent> = {}) => {
    if (!m || !ls || !canWrite) return
    const cm = currentMinute(ls, d, Date.now())
    let player_id = extra.player_id
    if ((type === 'save' || type === 'penalty_saved') && !player_id) player_id = goalkeeperAt(db.Lineup.find((l) => l.match_id === m.id && l.team_id === team), events, team, cm.minute, cm.period)
    const rows = await addAction(m, events, { team_id: team, type, period: cm.period, minute: cm.minute, added_minute: cm.added || undefined, clock_ms: cm.clock_ms, operator: user?.full_name ?? user?.email, ...extra, player_id })
    vibrate()
    const after = possessionAfter(m, { type, team_id: team })
    if (after && ls.running) await mutateLive((s, t) => setPossession(s, after, t))
    const main = rows[0] as MatchEvent
    const label = `${main.type === 'second_yellow' ? '2e avertissement → rouge' : EVENT_LABEL[main.type]}${main.player_id ? ` · ${playerShort(L.player.get(main.player_id))}` : ''} · ${fmtMinute(main.minute, main.added_minute)}`
    setUndo({ id: main.id!, label, until: Date.now() + 4500 })
    if ((main.type === 'red_card' || main.type === 'second_yellow') && main.player_id && main.card_target !== 'official') setFlow({ kind: 'suspension', player: main.player_id, event: main.id! })
    return main
  }, [m, ls, canWrite, d, events, db.Lineup, user, mutateLive, L.player])

  // --- raccourcis clavier (desktop) --------------------------------------------
  useEffect(() => {
    if (!m || !canWrite) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || flow) return
      const k = e.key.toLowerCase()
      if (k === 'a') mutateLive((s, t) => setPossession(s, 'home', t))
      else if (k === 'b') mutateLive((s, t) => setPossession(s, 'away', t))
      else if (k === 'm') mutateLive((s, t) => setPossession(s, 'dead', t))
      else if (k === ' ') { e.preventDefault(); mutateLive((s, t) => (s.running ? pause(s, t) : resume(s, t))) }
      else if (k === 'g' || k === 'h') setFlow({ kind: 'goal', team: k === 'g' ? m.home_team_id : m.away_team_id, step: 'type' })
      else if (k === 'z' && (e.ctrlKey || e.metaKey)) undoLast()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  if (!m) return <div className="p-6">Match introuvable · <Link to="/admin/match-center" className="text-neon">Programme</Link></div>
  const home = L.team.get(m.home_team_id), away = L.team.get(m.away_team_id)
  const lineups = { [m.home_team_id]: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.home_team_id), [m.away_team_id]: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.away_team_id) }
  const lineupsOk = !!lineups[m.home_team_id]?.validated && !!lineups[m.away_team_id]?.validated
  const score = scoreFromEvents(m, events)
  const knockout = isKnockout(m) || comp?.phase === 'knockout'
  // Art. 5.5 : pas de prolongation ; en phase éliminatoire, égalité → tirs au but directement
  const step = nextStep(ls, { extraTime: REGLEMENT.duration.extraTime, shootout: knockout, drawn: score.home === score.away })
  const effNow = isPlaying(ls?.period ?? 'pre') ? ((ls?.period === '2H' ? d.half * 60_000 : 0) + elapsedMs(ls!, now)) : 0
  const inferiority = isPlaying(ls?.period ?? 'pre') ? inferiorityAt(m, events, effNow, d.half) : []
  const period = ls?.period ?? 'pre'
  const ms = ls ? elapsedMs(ls, now) : 0
  const fm = isPlaying(period) ? footballMinute(period, ms, d) : null
  const addedPlanned = isPlaying(period) ? ls?.added_time?.[period] : undefined
  const pos = possession(ls, now)
  const cfg = xpConfig(db.XPRule, m.season_id)
  const xpLines = matchXPLines(league, m, cfg, { score })
  const xpBy = new Map<string, number>()
  for (const l of xpLines) xpBy.set(l.player_id, (xpBy.get(l.player_id) ?? 0) + l.points)
  const threshold = comp?.foul_alert_threshold ?? 5
  const foulAlerts = isPlaying(period) ? [m.home_team_id, m.away_team_id].filter((t) => foulsInPeriod(events, t, period as Period) >= threshold) : []
  const so = shootout(m, events)
  const undoLast = async () => { const last = [...events].reverse().find((e) => !e.auto); if (last && canWrite) { await removeEvent(m, events, last.id); toast.info('Dernière action annulée') } }

  const runStep = async () => {
    if (!step || !canWrite) return
    if (step.action === 'kickoff') { if (!lineupsOk) { setLineupsOpen(true); toast.error('Validez les deux compositions avant le coup d’envoi'); return } await base44.entities.Match.update(m.id, { status: 'live', source: 'match_center', half_duration_min: d.half }); await mutateLive((s, t) => startPeriod(s, '1H', t)) }
    else if (step.action === 'halftime') await mutateLive((s, t) => endPeriod(s, 'HT', t))
    else if (step.action === 'second_half') await mutateLive((s, t) => startPeriod(s, '2H', t))
    else if (step.action === 'end_regular') await mutateLive((s, t) => endPeriod(s, 'ET_BREAK', t))
    else if (step.action === 'start_et1') { await base44.entities.Match.update(m.id, { extra_time: true }); await mutateLive((s, t) => startPeriod(s, 'ET1', t)) }
    else if (step.action === 'start_et2') await mutateLive((s, t) => startPeriod(endPeriod(s, 'ET2', t), 'ET2', t))
    else if (step.action === 'end_et') await mutateLive((s, t) => endPeriod(s, 'PENS', t))
    else if (step.action === 'end_match') setFlow({ kind: 'close' })
    vibrate()
  }

  const readOnlyBanner = !canWrite && m.status !== 'finished'
  return (
    <div className={cn('min-h-screen overflow-x-hidden pb-24', bright && 'mc-bright')}>
      {/* barre d'outils */}
      <div className="sticky top-[calc(3.5rem+var(--sim-h,0px))] z-20 flex flex-wrap items-center gap-2 border-b border-white/5 bg-night-900/95 px-3 py-2 backdrop-blur">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/match-center"><ArrowLeft />Programme</Link></Button>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs', pending ? 'bg-amber-400/15 text-amber-200' : 'bg-win/15 text-win')}>{online ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />}{pending ? `⏳ ${pending} action(s) en attente` : '✓ synchronisé'}</span>
        <span className="text-xs text-muted-foreground">Opérateur : <b className="text-white">{holder?.name ?? '—'}</b></span>
        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm"><Link to={`/matchs/${m.id}`} target="_blank"><ExternalLink />Public</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to={`/admin/matchs/${m.id}/feuille`}><ClipboardList />Feuille</Link></Button>
          <Button variant="ghost" size="icon" onClick={() => setBright(!bright)} title="Mode haute luminosité">{bright ? <Moon /> : <Sun />}</Button>
        </div>
      </div>
      {readOnlyBanner && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-400/15 px-3 py-2 text-sm text-amber-100">
          <Lock className="size-4" />{holder ? `Ce match est déjà suivi par ${holder.name} — lecture seule.` : 'Lecture seule.'}
          {holder && user && can(user, 'take_over') && ls && <Button size="sm" variant="outline" className="ml-auto h-8" onClick={() => takeLock(ls, user, true)}><Hand />Prendre la main</Button>}
        </div>
      )}
      {!lineupsOk && m.status !== 'finished' && (
        <button onClick={() => setLineupsOpen(true)} className="flex w-full items-center gap-2 bg-red-500/20 px-3 py-2 text-left text-sm text-red-100 cursor-pointer"><AlertTriangle className="size-4" />Compositions non validées — le coup d'envoi est bloqué. Ouvrir la feuille de compo →</button>
      )}
      {foulAlerts.map((t) => <div key={t} className="bg-amber-500/20 px-3 py-1.5 text-sm text-amber-100">⚠️ {L.team.get(t)?.name} : {foulsInPeriod(events, t, period as Period)} fautes sur la période (seuil {threshold})</div>)}

      <div className="p-3 sm:p-4">
        {/* TABLEAU DE SCORE */}
        <section className="glass rounded-3xl p-3 sm:p-5">
          <div className="text-center text-xs text-muted-foreground">{comp?.name} · {isKnockout(m) ? STAGE_LABELS[m.stage!] : `Journée ${m.round}`} · {fmtDate(m.date, 'EEE d MMM')} · {fmtTime(m.date)} · {m.pitch}</div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
            <ScoreSide team={home} scorers={events.filter((e) => (e.type === 'goal' && e.team_id === m.home_team_id) || (e.type === 'own_goal' && e.team_id === m.away_team_id))} xp={xpBy} />
            <div className="flex flex-col items-center">
              <div className="num text-6xl leading-none sm:text-8xl">{score.home}<span className="text-white/30">-</span>{score.away}</div>
              {(so.home.length + so.away.length > 0) && <div className="num text-lg text-neon">({so.home_score}-{so.away_score} tab)</div>}
              <div className={cn('mt-1 rounded-lg px-3 py-0.5 font-display text-2xl font-black tabular-nums', ls?.running ? 'bg-red-500 text-white' : 'bg-white/10')}>
                {isPlaying(period) ? (fm!.added ? `${fm!.minute}+${fm!.added}'` : fmtClock(ms + (period === '2H' ? d.half * 60000 : period === 'ET1' ? 2 * d.half * 60000 : period === 'ET2' ? (2 * d.half + d.et) * 60000 : 0))) : { pre: 'À venir', HT: 'Mi-temps', ET_BREAK: 'Pause', PENS: 'Tirs au but', FT: 'Terminé' }[period] ?? ''}
              </div>
              <div className="mt-0.5 text-[11px] uppercase text-muted-foreground">{isPlaying(period) ? `${PERIOD_LABEL[period as Period]}${addedPlanned ? ` · +${addedPlanned}' annoncés` : ''}${!ls?.running ? ' · pause' : ''}` : m.status === 'finished' ? 'Match clôturé' : ''}</div>
            </div>
            <ScoreSide team={away} scorers={events.filter((e) => (e.type === 'goal' && e.team_id === m.away_team_id) || (e.type === 'own_goal' && e.team_id === m.home_team_id))} xp={xpBy} align="right" />
          </div>
          <InferiorityBar list={inferiority} home={home?.short_name} away={away?.short_name} />
          {canWrite && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {step && <Button size="lg" className="h-14 min-w-44 text-base" onClick={runStep}>{step.action === 'kickoff' ? <Play /> : <Flag />}{step.label}</Button>}
              {isPlaying(period) && <Button size="lg" variant="outline" className="h-14" onClick={() => mutateLive((s, t) => (s.running ? pause(s, t) : resume(s, t)))}>{ls?.running ? <><Pause />Pause</> : <><Play />Reprendre</>}</Button>}
              {isPlaying(period) && !REGLEMENT.duration.effectiveTime && <AddedTime value={addedPlanned ?? 0} onChange={(v) => mutateLive((s) => setAddedTime(s, period as Period, v))} />}
            </div>
          )}
          {m.status === 'finished' && user && can(user, 'match_center') && <div className="mt-3 flex justify-center"><Button variant="outline" onClick={async () => { await reopenMatch(m, user); await mutateLive((s) => ({ ...s, period: '2H', running: false })); toast.info('Match rouvert — l’XP officiel est retiré jusqu’à la nouvelle clôture') }}><RotateCcw />Rouvrir le match</Button></div>}
        </section>

        {/* POSSESSION */}
        <section className="mt-3 grid grid-cols-3 gap-2">
          {(['home', 'dead', 'away'] as const).map((s) => {
            const active = ls?.possession?.current === s
            const team = s === 'home' ? home : s === 'away' ? away : undefined
            const msv = s === 'home' ? pos.home_ms : s === 'away' ? pos.away_ms : pos.dead_ms
            return (
              <button key={s} disabled={!canWrite || !isPlaying(period)} onClick={() => { vibrate(); mutateLive((x, t) => setPossession(x, s, t)) }}
                className={cn('flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-2 py-2 font-display font-bold uppercase transition cursor-pointer disabled:cursor-default', active ? 'border-white text-white' : 'border-white/10 text-muted-foreground')}
                style={active && team ? { background: `${team.primary_color}55`, borderColor: team.primary_color } : active ? { background: '#ffffff22' } : undefined}>
                <span className="text-xs sm:text-sm">{s === 'dead' ? 'Ballon mort' : `Ballon ${team?.short_name}`}</span>
                <span className="num text-lg">{fmtClock(msv)}{s !== 'dead' && <span className="ml-1 text-sm text-muted-foreground">{s === 'home' ? pos.home_pct : pos.away_pct}%</span>}</span>
              </button>
            )
          })}
        </section>
        <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${pos.home_pct}%`, background: home?.primary_color }} /><div style={{ width: `${pos.away_pct}%`, background: away?.primary_color }} /></div>

        {m.status === 'finished' && (
          <section className="mt-3 rounded-2xl border border-white/10 bg-night-900/60 p-3 sm:p-4" aria-labelledby="visuels-titre">
            <div className="mb-3 grid gap-2 sm:grid-cols-[auto_minmax(0,320px)] sm:items-center"><h2 id="visuels-titre" className="title-caps text-xl">Visuels réseaux sociaux</h2>
              <label className="text-xs text-muted-foreground">Homme du match<MotmPicker match={m} events={events} /></label></div>
            <MatchVisualsPanel match={m} />
          </section>
        )}
        <Tabs value={tab} onValueChange={setTab} className="mt-3 lg:hidden">
          <TabsList className="w-full"><TabsTrigger value="input" className="flex-1">Saisie</TabsTrigger><TabsTrigger value="stats" className="flex-1">Statistiques</TabsTrigger><TabsTrigger value="summary" className="flex-1">Résumé</TabsTrigger><TabsTrigger value="xp" className="flex-1">XP</TabsTrigger></TabsList>
        </Tabs>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className={cn('space-y-3', tab !== 'input' && 'hidden lg:block')}>
            {period === 'PENS' && canWrite && <ShootoutPanel match={m} events={events} onKick={(team) => setFlow({ kind: 'shootout', team })} />}
            <div className="grid gap-3 sm:grid-cols-2">
              {[m.home_team_id, m.away_team_id].map((tid) => (
                <ActionPad key={tid} teamId={tid} events={events} disabled={!canWrite || !(isPlaying(period) || period === 'HT' || period === 'ET_BREAK')}
                  onGoal={() => setFlow({ kind: 'goal', team: tid, step: 'type' })}
                  onAction={(type) => (type === 'yellow_card' || type === 'red_card' ? setFlow({ kind: 'card', team: tid, type }) : type === 'shot_on_target' || type === 'shot_off_target' ? setFlow({ kind: 'shot', team: tid, type }) : act(tid, type))}
                  onMore={() => setFlow({ kind: 'more', team: tid })} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[m.home_team_id, m.away_team_id].map((tid) => <LineupPanel key={tid} match={m} teamId={tid} events={events} onPlayer={(p) => canWrite && setFlow({ kind: 'player_menu', team: tid, player: p })} onEdit={() => setLineupsOpen(true)} />)}
            </div>
            {canWrite && <Button variant="outline" size="lg" className="h-14 w-full" onClick={undoLast} disabled={!events.some((e) => !e.auto)}><Undo2 />Annuler la dernière action</Button>}
          </div>
          <div className="space-y-3">
            <div className={cn(tab !== 'stats' && 'hidden lg:block')}><TeamStatsBars match={m} events={events} live={ls} now={now} /></div>
            <div className={cn(tab !== 'summary' && 'hidden lg:block')}><SummaryPanel match={m} events={events} canEdit={canWrite || (!!user && can(user, 'sport'))} onEdit={(e) => setFlow({ kind: 'edit', event: e })} onDelete={(e) => removeEvent(m, events, e.id)} /></div>
            <div className={cn(tab !== 'xp' && 'hidden lg:block')}><XPPanel lines={xpLines} validated={!!m.validated} /></div>
          </div>
        </div>
      </div>

      {/* toast avec Annuler (4,5 s) */}
      {undo && undo.until > now && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[min(94vw,460px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-night-800 px-4 py-3 shadow-2xl ring-1 ring-white/10">
          <Check className="size-5 text-win" /><span className="flex-1 truncate text-sm">{undo.label}</span>
          <Button size="sm" variant="outline" onClick={async () => { await removeEvent(m, events, undo.id); setUndo(null); toast.info('Action annulée') }}>Annuler</Button>
        </div>
      )}

      <Dialog open={lineupsOpen} onOpenChange={setLineupsOpen}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Feuille de composition</DialogTitle><DialogDescription>Présents, 6 titulaires (1 gardien + 5 joueurs de champ), gardien (G), capitaine (C), numéros. Joueurs suspendus / documents non validés bloqués.</DialogDescription></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2"><LineupEditor match={m} teamId={m.home_team_id} readOnly={!canWrite && !can(user, 'sport')} /><LineupEditor match={m} teamId={m.away_team_id} readOnly={!canWrite && !can(user, 'sport')} /></div>
        </DialogContent>
      </Dialog>
      {flow && <FlowDialog flow={flow} setFlow={setFlow} match={m} events={events} act={act} ls={ls} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
function ScoreSide({ team, scorers, xp, align = 'left' }: { team?: { name: string; short_name: string; primary_color?: string } & Parameters<typeof TeamLogo>[0]['team']; scorers: MatchEvent[]; xp: Map<string, number>; align?: 'left' | 'right' }) {
  const L = useLookup()
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <TeamLogo team={team} size={64} />
      <div className="title-caps text-base leading-tight sm:text-xl">{team?.name}</div>
      <ul className={cn('w-full space-y-0.5 text-[11px] sm:text-xs', align === 'right' ? 'text-right' : 'text-left')}>
        {scorers.map((e) => (
          <li key={e.id} className="truncate">⚽ {playerShort(L.player.get(e.player_id ?? '')) || e.player_name_free || 'Inconnu'} {fmtMinute(e.minute, e.added_minute)}{e.type === 'own_goal' ? ' (csc)' : e.goal_kind === 'penalty' ? ' (pen.)' : ''}
            {e.type === 'goal' && e.player_id && xp.get(e.player_id) ? <span className="ml-1 rounded bg-neon/20 px-1 text-[10px] font-bold text-neon">{xp.get(e.player_id)! > 0 ? '+' : ''}{xp.get(e.player_id)} XP</span> : null}</li>
        ))}
      </ul>
    </div>
  )
}

function AddedTime({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex h-14 items-center gap-1 rounded-lg border border-input px-2">
      <span className="text-xs text-muted-foreground">Temps add.</span>
      <button className="size-9 rounded-md bg-white/5 text-lg cursor-pointer" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="num w-8 text-center text-xl">+{value}</span>
      <button className="size-9 rounded-md bg-white/5 text-lg cursor-pointer" onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function ActionPad({ teamId, events, disabled, onGoal, onAction, onMore }: { teamId: string; events: MatchEvent[]; disabled: boolean; onGoal: () => void; onAction: (t: EventType) => void; onMore: () => void }) {
  const L = useLookup()
  const team = L.team.get(teamId)
  const count = (t: EventType) => events.filter((e) => e.team_id === teamId && (e.type === t || (t === 'yellow_card' && e.type === 'second_yellow') || (t === 'save' && e.type === 'penalty_saved'))).length
  return (
    <div className="glass rounded-2xl p-2.5" style={{ borderTop: `3px solid ${team?.primary_color}` }}>
      <div className="mb-2 flex items-center gap-2"><TeamLogo team={team} size={22} /><span className="font-display text-lg font-bold uppercase">{team?.short_name}</span></div>
      <button disabled={disabled} onClick={() => { vibrate(); onGoal() }} className="mb-2 flex h-16 w-full items-center justify-center rounded-xl bg-neon font-display text-3xl font-black uppercase tracking-wider text-white shadow-[0_0_24px_-6px_rgb(242_107_29/.9)] active:scale-[.98] disabled:opacity-40 cursor-pointer">⚽ But</button>
      <div className="grid grid-cols-2 gap-1.5">
        {PAD.map((p) => (
          <button key={p.type} disabled={disabled} onClick={() => { vibrate(); onAction(p.type) }} className={cn('relative flex min-h-14 items-center justify-between last:odd:col-span-2 rounded-xl bg-white/5 px-3 text-left text-sm font-semibold active:bg-white/15 disabled:opacity-40 cursor-pointer', p.type === 'yellow_card' && 'bg-yellow-400/10', p.type === 'red_card' && 'bg-red-500/10')}>
            <span>{p.short}</span><span className="num rounded-md bg-black/30 px-1.5 text-base">{count(p.type)}</span>
          </button>
        ))}
      </div>
      <button disabled={disabled} onClick={onMore} className="mt-1.5 flex h-11 w-full items-center justify-center gap-1 rounded-xl border border-white/10 text-xs text-muted-foreground disabled:opacity-40 cursor-pointer"><Plus className="size-4" />CSC, penalty, but refusé, remplacement, gardien…</button>
    </div>
  )
}

function LineupPanel({ match, teamId, events, onPlayer, onEdit }: { match: Match; teamId: string; events: MatchEvent[]; onPlayer: (pid: string) => void; onEdit: () => void }) {
  const { db } = useData()
  const L = useLookup()
  const lu = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
  const subsIn = new Set(events.filter((e) => e.team_id === teamId && e.type === 'substitution').map((e) => e.player_id))
  const subsOut = new Set(events.filter((e) => e.team_id === teamId && e.type === 'substitution').map((e) => e.related_player_id))
  const gkNow = goalkeeperAt(lu, events, teamId, 999, 'PENS')
  const row = (pid: string, bench: boolean) => {
    const p = L.player.get(pid); if (!p) return null
    const b = playerBadges(events, pid)
    return (
      <button key={pid} onClick={() => onPlayer(pid)} className={cn('flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-white/5 cursor-pointer', bench && !subsIn.has(pid) && 'opacity-55', subsOut.has(pid) && 'line-through opacity-55')}>
        <span className="num w-6 text-right text-base">{lu?.numbers?.[pid] ?? p.number}</span>
        <span className="flex-1 truncate">{p.first_name.charAt(0)}. {p.last_name}</span>
        {gkNow === pid && <span className="flex size-5 items-center justify-center rounded-full bg-award-blue text-[10px] font-black">G</span>}
        {lu?.captain_id === pid && <span className="flex size-5 items-center justify-center rounded-full bg-award-gold text-[10px] font-black text-night-950">C</span>}
        {subsIn.has(pid) && <ArrowRightLeft className="size-3.5 text-win" />}
        <span className="text-xs">{b.goals ? `⚽${b.goals > 1 ? '×' + b.goals : ''}` : ''}{b.assists ? `🅰${b.assists > 1 ? '×' + b.assists : ''}` : ''}{b.red ? '🟥' : b.yellow ? '🟨' : ''}</span>
      </button>
    )
  }
  return (
    <div className="glass rounded-2xl p-2">
      <div className="mb-1 flex items-center justify-between px-1"><span className="text-xs font-bold uppercase text-muted-foreground">{L.team.get(teamId)?.short_name} · 6 contre 6</span><button className="text-xs text-neon cursor-pointer" onClick={onEdit}><Pencil className="inline size-3" /> compo</button></div>
      {lu ? <>{(lu.starter_ids ?? []).map((p) => row(p, false))}<div className="my-1 border-t border-white/5" />{(lu.substitute_ids ?? []).map((p) => row(p, true))}</> : <p className="p-2 text-xs text-muted-foreground">Composition non saisie</p>}
    </div>
  )
}

function SummaryPanel({ match, events, canEdit, onEdit, onDelete }: { match: Match; events: MatchEvent[]; canEdit: boolean; onEdit: (e: MatchEvent) => void; onDelete: (e: MatchEvent) => void }) {
  const L = useLookup()
  const [confirm, setConfirm] = useState<{ id: string; n: number } | null>(null)
  const byP = timelineByPeriod(events)
  return (
    <div className="glass rounded-2xl p-3">
      <div className="title-caps mb-2 text-lg">Résumé</div>
      {!byP.size && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
      {[...byP.entries()].map(([p, list]) => (
        <div key={p} className="mb-3">
          <div className="mb-1 text-center text-[11px] font-bold uppercase text-muted-foreground">{PERIOD_LABEL[p]}</div>
          {list.map((e) => {
            const home = e.team_id === match.home_team_id
            const txt = <span><b>{playerShort(L.player.get(e.player_id ?? '')) || e.player_name_free || (e.type === 'yellow_card' || e.type === 'red_card' ? 'Joueur inconnu' : '')}</b> {e.type === 'goal' && e.related_player_id ? <span className="text-muted-foreground">(🅰 {playerShort(L.player.get(e.related_player_id))})</span> : e.type === 'substitution' ? <span className="text-muted-foreground">↔ {playerShort(L.player.get(e.related_player_id ?? ''))}</span> : null} <span className="text-xs text-muted-foreground">{e.type === 'goal' ? (e.goal_kind === 'penalty' ? 'pen.' : e.goal_kind === 'header' ? 'tête' : e.goal_kind === 'direct_free_kick' ? 'CF direct' : '') : EVENT_LABEL[e.type]}</span>{e.revisions?.length ? <span className="ml-1 text-[10px] text-amber-300">(corrigé)</span> : null}</span>
            return (
              <div key={e.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-0.5 text-sm">
                <div className="text-right">{home && txt}</div>
                <div className="flex items-center gap-1"><span className="num w-12 text-center text-xs">{fmtMinute(e.minute, e.added_minute)}</span></div>
                <div className="flex items-center gap-1">{!home && txt}
                  {canEdit && <span className={cn('ml-auto flex gap-0.5', home && 'order-first mr-auto ml-0')}>
                    <button className="p-1 text-muted-foreground hover:text-white" onClick={() => onEdit(e)} title="Corriger"><Pencil className="size-3.5" /></button>
                    <button className={cn('p-1', confirm?.id === e.id ? 'text-red-300' : 'text-muted-foreground hover:text-red-400')} title="Supprimer (double confirmation)"
                      onClick={() => { if (confirm?.id === e.id && confirm.n >= 1) { onDelete(e); setConfirm(null) } else setConfirm({ id: e.id, n: (confirm?.id === e.id ? confirm.n : 0) + 1 }) }}>
                      {confirm?.id === e.id ? <span className="text-[10px] font-bold">Confirmer ?</span> : <Trash2 className="size-3.5" />}</button>
                  </span>}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function XPPanel({ lines, validated }: { lines: ReturnType<typeof matchXPLines>; validated: boolean }) {
  const L = useLookup()
  const by = new Map<string, typeof lines>()
  for (const l of lines) { if (!by.has(l.player_id)) by.set(l.player_id, []); by.get(l.player_id)!.push(l) }
  const sorted = [...by.entries()].map(([pid, ls]) => ({ pid, ls, total: ls.reduce((a, l) => a + l.points, 0) })).sort((a, b) => b.total - a.total)
  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between"><span className="title-caps text-lg">XP du match</span><Badge variant={validated ? 'success' : 'warning'}>{validated ? 'XP officiel validé' : 'Provisoire — validé à la clôture'}</Badge></div>
      <div className="max-h-96 space-y-1 overflow-y-auto">
        {sorted.map(({ pid, ls, total }) => (
          <details key={pid} className="rounded-lg bg-white/[.03] px-2 py-1">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm"><TeamLogo team={L.team.get(L.player.get(pid)?.team_id ?? '')} size={16} /><span className="flex-1 truncate">{playerShort(L.player.get(pid))}</span><span className={cn('num text-base', total >= 0 ? 'text-neon' : 'text-sky-400')}>{total > 0 ? '+' : ''}{total}</span></summary>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">{ls.map((l, i) => <li key={i} className="flex justify-between"><span>{XP_LABELS[l.key]}{l.count > 1 ? ` ×${l.count}` : ''}{l.detail ? ` · ${l.detail}` : ''}</span><span className="text-white">{l.points > 0 ? '+' : ''}{l.points}</span></li>)}</ul>
          </details>
        ))}
      </div>
    </div>
  )
}

function ShootoutPanel({ match, events, onKick }: { match: Match; events: MatchEvent[]; onKick: (team: string) => void }) {
  const L = useLookup()
  const so = shootout(match, events)
  const cell = (k?: MatchEvent) => <span className={cn('flex size-8 items-center justify-center rounded-full text-sm', !k ? 'bg-white/5' : k.type === 'shootout_scored' ? 'bg-win text-night-950' : 'bg-red-500 text-white')}>{!k ? '' : k.type === 'shootout_scored' ? '✓' : '✕'}</span>
  const n = Math.max(5, so.home.length, so.away.length)
  return (
    <div className="glass rounded-2xl p-3">
      <div className="title-caps mb-2 flex items-center justify-between text-lg">Tirs au but <span className="num text-2xl">{so.home_score} - {so.away_score}</span></div>
      {[match.home_team_id, match.away_team_id].map((tid) => (
        <div key={tid} className="mb-1.5 flex items-center gap-1.5"><span className="w-12 text-xs font-bold">{L.team.get(tid)?.short_name}</span>{Array.from({ length: n }, (_, i) => <span key={i}>{cell((tid === match.home_team_id ? so.home : so.away)[i])}</span>)}</div>
      ))}
      {so.decided ? <p className="text-sm text-win">Vainqueur : {L.team.get(so.winner!)?.name} — cliquez « Fin du match ».</p>
        : <Button size="lg" className="mt-2 h-14 w-full" onClick={() => onKick(so.nextTeam)}>Tireur suivant : {L.team.get(so.nextTeam)?.short_name}{so.suddenDeath ? ' (mort subite)' : ''}</Button>}
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Dialogues d'action
// ---------------------------------------------------------------------------
/** Le joueur est-il sur le terrain (titulaire non remplacé ou entré en jeu) ? Sinon : remplaçant sur le banc. */
function onPitch(match: Match, events: MatchEvent[], teamId: string, pid: string, lineups: { match_id: string; team_id: string; starter_ids?: string[] }[]) {
  const lu = lineups.find((l) => l.match_id === match.id && l.team_id === teamId)
  let on = !lu || !!lu.starter_ids?.includes(pid)
  for (const e of sortEvents(events.filter((x) => x.team_id === teamId && x.type === 'substitution'))) {
    if (e.player_id === pid) on = true
    if (e.related_player_id === pid) on = false
  }
  return on
}

/** Après un rouge (règlement v8) : aucune suspension automatique ; Ardentia peut saisir le conseil de discipline (Art. 11.6, 19). */
function CouncilReferralForm({ player, defaultIncident, onSave, onCancel }: { player?: Player; defaultIncident: string; onSave: (x: { incident: string; matches: number }) => void; onCancel: () => void }) {
  const [v, setV] = useState({ incident: defaultIncident, matches: 1 })
  return (
    <form className="space-y-3 text-sm" onSubmit={(e) => { e.preventDefault(); onSave(v) }}>
      <p><b>{player?.first_name} {player?.last_name}</b> est expulsé. <b>Pas de suspension automatique</b> : il peut jouer le match suivant, sauf si le conseil de discipline le suspend. <ArtLink art={REGLEMENT.cards.artRed} /></p>
      <fieldset className="space-y-2 rounded-xl border border-white/10 p-3">
        <legend className="px-1 text-xs font-semibold">Saisir le conseil de discipline <ArtLink art="19" /></legend>
        <textarea value={v.incident} onChange={(e) => setV({ ...v, incident: e.target.value })} aria-label="Faits" className="min-h-16 w-full rounded-lg border border-input bg-night-950/40 p-2 text-sm" />
        <label className="flex items-center gap-2 text-xs">Suspension soumise au vote<Input type="number" min={1} max={20} value={v.matches} onChange={(e) => setV({ ...v, matches: Math.max(1, +e.target.value || 1) })} className="h-8 w-20" />match(s), contre un avertissement</label>
        <p className="text-[11px] text-muted-foreground">Le vote, la décision et le PV se gèrent ensuite dans Admin → Discipline.</p>
      </fieldset>
      <div className="flex gap-2"><Button type="submit" disabled={!v.incident.trim()}>Ouvrir l’affaire</Button><Button type="button" variant="ghost" onClick={onCancel}>Plus tard</Button></div>
    </form>
  )
}

function PlayerGrid({ match, teamId, events, onPick, includeBench = true, onlyGk }: { match: Match; teamId: string; events: MatchEvent[]; onPick: (pid: string) => void; includeBench?: boolean; onlyGk?: boolean }) {
  const { db } = useData()
  const L = useLookup()
  const lu = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
  const ins = new Set(events.filter((e) => e.type === 'substitution' && e.team_id === teamId).map((e) => e.player_id))
  const outs = new Set(events.filter((e) => e.type === 'substitution' && e.team_id === teamId).map((e) => e.related_player_id))
  let ids = lu ? [...(lu.starter_ids ?? []).filter((x) => !outs.has(x)), ...(lu.substitute_ids ?? []).filter((x) => includeBench || ins.has(x))] : db.Player.filter((p) => p.team_id === teamId && p.season_ids?.includes(match.season_id)).map((p) => p.id)
  if (onlyGk) ids = [...new Set([...ids, ...(lu?.substitute_ids ?? [])])]
  const gk = goalkeeperAt(lu, events, teamId, 999, 'PENS')
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {ids.map((pid) => { const p = L.player.get(pid) as Player; if (!p) return null; return (
        <button key={pid} onClick={() => onPick(pid)} className={cn('flex min-h-16 flex-col items-center justify-center rounded-xl bg-white/5 p-1 hover:bg-neon/20 cursor-pointer', pid === gk && 'ring-1 ring-award-blue', !ins.has(pid) && !(lu?.starter_ids ?? []).includes(pid) && 'opacity-60')}>
          <span className="num text-2xl">{lu?.numbers?.[pid] ?? p.number}</span><span className="w-full truncate text-center text-[11px]">{p.last_name}{pid === gk ? ' (GK)' : ''}</span>
        </button>) })}
    </div>
  )
}

function FlowDialog({ flow, setFlow, match, events, act, ls }: { flow: Flow; setFlow: (f: Flow | null) => void; match: Match; events: MatchEvent[]; act: (team: string, type: EventType, extra?: Partial<MatchEvent>) => Promise<MatchEvent | undefined>; ls?: LiveState }) {
  const { db, league, settings } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const [free, setFree] = useState('')
  const [n, setN] = useState('1')
  const [official, setOfficial] = useState('')
  const opp = (t: string) => (t === match.home_team_id ? match.away_team_id : match.home_team_id)
  const close = () => setFlow(null)
  const teamName = (t: string) => L.team.get(t)?.name
  let title = '', body: React.ReactNode = null
  switch (flow.kind) {
    case 'goal': {
      title = `But — ${teamName(flow.team)}`
      if (flow.step === 'type') body = (
        <div className="grid grid-cols-2 gap-2">
          {([['normal', 'But'], ['header', 'De la tête'], ['penalty', 'Penalty'], ['direct_free_kick', 'Coup franc direct'], ['own_goal', 'Contre son camp']] as const).map(([k, l]) => (
            <Button key={k} size="xl" variant={k === 'own_goal' ? 'outline' : 'secondary'} onClick={() => setFlow({ ...flow, step: 'scorer', goal_kind: k })}>{l}</Button>
          ))}
        </div>)
      else if (flow.step === 'scorer') {
        const scorerTeam = flow.goal_kind === 'own_goal' ? opp(flow.team) : flow.team
        const pick = async (pid?: string, freeName?: string) => {
          if (flow.goal_kind === 'own_goal') { await act(scorerTeam, 'own_goal', { player_id: pid, player_name_free: freeName }); close() }
          else if (flow.goal_kind === 'penalty' || flow.goal_kind === 'direct_free_kick') { await act(flow.team, 'goal', { goal_kind: flow.goal_kind, player_id: pid, player_name_free: freeName }); close() }
          else setFlow({ ...flow, step: 'assist', scorer: pid, free: freeName })
        }
        body = <div className="space-y-3"><p className="text-sm text-muted-foreground">{flow.goal_kind === 'own_goal' ? `Joueur de ${teamName(scorerTeam)} auteur du CSC` : 'Buteur'}</p><PlayerGrid match={match} teamId={scorerTeam} events={events} onPick={(p) => pick(p)} includeBench={false} />
          <div className="flex gap-2"><Input placeholder="Autre joueur (hors compo)" value={free} onChange={(e) => setFree(e.target.value)} /><Button variant="outline" disabled={!free} onClick={() => pick(undefined, free)}>Valider</Button></div></div>
      } else body = <div className="space-y-3"><p className="text-sm text-muted-foreground">Passeur</p><PlayerGrid match={match} teamId={flow.team} events={events} includeBench={false} onPick={async (p) => { if (p === flow.scorer) return; await act(flow.team, 'goal', { goal_kind: flow.goal_kind as GoalKind, player_id: flow.scorer, player_name_free: flow.free, related_player_id: p }); close() }} />
        <Button size="xl" variant="outline" className="w-full" onClick={async () => { await act(flow.team, 'goal', { goal_kind: flow.goal_kind as GoalKind, player_id: flow.scorer, player_name_free: flow.free }); close() }}>Sans passeur</Button></div>
      break
    }
    case 'card':
      title = `${flow.type === 'yellow_card' ? 'Carton jaune' : 'Carton rouge'} — ${teamName(flow.team)}`
      body = <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Joueur sur le terrain ou remplaçant — {flow.type === 'yellow_card' ? <>2e jaune du match = rouge automatique « 2e avertissement » ; pas de cumul d’un match à l’autre. <ArtLink art={REGLEMENT.cards.artYellow} /></> : <>2 min d’infériorité ; pas de suspension automatique, le conseil de discipline peut être saisi. <ArtLink art={REGLEMENT.cards.artRed} /></>}</p>
        <PlayerGrid match={match} teamId={flow.team} events={events} onPick={async (p) => { setFlow(null); await act(flow.team, flow.type, { player_id: p, card_target: onPitch(match, events, flow.team, p, db.Lineup) ? 'player' : 'substitute' }) }} />
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); const name = official.trim(); setFlow(null); await act(flow.team, flow.type, { card_target: 'official', player_name_free: name || 'Officiel d’équipe' }) }}>
          <Input value={official} onChange={(e) => setOfficial(e.target.value)} placeholder="Officiel d’équipe (nom)" aria-label="Nom de l’officiel d’équipe" />
          <Button type="submit" variant="outline">Officiel</Button>
        </form>
        <Button variant="outline" className="w-full" onClick={async () => { setFlow(null); await act(flow.team, flow.type) }}>Joueur inconnu</Button></div>
      break
    case 'shot':
      title = `${flow.type === 'shot_on_target' ? 'Tir cadré' : 'Tir non cadré'} — ${teamName(flow.team)}`
      body = <div className="space-y-3"><p className="text-sm text-muted-foreground">Tireur (sert aux statistiques de tirs du joueur)</p><PlayerGrid match={match} teamId={flow.team} events={events} includeBench={false} onPick={async (p) => { setFlow(null); await act(flow.team, flow.type, { player_id: p }) }} />
        <Button variant="outline" className="w-full" onClick={async () => { setFlow(null); await act(flow.team, flow.type) }}>Sans joueur (tir de l’équipe)</Button></div>
      break
    case 'player_for':
      title = `${EVENT_LABEL[flow.type]} — ${teamName(flow.team)}`
      body = <PlayerGrid match={match} teamId={flow.team} events={events} onPick={async (p) => { setFlow(null); await act(flow.team, flow.type, { player_id: p }) }} />
      break
    case 'player_menu': {
      const p = L.player.get(flow.player)
      title = `${p?.first_name} ${p?.last_name}`
      body = (
        <div className="grid grid-cols-2 gap-2">
          <Button size="xl" onClick={() => setFlow({ kind: 'goal', team: flow.team, step: 'assist', goal_kind: 'normal', scorer: flow.player })}>⚽ But</Button>
          {([['shot_on_target', 'Tir cadré'], ['shot_off_target', 'Tir non cadré'], ['yellow_card', '🟨 Jaune'], ['red_card', '🟥 Rouge']] as const).map(([t, l]) => <Button key={t} size="xl" variant="secondary" onClick={async () => { setFlow(null); await act(flow.team, t, { player_id: flow.player }) }}>{l}</Button>)}
          <Button size="xl" variant="outline" onClick={() => setFlow({ kind: 'sub', team: flow.team, out: flow.player })}>↔ Remplacer</Button>
        </div>)
      break
    }
    case 'more':
      title = `Autres actions — ${teamName(flow.team)}`
      body = (
        <div className="grid grid-cols-2 gap-2">
          <Button size="xl" variant="secondary" onClick={() => setFlow({ kind: 'goal', team: opp(flow.team), step: 'scorer', goal_kind: 'own_goal' })}>CSC (pour {L.team.get(opp(flow.team))?.short_name})</Button>
          <Button size="xl" variant="secondary" onClick={() => setFlow({ kind: 'player_for', team: flow.team, type: 'penalty_missed' })}>Penalty manqué</Button>
          <Button size="xl" variant="secondary" onClick={async () => { close(); await act(flow.team, 'penalty_saved') }}>Penalty arrêté (gardien)</Button>
          <Button size="xl" variant="secondary" onClick={() => setFlow({ kind: 'player_for', team: flow.team, type: 'goal_disallowed' })}>But refusé</Button>
          <Button size="xl" variant="secondary" onClick={() => setFlow({ kind: 'sub', team: flow.team })}>Remplacement</Button>
          <Button size="xl" variant="secondary" onClick={() => setFlow({ kind: 'gk', team: flow.team })}>Changement de gardien</Button>
        </div>)
      break
    case 'sub':
      title = `Remplacement — ${teamName(flow.team)}`
      body = !flow.out
        ? <div className="space-y-2"><p className="text-sm text-muted-foreground">Joueur sortant</p><PlayerGrid match={match} teamId={flow.team} events={events} includeBench={false} onPick={(p) => setFlow({ ...flow, out: p })} /></div>
        : <div className="space-y-2"><p className="text-sm text-muted-foreground">Joueur entrant (remplace {playerShort(L.player.get(flow.out))})</p>
          <div className="grid grid-cols-3 gap-1.5">{(db.Lineup.find((l) => l.match_id === match.id && l.team_id === flow.team)?.substitute_ids ?? []).filter((x) => !events.some((e) => e.type === 'substitution' && e.player_id === x)).map((pid) => <Button key={pid} variant="secondary" className="h-14" onClick={async () => { close(); await act(flow.team, 'substitution', { player_id: pid, related_player_id: flow.out }) }}>{L.player.get(pid)?.number} {L.player.get(pid)?.last_name}</Button>)}</div></div>
      break
    case 'gk':
      title = `Nouveau gardien — ${teamName(flow.team)}`
      body = <PlayerGrid match={match} teamId={flow.team} events={events} onlyGk onPick={async (p) => { close(); await act(flow.team, 'gk_change', { player_id: p }) }} />
      break
    case 'shootout': {
      const so = shootout(match, events)
      title = `Tir au but — ${teamName(flow.team)}`
      const gkOpp = goalkeeperAt(db.Lineup.find((l) => l.match_id === match.id && l.team_id === opp(flow.team)), events, opp(flow.team), 999, 'PENS')
      body = <div className="space-y-3"><p className="text-sm text-muted-foreground">Tireur puis résultat</p>
        <PlayerGrid match={match} teamId={flow.team} events={events} includeBench={false} onPick={(p) => setFree(p)} />
        <div className="grid grid-cols-3 gap-2">
          <Button size="xl" disabled={!free} onClick={async () => { close(); await act(flow.team, 'shootout_scored', { player_id: free, shootout_order: so.nextOrder, period: 'PENS' }) }}>✓ Réussi</Button>
          <Button size="xl" variant="secondary" disabled={!free} onClick={async () => { close(); await act(flow.team, 'shootout_saved', { player_id: free, related_player_id: gkOpp, shootout_order: so.nextOrder, period: 'PENS' }) }}>🧤 Arrêté{gkOpp ? ` (${L.player.get(gkOpp)?.last_name})` : ''}</Button>
          <Button size="xl" variant="outline" disabled={!free} onClick={async () => { close(); await act(flow.team, 'shootout_missed', { player_id: free, shootout_order: so.nextOrder, period: 'PENS' }) }}>✕ À côté</Button>
        </div></div>
      break
    }
    case 'suspension': {
      const p = L.player.get(flow.player)
      const xpPer = Math.abs(xpConfig(db.XPRule, match.season_id).per_suspension_match)
      if (rulesForSeason(db.Season.find((s) => s.id === match.season_id)).council) {
        const ev = events.find((e) => e.id === flow.event)
        title = 'Expulsion — conseil de discipline'
        body = <CouncilReferralForm player={p} defaultIncident={`${ev?.type === 'second_yellow' ? 'Expulsion (2e avertissement)' : 'Carton rouge direct'}${ev?.minute ? ` à la ${ev.minute}e minute` : ''} lors de ${teamName(match.home_team_id)} – ${teamName(match.away_team_id)}.`} onCancel={close} onSave={async (x) => {
          await base44.entities.DisciplineCase.create({ season_id: match.season_id, player_id: flow.player, team_id: p?.team_id ?? '', match_id: match.id, event_id: flow.event, incident: x.incident.trim(), proposed_matches: x.matches, status: 'open', created_by: user?.email })
          toast.success('Affaire ouverte au conseil de discipline'); close()
        }} />
        break
      }
      title = 'Créer la suspension ?'
      body = <div className="space-y-3"><p className="text-sm">{p?.first_name} {p?.last_name} est exclu. Nombre de match(s) de suspension (−{xpPer} XP par match) :</p>
        <Input type="number" min={0} value={n} onChange={(e) => setN(e.target.value)} className="w-24" />
        <div className="flex gap-2"><Button onClick={async () => { await base44.entities.Suspension.create({ season_id: match.season_id, player_id: flow.player, origin_match_id: match.id, origin_event_id: flow.event, date: match.date?.slice(0, 10), matches: +n, created_by: user?.email }); toast.success('Suspension créée'); close() }}>Créer</Button><Button variant="ghost" onClick={close}>Plus tard (Règles XP → Suspensions)</Button></div></div>
      break
    }
    case 'edit': {
      const e = flow.event
      title = 'Corriger l’événement'
      body = <EditEvent match={match} e={e} onSave={async (patch) => {
        const before: Partial<MatchEvent> = {}
        for (const k of Object.keys(patch) as (keyof MatchEvent)[]) (before as Record<string, unknown>)[k] = e[k]
        await updateEvent(match, e.id, { ...patch, revisions: [...(e.revisions ?? []), { at: new Date().toISOString(), by: user?.email, before }] })
        toast.success('Événement corrigé (historique conservé)'); close()
      }} />
      break
    }
    case 'close': {
      const items = closureChecklist({ ...match, home_score: scoreFromEvents(match, events).home, away_score: scoreFromEvents(match, events).away }, events, db.Lineup.filter((l) => l.match_id === match.id), { knockout: isKnockout(match) })
      const blocking = items.some((i) => i.blocking && !i.ok)
      title = 'Checklist de clôture'
      body = <div className="space-y-3">
        {items.map((i) => <div key={i.key} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm', i.ok ? 'bg-win/10' : i.blocking ? 'bg-red-500/15' : 'bg-amber-400/10')}>{i.ok ? <Check className="size-4 text-win" /> : <AlertTriangle className="size-4 text-amber-300" />}{i.label}{!i.ok && i.blocking && <Badge variant="destructive" className="ml-auto">bloquant</Badge>}</div>)}
        <div><p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Homme du match</p>
          <MotmPicker match={match} events={events} /></div>
        <Button size="xl" className="w-full" disabled={blocking} onClick={async () => {
          const fresh = db.Match.find((x) => x.id === match.id)!
          if (ls) await saveLive({ ...pause(ls, Date.now()), period: 'FT' })
          await closeMatch(league, fresh, user, { voteMinutes: settings.motm_vote_minutes_after })
          toast.success('Match clôturé — XP, classements, forme, trophées et stats recalculés'); close()
        }}><Flag />Terminer le match</Button>
      </div>
      break
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>{body}<DialogFooter><Button variant="ghost" onClick={close}>Annuler</Button></DialogFooter></DialogContent>
    </Dialog>
  )
}

/** Homme du match : pré-rempli avec le joueur qui a gagné le plus d'XP dans le match (modifiable). */
function MotmPicker({ match, events }: { match: Match; events: MatchEvent[] }) {
  const { db, league } = useData()
  const L = useLookup()
  const cur = db.Match.find((m) => m.id === match.id) ?? match
  const sc = scoreFromEvents(cur, events)
  const suggestion = useMemo(() => suggestMotm(league, { ...cur, home_score: sc.home, away_score: sc.away }), [league, cur, sc.home, sc.away])
  const ids = [...new Set([...db.Lineup.filter((l) => l.match_id === match.id).flatMap((l) => [...(l.starter_ids ?? []), ...events.filter((e) => e.type === 'substitution' && e.team_id === l.team_id).map((e) => e.player_id!)]), ...events.filter((e) => e.player_id && e.card_target !== 'official').map((e) => e.player_id!), ...(suggestion ? [suggestion.player_id] : []), ...(cur.motm_player_id ? [cur.motm_player_id] : [])])].filter((pid) => L.player.get(pid))
  const votes = db.MotmVote.filter((v) => v.match_id === match.id)
  useEffect(() => { if (!cur.motm_player_id && suggestion) void base44.entities.Match.update(match.id, { motm_player_id: suggestion.player_id }) }, [cur.motm_player_id, suggestion?.player_id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <select className="mt-1 h-11 w-full rounded-lg border border-input bg-night-950 px-2 text-sm text-foreground" value={cur.motm_player_id ?? ''} onChange={(e) => base44.entities.Match.update(match.id, { motm_player_id: e.target.value || undefined })} aria-label="Homme du match">
        <option value="">— Choisir —</option>
        {ids.map((pid) => <option key={pid} value={pid}>{playerShort(L.player.get(pid))} ({L.team.get(L.player.get(pid)?.team_id ?? '')?.short_name}){pid === suggestion?.player_id ? ` · suggéré, ${suggestion.xp} XP` : ''}{votes.length ? ` · ${votes.filter((v) => v.player_id === pid).length} vote(s)` : ''}</option>)}
      </select>
      {suggestion && cur.motm_player_id && cur.motm_player_id !== suggestion.player_id && <span className="mt-1 block text-[11px] text-muted-foreground">Suggestion (plus d’XP) : {playerShort(L.player.get(suggestion.player_id))} — {suggestion.xp} XP</span>}
    </>
  )
}

function EditEvent({ match, e, onSave }: { match: Match; e: MatchEvent; onSave: (patch: Partial<MatchEvent>) => void }) {
  const { db } = useData()
  const L = useLookup()
  const [v, setV] = useState({ minute: e.minute ?? 0, added_minute: e.added_minute ?? 0, player_id: e.player_id ?? '', related_player_id: e.related_player_id ?? '', type: e.type })
  const players = db.Player.filter((p) => p.team_id === e.team_id || (e.type === 'own_goal' && (p.team_id === match.home_team_id || p.team_id === match.away_team_id)))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Minute<Input type="number" value={v.minute} onChange={(x) => setV({ ...v, minute: +x.target.value })} /></label>
        <label className="text-xs">Temps additionnel<Input type="number" value={v.added_minute} onChange={(x) => setV({ ...v, added_minute: +x.target.value })} /></label>
      </div>
      <label className="block text-xs">Type<select className="mt-1 h-10 w-full rounded-lg border border-input bg-night-950 px-2" value={v.type} onChange={(x) => setV({ ...v, type: x.target.value as EventType })}>{(Object.keys(EVENT_LABEL) as EventType[]).map((t) => <option key={t} value={t}>{EVENT_LABEL[t]}</option>)}</select></label>
      <label className="block text-xs">Joueur<select className="mt-1 h-10 w-full rounded-lg border border-input bg-night-950 px-2" value={v.player_id} onChange={(x) => setV({ ...v, player_id: x.target.value })}><option value="">Joueur inconnu</option>{players.map((p) => <option key={p.id} value={p.id}>{p.number} {p.first_name} {p.last_name} ({L.team.get(p.team_id)?.short_name})</option>)}</select></label>
      {(v.type === 'goal' || v.type === 'substitution') && <label className="block text-xs">{v.type === 'goal' ? 'Passeur' : 'Joueur sortant'}<select className="mt-1 h-10 w-full rounded-lg border border-input bg-night-950 px-2" value={v.related_player_id} onChange={(x) => setV({ ...v, related_player_id: x.target.value })}><option value="">—</option>{players.map((p) => <option key={p.id} value={p.id}>{p.number} {p.first_name} {p.last_name}</option>)}</select></label>}
      {e.revisions?.length ? <p className="text-[11px] text-muted-foreground">{e.revisions.length} correction(s) précédente(s) conservée(s)</p> : null}
      <Button className="w-full" onClick={() => onSave({ minute: v.minute, added_minute: v.added_minute || undefined, player_id: v.player_id || undefined, related_player_id: v.related_player_id || undefined, type: v.type })}>Enregistrer la correction</Button>
      <p className="text-[11px] text-muted-foreground">Période : {e.period} · {periodLength((e.period ?? '1H') as Period, durationsFor(match))} min</p>
    </div>
  )
}
