import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Spinner } from '@/components/league/Bits'
import { useData } from '@/hooks/useData'

const P = {
  Home: lazy(() => import('@/pages/public/Home')),
  Matches: lazy(() => import('@/pages/public/Matches')),
  MatchDetail: lazy(() => import('@/pages/public/MatchDetail')),
  Standings: lazy(() => import('@/pages/public/Standings')),
  Teams: lazy(() => import('@/pages/public/Teams')),
  TeamDetail: lazy(() => import('@/pages/public/TeamDetail')),
  Players: lazy(() => import('@/pages/public/Players')),
  PlayerDetail: lazy(() => import('@/pages/public/PlayerDetail')),
  Awards: lazy(() => import('@/pages/public/Awards')),
  Stats: lazy(() => import('@/pages/public/Stats')),
  TeamOfRound: lazy(() => import('@/pages/public/TeamOfRound')),
  Media: lazy(() => import('@/pages/public/Media')),
  History: lazy(() => import('@/pages/public/History')),
  Rules: lazy(() => import('@/pages/public/Rules')),
  Tv: lazy(() => import('@/pages/public/TvMode')),
}

export default function App() {
  const { ready } = useData()
  if (!ready) return <Spinner />
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/tv" element={<P.Tv />} />
        <Route path="/live/:terrain" element={<P.Tv />} />
        <Route element={<PublicLayout />}>
          <Route index element={<P.Home />} />
          <Route path="matchs" element={<P.Matches />} />
          <Route path="matchs/:id" element={<P.MatchDetail />} />
          <Route path="classement" element={<P.Standings />} />
          <Route path="equipes" element={<P.Teams />} />
          <Route path="equipes/:id" element={<P.TeamDetail />} />
          <Route path="joueurs" element={<P.Players />} />
          <Route path="joueurs/:id" element={<P.PlayerDetail />} />
          <Route path="trophees" element={<P.Awards />} />
          <Route path="statistiques" element={<P.Stats />} />
          <Route path="equipe-de-la-journee" element={<P.TeamOfRound />} />
          <Route path="media" element={<P.Media />} />
          <Route path="historique" element={<P.History />} />
          <Route path="reglement" element={<P.Rules />} />
          <Route path="*" element={<div className="py-20 text-center"><h1 className="title-caps text-5xl">404</h1><p className="text-muted-foreground">Page introuvable</p></div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
