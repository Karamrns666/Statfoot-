// Tests de bout en bout (Playwright) : mise en page sur téléphones / tablette / ordinateur, dans Chromium, Firefox et
// WebKit (moteur de Safari), + captures de référence (régression visuelle). Lancés par la CI sur le build local
// (données de démonstration, sans Supabase) servi par `vite preview`.
//   npx playwright test -c e2e/playwright.config.mjs
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  timeout: 60_000,
  retries: 1,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: '../test-results/e2e.json' }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', caret: 'hide' } },
  use: { baseURL: 'http://localhost:4173', locale: 'fr-FR', timezoneId: 'Africa/Casablanca', reducedMotion: 'reduce' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', cwd: '..', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
    { name: 'webkit-ipad', use: { ...devices['iPad (gen 7)'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } },
  ],
})
