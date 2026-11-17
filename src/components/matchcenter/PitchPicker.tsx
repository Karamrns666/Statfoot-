// Choix d'un joueur dans le match centre : TOUS les joueurs de la feuille de match, « Sur le terrain » en grand,
// « Sur le banc » en dessous, expulsés grisés. Aux couleurs de l'équipe.
import { useMemo, type ReactNode } from 'react'
import { useData, useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import { pitchState, type PitchState } from '@/lib/pitch'
import { matchColors, sideStyle, type SideColor } from '@/lib/teamColors'
import { cn } from '@/lib/utils'
import type { Match, MatchEvent, Player } from '@/types/entities'

/** État terrain / banc d'une équipe ; sans composition saisie, tout l'effectif de la saison est « sur le terrain » */
export function usePitch(match: Match, teamId: string, events: MatchEvent[]): PitchState {
  const { db } = useData()
  return useMemo(() => {
    const lu = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
    if (lu) return pitchState(lu, events, teamId)
    const all = db.Player.filter((p) => p.team_id === teamId && p.season_ids?.includes(match.season_id)).map((p) => p.id)
    const st = pitchState(undefined, events, teamId)
    return { ...st, roster: all, onField: all.filter((id) => !st.expelled.has(id)), bench: [] }
  }, [db.Lineup, db.Player, match.id, match.season_id, events, teamId])
}

export function useMatchColors(match: Match) {
  const L = useLookup()
  const h = L.team.get(match.home_team_id), a = L.team.get(match.away_team_id)
  return useMemo(() => matchColors(h, a), [h, a])
}
export function sideColor(match: Match, colors: { home: SideColor; away: SideColor }, teamId?: string) {
  return teamId === match.away_team_id ? colors.away : colors.home
}

/** Bandeau d'équipe : logo + nom sur la couleur de l'équipe */
export function TeamBand({ match, teamId, children, className }: { match: Match; teamId: string; children?: ReactNode; className?: string }) {
  const L = useLookup()
  const colors = useMatchColors(match)
  const t = L.team.get(teamId)
  return (
    <div className={cn('flex min-h-11 items-center gap-2 rounded-xl px-2.5', className)} style={sideStyle(sideColor(match, colors, teamId))}>
      <TeamLogo team={t} size={24} />
      <span className="truncate font-display text-lg font-black uppercase">{t?.short_name ?? t?.name}</span>
      {children}
    </div>
  )
}

export type PickMode = 'action' | 'card' | 'out' | 'in' | 'gk'

export function PitchPicker({ match, teamId, events, mode, onPick, exclude }: {
  match: Match; teamId: string; events: MatchEvent[]; mode: PickMode
  onPick: (pid: string, onField: boolean) => void
  exclude?: string[]
}) {
  const { db } = useData()
  const L = useLookup()
  const st = usePitch(match, teamId, events)
  const lu = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
  const skip = new Set(exclude ?? [])
  const field = mode === 'in' ? [] : st.onField.filter((id) => !skip.has(id))
  const bench = mode === 'out' ? [] : st.bench.filter((id) => !skip.has(id))
  const btn = (pid: string, onField: boolean) => {
    const p = L.player.get(pid) as Player | undefined; if (!p) return null
    const out = st.expelled.has(pid)
    // expulsé : plus aucune action possible (pas d'entrée, pas de nouveau carton)
    const disabled = out
    return (
      <button key={pid} type="button" disabled={disabled} onClick={() => onPick(pid, onField)}
        className={cn('flex flex-col items-center justify-center rounded-xl p-1 transition', onField ? 'min-h-16 bg-white/10 hover:bg-neon/25' : 'min-h-12 bg-white/[.04] hover:bg-neon/20', disabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer', st.goalkeeper === pid && 'ring-1 ring-award-blue')}>
        <span className={cn('num leading-none', onField ? 'text-2xl' : 'text-lg')}>{lu?.numbers?.[pid] ?? p.number ?? '–'}</span>
        <span className={cn('w-full truncate text-center', onField ? 'text-xs' : 'text-[11px]')}>{p.last_name}{st.goalkeeper === pid ? ' (G)' : ''}</span>
        {out && <span className="text-[10px] font-bold uppercase text-red-300">Expulsé</span>}
      </button>
    )
  }
  return (
    <div className="space-y-2">
      {field.length > 0 && <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Sur le terrain ({st.onField.length}/6)</div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">{field.map((id) => btn(id, true))}</div>
      </div>}
      {bench.length > 0 && <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Sur le banc</div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">{bench.map((id) => btn(id, false))}</div>
      </div>}
      {!field.length && !bench.length && <p className="text-sm text-muted-foreground">Aucun joueur disponible.</p>}
    </div>
  )
}
