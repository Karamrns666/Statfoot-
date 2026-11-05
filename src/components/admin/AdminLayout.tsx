import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarRange, Trophy, Layers, Shield, Users, Grid3x3, Shuffle, CalendarDays, Radio, Zap, BarChart3, Award, Image, Upload,
  ScrollText, UserCog, Settings, BookOpen, LogOut, Menu, X, ExternalLink, QrCode, Star, Scissors, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAutoCutouts } from '@/hooks/useAutoCutouts'
import { useData } from '@/hooks/useData'
import { AdminScopeProvider, useAdminScope } from '@/hooks/useAdminScope'
import { can, ROLE_LABEL, type Area } from '@/lib/permissions'
import { Logo } from '@/components/layout/Logo'
import { FilterSelect } from '@/components/league/FilterSelect'
import { Spinner } from '@/components/league/Bits'
import { cn } from '@/lib/utils'

export const ADMIN_NAV: { group: string; items: { to: string; label: string; icon: typeof LayoutDashboard; area: Area; end?: boolean }[] }[] = [
  { group: 'Pilotage', items: [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, area: 'dashboard', end: true },
    { to: '/admin/match-center', label: 'Match Center', icon: Radio, area: 'match_center' },
    { to: '/admin/matchs', label: 'Matchs', icon: CalendarDays, area: 'sport' },
  ] },
  { group: 'Compétition', items: [
    { to: '/admin/saisons', label: 'Saisons', icon: CalendarRange, area: 'sport' },
    { to: '/admin/competitions', label: 'Compétitions', icon: Trophy, area: 'sport' },
    { to: '/admin/divisions', label: 'Séries & Divisions', icon: Layers, area: 'sport' },
    { to: '/admin/tirage', label: 'Tirage & divisions', icon: Shuffle, area: 'sport' },
    { to: '/admin/groupes', label: 'Groupes & tirage', icon: Grid3x3, area: 'sport' },
  ] },
  { group: 'Effectifs', items: [
    { to: '/admin/equipes', label: 'Équipes', icon: Shield, area: 'sport' },
    { to: '/admin/joueurs', label: 'Joueurs', icon: Users, area: 'sport' },
    { to: '/admin/import', label: 'Import CSV', icon: Upload, area: 'import' },
  ] },
  { group: 'XP & trophées', items: [
    { to: '/admin/xp', label: 'Règles XP', icon: Zap, area: 'xp' },
    { to: '/admin/trophees', label: 'Awards', icon: Award, area: 'awards' },
    { to: '/admin/equipe-type', label: 'Équipe type', icon: Star, area: 'sport' },
    { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3, area: 'sport' },
  ] },
  { group: 'Contenu', items: [
    { to: '/admin/medias', label: 'Médiathèque', icon: Image, area: 'media' },
    { to: '/admin/reglement', label: 'Règlement', icon: BookOpen, area: 'settings' },
    { to: '/admin/diffusion', label: 'Mode TV & QR codes', icon: QrCode, area: 'match_center' },
  ] },
  { group: 'Administration', items: [
    { to: '/admin/journal', label: "Journal d'activité", icon: ScrollText, area: 'audit' },
    { to: '/admin/administrateurs', label: 'Administrateurs', icon: UserCog, area: 'admins' },
    { to: '/admin/parametres', label: 'Paramètres', icon: Settings, area: 'settings' },
  ] },
]

export function RequireArea({ area, children }: { area: Area; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!can(user, area)) return <div className="glass rounded-2xl p-8 text-center"><div className="title-caps text-xl">Accès refusé</div><p className="text-sm text-muted-foreground">Votre rôle ({user ? ROLE_LABEL[user.role] : '—'}) ne donne pas accès à cette page.</p></div>
  return <>{children}</>
}

