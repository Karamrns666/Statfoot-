import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Lock, Tv, Camera, ThumbsUp, Briefcase, PlayCircle, Mail, Phone, MapPin } from 'lucide-react'
import { Logo, OrganizedBy, MBL_LOGO } from './Logo'
import { SeasonSelector } from './SeasonSelector'
import { ScoreTicker } from '@/components/match/ScoreTicker'
import { useData } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export const PUBLIC_NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/matchs', label: 'Matchs' },
  { to: '/classement', label: 'Classement' },
  { to: '/equipes', label: 'Équipes' },
  { to: '/joueurs', label: 'Joueurs' },
  { to: '/trophees', label: 'Trophées' },
  { to: '/statistiques', label: 'Stats' },
  { to: '/equipe-de-la-journee', label: 'Équipe type' },
  { to: '/media', label: 'Média' },
  { to: '/historique', label: 'Historique' },
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [loc.pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <ScoreTicker />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-900/80 backdrop-blur-xl no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Logo subtitle="" />
          <nav className="ml-4 hidden flex-1 items-center gap-0.5 xl:flex">
            {PUBLIC_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('whitespace-nowrap rounded-lg px-2 py-1.5 font-display text-[14px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-white', isActive && 'text-neon bg-neon/10')}>{n.label}</NavLink>
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
              <NavLink to="/reglement" className="rounded-lg px-3 py-2.5 font-display text-lg font-bold uppercase text-muted-foreground">Règlement</NavLink>
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
  const { settings } = useData()
  const so = settings.socials ?? {}
  const socials = [
    { href: so.instagram, icon: Camera, label: 'Instagram' }, { href: so.facebook, icon: ThumbsUp, label: 'Facebook' },
    { href: so.linkedin, icon: Briefcase, label: 'LinkedIn' }, { href: so.youtube, icon: PlayCircle, label: 'YouTube' },
  ].filter((s) => s.href)
  return (
    <footer className="mt-12 border-t border-white/5 bg-night-950/60 no-print">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex items-start gap-4">
          <img src={settings.logo_url || MBL_LOGO} alt={settings.league_name ?? 'MBL'} className="h-24 w-auto" />
          <div>
            <div className="font-display text-2xl font-black uppercase leading-none">{settings.league_name}</div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{settings.tagline}</p>
            <OrganizedBy className="mt-4" />
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="title-caps text-base">Contact</div>
          {settings.contact_email && <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-muted-foreground hover:text-neon"><Mail className="size-4" />{settings.contact_email}</a>}
          {settings.contact_phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" />{settings.contact_phone}</div>}
          {settings.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" />{settings.address}</div>}
        </div>
        <div className="space-y-3">
          <div className="title-caps text-base">Suivez-nous</div>
          <div className="flex gap-2">
            {socials.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="glass rounded-xl p-2.5 hover:text-neon"><s.icon className="size-5" /></a>)}
          </div>
          <div className="flex gap-4 text-sm"><Link to="/reglement" className="text-muted-foreground hover:text-neon">Règlement</Link><Link to="/admin" className="text-muted-foreground hover:text-neon">Espace admin</Link></div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {settings.league_name ?? 'Morocco Business League'} — saison 2025-2026 : données officielles de la ligue ; saison 2026-2027 : démonstration</div>
    </footer>
  )
}
