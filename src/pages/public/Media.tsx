import { useState } from 'react'
import { Image, Play, FileText, X } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Media as M } from '@/types/entities'
import ReactMarkdown from 'react-markdown'

export default function Media() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [type, setType] = useState('')
  const [team, setTeam] = useState('')
  const [round, setRound] = useState('')
  const [open, setOpen] = useState<M | null>(null)
  const items = db.Media.filter((m) => m.published !== false && (!scopeSeasonId || m.season_id === scopeSeasonId) && (!type || m.type === type) && (!team || m.team_ids?.includes(team)) && (!round || String(m.round) === round)).sort((a, b) => (b.date ?? b.created_date ?? '').localeCompare(a.date ?? a.created_date ?? ''))
  const rounds = [...new Set(db.Media.map((m) => m.round).filter(Boolean))].sort((a, b) => a! - b!)
  return (
    <div>
      <PageHeader title="Média" subtitle="Photos, vidéos et articles" />
      <div className="glass mb-5 flex flex-wrap gap-2 rounded-2xl p-3">
        <FilterSelect value={type} onChange={setType} allLabel="Tous types" options={[{ value: 'photo', label: 'Photos' }, { value: 'video', label: 'Vidéos' }, { value: 'article', label: 'Articles' }]} />
        <FilterSelect value={team} onChange={setTeam} allLabel="Toutes équipes" options={db.Team.map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect value={round} onChange={setRound} allLabel="Toutes journées" options={rounds.map((r) => ({ value: String(r), label: `Journée ${r}` }))} />
      </div>
      {!items.length && <EmptyState title="Aucun média" icon={<Image />} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <button key={m.id} onClick={() => setOpen(m)} className="glass group overflow-hidden rounded-2xl text-left cursor-pointer">
            <div className="relative aspect-[4/3] overflow-hidden bg-night-950">
              <img src={m.thumbnail_url ?? m.url} alt={m.title} className="size-full object-cover transition group-hover:scale-105" loading="lazy" />
              <span className="absolute left-2 top-2 rounded-full bg-black/60 p-1.5">{m.type === 'video' ? <Play className="size-4" /> : m.type === 'article' ? <FileText className="size-4" /> : <Image className="size-4" />}</span>
              {m.round && <span className="absolute right-2 top-2 rounded bg-neon px-1.5 text-[10px] font-bold text-white">J{m.round}</span>}
            </div>
            <div className="p-3"><div className="truncate text-sm font-semibold">{m.title}</div><div className="truncate text-xs text-muted-foreground">{m.team_ids?.map((t) => L.team.get(t)?.short_name).join(' · ')}</div></div>
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{open?.title}</DialogTitle>
          {open?.type === 'video' ? <video src={open.url} controls className="w-full rounded-xl" /> : open?.type === 'article' ? <div className="prose prose-invert max-w-none text-sm"><ReactMarkdown>{open.body ?? ''}</ReactMarkdown></div> : open && <img src={open.url} alt={open.title} className="w-full rounded-xl" />}
          <X className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
