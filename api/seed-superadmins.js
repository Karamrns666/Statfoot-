// POST /api/seed-superadmins — même opération que scripts/seed-superadmins.mjs, exécutée sur Vercel
// (le mot de passe initial est lu dans la variable d'environnement SUPERADMIN_INITIAL_PASSWORD de Vercel).
// Protégé par SEED_TOKEN : en-tête « Authorization: Bearer <SEED_TOKEN> ». Idempotent.
import { config, seedSuperAdmins, audit } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' })
  const token = process.env.SEED_TOKEN
  if (!token || req.headers.authorization !== `Bearer ${token}`) return res.status(401).json({ error: 'Non autorisé' })
  try {
    const cfg = config()
    const report = await seedSuperAdmins(cfg, process.env.SUPERADMIN_INITIAL_PASSWORD)
    await audit(cfg, { action: 'seed_superadmins', entity: 'AdminUser', details: { comptes: report } })
    return res.status(200).json({ ok: true, report })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
