// Informations PRIVÉES (jamais lisibles par le public) : séparées des lignes publiques avant l'envoi à Supabase et
// rangées dans des lignes « __private » que seule une session admin peut lire (règle de sécurité côté base).
// Au retour, elles sont réassemblées dans les fiches pour l'admin. Le site public ne les reçoit jamais.
export const PRIVATE_ENTITY = '__private'
export const PRIVATE_FIELDS: Record<string, string[]> = {
  Player: ['birth_date', 'email', 'documents', 'employment_verified', 'employment_proof'],
  Team: ['contact_name', 'contact_email', 'contact_phone'],
}
export const privateId = (entity: string, id: string) => `${entity}:${id}`

export function hasPrivate(entity: string, data: unknown) {
  const f = PRIVATE_FIELDS[entity]
  return !!f && !!data && typeof data === 'object' && f.some((k) => (data as Record<string, unknown>)[k] !== undefined)
}

/** Sépare une fiche en partie publique et partie privée */
export function splitPrivate(entity: string, data: Record<string, unknown>): { pub: Record<string, unknown>; priv: Record<string, unknown> | null } {
  const f = PRIVATE_FIELDS[entity]
  if (!f) return { pub: data, priv: null }
  const pub: Record<string, unknown> = {}, priv: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) (f.includes(k) ? priv : pub)[k] = v
  return { pub, priv }
}

/** Reprend les champs privés d'une ancienne version (la ligne publique reçue ne les contient pas) */
export function keepPrivate(entity: string, fresh: Record<string, unknown>, old?: Record<string, unknown>) {
  const f = PRIVATE_FIELDS[entity]
  if (!f || !old) return fresh
  const out = { ...fresh }
  for (const k of f) if (out[k] === undefined && old[k] !== undefined) out[k] = old[k]
  return out
}
