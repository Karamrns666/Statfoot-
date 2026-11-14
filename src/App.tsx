import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Spinner } from '@/components/league/Bits'
import { useData } from '@/hooks/useData'
import { AdminLayout, RequireArea } from '@/components/admin/AdminLayout'
import type { Area } from '@/lib/permissions'

const P = {
  Preseason: lazy(() => import('@/pages/public/Preseason')),
  Captains: lazy(() => import('@/pages/public/Captains')),
  Home: lazy(() => import('@/pages/public/Home')),
  Matches: lazy(() => import('@/pages/public/Matches')),
  MatchDetail: lazy(() => import('@/pages/public/MatchDetail')),
  Standings: lazy(() => import('@/pages/public/Standings')),
  Teams: lazy(() => import('@/pages/public/Teams')),
  Badges: lazy(() => import('@/pages/public/Badges')),
  Glossary: lazy(() => import('@/pages/public/Glossary')),
  TeamDetail: lazy(() => import('@/pages/public/TeamDetail')),
  Players: lazy(() => import('@/pages/public/Players')),
  PlayerDetail: lazy(() => import('@/pages/public/PlayerDetail')),
  Awards: lazy(() => import('@/pages/public/Awards')),
  Stats: lazy(() => import('@/pages/public/Stats')),
  TeamOfRound: lazy(() => import('@/pages/public/TeamOfRound')),
  Media: lazy(() => import('@/pages/public/Media')),
  History: lazy(() => import('@/pages/public/History')),
  Rules: lazy(() => import('@/pages/public/Rules')),
  Discipline: lazy(() => import('@/pages/public/Discipline')),
  Tv: lazy(() => import('@/pages/public/TvMode')),
}
const named = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, name: T) => lazy(() => loader().then((m) => ({ default: m[name] })))
const sport = () => import('@/pages/admin/SportPages')
const content = () => import('@/pages/admin/ContentPages')
const misc = () => import('@/pages/admin/AdminMisc')
const A = {
  Preseason: lazy(() => import('@/pages/admin/PreseasonAdmin')),
  Planning: lazy(() => import('@/pages/admin/Planning')),
  Simulation: lazy(() => import('@/pages/admin/SimulationAdmin')),
  WeeklyVisuals: lazy(() => import('@/pages/admin/WeeklyVisualsAdmin')),
  Captains: lazy(() => import('@/pages/admin/CaptainsAdmin')),
  CaptainMatch: lazy(() => import('@/pages/admin/CaptainsAdmin').then((m) => ({ default: m.CaptainMatchEditor }))),
  Login: lazy(() => import('@/pages/admin/Login')),
  ChangePassword: lazy(() => import('@/pages/admin/AccountPages').then((m) => ({ default: m.ChangePassword }))),
  ForgotPassword: lazy(() => import('@/pages/admin/AccountPages').then((m) => ({ default: m.ForgotPassword }))),
  ResetPassword: lazy(() => import('@/pages/admin/AccountPages').then((m) => ({ default: m.ResetPassword }))),
  Dashboard: lazy(() => import('@/pages/admin/Dashboard')),
  Seasons: named(sport, 'Seasons'), Competitions: named(sport, 'Competitions'), Divisions: named(sport, 'Divisions'), Teams: named(sport, 'Teams'),
  Players: lazy(() => import('@/pages/admin/PlayersAdmin')),
  Groups: lazy(() => import('@/pages/admin/Groups')),
  Draw: lazy(() => import('@/pages/admin/DrawSwiss')),
  Matches: lazy(() => import('@/pages/admin/MatchesAdmin')),
  QuickEntry: lazy(() => import('@/pages/admin/QuickEntry')),
  Sheet: lazy(() => import('@/pages/admin/MatchSheet')),
  McProgram: lazy(() => import('@/pages/admin/MatchCenterProgram')),
  McLive: lazy(() => import('@/pages/admin/MatchCenter')),
  XP: lazy(() => import('@/pages/admin/XPRules')),
  Discipline: lazy(() => import('@/pages/admin/DisciplineAdmin')),
  Adjust: lazy(() => import('@/pages/admin/StandingsAdjustAdmin')),
  Visuels: lazy(() => import('@/pages/admin/VisualsAdmin')),
  TeamOfWeek: lazy(() => import('@/pages/admin/TeamOfWeekAdmin')),
  Stats: named(misc, 'StatsAdmin'), Awards: named(misc, 'AwardsAdmin'), Import: named(misc, 'ImportCsv'), Broadcast: named(misc, 'Broadcast'),
  Media: named(content, 'MediaAdmin'), Rules: named(content, 'RulesEditor'), Settings: named(content, 'SettingsPage'), Admins: named(content, 'AdminsPage'), Audit: named(content, 'AuditPage'),
}
const guard = (area: Area, el: React.ReactNode) => <RequireArea area={area}>{el}</RequireArea>

