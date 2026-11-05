// Terrain de l'équipe type (6 contre 6 : 1 gardien + 5 joueurs de champ) : photo ou initiales, note du match, club.
import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { TeamLogo } from '@/components/league/Identity'
import type { TeamOfWeekResult } from '@/lib/rewards'
import { cn } from '@/lib/utils'

export const ratingColor = (r: number) => (r >= 8.5 ? '#E8B931' : r >= 7.5 ? '#F85A00' : r >= 6.5 ? '#6CB4CC' : '#9DB8DE')
export const fmtRating = (r: number) => (r ? r.toFixed(1).replace('.', ',') : '—')

/** Fond de terrain bleu nuit (lignes bleu ciel), en SVG pour rester net à toutes les tailles */
export function PitchBackground({ className }: { className?: string }) {
  return (
    <svg className={cn('absolute inset-0 size-full', className)} viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden>
      <defs>
        <pattern id="tw-stripes" width="300" height="50" patternUnits="userSpaceOnUse"><rect width="300" height="25" fill="#0B2A63" /><rect y="25" width="300" height="25" fill="#09244F" /></pattern>
        <radialGradient id="tw-light" cx="50%" cy="0%" r="80%"><stop offset="0" stopColor="#6CB4CC" stopOpacity=".28" /><stop offset="1" stopColor="#6CB4CC" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#tw-stripes)" /><rect width="300" height="400" fill="url(#tw-light)" />
      <g fill="none" stroke="#A9D6E5" strokeOpacity=".45" strokeWidth="1.6">
        <rect x="12" y="12" width="276" height="376" rx="2" /><line x1="12" y1="200" x2="288" y2="200" /><circle cx="150" cy="200" r="34" />
        <rect x="85" y="12" width="130" height="52" /><rect x="85" y="336" width="130" height="52" /><rect x="120" y="12" width="60" height="20" /><rect x="120" y="368" width="60" height="20" />
      </g>
    </svg>
  )
}

export function TeamOfWeekPitch({ result, size = 'md', link = true, className }: { result: TeamOfWeekResult; size?: 'sm' | 'md' | 'lg'; link?: boolean; className?: string }) {
  const L = useLookup()
  const av = size === 'sm' ? 40 : size === 'lg' ? 72 : 58
  const best = result.player_of_round?.player_id
  return (
    <div className={cn('relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-sky/20 shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)]', className)}>
      <PitchBackground />
      <div className="absolute left-3 top-3 rounded-full bg-night-950/70 px-2.5 py-0.5 font-display text-sm font-black text-sky-soft">{result.formation.label}</div>
      {result.manual && <div className="absolute right-3 top-3 rounded-full bg-night-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Sélection de la ligue</div>}
      {result.slots.map((s) => {
        const p = L.player.get(s.player_id), t = L.team.get(s.team_id)
        const color = t?.primary_color ?? '#6CB4CC'
        const body = (
          <>
            <div className="relative">
              <div className="overflow-hidden rounded-full" style={{ width: av, height: av, boxShadow: `0 0 0 3px ${s.player_id === best ? '#E8B931' : color}, 0 8px 18px rgba(0,0,0,.5)` }}>
                {p?.photo_url ? <img src={p.photo_url} alt="" className="size-full object-cover object-[50%_18%]" />
                  : <div className="flex size-full items-center justify-center font-display font-black text-white" style={{ fontSize: av * 0.38, background: `radial-gradient(circle at 30% 25%, ${color}, #04163D 80%)` }}>{(p?.first_name[0] ?? '') + (p?.last_name[0] ?? '')}</div>}
              </div>
              {s.rating > 0 && <span className="absolute -right-2 -top-1 rounded-md px-1.5 font-display text-[13px] font-black leading-5 text-ink shadow" style={{ background: ratingColor(s.rating) }}>{fmtRating(s.rating)}</span>}
              {s.player_id === best && <Crown className="absolute -left-2 -top-2 size-5 fill-award-gold text-award-gold drop-shadow" aria-label="Joueur de la journée" />}
              <TeamLogo team={t} size={size === 'sm' ? 16 : 22} className="absolute -bottom-1 -right-2" />
            </div>
            <span className={cn('mt-1.5 max-w-full truncate rounded bg-night-950/80 px-1.5 font-bold leading-5', size === 'sm' ? 'text-[11px]' : 'text-sm')}>{p ? `${p.first_name.charAt(0)}. ${p.last_name}` : '—'}</span>
            {size !== 'sm' && <span className="text-[11px] text-white/75">{s.position === 'GK' ? 'Gardien · ' : ''}{t?.short_name}{s.goals ? ` · ${s.goals}⚽` : ''}{s.assists ? ` ${s.assists}🅰` : ''}{s.position === 'GK' && s.saves ? ` · ${s.saves} arr.` : ''}</span>}
          </>
        )
        const cls = 'absolute flex w-[30%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center'
        return link
          ? <Link key={s.player_id} to={`/joueurs/${s.player_id}`} className={cn(cls, 'transition hover:scale-105')} style={{ left: `${s.x}%`, top: `${s.y}%` }}>{body}</Link>
          : <div key={s.player_id} className={cls} style={{ left: `${s.x}%`, top: `${s.y}%` }}>{body}</div>
      })}
    </div>
  )
}
