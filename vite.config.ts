import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'

// CSS principal intégré dans la page (au lieu d'un fichier à télécharger avant le premier affichage)
function inlineEntryCss(): Plugin {
  return {
    name: 'inline-entry-css', apply: 'build', enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        return html.replace(/<link rel="stylesheet"(?: crossorigin)? href="\/(assets\/[^"]+\.css)">/g, (tag, file: string) => {
          const a = bundle[file]
          return a && a.type === 'asset' ? `<style>${String(a.source).replace(/<\/style/gi, '<\\/style')}</style>` : tag
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEntryCss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: { host: true, port: 5173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any)
