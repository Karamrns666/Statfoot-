// Règlement officiel Ardentia — texte intégral, sommaire collant, ancres partageables (/reglement#art-17-3),
// recherche, « L'essentiel en 1 minute », PDF, version et historique des versions (une saison = une version).
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { BookOpen, Check, ChevronDown, FileDown, History, Link2, ListTree, Search, X } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { ESSENTIALS, artHref, artLabel } from '@/lib/reglement'
import { countMatches, highlight, matchesQuery, parseRulebook, prettyTitle, type Block, type RuleSection } from '@/lib/rulebookText'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Rulebook } from '@/types/entities'

function useRulebook() {
  const { db } = useData()
  const [params, setParams] = useSearchParams()
  const books = useMemo(() => [...db.Rulebook].sort((a, b) => (a.status === 'current' ? -1 : 0) - (b.status === 'current' ? -1 : 0) || b.version.localeCompare(a.version, 'fr', { numeric: true })), [db.Rulebook])
  const asked = params.get('version')
  const book = books.find((b) => b.version === asked) ?? books.find((b) => b.status === 'current') ?? books[0]
  const setVersion = (v: string) => { const p = new URLSearchParams(params); if (books.find((b) => b.version === v)?.status === 'current') p.delete('version'); else p.set('version', v); setParams(p, { replace: true }) }
  return { books, book, setVersion, seasons: db.Season }
}

