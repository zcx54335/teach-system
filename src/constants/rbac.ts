export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TEACHER: 'teacher',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES] | 'parent';

export const normalizeRole = (raw: unknown): Role | null => {
  if (raw === 'super_admin') return 'super_admin';
  if (raw === 'sysadmin' || raw === 'admin') return 'super_admin';
  if (raw === 'teacher') return 'teacher';
  if (raw === 'parent') return 'parent';
  return null;
};

export const isSuperAdmin = (role: Role | null | undefined) => role === ROLES.SUPER_ADMIN;
