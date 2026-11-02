import { useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, Image, Link2, Play, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason } from '@/hooks/useStats'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { MBL_LOGO } from '@/components/layout/Logo'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Media as M } from '@/types/entities'

type Kind = 'tout' | 'photo' | 'video' | 'lien'
const KINDS: { v: Kind; label: string; icon: typeof Image }[] = [{ v: 'tout', label: 'Tout', icon: Image }, { v: 'photo', label: 'Photo', icon: Image }, { v: 'video', label: 'Vidéo', icon: Play }, { v: 'lien', label: 'Lien', icon: Link2 }]
/** « Lien » : article, ou contenu externe (URL / Google Drive) qui n'est ni une photo ni une vidéo hébergée */
const kindOf = (m: M): Exclude<Kind, 'tout'> => (m.type === 'video' ? 'video' : m.type === 'article' || (m.source === 'url' && m.type !== 'photo') ? 'lien' : 'photo')

export default function Media() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const [kind, setKind] = useState<Kind>('tout')
  const [team, setTeam] = useState<string>('') // '' = toutes, 'mbl' = médias de la ligue
  const [open, setOpen] = useState<M | null>(null)

  const seasonTeams = useMemo(() => {
    const ids = new Set(db.Competition.filter((c) => !sid || c.season_id === sid).flatMap((c) => c.team_ids ?? []))
    return db.Team.filter((t) => ids.has(t.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [db.Competition, db.Team, sid])

  const items = db.Media
    .filter((m) => m.published !== false && (!sid || m.season_id === sid || !m.season_id))
    .filter((m) => kind === 'tout' || kindOf(m) === kind)
    .filter((m) => !team || (team === 'mbl' ? !m.team_ids?.length : m.team_ids?.includes(team)))
    .sort((a, b) => (b.date ?? b.created_date ?? '').localeCompare(a.date ?? a.created_date ?? ''))

  const openItem = (m: M) => { if (kindOf(m) === 'lien' && !m.body) window.open(m.url, '_blank', 'noopener'); else setOpen(m) }

  return (
    <div>
      <PageHeader title="La Médiathèque" subtitle="Photos et vidéos des équipes" />

      {/* équipes */}
      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Équipe">
        <TeamChip active={team === 'mbl'} onClick={() => setTeam('mbl')} label="MBL" logo={<img src={MBL_LOGO} alt="" className="h-9 w-auto" />} />
        <TeamChip active={team === ''} onClick={() => setTeam('')} label="Toutes" logo={<span className="flex size-9 items-center justify-center rounded-full bg-white/10 font-display text-sm font-black">{seasonTeams.length}</span>} />
        {seasonTeams.map((t) => <TeamChip key={t.id} active={team === t.id} onClick={() => setTeam(t.id)} label={t.name} logo={<TeamLogo team={t} size={36} />} />)}
      </div>

      {/* types */}
      <div className="mb-6 flex gap-2" role="tablist" aria-label="Type de média">
        {KINDS.map((k) => (
          <button key={k.v} role="tab" aria-selected={kind === k.v} onClick={() => setKind(k.v)} className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition', kind === k.v ? 'border-white bg-white text-ink' : 'border-white/15 text-muted-foreground hover:text-white')}>
            {k.v !== 'tout' && <k.icon className="size-3.5" />}{k.label}
          </button>
        ))}
      </div>

      {!items.length ? <EmptyState title="Aucun média pour cette sélection." icon={<Image />}>Les photos et vidéos ajoutées par la ligue dans l’espace admin apparaîtront ici.</EmptyState> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m, i) => {
            const k = kindOf(m)
            const featured = i === 0 && kind === 'tout' && !team
            return (
              <button key={m.id} onClick={() => openItem(m)} className={cn('group relative cursor-pointer overflow-hidden rounded-2xl bg-night-950 text-left', featured ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-[4/3]')}>
                {k === 'lien' && !m.thumbnail_url
                  ? <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-mbl to-night-950"><FileText className="size-10 text-sky" /></div>
                  : <img src={m.thumbnail_url ?? m.url} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/20 to-transparent" />
                {k === 'video' && <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neon/90 shadow-lg transition group-hover:scale-110"><Play className="size-6 fill-white text-white" /></span>}
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold backdrop-blur">{k === 'video' ? <><Play className="size-3" />Vidéo</> : k === 'lien' ? <><ExternalLink className="size-3" />Lien</> : <><Image className="size-3" />Photo</>}</span>
                {m.round && <span className="absolute right-2.5 top-2.5 rounded-full bg-neon px-2 py-0.5 font-display text-xs font-black">J{m.round}</span>}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="flex -space-x-1.5">{m.team_ids?.slice(0, 2).map((t) => <TeamLogo key={t} team={L.team.get(t)} size={22} />)}</div>
                  <div className={cn('mt-1 line-clamp-2 font-display font-extrabold leading-tight', featured ? 'text-2xl sm:text-3xl' : 'text-base')}>{m.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{fmtDate(m.date ?? m.created_date, 'd MMM yyyy')}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{open?.title}</DialogTitle>
          {open && (kindOf(open) === 'video'
            ? <video src={open.url} poster={open.thumbnail_url} controls autoPlay className="w-full rounded-xl" />
            : kindOf(open) === 'lien'
              ? <div className="space-y-3"><div className="prose prose-invert max-w-none text-sm"><ReactMarkdown>{open.body ?? ''}</ReactMarkdown></div>{open.url && <a href={open.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-neon"><ExternalLink className="size-4" />Ouvrir le lien</a>}</div>
              : <img src={open.url} alt={open.title} className="max-h-[75vh] w-full rounded-xl object-contain" />)}
          {open && <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{open.team_ids?.map((t) => <span key={t} className="inline-flex items-center gap-1.5"><TeamLogo team={L.team.get(t)} size={16} />{L.team.get(t)?.name}</span>)}{open.round && <span>· Journée {open.round}</span>}<span>· {fmtDate(open.date ?? open.created_date, 'd MMMM yyyy')}</span></div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeamChip({ active, onClick, label, logo }: { active: boolean; onClick: () => void; label: string; logo: ReactNode }) {
  return (
    <button role="tab" aria-selected={active} onClick={onClick} title={label} className={cn('flex w-20 shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2 transition', active ? 'border-neon bg-neon/15' : 'border-white/10 bg-white/[.03] hover:bg-white/[.07]')}>
      {logo}
      <span className={cn('w-full truncate text-center text-[11px] font-semibold', active ? 'text-white' : 'text-muted-foreground')}>{label}</span>
    </button>
  )
}
