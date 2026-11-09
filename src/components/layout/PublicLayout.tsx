import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Lock, Tv, Mail, Phone, MapPin, Globe } from 'lucide-react'
import { IconInstagram, IconLinkedin, IconWhatsapp } from './SocialIcons'
import { useLeague } from '@/hooks/useLeague'
import { mapsHref, telHref, whatsappHref } from '@/config/league'
import { Logo, MBL_LOGO } from './Logo'
import { SeasonSelector } from './SeasonSelector'
import { ScoreTicker } from '@/components/match/ScoreTicker'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export const PUBLIC_NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/matchs', label: 'Matchs' },
  { to: '/classement', label: 'Classement' },
  { to: '/equipes', label: 'Équipes' },
  { to: '/joueurs', label: 'Joueurs' },
  { to: '/equipe-type', label: 'Équipe type' },
  { to: '/trophees', label: 'Trophées' },
  { to: '/statistiques', label: 'Stats', wide: true },
  { to: '/media', label: 'Média' },
  { to: '/historique', label: 'Historique', wide: true },
  { to: '/reglement', label: 'Règlement' },
] as { to: string; label: string; end?: boolean; wide?: boolean }[]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [loc.pathname])
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <ScoreTicker />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-900/80 backdrop-blur-xl no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Logo subtitle="" className="shrink-0" />
          <nav className="ml-6 hidden min-w-0 flex-1 items-center gap-0.5 xl:flex">
            {PUBLIC_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('whitespace-nowrap rounded-lg px-2 py-1.5 font-display text-[15px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-white', n.wide && 'hidden 2xl:block', isActive && 'text-neon bg-neon/10')}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SeasonSelector className="hidden sm:flex" />
            <Link to="/tv" title="Mode TV" className="hidden rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white sm:block"><Tv className="size-5" /></Link>
            <Link to="/admin" title="Espace admin" className="hidden rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white sm:block"><Lock className="size-5" /></Link>
            <button className="rounded-lg p-2 hover:bg-white/10 xl:hidden cursor-pointer" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && (
          <div className="border-t border-white/5 bg-night-900/95 px-4 pb-4 xl:hidden">
            <SeasonSelector className="mt-3 w-full sm:hidden" />
            <nav className="mt-2 grid grid-cols-2 gap-1">
              {PUBLIC_NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('rounded-lg px-3 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-muted-foreground', isActive && 'text-neon bg-neon/10')}>{n.label}</NavLink>
              ))}
              <NavLink to="/tv" className="rounded-lg px-3 py-2.5 font-display text-lg font-bold uppercase text-muted-foreground">Mode TV</NavLink>
              <NavLink to="/admin" className="rounded-lg px-3 py-2.5 font-display text-lg font-bold uppercase text-muted-foreground">Admin</NavLink>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8"><Outlet /></main>
      <Footer />
    </div>
  )
}

function Footer() {
  const L = useLeague()
  const o = L.organizer
  const socials = [
    { href: L.instagram, icon: IconInstagram, label: 'Instagram de la Morocco Business League', short: 'MBL' },
    { href: o.instagram, icon: IconInstagram, label: `Instagram de ${o.name}`, short: o.name },
    { href: o.linkedin, icon: IconLinkedin, label: `LinkedIn de ${o.name}`, short: o.name },
  ]
  return (
    <footer className="mt-12 border-t border-white/5 bg-night-950/60 no-print">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex items-start gap-4">
          <img src={L.logo || MBL_LOGO} alt={L.name} className="h-24 w-auto" />
          <div>
            <div className="font-display text-2xl font-black uppercase leading-none">{L.name}</div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{L.tagline}</p>
            <a href={o.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-white">Organisé par <img src={o.logo} alt={o.name} className="h-7 w-auto" /></a>
          </div>
        </div>
        <address className="space-y-2.5 text-sm not-italic">
          <div className="title-caps text-base">Contact</div>
          <a href={`mailto:${o.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-neon"><Mail className="size-4 shrink-0" />{o.email}</a>
          <a href={telHref(o.phone)} className="flex items-center gap-2 text-muted-foreground hover:text-neon"><Phone className="size-4 shrink-0" />{o.phone}</a>
          <a href={mapsHref(o.address)} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-muted-foreground hover:text-neon"><MapPin className="mt-0.5 size-4 shrink-0" />{o.address}</a>
          <a href={o.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-neon"><Globe className="size-4 shrink-0" />{o.website.replace(/^https?:\/\//, '')}</a>
          <div className="flex flex-wrap gap-2 pt-2">
            <a href={whatsappHref(o.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-[#06210f] hover:brightness-110"><IconWhatsapp className="size-4" />WhatsApp</a>
            <a href={telHref(o.phone)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"><Phone className="size-4" />Appeler</a>
          </div>
        </address>
        <div className="space-y-3">
          <div className="title-caps text-base">Suivez-nous</div>
          <ul className="space-y-2">
            {socials.map((x) => (
              <li key={x.label}><a href={x.href} target="_blank" rel="noreferrer" aria-label={x.label} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-neon"><span className="glass rounded-lg p-2"><x.icon className="size-4" /></span>{x.icon === IconLinkedin ? 'LinkedIn' : 'Instagram'} · {x.short}</a></li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm"><Link to="/reglement" className="text-muted-foreground hover:text-neon">Règlement</Link><Link to="/historique" className="text-muted-foreground hover:text-neon">Historique</Link><Link to="/admin" className="text-muted-foreground hover:text-neon">Espace admin</Link></div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {L.name} · organisée par {o.name}</div>
    </footer>
  )
}