export default function App() {
  const { ready } = useData()
  if (!ready) return <Spinner />
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/tv" element={<P.Tv />} />
        <Route path="/live/:terrain" element={<P.Tv />} />
        <Route path="/admin/login" element={<A.Login />} />
        <Route path="/admin/mot-de-passe" element={<A.ChangePassword />} />
        <Route path="/admin/mot-de-passe-oublie" element={<A.ForgotPassword />} />
        <Route path="/admin/reinitialisation" element={<A.ResetPassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={guard('dashboard', <A.Dashboard />)} />
          <Route path="saisons" element={guard('sport', <A.Seasons />)} />
          <Route path="competitions" element={guard('sport', <A.Competitions />)} />
          <Route path="divisions" element={guard('sport', <A.Divisions />)} />
          <Route path="equipes" element={guard('sport', <A.Teams />)} />
          <Route path="joueurs" element={guard('sport', <A.Players />)} />
          <Route path="groupes" element={guard('sport', <A.Groups />)} />
          <Route path="tirage" element={guard('sport', <A.Draw />)} />
          <Route path="pre-saison" element={guard('sport', <A.Preseason />)} />
          <Route path="planning" element={guard('sport', <A.Planning />)} />
          <Route path="simulation" element={guard('dashboard', <A.Simulation />)} />
          <Route path="matchs" element={guard('sport', <A.Matches />)} />
          <Route path="matchs/:id/saisie" element={guard('match_center', <A.QuickEntry />)} />
          <Route path="matchs/:id/feuille" element={guard('match_center', <A.Sheet />)} />
          <Route path="match-center" element={guard('match_center', <A.McProgram />)} />
          <Route path="match-center/:id" element={guard('match_center', <A.McLive />)} />
          <Route path="xp" element={guard('xp', <A.XP />)} />
          <Route path="ajustements-classement" element={guard('derogation', <A.Adjust />)} />
          <Route path="discipline" element={guard('sport', <A.Discipline />)} />
          <Route path="visuels" element={guard('media', <A.Visuels />)} />
          <Route path="visuels-semaine" element={guard('media', <A.WeeklyVisuals />)} />
          <Route path="equipe-type" element={guard('sport', <A.TeamOfWeek />)} />
          <Route path="statistiques" element={guard('sport', <A.Stats />)} />
          <Route path="trophees" element={guard('awards', <A.Awards />)} />
          <Route path="capitaines" element={guard('sport', <A.Captains />)} />
          <Route path="capitaines/:id" element={guard('match_center', <A.CaptainMatch />)} />
          <Route path="import" element={guard('import', <A.Import />)} />
          <Route path="medias" element={guard('media', <A.Media />)} />
          <Route path="reglement" element={guard('settings', <A.Rules />)} />
          <Route path="diffusion" element={guard('match_center', <A.Broadcast />)} />
          <Route path="journal" element={guard('audit', <A.Audit />)} />
          <Route path="administrateurs" element={guard('admins', <A.Admins />)} />
          <Route path="parametres" element={guard('settings', <A.Settings />)} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route index element={<P.Home />} />
          <Route path="matchs" element={<P.Matches />} />
          <Route path="matchs/:id" element={<P.MatchDetail />} />
          <Route path="classement" element={<P.Standings />} />
          <Route path="classement/:slug" element={<P.Standings />} />
          <Route path="gold-cup" element={<Navigate to="/classement/gold-cup" replace />} />
          <Route path="silver-cup" element={<Navigate to="/classement/silver-cup" replace />} />
          <Route path="equipes" element={<P.Teams />} />
          <Route path="badges" element={<P.Badges />} />
          <Route path="glossaire" element={<P.Glossary />} />
          <Route path="equipes/:id" element={<P.TeamDetail />} />
          <Route path="joueurs" element={<P.Players />} />
          <Route path="joueurs/:id" element={<P.PlayerDetail />} />
          <Route path="trophees" element={<P.Awards />} />
          <Route path="meilleure-performance" element={<Navigate to="/trophees" replace />} />
          <Route path="recompenses" element={<Navigate to="/trophees" replace />} />
          <Route path="statistiques" element={<P.Stats />} />
          <Route path="match-des-capitaines" element={<P.Captains />} />
          <Route path="pre-saison" element={<P.Preseason />} />
          <Route path="capitaines" element={<Navigate to="/match-des-capitaines" replace />} />
          <Route path="equipe-type" element={<P.TeamOfRound />} />
          <Route path="equipe-de-la-journee" element={<Navigate to="/equipe-type" replace />} />
          <Route path="media" element={<P.Media />} />
          <Route path="historique" element={<P.History />} />
          <Route path="reglement" element={<P.Rules />} />
          <Route path="discipline" element={<P.Discipline />} />
          <Route path="*" element={<div className="py-20 text-center"><h1 className="title-caps text-5xl">404</h1><p className="text-muted-foreground">Page introuvable</p></div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
