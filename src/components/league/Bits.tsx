import { divisionLogo } from '@/lib/divisionLogo'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Minus, Sparkle } from 'lucide-react'
import type { Result } from '@/lib/stats'
import { cn } from '@/lib/utils'
import type { Competition } from '@/types/entities'

const FORM: Record<Result, { l: string; c: string }> = { W: { l: 'V', c: 'bg-win' }, D: { l: 'N', c: 'bg-draw' }, L: { l: 'D', c: 'bg-loss' } }
export function FormPills({ form, size = 'sm' }: { form: Result[]; size?: 'sm' | 'md' }) {
  if (!form.length) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex gap-1" aria-label={`Forme : ${form.map((r) => FORM[r].l).join('')}`}>
      {form.map((r, i) => (
        <span key={i} className={cn('inline-flex items-center justify-center rounded-full font-display font-extrabold text-night-950', FORM[r].c, size === 'sm' ? 'size-5 text-[10px]' : 'size-7 text-xs', i === form.length - 1 && 'ring-2 ring-white/40')}>{FORM[r].l}</span>
      ))}
    </div>
  )
}

export function RankDelta({ delta }: { delta?: number | null }) {
  if (delta === null || delta === undefined) return <span className="inline-flex items-center text-[11px] text-neon" title="Nouveau"><Sparkle className="size-3" /></span>
  if (delta === 0) return <span className="inline-flex items-center text-muted-foreground" title="Stable"><Minus className="size-3" /></span>
  return delta > 0
    ? <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-win" title={`+${delta} place(s)`}><ArrowUp className="size-3" />{delta}</span>
    : <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-loss" title={`${delta} place(s)`}><ArrowDown className="size-3" />{-delta}</span>
}

export function SectionTitle({ title, subtitle, action, className, accent = '#F85A00' }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string; accent?: string }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="title-caps flex items-center gap-2 text-2xl sm:text-3xl">
          <span className="inline-block h-6 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="title-caps text-4xl sm:text-5xl neon-text">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function StatTile({ label, value, icon, color = '#F85A00', sub }: { label: string; value: ReactNode; icon?: ReactNode; color?: string; sub?: ReactNode }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-30 blur-2xl" style={{ background: color }} />
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon && <span style={{ color }} className="[&_svg]:size-4">{icon}</span>}{label}
      </div>
      <div className="num mt-1 text-3xl sm:text-4xl" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center">
      {icon && <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <div className="title-caps text-lg">{title}</div>
      {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function LiveDot({ label = 'Live' }: { label?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-red-400"><span className="size-2 rounded-full bg-red-500 animate-pulse-live" />{label}</span>
}

export function CompetitionBadge({ competition, className }: { competition?: Competition | null; className?: string }) {
  if (!competition) return null
  const c = competition.color ?? '#F85A00'
  const logo = divisionLogo(competition)
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wider', logo && 'pl-0.5', className)} style={{ color: c, background: `${c}1f`, boxShadow: `inset 0 0 0 1px ${c}44` }}>{logo && <img src={logo} alt="" className="size-[1.6em] shrink-0 object-contain" />}{competition.name}</span>
}

export function Spinner() {
  return <div className="flex min-h-[40vh] items-center justify-center"><div className="size-10 animate-spin rounded-full border-4 border-neon/20 border-t-neon" /></div>
}

export function RookieBadge() {
  return <span className="inline-flex items-center rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-300">Recrue · 1re saison</span>
}
