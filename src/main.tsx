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