export default function Rules() {
  const { books, book, setVersion, seasons } = useRulebook()
  const sections = useMemo(() => parseRulebook(book?.content ?? ''), [book?.content])
  const [q, setQ] = useState('')
  const [tocOpen, setTocOpen] = useState(false)
  const loc = useLocation()

  // ancre partagée : défiler jusqu'à l'article une fois le texte affiché
  useEffect(() => {
    if (!loc.hash) return
    const id = decodeURIComponent(loc.hash.slice(1))
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [loc.hash, sections.length])

  if (!book) return <p className="py-20 text-center text-muted-foreground">Règlement à venir.</p>
  const visible = sections.filter((s) => matchesQuery(s, q))
  const hits = q.trim() ? sections.reduce((a, s) => a + countMatches(s, q), 0) : 0
  const season = seasons.find((s) => s.id === book.season_id)
  const archived = book.status !== 'current'
  const articles = sections.filter((s) => s.level === 1)

  return (
    <div className="mx-auto max-w-6xl">
      {/* en-tête */}
      <header className="mb-6 border-b border-white/10 pb-6">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-neon">Ardentia · Football 6 contre 6</p>
        <h1 className="title-caps mt-1 text-4xl sm:text-5xl">Règlement officiel</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-0.5 font-semibold text-foreground">Version {book.version.replace(/^v/, '')}</span>
          <span>{fmtDate(book.date, 'd MMMM yyyy')}</span>
          {season ? <span>Saison {season.name.replace(/^Saison /, '')}</span> : <span>Non rattachée à une saison</span>}
          <VersionPicker books={books} current={book} onPick={setVersion} seasons={seasons} />
        </div>
        {archived && (
          <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200" role="status">
            Version archivée, conservée pour l’historique. {book.changes} <button className="cursor-pointer font-semibold underline" onClick={() => setVersion(books.find((b) => b.status === 'current')?.version ?? book.version)}>Voir la version en vigueur</button>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {book.pdf_url && <a href={book.pdf_url} download className="inline-flex h-10 w-full items-center justify-center gap-2 sm:w-auto rounded-lg bg-neon px-4 text-sm font-bold text-white hover:bg-neon/90"><FileDown className="size-4" />Télécharger le règlement (PDF)</a>}
          <label className="relative flex h-10 min-w-0 basis-full items-center sm:max-w-sm sm:flex-1 sm:basis-0">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans le règlement (ex. carton, forfait)" aria-label="Rechercher dans le règlement"
              className="h-10 w-full rounded-lg border border-input bg-night-950/40 pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neon" />
            {q && <button className="absolute right-2 cursor-pointer rounded p-1 text-muted-foreground hover:text-white" onClick={() => setQ('')} aria-label="Effacer la recherche"><X className="size-4" /></button>}
          </label>
        </div>
        {q.trim() && <p className="mt-2 text-sm text-muted-foreground" role="status">{hits ? `${hits} résultat${hits > 1 ? 's' : ''} dans ${visible.length} section${visible.length > 1 ? 's' : ''}` : 'Aucun résultat. Essayez un autre mot (ex. « jaune », « gardien », « réclamation »).'}</p>}
      </header>

      {!q.trim() && !archived && <Essentials />}

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* sommaire */}
        <nav aria-label="Sommaire du règlement" className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <button className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-night-900/60 px-3 py-2.5 font-display font-bold uppercase lg:hidden" aria-expanded={tocOpen} onClick={() => setTocOpen((o) => !o)}>
            <span className="inline-flex items-center gap-2"><ListTree className="size-4" />Sommaire</span><ChevronDown className={cn('size-4 transition-transform', tocOpen && 'rotate-180')} />
          </button>
          <ol className={cn('mt-2 space-y-0.5 text-sm lg:mt-0 lg:block', !tocOpen && 'hidden')}>
            {articles.map((a) => {
              const subs = sections.filter((s) => s.level === 2 && s.ref.split('.')[0] === a.ref)
              const dim = q.trim() && !matchesQuery(a, q) && !subs.some((s) => matchesQuery(s, q))
              return (
                <li key={a.id} className={cn(dim && 'opacity-40')}>
                  <a href={`#${a.id}`} onClick={() => setTocOpen(false)} className="block rounded-md px-2 py-1 font-semibold hover:bg-white/5 hover:text-neon">{a.ref === 'preambule' ? 'Préambule' : `${a.ref}. ${prettyTitle(a.title).replace(/^Article \d+ — /, '')}`}</a>
                  {subs.length > 0 && <ol className="mb-1 ml-3 border-l border-white/10 pl-2">{subs.map((s) => <li key={s.id}><a href={`#${s.id}`} onClick={() => setTocOpen(false)} className={cn('block rounded px-2 py-0.5 text-[13px] text-muted-foreground hover:text-neon', q.trim() && !matchesQuery(s, q) && 'opacity-50')}>{s.title}</a></li>)}</ol>}
                </li>
              )
            })}
          </ol>
        </nav>

        {/* texte intégral */}
        <article className="min-w-0">
          {visible.map((s) => <Section key={s.id} s={s} q={q} version={archived ? book.version : undefined} />)}
          <p className="mt-10 border-t border-white/10 pt-4 text-xs text-muted-foreground">Texte officiel publié par Ardentia — version {book.version.replace(/^v/, '')} du {fmtDate(book.date, 'd MMMM yyyy')}. Les calculs du site (points, départage, suspensions, durée) appliquent ce règlement.</p>
        </article>
      </div>
    </div>
  )
}

function Essentials() {
  return (
    <section aria-labelledby="essentiel" className="mb-8 rounded-2xl border border-neon/30 bg-gradient-to-br from-neon/10 to-transparent p-4 sm:p-6">
      <h2 id="essentiel" className="title-caps flex items-center gap-2 text-2xl"><BookOpen className="size-5 text-neon" />L’essentiel en 1 minute</h2>
      <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {ESSENTIALS.map((e) => (
          <li key={e.text} className="flex items-start gap-2 text-[15px] leading-snug">
            <Check className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
            <span>{e.text} <Link to={artHref(e.art)} className="whitespace-nowrap text-xs font-semibold text-neon/90 hover:underline">{artLabel(e.art)}</Link></span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Section({ s, q, version }: { s: RuleSection; q: string; version?: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/reglement${version ? `?version=${version}` : ''}#${s.id}`
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { /* lien visible dans l'adresse */ } }
  const H = s.level === 1 ? 'h2' : 'h3'
  return (
    <section id={s.id} className={cn('rule-section scroll-mt-24 rounded-xl', s.level === 1 ? 'mt-10 first:mt-0' : 'mt-6')}>
      <div className="group flex items-start gap-2">
        <H className={cn(s.level === 1 ? 'title-caps border-b border-white/10 pb-2 text-2xl sm:text-3xl' : 'font-display text-lg font-extrabold uppercase text-neon sm:text-xl')}>
          <Mark text={s.level === 1 ? prettyTitle(s.title) : s.title} q={q} />
        </H>
        <a href={`#${s.id}`} onClick={copy} className="mt-1 shrink-0 rounded p-1 text-muted-foreground opacity-60 hover:text-neon group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Copier le lien vers ${s.level === 1 ? s.title : `l’article ${s.ref}`}`} title="Copier le lien de cet article">
          {copied ? <Check className="size-4 text-win" /> : <Link2 className="size-4" />}
        </a>
      </div>
      <div className="mt-2 max-w-[72ch] space-y-3 text-[15px] leading-relaxed text-[#c9d5ea]">
        {s.blocks.map((b, i) => <BlockView key={i} b={b} q={q} />)}
      </div>
    </section>
  )
}

function BlockView({ b, q }: { b: Block; q: string }) {
  if (b.kind === 'p') return <p><Inline text={b.text} q={q} /></p>
  const L = b.kind === 'ul' ? 'ul' : 'ol'
  return <L className={cn('space-y-1.5 pl-5', b.kind === 'ul' ? 'list-disc' : 'list-decimal')}>{b.items.map((t, i) => <li key={i}><Inline text={t} q={q} /></li>)}</L>
}

/** Gras (**…**) du texte d'origine + surlignage de la recherche */
function Inline({ text, q }: { text: string; q: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i} className="text-white"><Mark text={p.slice(2, -2)} q={q} /></strong> : <Fragment key={i}><Mark text={p} q={q} /></Fragment>)}</>
}
function Mark({ text, q }: { text: string; q: string }): ReactNode {
  return <>{highlight(text.replace(/\*([^*]+)\*/g, '$1'), q).map((h, i) => (h.hit ? <mark key={i} className="rounded bg-neon/30 px-0.5 text-white">{h.text}</mark> : <Fragment key={i}>{h.text}</Fragment>))}</>
}

function VersionPicker({ books, current, onPick, seasons }: { books: Rulebook[]; current: Rulebook; onPick: (v: string) => void; seasons: { id: string; name: string }[] }) {
  if (books.length < 2) return null
  return (
    <label className="inline-flex items-center gap-1.5">
      <History className="size-4" aria-hidden /><span className="sr-only">Historique des versions</span>
      <select value={current.version} onChange={(e) => onPick(e.target.value)} className="cursor-pointer rounded-md border border-input bg-night-950/60 px-2 py-1 text-sm text-foreground" aria-label="Historique des versions">
        {books.map((b) => <option key={b.id} value={b.version}>Version {b.version.replace(/^v/, '')}{b.status === 'current' ? ' (en vigueur)' : ' (archivée)'}{b.season_id ? ` · ${seasons.find((s) => s.id === b.season_id)?.name ?? ''}` : ''}</option>)}
      </select>
    </label>
  )
}