export function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [loc.pathname])
  // détourage automatique des photos joueurs (pas pendant la saisie d'un match en direct)
  const inMatch = loc.pathname.startsWith('/admin/match-center/')
  const cut = useAutoCutouts(!!user && user.role !== 'operator' && !inMatch)
  if (loading) return <Spinner />
  if (!user) return <Navigate to={`/admin/login?next=${encodeURIComponent(loc.pathname)}`} replace />
  if (user.role === 'operator' && loc.pathname === '/admin') return <Navigate to="/admin/match-center" replace />
  const live = loc.pathname.startsWith('/admin/match-center/') && loc.pathname.split('/').length > 3
  const nav = (
    <nav className="space-y-5">
      {ADMIN_NAV.map((g) => {
        const items = g.items.filter((i) => can(user, i.area))
        if (!items.length) return null
        return (
          <div key={g.group}>
            <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground/70">{g.group}</div>
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-white', isActive && 'bg-neon/12 text-neon')}>
                <i.icon className="size-4" />{i.label}
              </NavLink>
            ))}
          </div>
        )
      })}
    </nav>
  )
  return (
    <AdminScopeProvider>
      <div className="flex min-h-screen">
        {!live && <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-white/5 bg-night-950/70 p-4 lg:block"><div className="mb-6"><Logo to="/admin" subtitle="Administration" /></div>{nav}</aside>}
        {open && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 overflow-y-auto bg-night-900 p-4" onClick={(e) => e.stopPropagation()}><div className="mb-6 flex items-center justify-between"><Logo to="/admin" subtitle="Admin" /><button onClick={() => setOpen(false)}><X /></button></div>{nav}</aside></div>}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/5 bg-night-900/90 px-3 backdrop-blur sm:px-5">
            <button className={cn('rounded-lg p-2 hover:bg-white/10', !live && 'lg:hidden')} onClick={() => setOpen(true)} aria-label="Menu"><Menu className="size-5" /></button>
            {user.role !== 'operator' && <ScopeSelectors />}
            <div className="ml-auto flex items-center gap-2">
              {cut.pending > 0 && <span className="hidden items-center gap-1.5 rounded-full bg-neon/10 px-2.5 py-1 text-[11px] font-semibold text-neon md:inline-flex" role="status" title="Le fond des photos joueurs est supprimé automatiquement pour les cartes"><Scissors className="size-3.5" />{cut.current ? <Loader2 className="size-3 animate-spin" /> : null}Détourage : {cut.pending} photo{cut.pending > 1 ? 's' : ''}</span>}
              <Link to="/" target="_blank" className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-white/5 sm:flex"><ExternalLink className="size-3.5" />Site public</Link>
              <div className="hidden text-right sm:block"><div className="text-xs font-semibold">{user.full_name ?? user.email}</div><div className="text-[10px] text-neon">{ROLE_LABEL[user.role]}</div></div>
              <button onClick={logout} className="rounded-lg p-2 hover:bg-white/10" title="Déconnexion"><LogOut className="size-4" /></button>
            </div>
          </header>
          <main className={cn('flex-1', live ? 'p-0' : 'p-3 sm:p-6')}><Outlet /></main>
        </div>
      </div>
    </AdminScopeProvider>
  )
}

function ScopeSelectors() {
  const { db } = useData()
  const { seasonId, setSeasonId, competitionId, setCompetitionId } = useAdminScope()
  return (
    <div className="flex min-w-0 gap-2">
      <FilterSelect className="h-8 w-36 sm:w-44" value={seasonId} onChange={(v) => v && setSeasonId(v)} allLabel={null} label="Saison" options={[...db.Season].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((s) => ({ value: s.id, label: s.name }))} />
      <FilterSelect className="h-8 w-36 sm:w-44" value={competitionId} onChange={setCompetitionId} allLabel="Toutes compétitions" label="Compétition" options={db.Competition.filter((c) => c.season_id === seasonId).map((c) => ({ value: c.id, label: c.name }))} />
    </div>
  )
}

export function AdminPage({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="title-caps text-3xl sm:text-4xl">{title}</h1>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
