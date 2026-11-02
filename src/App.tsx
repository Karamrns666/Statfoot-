import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Spinner } from '@/components/league/Bits'
import { useData } from '@/hooks/useData'

const Home = lazy(() => import('@/pages/public/Home'))

export default function App() {
  const { ready } = useData()
  if (!ready) return <Spinner />
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
