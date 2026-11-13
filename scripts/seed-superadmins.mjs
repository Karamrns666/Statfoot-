#!/usr/bin/env node
// Création des 7 comptes super-admin dans Supabase (idempotent).
//   node --env-file=.env.local scripts/seed-superadmins.mjs
// Variables lues : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_INITIAL_PASSWORD (jamais affichées).
import { config, seedSuperAdmins } from '../api/_lib/supabaseAdmin.js'

try {
  const report = await seedSuperAdmins(config(), process.env.SUPERADMIN_INITIAL_PASSWORD)
  for (const r of report) console.log(`✔ ${r.email} — ${r.action}`)
  console.log('Terminé. Chaque nouveau compte devra changer son mot de passe à la première connexion.')
} catch (e) {
  console.error(`✖ ${e.message}`)
  process.exit(1)
}
