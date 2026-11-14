import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { DataProvider } from '@/hooks/useData'
import { SeasonProvider } from '@/hooks/useSeason'
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from '@/components/ui/toast'
import { registerFileWorker } from '@/api/fileStore'

// sert les images importées (photos, posters) depuis IndexedDB
void registerFileWorker()
// image introuvable (ex. fichier importé sur un autre appareil) : on la masque plutôt que d'afficher l'icône cassée
addEventListener('error', (e) => { const t = e.target; if (t instanceof HTMLImageElement) t.style.visibility = 'hidden' }, true)
addEventListener('load', (e) => { const t = e.target; if (t instanceof HTMLImageElement && t.style.visibility === 'hidden') t.style.visibility = '' }, true)

// code de la page demandée chargé tout de suite, en parallèle des données (au lieu d'attendre qu'elles soient arrivées)
const PAGE: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/public/Home'), '/classement': () => import('@/pages/public/Standings'), '/joueurs': () => import('@/pages/public/Players'),
  '/matchs': () => import('@/pages/public/Matches'), '/equipes': () => import('@/pages/public/Teams'), '/trophees': () => import('@/pages/public/Awards'),
  '/pre-saison': () => import('@/pages/public/Preseason'),
}
void PAGE[location.pathname.replace(/\/$/, '') || '/']?.().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <SeasonProvider>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </SeasonProvider>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
)
