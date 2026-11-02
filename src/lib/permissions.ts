import type { AdminRole, AdminUser } from '@/types/entities'

export type Area = 'dashboard' | 'sport' | 'match_center' | 'xp' | 'awards' | 'media' | 'import' | 'audit' | 'admins' | 'settings' | 'derogation' | 'take_over'
const MATRIX: Record<AdminRole, Area[]> = {
  super_admin: ['dashboard', 'sport', 'match_center', 'xp', 'awards', 'media', 'import', 'audit', 'admins', 'settings', 'derogation', 'take_over'],
  admin: ['dashboard', 'sport', 'match_center', 'xp', 'awards', 'media', 'import', 'audit', 'take_over'],
  operator: ['match_center'],
}
export const can = (u: Pick<AdminUser, 'role'> | null | undefined, a: Area) => !!u && MATRIX[u.role]?.includes(a)
export const ROLE_LABEL: Record<AdminRole, string> = { super_admin: 'Super Admin', admin: 'Admin', operator: 'Opérateur de saisie' }
